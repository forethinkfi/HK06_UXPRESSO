# UXPRESSO — 메가MGC커피 키오스크 UX/UI 개선

> 고민하는 시간을 줄이고, 선택의 확신을 높이다.
> 주문을 서두르게 만드는 키오스크가 아니라, 짧은 시간 안에도 만족스러운 선택을 할 수 있도록 돕는 키오스크.

피크타임 대기열 속 고객의 **심리적·인지적 부담**을 줄이기 위한 세로형(1080×1920) 키오스크 인터랙티브 프로토타입입니다.
메가MGC커피의 공식 프로젝트가 아닌 **비공식 UX/UI 개선 프로젝트**이며, 메뉴·가격·설명은 모두 테스트 데이터입니다.

팀: **UXPRESSO**

## 실행

```bash
npm start     # http://localhost:3000
```

| 주소 | 내용 |
|---|---|
| `/` | 키오스크 프로토타입 |
| `/?debug=1` | 터치 수·경과 시간·도움 호출 횟수 표시 (사용성 테스트 기록용) |
| `/screens.html` | 개선 시안 보드 — 핵심 화면 14장을 한눈에 보기 (누르면 해당 상태의 프로토타입이 열림) |
| `/?demo=이름` | 특정 화면 상태로 바로 열기: `start` `pre` `menu` `filter` `mode` `detail` `cart` `confirm` `pay-coupon` `pay-unusable` `pay-fail` `pay-pending` `done` `help` |
| `/kit.html` | UXPRESSO Kiosk UI Kit — 버튼 6종 × 4상태 |

Node.js 18 이상이면 되고, 설치할 패키지는 없습니다.

## 주문 저장 (Supabase)

결제가 승인되면 서버가 주문을 다시 계산해 Supabase `orders`·`order_items`에 한 번에 저장하고, 저장이 확인된 뒤에 주문번호(`A-001` 형식)를 보여 줍니다. 설계와 규칙은 [docs/orders/schema.md](docs/orders/schema.md).

**설정 (처음 한 번)**
1. Supabase → SQL Editor에서 `supabase/migrations/20261126_orders_rpc_and_kitchen.sql`을 실행합니다. (테이블 생성 SQL은 이미 실행했으므로 다시 실행하지 않습니다.)
2. 환경변수를 입력합니다. 로컬은 `.env` 대신 터미널에서 지정하고, Render는 Environment 탭에 입력합니다. 값은 채팅·코드·커밋에 넣지 않습니다.

