-- ORIGINAL table creation SQL, kept verbatim as a record. It was already run in the Supabase SQL Editor.
-- DO NOT run it again (it would fail: the tables exist) and never DROP/recreate the tables.
-- Changes go into supabase/migrations/*.sql.
BEGIN;

CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,
    customer_session_id TEXT,
    kiosk_id TEXT DEFAULT 'KIOSK-01',
    order_channel TEXT NOT NULL
        CHECK (order_channel IN ('voice', 'touch', 'mixed')),
    order_type TEXT NOT NULL
        CHECK (order_type IN ('dine_in', 'takeout')),
    total_price INTEGER NOT NULL CHECK (total_price >= 0),
    payment_status TEXT NOT NULL DEFAULT 'simulated',
    order_status TEXT NOT NULL DEFAULT 'received',
    idempotency_key UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id)
        ON DELETE CASCADE,
    menu_id TEXT,
    menu_name TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    temperature TEXT,
    size TEXT,
    options JSONB NOT NULL DEFAULT '[]'::jsonb,
    unit_price INTEGER NOT NULL CHECK (unit_price >= 0)
);

CREATE INDEX order_items_order_id_idx
ON public.order_items(order_id);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.orders FROM anon, authenticated;
REVOKE ALL ON public.order_items FROM anon, authenticated;

COMMIT;
