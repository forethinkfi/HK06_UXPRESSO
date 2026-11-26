# 폐기한 기능: 쿠폰

최종 서비스(키오스크 v6)에는 쿠폰 기능을 넣지 않기로 했습니다. 이 문서는 초기 프로토타입에서 무엇을 만들었고, 지금 어디에 남아 있는지 기록합니다.

> 비공식 프로토타입입니다. 쿠폰 번호·할인 규칙은 모두 테스트 데이터이며 실제 쿠폰 시스템과 연결되지 않습니다.

## 초기 프로토타입에서 만든 것

designoh `8fb5440` (2026-11-25) "Add coupon pre-check, payment method selection, error recovery and pending-approval flow"

- **쿠폰 미리 확인:** 시작 화면의 보조 버튼에서 쿠폰 번호를 넣어 사용 가능 여부를 확인. 주문 단계는 늘지 않음.
- **결제 화면 쿠폰 적용:** 결과를 `ok` / `unusable`(원인 + 대체 방법) / `unknown`(직원 확인)으로 안내.
- **할인 계산:** 정률·정액·교환권·금액권, 최소 주문 금액, 만료일 (`server.js`의 `applyCoupon`).
- 테스트 번호: `WELCOME10`, `DRINK1000`, `FREEAMERICANO`, `GIFT5000`, `APP-ONLY`, `OLD2024`.

화면: [../prototypes/README.md](../prototypes/README.md#초기-키오스크-프로토타입-v1v5)의 "쿠폰·결제" 캡처

## 지금 남아 있는 곳

| 위치 | 상태 |
|---|---|
| `public/app.js` (초기 프로토타입, `/index.html`·`/?demo=pay-coupon`) | 동작함 |
| `server.js` — `GET /api/coupons`, `POST /api/coupons/apply` | 동작함 (초기 프로토타입이 사용) |
| `data/coupons.json` | 테스트 데이터 |
| `public/v6/app.js` (현행) | "메가쿠폰" 결제 타일만 **비활성으로 표시**. 쿠폰 입력·적용·할인 없음 |
| 음성 주문 | 결제·쿠폰·적립은 음성으로 실행하지 않음 (`docs/api/ai-integration.md`) |

정리 작업에서는 서비스 코드를 바꾸지 않는다는 원칙에 따라 위 코드를 지우지 않았습니다. 지울지는 팀이 따로 정합니다.

## 이후 작업 시 주의

- `feature/supabase-orders`를 통합할 때 쿠폰을 다시 켜지 않습니다.
- 쿠폰을 다시 넣는다면 PRD와 디자인 시스템에 먼저 범위를 정하고, 할인 계산은 서버 데이터 기준으로만 합니다.
