-- Checks for supabase/migrations/20261126_orders_rpc_and_kitchen.sql — run on a SCRATCH PostgreSQL, not on the real project
-- (it inserts test orders). Prepare: create roles anon/authenticated/service_role, run supabase/schema/001_create_orders.sql, then the migration,
-- then:  psql -f supabase/tests/rpc_checks.sql
-- Expected: T1 duplicate=false, T2 duplicate=true same number, T3 1|2, T4/T5 ERROR, T6 1|2, T7 number 3 (a failed insert burns an identity
-- number: gaps are normal in PostgreSQL), T8 kitchen JSON, T10-T14 "permission denied".
\set ON_ERROR_STOP 0
\pset tuples_only on
set role service_role;
select 'T1 create', public.create_order('{"idempotency_key":"11111111-1111-4111-8111-111111111111","customer_session_id":"sess-abcdef12","kiosk_id":"KIOSK-01","order_channel":"mixed","order_type":"takeout","subtotal_price":5500,"discount_amount":550,"total_price":4950,"coupon_code":"X","payment_method":"card","payment_status":"simulated","payment_tx_id":"ab12","items":[{"menu_id":"americano","menu_name":"아메리카노","quantity":2,"temperature":"ICE","size":null,"options":[{"group_id":"shot","group_label":"샷","choice_id":"1","choice_label":"샷 1개 추가","price":500}],"unit_price":2500},{"menu_id":"latte","menu_name":"라떼","quantity":1,"temperature":"HOT","options":[],"unit_price":500}]}'::jsonb);
select 'T2 duplicate', public.create_order('{"idempotency_key":"11111111-1111-4111-8111-111111111111","items":[]}'::jsonb);
select 'T3 counts', (select count(*) from orders), (select count(*) from order_items);
select 'T4 bad total (expect error)'; select public.create_order('{"idempotency_key":"22222222-2222-4222-8222-222222222222","order_channel":"touch","order_type":"dine_in","subtotal_price":1000,"discount_amount":0,"total_price":999,"items":[{"menu_id":"a","menu_name":"a","quantity":1,"unit_price":1000}]}'::jsonb);
select 'T5 failing item mid-insert rolls back order (expect error)'; select public.create_order('{"idempotency_key":"33333333-3333-4333-8333-333333333333","order_channel":"touch","order_type":"dine_in","subtotal_price":1000,"discount_amount":0,"total_price":1000,"items":[{"menu_id":"a","menu_name":null,"quantity":1,"unit_price":1000}]}'::jsonb);
select 'T6 counts after failures', (select count(*) from orders), (select count(*) from order_items);
select 'T7 next number (a gap after the failed insert is expected)', (public.create_order('{"idempotency_key":"44444444-4444-4444-8444-444444444444","order_channel":"voice","order_type":"dine_in","subtotal_price":1000,"discount_amount":0,"total_price":1000,"items":[{"menu_id":"a","menu_name":"a","quantity":1,"unit_price":1000}]}'::jsonb))->>'order_number';
select 'T8 kitchen', jsonb_pretty(kitchen_order_json((select id from orders where order_number=1)));
select 'T9 view', display_number, order_channel from kitchen_orders_v order by order_number;
reset role;
set role anon;
select 'T10 anon rpc (expect denied)'; select public.create_order('{}'::jsonb);
select 'T11 anon table (expect denied)'; select * from orders;
select 'T12 anon view (expect denied)'; select * from kitchen_orders_v;
reset role; set role authenticated;
select 'T13 authenticated rpc (expect denied)'; select public.create_order('{}'::jsonb);
select 'T14 authenticated kitchen fn (expect denied)'; select public.kitchen_order_json(gen_random_uuid());
