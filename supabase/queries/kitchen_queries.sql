-- Read-only helper queries for the kitchen hand-off data (run in Supabase → SQL Editor; no UI is built for this).
-- Needs supabase/migrations/20261126_orders_rpc_and_kitchen.sql.

-- A) Orders waiting for the kitchen, oldest first (the order a kitchen would work in)
SELECT display_number, received_at, order_type, order_channel, kitchen_json
FROM public.kitchen_orders_v
WHERE order_status = 'received'
ORDER BY received_at ASC;

-- B) Newest 20 orders as plain rows
SELECT o.order_number, 'A-' || lpad(o.order_number::text, 3, '0') AS display_number, o.created_at, o.order_type, o.order_channel,
       o.order_status, o.total_price, o.discount_amount, o.coupon_code, o.payment_method, o.customer_session_id
FROM public.orders o ORDER BY o.created_at DESC LIMIT 20;

-- C) One order with its lines (replace the number)
SELECT 'A-' || lpad(o.order_number::text, 3, '0') AS display_number, i.menu_name, i.temperature, i.quantity, i.unit_price, i.options
FROM public.orders o JOIN public.order_items i ON i.order_id = o.id
WHERE o.order_number = 1 ORDER BY i.id;

-- D) Kitchen JSON of one order
SELECT public.kitchen_order_json(id) FROM public.orders WHERE order_number = 1;

-- E) Today's orders per input path (voice / touch / mixed), Korea time
SELECT order_channel, count(*) AS orders, sum(total_price) AS won
FROM public.orders
WHERE created_at >= date_trunc('day', now() AT TIME ZONE 'Asia/Seoul') AT TIME ZONE 'Asia/Seoul'
GROUP BY order_channel ORDER BY order_channel;

-- F) Manual status change when staff use it (not automated by the kiosk)
-- UPDATE public.orders SET order_status = 'preparing' WHERE order_number = 1;   -- received → preparing → ready → picked_up
