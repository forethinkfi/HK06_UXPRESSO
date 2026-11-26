# 04. Component Library

모든 컴포넌트는 Auto Layout · Variables · Text Style · Variants · Component Properties(Boolean, Instance Swap)로 만듭니다. 공통 규칙: **터치 영역: 주요 ≥ 96px · 일반 ≥ 72px · 아이콘 ≥ 64px, 인접 요소 간격 ≥ 16px, 선택 상태 = 색 + 테두리 + ✓, 상태 이름은 Default · Pressed · Selected · Disabled · Focused(+Loading/Error/Empty/Success)**. 모든 수치는 [제안]입니다.

---

## 8.1 Button — `Button/Primary|Secondary|Tertiary|Destructive|Icon|Help`

| 항목 | 내용 |
|---|---|
| Types | **Primary** 화면의 핵심 행동 1개(노랑 + 검정 글씨) · **Secondary** 보조 행동(흰 면 + 2px 검정 테두리) · **Tertiary** 텍스트 버튼(밑줄 없이 굵게) · **Destructive** 전체 주문 취소(흰 면 + 빨강 테두리/글씨, 확인 단계 필수) · **Icon Button** 아이콘 + 라벨 · **Help Button** `? 주문 도움`(검정 면 + 흰 글씨) |
| Sizes | 일반 88 · 주요 104(기본) · XL 120 (v1: 주요 96~120, 일반 72~96) |
| States | Default · Pressed(면 어둡게/`primary-pressed`) · Disabled(회색 면 + 이유 문구) · Loading(스피너 + 라벨 유지, 재터치 무시) · Focused(3px 포커스 링) |
| Properties | Type · Size · State · Label · Leading Icon(boolean) · Trailing Icon(boolean) · Full Width(boolean) |

가이드: 한 화면에 Primary는 하나 · 동일 위계 선택지는 같은 크기 · 라벨은 행동+결과(`4,500원 결제하기`) · 취소와 진행 버튼은 모양·위치로 구분 · 비활성에는 이유를 옆에 표시 · 결제·승인 중에는 Loading으로 중복 터치 차단.
Do: `주문 내역 확인`(Primary) + `메뉴 더 담기`(Secondary). Don't: 같은 화면에 노란 버튼 3개, `확인`·`다음` 단독 문구.

## 8.2 Selection Card — `Selection/OrderType|Temperature|Option`

| 항목 | 내용 |
|---|---|
| 용도 | 매장/포장, HOT/ICE, 옵션, 결제 수단 |
| States | Default(흰 면 + 2px 회색 테두리) · Pressed · **Selected(3px 검정 테두리 + `surface/selected` 면 + ✓ + "선택됨")** · Disabled(점선 테두리 + 이유) · Focused |
| Properties | Label · Description · Icon · Selected · Disabled · Supporting Text(추가 금액 등) |

가이드: 선택은 색만으로 알리지 않음 · 비선택도 4.5:1 이상으로 읽힘 · 동등한 선택지 사이에 크기·색 편향 금지 · **즉시 이동형**(주문 방식 → 다음 화면)과 **선택 후 확인형**(옵션 → 담기)을 구분하고 화면에서 어느 쪽인지 분명히.

## 8.3 Order Type Selector — `Selection/OrderType`

화면 제목 `어디에서 드시나요?` · A `매장에서 먹기`(Dine in, 매장 안에서 드실 분, 컵 아이콘) · B `포장하기`(Takeout, 음료를 가지고 가실 분, 포장 아이콘). 두 카드는 크기·위계 동일.
- 선택 결과를 이후 화면 상단에 `주문 방식: 포장하기 [바꾸기]`로 표시, 주문 확인에서 변경 가능. 변경으로 가격·옵션이 달라지면 변경 전에 안내.
- 기존 '픽업하기'가 사전 주문 수령이라면 포장하기와 합치지 않고 **신규 주문 / 주문 수령을 별도 플로우**로 설계([확인 필요]).

## 8.4 Category Tab — `Navigation/CategoryTab`

States: Default · Selected(검정 채움 + 흰 글씨 + ✓, 굵게) · Pressed · Disabled. 기존 메가커피 메뉴 분류와 이름을 그대로 유지. 가로 스크롤이면 잘린 탭 일부를 보이게 하고 끝 표시(그라데이션 금지 → 화살표 버튼). 탭 높이 ≥ 72px(권장 88px), 탭 간격 ≥ 16px.

## 8.5 Menu Card — `Card/Menu`

| 항목 | 내용 |
|---|---|
| Anatomy | ① 제품 이미지(정사각, radius 12) ② 메뉴명(Heading 3) ③ 한 줄 설명(Body Small, 말줄임 금지 → 2줄 한도) ④ 가격(Price) ⑤ 선택 배지(New/Recommended — 근거 있을 때만) ⑥ 가용 상태 |
| Variants | Default · Description · New · Recommended · Sold Out · Pressed |
| Properties | Image · Menu Name · Description · Price · Badge · Availability |