| 이름 | 값 |
|---|---|
| `SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | 같은 화면의 `service_role` (또는 새 `sb_secret_...`) 키. **서버 전용 비밀 값** |
| `ORDERS_ENABLED` | 선택. `false`면 저장을 끔 |

```bash
SUPABASE_URL=https://<project-ref>.supabase.co SUPABASE_SERVICE_ROLE_KEY=<키> npm start
```

**연결 확인 (실제 Supabase에 테스트 주문 1건을 씁니다)**

```bash
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run smoke:supabase -- --confirm
```

테스트 주문 정리: `DELETE FROM public.orders WHERE customer_session_id LIKE 'smoke-test-%';`

**시연 순서**: 앱에서 주문 → 결제 → 주문 완료 화면의 번호 확인 → Supabase SQL Editor에서 `supabase/queries/kitchen_queries.sql`의 A) 실행 → 같은 번호의 주문이 보이는지 확인. 주방 전달 JSON 예시는 [docs/orders/kitchen-output.example.json](docs/orders/kitchen-output.example.json). 환경변수가 없으면 화면에 "저장되지 않았어요" 안내가 뜨는 데모로 동작합니다. 저장 실패를 시연하려면 잘못된 `SUPABASE_URL`로 실행하면 "주문 접수 다시 시도" 화면이 나옵니다.

**테스트**: `npm test`(음성 + 주문 저장, 모의 서버), `node scripts/e2e-orders-browser.cjs`(브라우저, Playwright 필요). 결과는 [docs/orders/test-report.md](docs/orders/test-report.md).

## 디자인 전략

- **SEE** 한눈에 발견하다 — 주요 메뉴, 카테고리, 취향 필터, 이미지 중심 메뉴 카드
- **UNDERSTAND** 직관적으로 이해하다 — 행동·결과가 보이는 버튼 문구, 쉬운 옵션 설명
- **DECIDE** 확신을 가지고 선택하다 — 언제든 수정 가능, 주문 확인 전 전체 내역 제공

## 화면과 흐름

주문 방식 선택 → 메뉴 탐색 → 메뉴 상세·옵션 → 장바구니 → 주문 확인 → 쿠폰·결제 → 주문 완료

- **주문 시작** "어디에서 드시나요?" — 매장에서 먹기 / 포장하기를 동일한 크기·위계로 제시 (아이콘 + 텍스트 + 설명). 이후 모든 화면에서 "바꾸기"로 변경 가능
- **메뉴 탐색** 주요 메뉴 바로 선택, 전체 카테고리, 취향 필터(커피가 들어간/들어가지 않은 음료, 달콤한, 상큼한, 부드러운, 깔끔한), 하단 고정 장바구니·총액
- **메뉴 카드** 이미지·이름·한 줄 설명·핵심 특징·가격
- **메뉴 상세·옵션** 온도(따뜻하게/차갑게), 커피를 더 진하게(샷), 더 달콤하게(시럽) 등. 필수/선택 구분, 추가 금액 실시간 반영, 선택 가능한 옵션만 활성화
- **장바구니** 수량 변경, 옵션 수정, 메뉴 삭제, 주문 방식 변경, 전체 주문 취소(확인 절차)
- **주문 확인** 주문 방식·메뉴·옵션·수량·금액 확인, `주문 수정`으로 장바구니 복귀
- **주문 완료** 주문번호, 수령 안내, 일정 시간 뒤 시작 화면 복귀 (카운트다운 표시 없음)
- **쿠폰·결제 수단 미리 확인 (선택)** 시작 화면의 보조 버튼. 쿠폰 번호로 사용 가능 여부 확인, 쿠폰 종류별 조건·사용 방법, 사용 가능/불가 결제 수단 안내. 건너뛰어도 주문 단계는 늘지 않음
- **결제** 주문 금액 / 쿠폰 할인 / 최종 결제 금액을 한눈에 표시. 쿠폰 적용(성공·불가·확인 불가), 결제 수단 그룹별 선택(지원되는 수단만 활성화, 불가 사유·대체 방법 표시), 선택한 수단의 사용 방법 안내, `N원 결제하기`
- **결제 오류 복구** 실패 시 원인·해결 방법 안내 + 같은 방법 재시도 / 다른 결제 수단 / 주문 수정 / 직원 도움 요청. 장바구니와 쿠폰은 유지
- **결제 승인 확인 중** 자동 확인(폴링) + 수동 확인. 같은 주문 키로는 두 번 결제되지 않음(중복 결제 방지)
- **주문 도움** 모든 주요 화면에서 현재 단계 기준 도움말 제공. 닫으면 기존 주문 상태 그대로 복귀. 직원 도움 요청 버튼 포함

공통 원칙: 재촉 문구·대기 인원 표시 없음, 필터·카테고리 모두 강제하지 않음, 이전 화면으로 돌아가도 주문 내용 유지, 선택 상태는 색상 + 체크 + 테두리로 표현.

## API

자체 테스트 API이며 메가MGC커피의 공식 API가 아닙니다.

| Method | Endpoint | 설명 |
|---|---|---|
| GET | `/api/menus` | 전체 메뉴 |
| GET | `/api/menus?tags=달콤한,커피` | 태그 조건을 모두 만족하는 메뉴 |
| GET | `/api/menus/:id` | 메뉴 상세 (옵션·옵션별 추가 금액 포함) |
| GET | `/api/categories` | 카테고리 |

쿠폰·결제 모의 API (실제 쿠폰·결제 시스템과 연결되지 않음):

| Method | Endpoint | 설명 |
|---|---|---|
| GET | `/api/coupons` | 쿠폰 종류(사용 조건·방법·키오스크 사용 가능 여부·제한 사유·대체 방법) |
| POST | `/api/coupons/apply` | `{code, items?}` 쿠폰 확인·적용. `ok` / `unusable` / `unknown`. `items`가 없으면 사용 가능 여부만 확인 |
| GET | `/api/payment-methods` | 결제 수단(지원 여부·사용 방법·불가 사유) |
| POST | `/api/pay` | `{method, amount, key, attempt}` 모의 결제. `approved` / `pending` / `failed`. 같은 `key`는 중복 결제되지 않음 |
| GET | `/api/pay/:txId` | 승인 확인 중 결제의 상태 조회 |

테스트용 쿠폰 번호: `WELCOME10`(10%·5,000원 이상), `DRINK1000`(1,000원·3,000원 이상), `FREEAMERICANO`(교환권), `GIFT5000`(금액권), `APP-ONLY`(앱 전용 → 불가), `OLD2024`(만료 → 불가), 그 외 번호(확인 불가 → 직원 확인).
결제 시나리오: 신용·체크카드 = 즉시 승인, 카카오페이 = 승인 확인 중(약 3초 뒤 승인), 네이버페이 = 첫 시도 실패 후 재시도 승인, 그 밖의 간편결제·상품권 = 즉시 승인(모의), 현금 = 사용 불가.

API 호출이 실패하면 `data/menus.json` 기본 데이터로 자동 전환되어 주문을 이어갈 수 있습니다.
영양·알레르기 정보는 확인된 공식 정보가 없어 "확인되지 않았어요"로 표시합니다.

## 문서

[`docs/index.md`](docs/index.md)에서 요구사항 요약, 디자인 시스템, API 문서를 볼 수 있고, Claude Code 작업 가이드는 [`CLAUDE.md`](CLAUDE.md)에 있습니다. 팀원이 자료를 올리는 위치와 브랜치 규칙은 [`CONTRIBUTING.md`](CONTRIBUTING.md)를 보세요. 디자인 시안은 [Figma 파일](https://www.figma.com/design/RPhFB3P8rftlJ1k0E9QmA7/UXPRESSO--%EC%9C%A0%EC%97%91%EC%8A%A4%ED%94%84%EB%A0%88%EC%86%8C-%ED%8C%80---%EC%B9%B4%ED%8E%98-%ED%82%A4%EC%98%A4%EC%8A%A4%ED%81%AC-%EA%B0%9C%EC%84%A0?node-id=0-1)에서 볼 수 있습니다.

디자인 시스템(2차, 모바일 앱 레퍼런스 기반)은 [`docs/design-system/`](docs/design-system/README.md)에 있습니다. 토큰: [`tokens.json`](docs/design-system/tokens.json), [`tokens.css`](docs/design-system/tokens.css).

## 구조

```
server.js          정적 파일 + 메뉴 API (의존성 없음)
data/menus.json    테스트 메뉴 데이터
data/coupons.json  테스트 쿠폰 정책 데이터
data/payments.json 테스트 결제 수단 데이터
public/index.html  키오스크 진입 페이지
public/app.js      화면·상태·인터랙션
public/style.css   디자인 토큰·컴포넌트 스타일
public/kit.html    버튼 UI Kit
public/screens.html 시안 보드 (iframe으로 ?demo= 화면 모음)
docs/              요구사항·디자인 시스템·API 문서, 리서치(research/), 회의록(meetings/), 발표 자료(presentation/)
CONTRIBUTING.md    자료 올리는 위치·브랜치 규칙
CLAUDE.md          Claude Code 작업 가이드
```

매장별로 조정할 값은 `public/app.js` 상단의 `PICKUP_TEXT`(수령 안내 문구), `RETURN_MS`(자동 복귀 시간)입니다.

## 디자인 시스템 (UXPRESSO — Kiosk UI Kit)

브랜드 컬러(노랑·검정·흰색)를 유지한 비공식 개선 시스템입니다. 버튼은 Primary / Secondary / Selection / Navigation / Help / Destructive 6종이며 Default·Pressed·Selected·Disabled 상태를 `/kit.html`에서 확인할 수 있습니다. 터치 영역은 최소 88px, 본문 32px, 핵심 텍스트 대비는 4.5:1 이상을 목표로 합니다.

## 한계

- 메뉴 이미지는 실제 제품 사진이 아닌 컵 일러스트이고, 가격·설명은 예시입니다.
- 기존 키오스크(AS-IS) 재현 화면, UI Audit, 사용성 테스트 결과는 포함하지 않았습니다.
- 챗봇형 자연어 검색·AI 질의응답은 넣지 않았습니다. PRD v3에 따라 **음성 주문(모의 입력)** 을 선택 기능으로 추가했습니다(결제·쿠폰은 항상 직접 터치, 실제 음성 인식 없음). 자세한 범위는 [docs/prd-v3-summary.md](docs/prd-v3-summary.md)
- 쿠폰·결제는 모두 모의이며, 쿠폰 번호는 화면의 안내 문구에 있는 테스트 번호만 동작합니다.
- 사전 주문 수령 플로우는 없습니다. '픽업하기'는 실제 포장 기능으로 가정해 **포장하기**로 표기했습니다.

저장소: https://github.com/forethinkfi/HK06_UXPRESSO
