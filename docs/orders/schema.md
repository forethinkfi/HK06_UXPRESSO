# 주문 데이터 저장 (Supabase) — 스키마·매핑·흐름

비공식 프로토타입의 **주문 저장** 설계 문서입니다. 관리자·주방·POS 화면은 만들지 않았고, 데이터가 Supabase에 쌓이는 것까지가 범위입니다. 실제 주방 시스템 연동은 범위 밖입니다.

## 파일

| 경로 | 역할 |
|---|---|
| `supabase/schema/001_create_orders.sql` | 이미 실행한 테이블 생성 SQL **원본**(기록용, 다시 실행 금지) |
| `supabase/migrations/20261126_orders_rpc_and_kitchen.sql` | 추가 컬럼, `create_order()`(원자적 저장), 주방 JSON 함수·뷰, 권한. 여러 번 실행해도 안전 |
| `supabase/queries/kitchen_queries.sql` | 조회용 SQL 모음 |
| `supabase/tests/rpc_checks.sql` | SQL 함수 검증 스크립트(연습용 PostgreSQL에서 실행) |
| `lib/orders.js` | 서버 재계산·검증, Supabase 호출, 주방 JSON 변환 |
| `server.js` `POST /api/orders` | 주문 저장 API (모의 결제 승인 확인 포함) |
| `docs/orders/kitchen-output.example.json` | 주방 전달 JSON 예시 |
| `docs/orders/test-report.md` | 테스트 결과 |

## 테이블

기존 `orders`, `order_items`는 그대로 두고 **컬럼만 추가**했습니다.

| `orders` 컬럼 | 값 |
|---|---|
| `id`, `order_number`(identity), `created_at`, `order_status`(기본 `received`) | DB가 생성 |
| `customer_session_id` | 브라우저가 만든 익명 UUID. 주문마다 새로 만듦. 개인정보 없음 |
| `idempotency_key` | 결제 키(`paymentKey`, UUID). 같은 키는 한 번만 저장 |
| `order_channel` | `voice` / `touch` / `mixed` |
| `order_type` | `dine` → `dine_in`, `take` → `takeout` |
| `total_price` | 실제 결제 금액(할인 후). 서버가 다시 계산 |
| `subtotal_price`, `discount_amount`, `coupon_code` | 추가 컬럼. 할인 전 금액, 할인 금액, 쿠폰 번호 |
| `payment_status` | `simulated`(모의 결제 승인), 전액 쿠폰이면 `coupon_covered` |
| `payment_method`, `payment_tx_id` | 추가 컬럼. 모의 결제 수단 id, 모의 거래 id |
| `kiosk_id` | `KIOSK_ID` 환경변수, 기본 `KIOSK-01` |

| `order_items` 컬럼 | 값 |
|---|---|
| `menu_id`, `menu_name` | 주문 당시 `data/menus.json` 기준 id·이름 |
| `quantity`, `temperature`(HOT/ICE), `size`(현재 항상 null: 메뉴 데이터에 사이즈 없음) | |
| `unit_price` | 옵션 포함 1개 가격(서버 계산) |
| `options` (JSONB) | 주문 당시 스냅샷: `[{group_id, group_label, choice_id, choice_label, price}]`. 기본값("추가 안 함")은 저장하지 않음 |

## 주문 채널 구분 기준

장바구니를 **어떤 입력 경로로 채웠는지**로 정합니다. 음성(AI 도구 호출)으로 담거나 바꾼 적이 있으면 voice, 터치로 담거나 바꾼 적이 있으면 touch, 둘 다면 mixed입니다. 음성으로 둘러보기만 하고 터치로 담았다면 touch입니다. 결제는 항상 터치입니다.

## 번호 표시

화면에는 `order_number`를 `A-001`, `A-002` 형식으로 보여 줍니다(1000 이상은 `A-1000`). 일별 초기화는 하지 않습니다. 실패한 저장이나 롤백이 있으면 번호에 **빈 번호(gap)가 생길 수 있습니다**(PostgreSQL identity의 특성). 같은 키의 재요청은 번호를 소비하지 않습니다.

## 저장 흐름

```
결제 승인(/api/pay, 기존 로직)
  └→ 브라우저: POST /api/orders { sessionId, paymentKey, txId, mode, channel, couponCode, methodId, expectedFinal, items:[{menuId,temp,qty,opts}] }
       └→ 서버: 메뉴·옵션·가격·쿠폰을 data/ 기준으로 다시 계산 → 화면 금액(expectedFinal)과 다르면 거절
            └→ 서버: 모의 결제가 이 키·금액·수단·txId로 승인됐는지 확인 (전액 쿠폰이면 생략)
                 └→ 서버: Supabase RPC create_order(p_order)  ← orders + order_items 한 트랜잭션
                      └→ { status: saved | duplicate, orderNo: "A-007" }
```

| 서버 응답 | 의미 | 화면 |
|---|---|---|
| `saved` / `duplicate` | 저장 확인됨 | 주문 완료 + 서버 번호 |
| `unavailable` (503) | DB 장애·시간 초과 | 자동 3회 재시도 후 "주문 접수 다시 시도" 화면. **결제는 다시 하지 않음**, 장바구니·쿠폰 유지 |
| `rejected` (4xx) | 금액 불일치·결제 미확인 등 | 같은 오류 화면, 직원 도움 요청 |
| `disabled` | 키 없음/`ORDERS_ENABLED=false` | 데모 번호 + "서버에 저장되지 않았어요" 안내. DB 저장 성공으로 표시하지 않음 |

- 저장이 확인되기 전에는 주문번호도 "주문이 접수되었어요"도 보여 주지 않고, 장바구니도 비우지 않습니다.
- 확정 전 새로고침: 결제 직후 주문 데이터를 `localStorage`(개인정보 없음)에 보관하고, 다시 열면 같은 키로 자동 재전송합니다. 서버가 이미 저장했다면 `duplicate`로 끝나 1건만 남습니다.
- 저장 중·오류 화면에서는 유휴 시간 초과 초기화가 동작하지 않습니다(결제된 주문이 사라지지 않도록).

## 보안

- `anon`/`authenticated`는 두 테이블, 함수, 뷰에 접근할 수 없습니다(`REVOKE`, RLS 켬). `create_order`, `kitchen_order_json`, `kitchen_orders_v`는 `service_role`만 쓸 수 있습니다.
- `SUPABASE_SERVICE_ROLE_KEY`는 서버에서만 읽고, 브라우저 응답·로그에 넣지 않습니다. 새 `sb_secret_...` 키는 `apikey` 헤더만, 예전 JWT 키는 `Authorization: Bearer`도 함께 보냅니다.
- 서버는 브라우저가 보낸 이름·가격을 쓰지 않습니다. `create_order`는 합계가 맞지 않으면 저장하지 않습니다.
- `/api/orders`는 IP당 분당 30회로 제한합니다.

## 알려진 한계

- 모의 결제 기록(`tx`)은 서버 메모리에 있습니다. 결제 직후 서버(Render)가 재시작되면 승인 기록이 사라져 그 주문은 `payment_not_found`로 거절됩니다. 실제 결제 연동 단계에서 결제 기록도 DB로 옮겨야 합니다.
- `/api/pay`와 `/api/orders`는 로그인 없는 공개 API입니다. 데모용이며, 운영에는 키오스크 인증이 필요합니다.
- 쿠폰은 사용 처리(소진)하지 않습니다(기존 모의 동작 그대로).
- 주문 상태 변경(`preparing` 등)을 하는 화면·API는 없습니다. 필요하면 `kitchen_queries.sql`의 F)처럼 직접 변경합니다.