가이드: 기존 제품 이미지 스타일 유지 · 이름·가격이 가장 선명 · 확인되지 않은 맛·원재료·알레르기 정보 생성 금지 · 카드 높이·정보 위치 일관 · **Sold Out은 선택 불가임을 라벨로 명시**(흐림만으로 표현 금지) · 모든 카드에 태그를 붙이지 않음 · 추천·인기는 근거 있을 때만.

## 8.6 Taste Filter — `Filter/Taste` (P1)

필터: 달콤한 · 상큼한 · 부드러운 · 깔끔한 · 커피가 들어가지 않은 음료. States: Default · Selected(검정 채움 + ✓) · Disabled · No Results. 기본 탐색을 대체하지 않으며 **접힌 상태가 기본**, 필요한 고객이 펼침. 적용 중인 필터를 상단에 표시하고 `필터 모두 해제` 제공. 결과 0건이면 "조건에 맞는 메뉴가 없어요" + 해제/카테고리 이동. **커피 미포함과 카페인 미포함은 다른 조건**이므로 라벨을 분리. 필터는 확인된 메뉴 데이터 기반으로만 동작.

## 8.7 Temperature Selector — `Selection/Temperature`

라벨 `HOT` + 보조 `따뜻하게`, `ICE` + 보조 `차갑게`(HOT 먼저가 주 레이블). 아이콘 + 텍스트, 선택은 ✓ + 테두리. 빨강/파랑만으로 구분 금지. 해당 메뉴가 제공하는 온도만 활성, 나머지는 `이 메뉴는 ICE만 주문할 수 있어요`와 함께 비활성.

## 8.8 Option Selector — `Input/OptionSelector`

| 항목 | 내용 |
|---|---|
| Types | Required · Optional · Single · Multiple · Quantity |
| Anatomy | 옵션명 · 보조 설명 · 추가 금액 · 선택 컨트롤 · 선택 상태 |

문구 예: `커피를 더 진하게` (샷 추가) / 그룹 안내 `추가하고 싶은 옵션이 있나요? 원하는 게 없으면 선택하지 않아도 돼요.` 필수는 `꼭 골라요` 배지, 선택은 `선택 사항`. 선택 **전에** 추가 금액 표시(`+500원`), 선택 즉시 총액 반영. 제공되는 옵션만 노출하고 조합 제한(예: ICE 전용 옵션)은 비활성 + 이유. 기본 선택값이 있으면 `기본` 표시.

## 8.9 Quantity Stepper — `Input/QuantityStepper`

[−] 수량 [＋], 각 버튼 ≥ 72px(권장 88px). States: Default · Minimum(− 비활성) · Maximum(＋ 비활성 + 이유) · Disabled. 연속 터치 방지: 터치당 ±1, 300ms 디바운스, 길게 눌러 가속 금지. 최소·최대 수량은 실제 정책 기준([확인 필요]).

## 8.10 Cart Item — `Cart/Item`

이미지 · 메뉴명 · 온도 · 선택 옵션 · 수량 · 가격 · `옵션 수정` · `메뉴 삭제`. 장바구니에서 직접 수정, 옵션이 다르면 별도 항목, 여러 잔 중 일부만 수정 가능하게 고려, 수정 시 나머지 정보 유지. **개별 삭제와 전체 주문 취소를 시각적으로 분리**(전체 취소는 Destructive + 확인 대화상자).

## 8.11 Progress Indicator — `Navigation/Progress`

단계: ① 메뉴 선택 ② 주문 확인 ③ 결제 ④ 주문 완료. States: Upcoming · Current(굵게 + 검정 채움) · Completed(✓). 세부 화면을 모두 넣지 않음. 카운트다운·재촉 문구 금지. 현재 해야 할 일은 화면 제목으로 안내.

## 8.12 Coupon — `Coupon/Check|Applied|Error|Unavailable|Pending|Entry|Scan`

쿠폰 사용 조건을 **주문 전에** 확인할 수 있게(시작 화면의 선택 기능) 하되 강제하지 않음. 쿠폰 종류(할인 쿠폰 · 상품 교환권 · 금액권)별 목적·조건·방법을 안내. **사용 가능 여부와 실제 적용 가능 여부를 구분**: 사전 확인은 "사용할 수 있는 종류예요", 적용 결과는 주문 내용 기준. 실패해도 장바구니 유지, 확인 서버 오류 시 쿠폰 없이 진행 또는 직원 도움. 정책 확인 없이 가능 여부 단정 금지, 바코드 인식과 유효성 검증을 구분해 안내.

## 8.13 Payment Method Card — `Card/PaymentMethod`

Payment icon · 수단명 · 지원 브랜드 로고 · 보조 설명 · 선택 상태. 그룹(제안): 카드 결제 · QR/바코드 결제 · 모바일 금액권 — **실제 지원 수단에 맞춰 조정**. 고객에게 익숙한 서비스명과 로고를 함께 표시(브랜드 로고 사용 가능 여부는 [확인 필요]). 쿠폰·교환권과 결제 수단을 구분. 지원하지 않는 수단은 임의로 추가하지 않고 비활성 + 대체 방법.

