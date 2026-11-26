-- UXPRESSO unofficial prototype — migration 1 (additive and re-runnable; it never drops or recreates tables).
-- Adds: price/coupon/payment columns, the atomic create_order() function, and the kitchen hand-off function + view.
-- Run once in Supabase → SQL Editor. Safe to run again.
BEGIN;

-- 1) extra columns (existing rows keep working; new columns are nullable or have defaults)
ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS subtotal_price  INTEGER CHECK (subtotal_price >= 0),
    ADD COLUMN IF NOT EXISTS discount_amount INTEGER NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    ADD COLUMN IF NOT EXISTS coupon_code     TEXT,
    ADD COLUMN IF NOT EXISTS payment_method  TEXT,
    ADD COLUMN IF NOT EXISTS payment_tx_id   TEXT;

CREATE INDEX IF NOT EXISTS orders_created_at_idx ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS orders_status_created_idx ON public.orders (order_status, created_at);

-- 2) create_order: orders + order_items in ONE transaction (a plpgsql function body is a single transaction:
--    if any statement fails, nothing is stored). The same idempotency_key returns the existing order_number.
CREATE OR REPLACE FUNCTION public.create_order(p_order jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
    v_key   uuid;
    v_id    uuid;
    v_num   bigint;
    v_items jsonb := p_order -> 'items';
BEGIN
    v_key := (p_order ->> 'idempotency_key')::uuid;

    -- already saved? return it WITHOUT touching the identity sequence (no gaps for retries)
    SELECT id, order_number INTO v_id, v_num FROM public.orders WHERE idempotency_key = v_key;
    IF FOUND THEN
        RETURN jsonb_build_object('order_id', v_id, 'order_number', v_num, 'duplicate', true);
    END IF;

    IF jsonb_typeof(v_items) IS DISTINCT FROM 'array' OR jsonb_array_length(v_items) = 0 THEN
        RAISE EXCEPTION 'order_items_required' USING ERRCODE = '22023';
    END IF;

    -- integrity: totals must add up (the server re-prices; this is the last line of defence)
    IF (SELECT COALESCE(SUM((i ->> 'unit_price')::int * (i ->> 'quantity')::int), -1) FROM jsonb_array_elements(v_items) i)
         IS DISTINCT FROM (p_order ->> 'subtotal_price')::int
       OR (p_order ->> 'total_price')::int IS DISTINCT FROM GREATEST(0, (p_order ->> 'subtotal_price')::int - (p_order ->> 'discount_amount')::int) THEN
        RAISE EXCEPTION 'order_total_mismatch' USING ERRCODE = '22023';
    END IF;

    INSERT INTO public.orders (
        customer_session_id, kiosk_id, order_channel, order_type,
        subtotal_price, discount_amount, total_price, coupon_code,
        payment_method, payment_status, payment_tx_id, idempotency_key
    ) VALUES (
        p_order ->> 'customer_session_id',
        COALESCE(p_order ->> 'kiosk_id', 'KIOSK-01'),
        p_order ->> 'order_channel',
        p_order ->> 'order_type',
        (p_order ->> 'subtotal_price')::int,
        (p_order ->> 'discount_amount')::int,
        (p_order ->> 'total_price')::int,
        NULLIF(p_order ->> 'coupon_code', ''),
        NULLIF(p_order ->> 'payment_method', ''),
        COALESCE(p_order ->> 'payment_status', 'simulated'),
        NULLIF(p_order ->> 'payment_tx_id', ''),
        v_key
    )
    ON CONFLICT (idempotency_key) DO NOTHING
    RETURNING id, order_number INTO v_id, v_num;

    IF v_id IS NULL THEN -- two identical requests raced; the other one committed first
        SELECT id, order_number INTO v_id, v_num FROM public.orders WHERE idempotency_key = v_key;
        RETURN jsonb_build_object('order_id', v_id, 'order_number', v_num, 'duplicate', true);
    END IF;

    INSERT INTO public.order_items (order_id, menu_id, menu_name, quantity, temperature, size, options, unit_price)
    SELECT v_id, i ->> 'menu_id', i ->> 'menu_name', (i ->> 'quantity')::int, i ->> 'temperature', i ->> 'size',
           COALESCE(i -> 'options', '[]'::jsonb), (i ->> 'unit_price')::int
    FROM jsonb_array_elements(v_items) AS i;

    RETURN jsonb_build_object('order_id', v_id, 'order_number', v_num, 'duplicate', false);
END;
$$;

-- 3) kitchen hand-off JSON for one order (no kitchen system is connected; this is the data contract)
CREATE OR REPLACE FUNCTION public.kitchen_order_json(p_order_id uuid)
RETURNS jsonb
LANGUAGE sql STABLE
SET search_path = public, pg_temp
AS $$
    SELECT jsonb_build_object(
        'orderNumber', 'A-' || lpad(o.order_number::text, 3, '0'),
        'orderId', o.id,
        'receivedAt', o.created_at,
        'status', o.order_status,
        'orderType', o.order_type,
        'channel', o.order_channel,
        'customerSessionId', o.customer_session_id,
        'kioskId', o.kiosk_id,
        'items', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'menuId', i.menu_id, 'name', i.menu_name, 'quantity', i.quantity,
                'temperature', i.temperature, 'size', i.size,
                'options', COALESCE((
                    SELECT jsonb_agg(jsonb_build_object('group', op ->> 'group_label', 'choice', op ->> 'choice_label', 'extraPrice', (op ->> 'price')::int))
                    FROM jsonb_array_elements(i.options) op), '[]'::jsonb)
            ) ORDER BY i.id)
            FROM public.order_items i WHERE i.order_id = o.id), '[]'::jsonb)
    )
    FROM public.orders o WHERE o.id = p_order_id;
$$;

-- 4) kitchen view: newest first, one row per order (security_invoker: RLS of the caller applies; only service_role can read)
CREATE OR REPLACE VIEW public.kitchen_orders_v WITH (security_invoker = true) AS
SELECT o.id AS order_id,
       o.order_number,
       'A-' || lpad(o.order_number::text, 3, '0') AS display_number,
       o.created_at AS received_at,
       o.order_status,
       o.order_type,
       o.order_channel,
       o.customer_session_id,
       o.kiosk_id,
       o.total_price,
       public.kitchen_order_json(o.id) AS kitchen_json
FROM public.orders o;

-- 5) permissions: nobody but the server (service_role) may call or read any of this
REVOKE ALL ON FUNCTION public.create_order(jsonb)        FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.kitchen_order_json(uuid)   FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.kitchen_orders_v                    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_order(jsonb)      TO service_role;
GRANT EXECUTE ON FUNCTION public.kitchen_order_json(uuid) TO service_role;
GRANT SELECT ON public.kitchen_orders_v                   TO service_role;
GRANT SELECT, INSERT ON public.orders, public.order_items TO service_role;

COMMIT;

NOTIFY pgrst, 'reload schema'; -- make the REST API see the new function right away