## 8.14 Payment Instruction — `Feedback/PaymentInstruction`

Types: Insert Card · Tap Card · Scan Barcode · Scan QR · Processing · Approved · Declined · Unknown Status. 이미지(단말기 위치 화살표) + 한 문장 행동 안내. 처리 중에는 모든 결제 버튼 Loading/비활성(중복 요청 방지). **승인 여부가 불확실하면 재결제를 유도하지 않고** 상태 확인·직원 도움만 제공. 실패가 **확정된 경우에만** 재시도 경로 제공. 단말기·스캐너 위치는 실기기 확인 필요.

## 8.15 Dialog & Modal — `Dialog/Confirmation|Error|Help|SessionTimeout`

Types: Information · Confirmation · Warning · Error · Help · Session Timeout. Anatomy: 상태 아이콘 · 제목 · 설명 · Primary · Secondary. 단순 설명은 인라인 안내 우선(모달 최소화). 주요 행동과 취소는 모양·위치로 구분. **닫아도 주문 정보 유지.** 중첩 모달 금지. 모달 안 버튼도 일반 72px·주요 96px 이상.

## 8.16 Feedback & Error Recovery — `Feedback/Success|Warning|Error|Loading`

States: Success · Warning · Error · Loading · Empty · Pending · Offline. 메시지 구조: ① 현재 상황 ② 확인된 원인 ③ 주문 정보 유지 여부 ④ 다음에 할 수 있는 행동. 시스템에서 확인된 상태에 맞는 메시지만 표시.

| 상황 | 제목 | 설명 | Primary / Secondary |
|---|---|---|---|
| 결제 요청 전 카드 인식 실패 | 카드가 인식되지 않았어요. | 아직 결제가 요청되지 않았어요. 담은 메뉴는 그대로 유지돼요. | 카드 다시 인식하기 / 다른 방법으로 결제하기 |
| 승인 여부 불확실 | 결제 여부를 확인하고 있어요. | 중복 결제를 방지하기 위해 다시 결제하지 말아 주세요. | 결제 상태 확인 / 직원 도움 요청 |

## 8.17 Contextual Help — `Help/Inline|Button|Expandable|Panel`

Types: Inline Help · Help Button · Expandable Description · Instruction Panel. 필요한 순간에 도움, 도움말을 읽느라 주문을 처음부터 다시 하지 않음, 긴 매뉴얼 금지, **한 번에 하나의 해결 행동**, 자체 해결이 어려우면 직원 지원 경로. `? 주문 도움`은 모든 주요 화면 같은 위치.

## 8.18 Order Completion — `Feedback/OrderComplete`

Success Status · **주문번호(Display 56px, 가장 강조)** · 주문 요약 · 수령 안내 · 영수증 정보 · 마침 버튼. **결제 승인과 주문 접수가 모두 확인된 뒤** 완료 표시. 이전 고객 정보가 다음 고객에게 보이지 않게 확인 시간 제공 후 초기화(카운트다운 숫자 표시 금지).

---

## 사용 예 요약 (Do & Don't)

| Do | Don't |
|---|---|
| 선택 = 검정 테두리 + ✓ + 텍스트 | 노랑 면만으로 선택 표시 (흰 배경 1.36:1) |
| 아이콘 + 텍스트 | 아이콘 단독 버튼 |
| 오류 = 원인 + 해결 + 주문 유지 | `결제 오류`처럼 원인 없는 문구 |
| 승인 불확실 시 확인/직원 도움 | 승인 불확실한데 `다시 결제` 노출 |
| 추가 금액을 선택 전에 표시 | 담은 뒤에야 금액 변화 노출 |
| 비활성 + 이유 | 이유 없는 회색 버튼 |

## 8.19 Voice Order CTA — `Voice/Trigger` (PRD v3)
가로 전체 폭 바, 높이 104px, radius 16, 아이콘 + 문구 + 아래 보조 설명(22px). 상태 5종 + Hidden은 [voice-cta-states.md](../../../design-system/voice-cta-states.md). 색상만으로 구분하지 않고 아이콘·문구를 함께 바꿈. 위치: 시작 화면(주문 방식 아래), 메뉴·장바구니 헤더 아래, 옵션 시트 상단. 주문 확인·결제·완료에서는 렌더링하지 않음. 글자 Button Large 32px.

## 8.20 Voice Guidance Panel — `Voice/GuidanceBar`
CTA 아래 연한 노랑 패널. 말씀하신 내용 · 안내 · 다음 행동(22px 라벨 + 26px 본문) · 상태별 본문(모의 입력 문장 칩 / 확인 카드 + 담기·수정하기 / HOT·ICE 선택 / 후보 목록) · `다시 말하기`(오류·확인 시) · `화면에서 선택하기`(항상). 버튼 높이 72px 이상.
