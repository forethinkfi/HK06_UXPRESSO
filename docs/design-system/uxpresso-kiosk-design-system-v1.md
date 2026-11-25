> **원문 보관본** — 팀이 제공한 "UXPRESSO — Kiosk Design System v1.0" 문서를 그대로 저장했습니다(편집 없음).
> 프로토타입(`public/`)과 `docs/design-system/` v2 토큰에는 아직 반영하지 않았습니다. 음성 주문(Voice-Driven UI)·세션 정책 등은 현재 기본 플로우(AI·긴 자연어 입력 제외, 카운트다운 금지)와 충돌하는 부분이 있어 적용 전 팀 확인이 필요합니다.

# UXPRESSO — Kiosk Design System v1.0

> MEGA MGC COFFEE Kiosk UX/UI Redesign
> Familiar Brand, Accessible Experience.
> 누구나 쉽게, 혼자서도 자신 있게.

---

# 01. Project Overview

## 1.1 프로젝트명

UXPRESSO

UX + Espresso + Express

메가MGC커피의 브랜드 경험을 유지하면서
디지털 숙련도에 관계없이 누구나 독립적으로
주문할 수 있도록 개선하는 키오스크 UX/UI 프로젝트.

## 1.2 프로젝트 목표

- 디지털 환경에 익숙하지 않은 고객의 독립적인 주문 지원
- 메뉴 탐색 및 선택 과정의 인지 부담 감소
- 기존 브랜드 경험과 비즈니스 가치 유지
- 터치와 음성을 자유롭게 활용할 수 있는 주문 환경 제공
- 결제 과정에서 고객의 통제권 유지
- 주문 오류 예방 및 복구 경험 개선

## 1.3 핵심 문제 정의

고객은 원하는 메뉴를 주문하기 위해
키오스크의 정보구조, 조작 방식, 옵션 선택 방식,
결제 및 할인 정책을 이해해야 한다.

디지털 환경에 익숙하지 않은 고객에게
이러한 학습 과정은 주문의 진입 장벽이 될 수 있다.

## 1.4 How Might We

어떻게 하면 디지털 환경에 익숙하지 않은 고객도
타인의 도움 없이 키오스크를 이해하고,
자신 있게 주문을 완료할 수 있을까?

## 1.5 디자인 시스템의 성격

본 디자인 시스템은 메가MGC커피의 공식 디자인 시스템이 아니다.

기존 브랜드와 키오스크 화면을 참고하여
재구성한 UX/UI 개선 프로젝트 전용 디자인 시스템이다.

컬러, 타이포그래피, 화면 규격, 컴포넌트 수치,
메뉴 정보구조 및 운영 정책은 설계 제안이며
실제 기기 및 사용자 테스트를 통해 검증해야 한다.

---

# 02. Design Philosophy

## 2.1 Familiar Brand, Accessible Experience

익숙한 브랜드 경험을 유지하면서
누구나 접근할 수 있는 주문 경험을 제공한다.

## 2.2 Reduce Decisions, Not Features

기능을 제거하는 것이 아니라
고객이 판단해야 하는 복잡성을 줄인다.

## 2.3 Reduce Complexity, Not Visibility

상품, 할인, 적립, 결제 브랜드를 숨기지 않는다.

정보의 그룹화와 시각적 위계를 통해
발견 가능성을 유지하면서 복잡성을 줄인다.

## 2.4 One Flow, Multiple Ways

터치 주문과 음성 주문은
서로 다른 서비스가 아니다.

하나의 주문 흐름에서 고객이 원하는 입력 방식을
자유롭게 사용할 수 있도록 한다.

## 2.5 Speak · See · Touch

- Speak: 원하는 메뉴를 자연스럽게 말한다.
- See: 인식 결과와 다음 행동을 화면에서 확인한다.
- Touch: 필요한 경우 직접 선택하고 수정한다.

## 2.6 Speak to Select, Touch to Confirm

메뉴 탐색과 상품 구성은 음성으로 지원한다.

최종 주문 확인, 할인, 적립, 결제는
고객이 직접 조작한다.

## 2.7 Control, Not Pressure

세션 관리 기능은 유지하되
고객에게 불필요한 시간 압박을 주지 않는다.

## 2.8 Business Friendly

신메뉴, 시즌 메뉴, 콜라보 상품,
제휴 혜택 및 추가 구매 기회를 유지한다.

단, 비즈니스 목적을 위해 고객의 주문을
강제로 방해하지 않는다.

---

# 03. Design Strategy

## 3.1 INHERIT — 유지

- 메가커피의 브랜드 아이덴티티
- 브랜드 옐로우
- 상품 이미지 중심의 메뉴 카드
- 기존 8개 대분류 카테고리
- HOT / ICE 표현
- 신메뉴 및 콜라보 홍보
- 결제사 및 제휴 브랜드 노출
- 매장 식사 / 포장 주문
- 세션 초기화 기능

## 3.2 ADAPT — 개선

- 메뉴 카테고리의 시각적 위계
- 하위 정보구조
- 상품 카드 가독성
- 터치 영역
- 상품 상세 정보
- 옵션 선택 구조
- 주문 내역 확인
- 할인 및 결제 정보 그룹화
- 한정시간 표현
- 오류 안내 및 복구 방식

## 3.3 CREATE — 신규

- Voice Order Trigger
- Voice Guidance Bar
- Speech Recognition Feedback
- Voice Intent Navigation
- Preference-based Menu Results
- Voice Confirmation Pattern
- Voice-to-Touch Transition
- Session Extension
- Timeout Warning
- Accessible Interaction Patterns

---

# 04. Foundations

## 4.1 Canvas

기준 화면: 1080 × 1920 px

- Orientation: Portrait
- Aspect Ratio: 9:16
- Platform: Self-service Kiosk
- Input: Touch + Voice
- Output: Visual + Optional Audio

실제 화면 해상도와 물리적 크기는 별도 검증한다.

## 4.2 Layout Grid

- Columns: 12
- Margin: 40px
- Gutter: 24px
- Base Unit: 4px
- Spacing System: 8pt 기반

권장 레이아웃:

- Category Grid: 4 Columns × 2 Rows
- Product Grid: 3 Columns
- Payment Brand Grid: 3~4 Columns
- Primary Action: Full Width 또는 넓은 고정 영역

상품 카드의 3열 배치는 초기 제안이다.
기존 4열 구조와 비교하여 가독성, 상품 노출 수,
탐색 효율을 검증한 후 확정한다.

## 4.3 Color Tokens

| Token | HEX | Usage |
|---|---|---|
| brand.primary | #FFDC00 | 브랜드, 주요 CTA |
| brand.black | #171717 | 기본 텍스트, 강조 버튼 |
| brand.white | #FFFFFF | 기본 배경 |
| brand.tint | #FFF7D1 | 선택 상태, 음성 안내 |
| surface.default | #FFFFFF | 기본 화면 |
| surface.secondary | #F5F5F5 | 정보 그룹, 보조 영역 |
| surface.disabled | #E5E5E5 | 비활성화 |
| text.primary | #171717 | 주요 텍스트 |
| text.secondary | #595959 | 보조 정보 |
| text.inverse | #FFFFFF | 어두운 배경 위 텍스트 |
| border.default | #D9D9D9 | 카드 및 영역 구분 |
| border.strong | #171717 | 선택 상태, 주요 컨트롤 |
| status.success | #237A45 | 성공 상태 |
| status.success.bg | #E8F3E8 | 성공 배경 |
| status.warning | #8A5B00 | 주의 상태 |
| status.warning.bg | #FFF3CD | 주의 배경 |
| status.error | #B3261E | 오류 상태 |
| status.error.bg | #FDECEC | 오류 배경 |

브랜드 컬러는 공식 브랜드 가이드가 아닌
프로젝트용 제안 값이다.

## 4.4 Color Usage Rules

- 브랜드 옐로우 위에는 검정 텍스트 사용
- 흰색 텍스트를 옐로우 배경에 사용하지 않음
- 주요 CTA에 브랜드 옐로우 적용
- 음성 주문 버튼은 검정 배경과 흰색 텍스트 사용
- 일반 정보에 빨간색을 사용하지 않음
- 오류 및 실제 위험 상황에만 오류 컬러 적용
- 선택 여부를 색상만으로 표현하지 않음
- 선택 상태에 테두리, 체크 아이콘, 굵기를 병행
- 일반 텍스트 명도 대비 4.5:1 이상 목표
- 큰 텍스트 및 주요 비텍스트 UI 대비 3:1 이상 목표

실제 디스플레이의 밝기와 반사 환경에서
대비 및 가독성을 추가 검증한다.

## 4.5 Typography

Primary Font: Pretendard

Fallback:
- Noto Sans KR
- sans-serif

| Token | Size | Line Height | Weight | Usage |
|---|---:|---:|---|---|
| display | 56px | 72px | Bold | 첫 화면 핵심 문구 |
| heading.1 | 40px | 56px | Bold | 화면 제목 |
| heading.2 | 32px | 44px | Bold | 섹션 제목 |
| heading.3 | 28px | 40px | SemiBold | 상품명, 카드 제목 |
| body.large | 28px | 40px | Medium | 주요 안내 |
| body.default | 24px | 36px | Regular | 일반 정보 |
| body.small | 22px | 32px | Regular | 보조 정보 |
| caption | 18px | 28px | Medium | 비핵심 보조 정보 |
| button.large | 32px | 44px | Bold | 주요 CTA |
| button.default | 28px | 40px | SemiBold | 일반 버튼 |
| price.large | 40px | 52px | Bold | 총 결제 금액 |
| price.default | 28px | 40px | Bold | 상품 가격 |

중요한 안내 및 필수 정보에는
caption 스타일을 사용하지 않는다.

고령층의 실제 읽기 거리에서 글자 크기를 검증한다.

## 4.6 Spacing Tokens

| Token | Value |
|---|---:|
| space.1 | 4px |
| space.2 | 8px |
| space.3 | 16px |
| space.4 | 24px |
| space.5 | 32px |
| space.6 | 40px |
| space.7 | 48px |
| space.8 | 64px |
| space.9 | 80px |
| space.10 | 96px |

## 4.7 Radius Tokens

| Token | Value | Usage |
|---|---:|---|
| radius.xs | 4px | 작은 배지 |
| radius.sm | 8px | 필터, 태그 |
| radius.md | 12px | 상품 카드 |
| radius.lg | 16px | 버튼 |
| radius.xl | 24px | 모달, 주요 패널 |
| radius.full | 999px | 원형 버튼, 필터 칩 |

## 4.8 Elevation

- elevation.0: None
- elevation.1: 0 2px 8px rgba(0,0,0,0.06)
- elevation.2: 0 8px 24px rgba(0,0,0,0.10)
- elevation.3: 0 16px 48px rgba(0,0,0,0.16)

그림자는 장식보다 화면 계층 구분에 사용한다.

## 4.9 Touch Target

- 주요 버튼 높이: 96~120px 제안
- 일반 버튼 높이: 72~96px 제안
- 아이콘 버튼 터치 영역: 최소 64 × 64px 제안
- 인접 버튼 간격: 최소 16px 제안
- 주요 조작 영역의 물리적 크기: 15~20mm 목표

픽셀 수치만으로 접근성을 판단하지 않는다.

실제 화면의 PPI, 설치 높이, 손이 닿는 범위,
사용자 자세 및 조작 정확도를 확인한다.

## 4.10 Iconography

- Outline 기반 아이콘
- 일관된 Stroke 사용
- 기본 아이콘 크기: 32px
- 주요 아이콘 크기: 48px
- 접근성 및 음성 아이콘: 48~64px

주요 기능에는 아이콘과 텍스트를 함께 사용한다.

예외:
- 닫기
- 수량 증가 / 감소
- 명확하게 인식되는 방향 아이콘

---

# 05. Screen Architecture

## 5.1 Global Layout

일반 메뉴 화면은 다음 영역으로 구성한다.

1. Global Header
2. Voice Guidance Bar (음성 활성화 시)
3. Category Navigation
4. Subcategory / Filter
5. Product Content
6. Session Control
7. Sticky Cart
8. Accessibility Utilities

## 5.2 Global Header

포함 요소:

- 브랜드 로고
- 처음으로
- 현재 주문 유형
- 음성으로 주문하기
- 언어 선택

메뉴 탐색 및 상품 선택 단계에서
동일한 위치에 음성 주문 버튼을 제공한다.

음성 버튼은 상품 목록 스크롤과 관계없이
접근할 수 있도록 고정한다.

상단 배치는 우선 설계안이며
물리적 접근성 테스트 후 위치를 확정한다.

## 5.3 Sticky Cart

포함 요소:

- 주문 상품 목록
- 선택한 옵션
- 상품 수량
- 상품 삭제 및 수정
- 총 주문 금액
- 주문 확인 CTA

상품 탐색 중에도 현재 주문 상태를 확인할 수 있다.

## 5.4 Accessibility Utilities

- 언어 선택
- 접근성 설정
- 화면 확대
- 도움말

음성 주문을 사용하지 않는 고객도
접근성 기능을 이용할 수 있어야 한다.

---

# 06. Information Architecture

## 6.1 Primary Categories

기존 8개 대분류를 유지한다.

1. 신메뉴
2. 추천메뉴
3. 커피
4. 디카페인
5. 음료
6. 티
7. 푸드
8. 상품

대분류를 유지하는 이유:

- 기존 고객의 익숙한 탐색 경험 유지
- 특정 상품군에 대한 직접 접근 지원
- 신메뉴 및 콜라보 상품 노출 유지
- 디카페인 고객의 목적형 탐색 지원
- 음료와 티의 독립적인 상품군 유지

## 6.2 Secondary Categories

### 신메뉴

- 전체
- 시즌 메뉴
- 콜라보 메뉴

### 추천메뉴

- 추천·인기
- 할인 메뉴
- 세트 메뉴

추천과 인기 상품은 통합 노출하되
상품 카드의 배지를 통해 의미를 구분한다.

실제 인기 데이터가 없는 경우
BEST를 사실처럼 표시하지 않는다.

기존 메가메뉴의 운영상 의미를 확인한 후
유지, 통합 또는 별도 노출 여부를 결정한다.

### 커피

- 전체
- 필요한 경우 상품 유형별 분류

온도 필터:
- HOT
- ICE

### 디카페인

- 전체

온도 필터:
- HOT
- ICE

디카페인을 일반 음료 카테고리에 통합하지 않는다.

### 음료

- 전체
- 라떼·밀크
- 스무디·프라페
- 주스·에이드
- 기타 음료

### 티

- 전체
- 과일차
- 허브·블렌딩 티
- 아이스티

### 푸드

- 전체
- 베이커리
- 디저트
- 샌드위치·간식

### 상품

- 전체
- 굿즈
- 콜라보 상품

하위 카테고리는 제안 구조이며
전체 판매 상품 목록 및 운영 정책 확인 후 확정한다.

## 6.3 Merchandising Strategy

신메뉴 및 콜라보 상품 노출 경로:

1. 첫 화면 AD
2. 신메뉴 카테고리
3. 일반 상품군 내 NEW 배지
4. 추천메뉴 카테고리
5. 관련 상품 추천

홍보 영역이 주문 진행을 강제적으로 방해하지 않는다.

---

# 07. Core Components

## 7.1 Button

Variants:

- Primary
- Secondary
- Outline
- Ghost
- Destructive
- Voice
- Icon

States:

- Default
- Pressed
- Selected
- Focused
- Disabled
- Loading
- Success
- Error

Rules:

- 한 화면의 주요 행동은 명확하게 강조한다.
- 버튼 텍스트는 행동 중심으로 작성한다.
- 비활성화 이유를 필요한 경우 안내한다.
- 취소와 확인 버튼을 시각적으로 구분한다.

## 7.2 Category Tab

Properties:

- Label
- Selected
- Default
- Disabled

Selected Style:

- Background: brand.primary
- Text: text.primary
- Border: border.strong
- Weight: Bold

기존 8개 대분류를 직접 노출한다.

가로 스크롤을 해야만 주요 카테고리를
발견할 수 있는 구조는 지양한다.

## 7.3 Filter Chip

Examples:

- 전체
- HOT
- ICE
- 할인
- 세트

필터는 필요한 상품군에서만 제공한다.

선택 여부는 색상, 텍스트, 테두리로 구분한다.

## 7.4 Product Card

Anatomy:

1. Product Image
2. Product Badge
3. Product Name
4. Temperature
5. Price
6. Detail Action
7. Availability State

Optional:

- 한 줄 상품 설명
- 맛 또는 주요 특징
- 프로모션 정보

Variants:

- Default
- New
- Recommended
- Best
- Discount
- Collaboration
- Sold Out
- Selected

상품 이미지와 상품명을 주요 탐색 단서로 사용한다.

품절 상품은 품절 여부를 텍스트로 명확히 표시하고
주문할 수 없도록 한다.

## 7.5 Product Detail

포함 요소:

- 상품 이미지
- 상품명
- 상품 설명
- 가격
- 확인 가능한 원재료 및 알레르기 정보
- 상품 선택 CTA
- 닫기

검증되지 않은 맛, 성분, 카페인 정보,
알레르기 정보를 AI가 임의로 생성하지 않는다.

## 7.6 Option Card

Variants:

- Required
- Optional
- Single Select
- Multi Select
- Quantity
- Unavailable

필수 옵션과 선택 옵션을 구분한다.

선택에 따른 추가 금액을 즉시 표시한다.

## 7.7 Temperature Selector

Options:

- HOT / 따뜻하게
- ICE / 차갑게

아이콘, 영문, 한글 설명을 함께 사용한다.

상품 데이터상 선택 가능한 온도만 제공한다.

## 7.8 Quantity Stepper

Anatomy:

- Minus
- Current Quantity
- Plus

수량은 허용 범위 내에서만 변경한다.

변경된 가격을 즉시 반영한다.

## 7.9 Cart Item

Anatomy:

- Product Image
- Product Name
- Temperature
- Selected Options
- Quantity
- Price
- Edit
- Remove

음성 주문과 터치 주문은
동일한 Cart Item 데이터를 사용한다.

## 7.10 Modal

Variants:

- Product Detail
- Confirmation
- Required Selection
- Error Recovery
- Session Warning

모달은 중요한 의사결정에만 사용한다.

일반적인 음성 안내나 상품 담기 성공 안내는
가능하면 인라인 메시지로 제공한다.

## 7.11 Status Message

Variants:

- Information
- Success
- Warning
- Error

구성:

- 상태 아이콘
- 명확한 제목
- 현재 상황 설명
- 다음 행동

오류 메시지는 원인 설명에 그치지 않고
복구 방법을 함께 제공한다.

---

# 08. Start Screen

## 8.1 Layout

상단:
- 브랜드 로고
- 시즌 AD
- 신메뉴 및 콜라보 홍보

하단:
- 매장에서 먹기
- 포장하기
- 음성으로 주문하기
- 언어 및 접근성 기능

## 8.2 Visual Hierarchy

초기 레이아웃 비율:

- AD Area: 약 60%
- Order Action Area: 약 30%
- Utility Area: 약 10%

실제 손이 닿는 범위와 화면 규격에 따라 조정한다.

## 8.3 Order Actions

Primary:

- 매장에서 먹기
- 포장하기

Secondary:

- 음성으로 주문하기

매장 식사와 포장은 주문 유형이다.

음성 주문은 입력 방식이다.

세 버튼을 동일한 의미의 선택지로 표현하지 않고
시각적으로 구분한다.

음성 주문으로 시작한 고객에게는
매장 식사 또는 포장 여부를 음성이나 터치로 확인한다.

## 8.4 AD Rules

- 광고 시청을 강제하지 않는다.
- 광고가 바뀌어도 주문 버튼 위치를 유지한다.
- 광고가 주문 버튼을 가리지 않는다.
- 과도한 점멸과 빠른 애니메이션을 지양한다.

---

# 09. Voice-Driven UI System

## 9.1 Definition

Voice-Driven UI

고객의 자연어를 이해하고
의도에 맞는 기존 키오스크 화면으로 연결하는
화면 중심 음성 주문 인터페이스.

별도의 AI 채팅형 주문 서비스를 만들지 않는다.

## 9.2 Core Principle

Input:
- Voice
- Touch

Output:
- Visual by Default
- Optional Audio

모든 AI 질문과 안내는 화면에 표시한다.

AI 음성을 듣지 못해도 주문을 진행할 수 있어야 한다.

## 9.3 Supported Scope

음성 지원:

- 주문 시작
- 매장 식사 / 포장 선택
- 메뉴 탐색
- 카테고리 이동
- 메뉴 추천
- 상품 정보 확인
- 상품 선택
- 온도 선택
- 옵션 선택
- 수량 선택
- 장바구니 담기
- 추가 메뉴 탐색

직접 터치:

- 최종 주문 확인
- 최종 주문 수정
- 할인 적용
- 쿠폰 사용
- 포인트 적립
- 개인정보 입력
- 결제 수단 선택
- 결제 승인

최종 주문 확인 화면에 진입하면
음성 주문 기능을 종료한다.

## 9.4 Voice Order Trigger

Component:
Voice/Trigger

Label:
음성으로 주문하기

Location:
- Start Screen
- Global Header

Variants:

- Default
- Active
- Unavailable
- Hidden

Default:

- 검정 배경
- 흰색 마이크 아이콘
- 흰색 텍스트

Active:

- 음성 주문 이용 중
- 마이크 상태 표시
- 음성 주문 종료 기능 제공

Hidden:

- 최종 주문 확인
- 할인 및 적립
- 결제
- 주문 완료

## 9.5 Voice Guidance Bar

Component:
Voice/GuidanceBar

음성 주문이 활성화된 경우에만 노출한다.

Anatomy:

1. Microphone Status
2. Recognized Speech
3. AI Response
4. Next Action
5. Audio Control
6. Close / Stop

Example:

말씀하신 내용:
"디카페인 커피 보여줘."

AI 안내:
"디카페인 메뉴를 보여드릴게요."

다음 행동:
"원하는 메뉴를 말하거나 눌러 주세요."

현재 질문과 다음 행동을 가장 명확하게 표시한다.

대화 기록 전체를 계속 누적하지 않는다.

## 9.6 Voice State

### Idle

음성 주문을 이용할 수 있는 상태.

### Listening

Label:
듣고 있어요.

- 마이크 활성화 상태 표시
- 음성 입력 시각적 피드백
- 말하기 완료 버튼
- 마이크 중지 버튼

### Processing

Label:
말씀하신 내용을 확인하고 있어요.

- 음성 수집 종료 또는 일시 정지
- 처리 상태 표시
- 중복 명령 방지

### Responding

AI가 이해한 결과와 다음 행동을 표시한다.

필요한 경우 선택적 음성 안내를 제공한다.

AI 안내 음성이 고객의 발화로
다시 인식되지 않도록 제어한다.

### Awaiting Input

필요한 정보가 부족한 상태.

예:
따뜻하게 드릴까요, 차갑게 드릴까요?

음성과 터치 입력을 함께 제공한다.

### Confirming

상품, 온도, 수량, 옵션, 가격을 표시한다.

사용자의 확인 전에는
잘못 인식된 상품을 장바구니에 확정하지 않는다.

### Success

Label:
장바구니에 담았어요.

기존 장바구니와 주문 내역을 유지한다.

### Error

Label:
잘 듣지 못했어요.

Actions:
- 다시 말하기
- 화면에서 선택하기

### Ended

음성 주문 종료.
마이크 비활성화.

## 9.7 Voice Intent Mapping

| Intent | Example | UI Action |
|---|---|---|
| navigate_recommend | 메뉴 추천해 줘 | 추천메뉴 이동 |
| navigate_new | 새로 나온 메뉴 있어? | 신메뉴 이동 |
| navigate_decaf | 디카페인 보여줘 | 디카페인 이동 |
| navigate_coffee | 커피 보여줘 | 커피 이동 |
| navigate_food | 먹을 것도 보여줘 | 푸드 이동 |
| recommend_by_preference | 달달한 음료 추천해 줘 | 조건별 상품 목록 |
| filter_price | 저렴한 커피 보여줘 | 가격 조건 상품 목록 |
| select_product | 아메리카노 주세요 | 상품 선택 |
| ask_product_detail | 이거 무슨 맛이야? | 상품 상세 정보 |
| set_temperature | 차갑게 주세요 | ICE 선택 |
| set_quantity | 두 잔 주세요 | 수량 변경 |
| set_option | 샷 하나 추가해 줘 | 옵션 변경 |
| confirm_item | 이걸로 담아줘 | 상품 확인 및 담기 |
| continue_order | 하나 더 주문할게 | 메뉴 탐색 복귀 |
| finish_selection | 이제 됐어 | 주문 확인 화면 |

## 9.8 Recommendation Rules

일반적인 추천 요청:

"메뉴 추천해 줘."

기존 추천메뉴 카테고리로 이동한다.

취향 기반 추천 요청:

"달달하고 차가운 음료 추천해 줘."

메뉴 데이터에 등록된 맛, 온도, 상품 유형 등의
속성을 기준으로 조건에 맞는 상품을 보여준다.

가격 기반 추천 요청:

"3천 원 이하 커피 보여줘."

실제 메뉴 가격을 기준으로 필터링한다.

AI는 존재하지 않는 상품을 생성하지 않는다.

품절 상품은 추천 결과에서 제외하거나
품절 상태를 명확히 표시한다.

## 9.9 Voice Navigation Rules

- 화면 이동이 필요한 경우에만 이동한다.
- 현재 화면에서 해결할 수 있으면 유지한다.
- 이동 후 화면이 바뀐 이유를 안내한다.
- 모호한 상품명은 후보 목록을 제공한다.
- 이미 입력한 정보를 반복 질문하지 않는다.
- 부족한 필수 정보만 질문한다.
- 선택 옵션을 모든 고객에게 반복 질문하지 않는다.
- 인식 실패 시 현재 화면과 주문 상태를 유지한다.

## 9.10 Voice Conversation Pattern

### Case A: 일반 추천

Customer:
메뉴 추천해 줘.

System:
추천 메뉴를 보여드릴게요.

UI:
추천메뉴 카테고리

Next:
원하는 메뉴를 말하거나 화면에서 선택해 주세요.

### Case B: 완전한 주문

Customer:
아이스 아메리카노 두 잔 주세요.

System:
이 메뉴가 맞나요?

UI:
- 아메리카노
- ICE
- 2잔
- 실제 메뉴 가격
- 장바구니에 담기

### Case C: 정보 부족

Customer:
카페라떼 주세요.

System:
따뜻하게 드릴까요, 차갑게 드릴까요?

UI:
- HOT / 따뜻하게
- ICE / 차갑게

고객은 말하거나 화면을 눌러 선택한다.

### Case D: 취향 기반 추천

Customer:
달달한 음료 추천해 줘.

System:
달콤한 음료를 찾아봤어요.

UI:
메뉴 데이터 기반 추천 결과 목록.

### Case E: 인식 실패

System:
잘 듣지 못했어요.

UI:
- 다시 말하기
- 화면에서 선택하기

기존 장바구니를 유지한다.

## 9.11 Audio Output

음성 출력은 선택적인 보조 수단이다.

지원 기능:

- 음성 안내 켜기 / 끄기
- 다시 듣기
- 음량 조절
- 천천히 듣기

모든 음성 안내는 화면에 함께 표시한다.

음성 출력이 꺼져 있어도
전체 주문 과정을 진행할 수 있어야 한다.

## 9.12 Microphone Policy

- 고객이 명시적으로 활성화한 경우에만 수집
- 마이크 활성화 상태를 화면에 표시
- 불필요한 상시 녹음 금지
- 음성 입력 종료 기능 제공
- 주문 확인 단계 진입 시 마이크 종료
- 세션 종료 시 음성 관련 임시 데이터 정리
- 개인정보 및 결제 정보 음성 입력 제한

느린 발화와 중간 침묵을 고려한다.

짧은 침묵만으로 주문을 확정하지 않는다.

## 9.13 Voice-to-Touch Transition

음성 주문을 사용한 고객이
최종 주문 확인 화면으로 진입할 경우:

Title:
주문 내역을 확인해 주세요.

Message:
이제 화면을 눌러 진행해 주세요.

Description:
할인, 적립 및 결제는 직접 선택해 주세요.

별도의 강제 팝업보다
주문 확인 화면의 인라인 안내를 우선 사용한다.

기존 주문 내역을 그대로 유지한다.

메뉴를 추가하기 위해 이전 화면으로 돌아가면
음성 주문 버튼을 다시 제공한다.

마이크를 자동으로 재활성화하지 않는다.

---

# 10. Menu Exploration Pattern

## 10.1 Standard Menu Flow

1. 카테고리 선택
2. 하위 카테고리 또는 필터 선택
3. 상품 목록 확인
4. 상품 선택
5. 상품 상세 또는 옵션 선택
6. 장바구니 담기

## 10.2 Voice Menu Flow

1. 음성 주문 활성화
2. 고객 자연어 입력
3. AI 의도 분석
4. 기존 메뉴 화면 연결
5. 상품 및 옵션 선택
6. 주문 내용 확인
7. 장바구니 담기

두 방식은 동일한 화면과 주문 데이터를 사용한다.

## 10.3 Product Selection Rules

- 상품 이미지와 이름을 함께 제공한다.
- 가격을 상품 선택 전에 표시한다.
- 필수 옵션이 미선택된 경우 안내한다.
- 옵션 변경에 따른 금액을 즉시 표시한다.
- 상품 상세 정보에서 주문으로 이어질 수 있다.
- 품절 상품은 선택할 수 없도록 한다.

## 10.4 Product Recommendation Results

취향 기반 추천 결과는 기존 Product Grid를 재사용한다.

추가 요소:

- 추천 조건
- 추천 결과 제목
- 적용된 필터
- 전체 메뉴 보기
- 조건 변경

추천 이유는 확인 가능한 메뉴 데이터에 근거한다.

---

# 11. Cart & Order Review

## 11.1 Shared Cart

터치와 음성 주문은 동일한 장바구니를 사용한다.

공통 데이터:

- Product ID
- Product Name
- Temperature
- Quantity
- Options
- Unit Price
- Total Price

입력 방식을 전환해도
기존 상품과 옵션을 유지한다.

## 11.2 Cart Actions

- 상품 추가
- 수량 변경
- 옵션 수정
- 상품 삭제
- 메뉴 더 담기
- 주문 확인

## 11.3 Order Review

표시 정보:

- 상품명
- 상품 이미지
- HOT / ICE
- 수량
- 추가 옵션
- 매장 식사 / 포장
- 총 주문 금액

Actions:

- 메뉴 더 담기
- 상품 및 옵션 수정
- 결제 방법 선택

음성 주문은 이 단계에서 종료한다.

---

# 12. Payment Design System

## 12.1 Principle

Reduce Complexity, Not Visibility.

기존 제휴 혜택 및 결제 브랜드의
발견 가능성을 유지한다.

카테고리 안에 모든 브랜드를 숨기거나
추가 터치를 강제하지 않는다.

## 12.2 Payment Screen Structure

1. 결제 금액
2. 할인 및 제휴 혜택
3. 메가커피 쿠폰
4. 카드 결제
5. 모바일 간편결제
6. 상품권 및 선불카드
7. 스탬프 적립
8. 접근성 및 도움말

실제 혜택 적용 순서와 적립 정책은
운영 정책 확인 후 확정한다.

## 12.3 Benefits Group

기존 혜택 브랜드 예시:

- KT 멤버십
- T멤버십
- CJ ONE
- 기아멤버스
- SKT 우주패스
- 메가쿠폰
- 현대 M포인트

현대 M포인트는 실제 결제 및 포인트 사용 정책에 따라
최종 그룹 위치를 결정한다.

## 12.4 Card Payment

Primary Payment Option:

- 신용·체크카드
- 삼성페이

결제 단말기의 실제 지원 방식에 맞춰
명칭 및 안내를 조정한다.

## 12.5 Mobile Payment

기존 결제 브랜드 예시:

- 앱카드 QR / 바코드
- 카카오페이
- PAYCO
- 네이버페이
- 제로페이
- BC 페이북
- 하나Pay
- KB Pay
- 신한 SOL Pay / SuperSOL
- 당근페이
- Alipay / WeChat Pay

## 12.6 Gift & Prepaid

- 모바일 상품권
- 메가커피 선불카드
- CJ 기프트카드

## 12.7 Stamp Rewards

스탬프 적립 기능을 명확하게 노출한다.

실제 적립 가능 시점과 결제 진행 순서를 확인한다.

결제 버튼을 먼저 선택하여
적립 기회를 놓치는 문제가 발생하지 않도록 한다.

## 12.8 Payment Brand Tile

Component:
Payment/BrandTile

Anatomy:

- Official Brand Logo
- Brand Name
- Selected State
- Availability

Rules:

- 실제 로고의 비율을 유지한다.
- 로고를 임의로 변형하지 않는다.
- 로고와 브랜드명을 함께 제공한다.
- 동일 그룹의 타일 크기를 일관되게 유지한다.
- 결제 브랜드를 불필요하게 숨기지 않는다.

## 12.9 Payment Guidance

카드 결제:

카드를 카드 리더기에 넣거나
지원되는 방식으로 결제해 주세요.

QR / 바코드:

휴대폰의 결제 화면을 열고
스캐너에 보여 주세요.

실제 단말기의 위치와 지원 방식에 맞는
이미지 및 방향 안내를 제공한다.

## 12.10 Payment Safety

- 음성 명령으로 결제를 실행하지 않는다.
- 결제 요청 중 중복 요청을 방지한다.
- 결제 진행 중 주문 변경을 제한한다.
- 결제 상태가 불명확하면 즉시 재결제시키지 않는다.
- 결제 결과 확인 후 다음 행동을 안내한다.
- 실제 결제 승인 전 주문 완료를 표시하지 않는다.

---

# 13. Session Management

## 13.1 Principle

Control, Not Pressure.

세션 관리의 목적:

- 방치된 주문 세션 정리
- 다음 고객의 이용 지원
- 이전 고객의 주문 정보 보호
- 매장 운영 효율 유지

이는 기존 기능의 목적에 대한 설계 가설이다.

## 13.2 Normal State

일반 상태에서는 시간 정보를
낮은 시각적 위계로 표시한다.

Example:

"2분 동안 조작이 없으면 종료 안내가 표시돼요."

Action:

"시간 연장"

전체 주문 가능 시간과 미사용 시간을
혼동하게 만드는 표현을 사용하지 않는다.

## 13.3 Session Policy

프로토타입 기준 제안:

- 미사용 120초 후 종료 안내
- 종료 안내 후 60초 유예
- 총 미사용 180초 후 미결제 세션 초기화

사용자가 유효한 조작을 하면
미사용 타이머를 초기화한다.

실제 기존 타이머의 동작과 운영 정책을
확인한 후 최종 시간을 확정한다.

## 13.4 Timeout Warning

Title:
아직 주문 중이신가요?

Description:
계속 주문하기를 누르면
선택한 메뉴가 그대로 유지돼요.

Countdown:
60초 후 주문 내역이 초기화됩니다.

Primary:
계속 주문하기

Secondary:
주문 종료하기

## 13.5 Timer Exceptions

다음 상태에서는 일반 미사용 타이머를
일시 정지하거나 별도 정책으로 처리한다.

- 음성 입력 중
- 음성 응답 처리 중
- 결제 승인 처리 중
- 결제 상태 확인 중
- 시스템 응답 대기 중

음성 처리 및 시스템 대기는
무한정 지속되지 않도록 별도의 오류 정책을 둔다.

상품 상세 읽기 및 접근성 이용 시
충분한 조작 시간을 제공한다.

결제 진행 중이거나 결제 결과가 불명확한 세션은
일반적인 미사용 정책으로 초기화하지 않는다.

## 13.6 Session Reset

초기화 대상:

- 미결제 장바구니
- 선택한 상품 및 옵션
- 적용 전 혜택 정보
- 개인정보 입력값
- 음성 관련 임시 데이터
- 사용자별 접근성 설정

매장 운영 및 개인정보 정책에 따라
필요한 거래 기록은 별도로 관리한다.

---

# 14. Accessibility

## 14.1 Accessible by Default

쉬운 주문 모드를 선택하지 않아도
기본 주문 화면 자체가 이해하기 쉬워야 한다.

## 14.2 Visual Accessibility

- 큰 글자
- 충분한 명도 대비
- 명확한 선택 상태
- 이미지와 텍스트 병행
- 아이콘과 텍스트 병행
- 중요한 정보의 고정된 위치
- 색상에만 의존하지 않는 상태 표현
- 화면 확대 지원

## 14.3 Auditory Accessibility

- 모든 AI 음성 안내를 화면에 표시
- 소리 없이 주문 진행 가능
- 음성 안내 끄기
- 다시 듣기
- 음량 조절
- 천천히 듣기

## 14.4 Cognitive Accessibility

- 한 번에 하나의 주요 질문
- 필요한 정보만 요청
- 익숙한 일상 언어 사용
- 선택 결과를 화면에 유지
- 필수 선택과 선택 사항 구분
- 불필요한 화면 전환 최소화
- 이전 단계로 돌아갈 수 있는 구조
- 충분한 응답 시간 제공

## 14.5 Physical Accessibility

- 실제 터치 가능 범위 검증
- 충분한 터치 영역
- 인접 버튼 간격 확보
- 휠체어 사용자 접근성 고려
- 상단 음성 버튼의 도달 가능성 확인
- 실제 결제 단말기 접근성 확인

## 14.6 Accessibility Settings

설정 예시:

- 글자 및 화면 확대
- 화면 대비
- 음성 안내
- 음량
- 음성 안내 속도
- 이용 시간 연장

접근성 설정은 주문을 시작하기 위한
필수 절차가 아니다.

본 시스템은 접근성 개선을 목표로 하지만
실제 키오스크 접근성 인증이나
관련 법적 기준 충족을 보장하지 않는다.

---

# 15. UX Writing Guidelines

## 15.1 Voice & Tone

- 친절함
- 명확함
- 간결함
- 행동 중심
- 고객을 탓하지 않음
- 기술 용어 최소화

## 15.2 Writing Rules

- 한 문장에 하나의 핵심 행동
- 다음 행동을 명확하게 안내
- 어려운 시스템 용어 지양
- 불필요한 존칭 및 반복 표현 지양
- 오류의 책임을 고객에게 돌리지 않음
- 동일한 기능에는 동일한 명칭 사용
- 실제 상태와 일치하는 문구 사용

## 15.3 Copy Library

| Situation | Recommended Copy |
|---|---|
| 주문 시작 | 어디에서 드시나요? |
| 매장 식사 | 매장에서 먹기 |
| 포장 | 포장하기 |
| 음성 시작 | 음성으로 주문하기 |
| 음성 입력 | 원하는 메뉴를 말씀해 주세요. |
| 음성 인식 | 듣고 있어요. |
| 음성 처리 | 말씀하신 내용을 확인하고 있어요. |
| 메뉴 추천 | 추천 메뉴를 보여드릴게요. |
| 온도 선택 | 따뜻하게 드릴까요, 차갑게 드릴까요? |
| 입력 안내 | 말하거나 화면을 눌러 주세요. |
| 주문 확인 | 이 메뉴가 맞나요? |
| 상품 추가 | 장바구니에 담기 |
| 추가 성공 | 장바구니에 담았어요. |
| 추가 주문 | 메뉴 더 담기 |
| 음성 실패 | 잘 듣지 못했어요. |
| 음성 재시도 | 다시 말하기 |
| 터치 전환 | 화면에서 선택하기 |
| 최종 확인 | 주문 내역을 확인해 주세요. |
| 결제 전환 | 이제 화면을 눌러 진행해 주세요. |
| 혜택 안내 | 받을 수 있는 혜택이 있나요? |
| 결제 선택 | 어떻게 결제하시겠어요? |
| 시간 연장 | 시간 연장 |
| 종료 안내 | 아직 주문 중이신가요? |
| 주문 유지 | 계속 주문하기 |
| 주문 완료 | 주문이 완료되었어요. |

## 15.4 Avoid

- 음성 모드 전환
- Invalid Input
- Session Timeout
- Transaction Failed
- 사용자 입력 오류
- 시스템 처리 실패

기술 상태를 고객이 이해할 수 있는
상황과 행동 중심의 언어로 변환한다.

---

# 16. Motion & Feedback

## 16.1 Motion Tokens

- motion.fast: 150ms
- motion.default: 250ms
- motion.slow: 350ms

## 16.2 Interaction Feedback

- 버튼을 누르면 즉시 시각적 피드백 제공
- 선택 상태를 명확하게 유지
- 상품 추가 시 성공 안내 제공
- 가격 변경 시 새로운 금액 표시
- 음성 인식 상태를 시각적으로 표현
- 처리 중 중복 입력 방지

## 16.3 Voice Animation

Listening:

- 마이크 아이콘
- 음성 파형
- 듣고 있어요 텍스트

Processing:

- 로딩 표시
- 처리 상태 텍스트

Success:

- 체크 아이콘
- 성공 메시지

Error:

- 마이크 오류 아이콘
- 다시 말하기 CTA

과도한 애니메이션 및 점멸을 지양한다.

애니메이션을 보지 못해도
텍스트만으로 상태를 이해할 수 있어야 한다.

---

# 17. Error & Recovery

## 17.1 General Principle

오류가 발생하더라도
고객이 처음부터 다시 주문하지 않도록 한다.

## 17.2 Edge Cases

| Case | Recovery |
|---|---|
| 음성 인식 실패 | 다시 말하기 / 터치 선택 |
| 매장 소음 | 현재 화면 유지 / 재시도 |
| 주변 고객 음성 인식 | 주문 내용 확인 후 반영 |
| 잘못된 메뉴 인식 | 후보 상품 선택 / 수정 |
| 수량 인식 오류 | 직접 수량 수정 |
| 옵션 인식 오류 | 선택값 확인 및 수정 |
| 판매하지 않는 상품 | 판매 가능한 대안 안내 |
| 품절 상품 | 품절 표시 및 대체 상품 |
| 모호한 요청 | 후보 또는 조건 선택 |
| 음성 API 오류 | 기존 장바구니 유지 |
| 네트워크 오류 | 재시도 및 상태 안내 |
| 중복 상품 추가 | 중복 실행 방지 및 수정 |
| 시간 초과 예정 | 종료 전 안내 및 연장 |
| 할인 적용 실패 | 원인 안내 및 다른 방법 선택 |
| 결제 실패 확정 | 다른 결제 방법 / 재시도 |
| 결제 결과 불명확 | 결제 상태 확인 / 도움 요청 |
| 결제 중 시간 초과 | 세션 유지 및 결과 확인 |

## 17.3 Recovery Rules

- 오류 발생 시 기존 선택값을 유지한다.
- 재시도 방법을 명확하게 제공한다.
- 음성 기능 실패가 주문 전체 실패로 이어지지 않는다.
- 사용자가 해결할 수 없는 상황에는 도움말을 제공한다.
- 결제 상태가 불명확할 경우 중복 결제를 방지한다.

---

# 18. User Flow

## 18.1 Main Flow

Start Screen
    ↓
매장 식사 / 포장 선택
    ↓
Menu Exploration
    ↓
Product Selection
    ↓
Option Selection
    ↓
Add to Cart
    ↓
Order Review
    ↓
Benefits & Rewards
    ↓
Payment Method
    ↓
Payment Processing
    ↓
Order Complete

## 18.2 Voice Supported Flow

Start Screen / Sticky Header
    ↓
Voice Activation
    ↓
Speech Recognition
    ↓
Intent Analysis
    ↓
Existing UI Navigation
    ↓
Product / Option Selection
    ↓
Item Confirmation
    ↓
Shared Cart
    ↓
추가 메뉴 주문 또는 주문 확인
    ↓
Voice Deactivation
    ↓
Touch-only Order Review & Payment

## 18.3 Voice Intent Branch

Voice Input
    ↓
Intent Analysis
    ├── 카테고리 요청 → Category UI
    ├── 일반 추천 → Recommended Category
    ├── 취향 추천 → Filtered Product Grid
    ├── 상품 요청 → Product Option UI
    ├── 정보 요청 → Product Detail UI
    ├── 옵션 변경 → Current Option UI
    ├── 정보 부족 → Required Question
    └── 인식 실패 → Recovery UI

---

# 19. API & Data Architecture

## 19.1 Architecture

Voice Input
    ↓
Speech-to-Text API
    ↓
AI Intent Analysis
    ↓
Intent Validation
    ↓
Menu Data API
    ↓
UI Action Controller
    ↓
Shared Order State

AI는 고객의 의도를 분석한다.

실제 화면 이동, 상품 검증, 가격 계산,
주문 상태 변경은 키오스크 시스템이 담당한다.

## 19.2 Intent Schema

Example:

{
  "intent": "navigate_category",
  "category": "recommended"
}

Example:

{
  "intent": "select_product",
  "product_name": "아메리카노",
  "temperature": "ICE",
  "quantity": 2,
  "options": [],
  "requires_confirmation": true
}

Example:

{
  "intent": "recommend_by_preference",
  "filters": {
    "taste": "sweet",
    "temperature": "ICE"
  }
}

## 19.3 Menu Data Schema

{
  "id": "product_001",
  "name": "아메리카노",
  "category": "coffee",
  "subcategory": null,
  "description": "검증된 상품 설명",
  "image_url": null,
  "available": true,
  "temperatures": ["HOT", "ICE"],
  "prices": {
    "HOT": 1500,
    "ICE": 2000
  },
  "tags": [],
  "taste_attributes": [],
  "options": []
}

위 가격과 데이터는 스키마 설명용 예시이다.

## 19.4 Shared Order State

{
  "session_id": "session_001",
  "order_type": "takeout",
  "input_mode": "touch",
  "voice_active": false,
  "items": [],
  "subtotal": 0,
  "discount_total": 0,
  "total": 0,
  "payment_status": "not_started"
}

## 19.5 Validation Rules

- AI 출력은 허용된 Intent 목록으로 제한
- 실제 존재하는 Product ID 확인
- 상품 판매 가능 여부 확인
- 지원하는 온도 및 옵션 확인
- 수량 범위 검증
- 가격은 Menu Data API 기준 계산
- 중복 명령 실행 방지
- 미확정 주문 변경은 사용자 확인
- 결제 관련 Intent 실행 금지
- AI가 임의로 가격 및 상품 정보를 생성하지 않음

## 19.6 Payment State

- not_started
- pending
- approved
- failed
- unknown
- order_submitted
- completed

결제 승인과 주문 접수는 구분한다.

결제 승인 여부가 불명확한 경우
임의로 실패 또는 성공 처리하지 않는다.

## 19.7 Prototype Scope

- Mock Menu API
- Speech-to-Text API 또는 모의 음성 입력
- AI Intent Analysis
- UI Navigation
- Shared Cart
- Mock Coupon State
- Mock Payment Status

실제 결제 및 실제 개인정보 수집은
프로젝트 범위에서 제외한다.

---

# 20. Figma Design System Structure

## 20.1 Pages

00. Cover
01. Brand & AS-IS Audit
02. Foundations
03. Variables
04. Components
05. Voice Components
06. Interaction Patterns
07. UX Writing
08. AS-IS Screens
09. TO-BE Screens
10. Prototype
11. User Testing
12. Handoff

## 20.2 Component Naming

Button/Primary
Button/Secondary
Button/Outline
Button/Voice
Button/Destructive

Navigation/GlobalHeader
Navigation/CategoryTab
Navigation/Subcategory
Navigation/FilterChip

Product/Card
Product/Badge
Product/Detail
Product/Temperature
Product/Option
Product/QuantityStepper

Cart/Item
Cart/StickyBar
Cart/OrderSummary

Voice/Trigger
Voice/GuidanceBar
Voice/Listening
Voice/Processing
Voice/Question
Voice/Confirmation
Voice/Error
Voice/Transition
Voice/AudioControl

Payment/BrandTile
Payment/BenefitTile
Payment/MethodGroup
Payment/AmountSummary
Payment/Processing
Payment/Recovery

Session/Timer
Session/ExtendButton
Session/TimeoutWarning

Accessibility/Settings
Accessibility/Language
Accessibility/Zoom

Feedback/Toast
Feedback/InlineMessage
Feedback/Modal

## 20.3 Component Properties

- Variant
- State
- Size
- Selected
- Disabled
- Leading Icon
- Trailing Icon
- Label
- Description
- Price
- Badge
- Image
- Availability

## 20.4 Variable Collections

### Primitive

- Color
- Spacing
- Radius
- Typography
- Elevation
- Motion

### Semantic

- Brand
- Text
- Surface
- Border
- Action
- Status

### Component

- Button
- Product
- Navigation
- Voice
- Payment
- Session

## 20.5 Auto Layout Rules

- 가능한 모든 컴포넌트에 Auto Layout 적용
- 텍스트 영역은 내용에 맞게 확장
- 주요 CTA는 Fill Container
- 상품 카드는 동일한 정보 계층 유지
- 고정 높이로 인해 텍스트가 잘리지 않도록 설계
- 다국어 및 확대 상태를 고려
- 아이콘과 텍스트 간격은 토큰 사용
- 화면 전체에서 공통 컴포넌트 재사용

---

# 21. Screen Inventory

## Start

S01. 첫 화면 / AD
S02. 매장 식사 및 포장 선택
S03. 언어 선택
S04. 접근성 설정

## Menu

M01. 신메뉴
M02. 추천메뉴
M03. 커피
M04. 디카페인
M05. 음료
M06. 티
M07. 푸드
M08. 상품
M09. 상품 상세
M10. 상품 옵션
M11. 장바구니 담기 성공

## Voice

V01. 음성 주문 활성화
V02. 음성 입력 중
V03. 음성 처리 중
V04. 일반 추천 카테고리 이동
V05. 디카페인 카테고리 이동
V06. 취향 기반 추천 결과
V07. 특정 상품 선택
V08. 필수 정보 질문
V09. 주문 내용 확인
V10. 음성 인식 실패
V11. 음성에서 터치로 전환
V12. 음성 주문 종료 안내

## Cart

C01. 장바구니
C02. 상품 수정
C03. 최종 주문 확인

## Payment

P01. 할인 및 결제 방법
P02. 제휴 혜택 적용
P03. 쿠폰 적용
P04. 스탬프 적립
P05. 카드 결제 안내
P06. 모바일 결제 안내
P07. 결제 처리 중
P08. 결제 실패
P09. 결제 상태 확인
P10. 주문 완료

## Session

T01. 일반 시간 표시
T02. 시간 연장
T03. 종료 전 안내
T04. 세션 초기화

---

# 22. Usability Testing

## 22.1 Primary KPI

Independent Order Completion Rate

직원이나 주변 고객의 도움 없이
정확한 주문을 완료한 비율.

키오스크 자체의 음성 및 도움말 기능 사용은 허용한다.

## 22.2 Secondary KPI

- 메뉴 탐색 성공률
- 첫 카테고리 선택 정확도
- 카테고리 이동 횟수
- 음성 기능 발견율
- 음성 인식 정확도
- 음성 전환 성공률
- 주문 상태 유지 여부
- 오류 복구 성공률
- 주문 정확도
- 직원 도움 요청 횟수
- 결제 혜택 발견율
- 주문 자신감
- 주관적 인지 부담
- 주문 소요 시간

주문 속도는 보조 지표이며
독립적인 주문 완료가 핵심 목표이다.

## 22.3 Test Scenarios

### Scenario 01

디카페인 아메리카노를 찾아 주문한다.

### Scenario 02

음성으로 일반 메뉴 추천을 요청한다.

### Scenario 03

달콤한 음료를 음성으로 추천받는다.

### Scenario 04

아이스 아메리카노 두 잔을 한 번에 말한다.

### Scenario 05

상품명만 말하고 필요한 옵션을 선택한다.

### Scenario 06

AI 음성 안내를 끈 상태에서 주문한다.

### Scenario 07

잘못 인식된 상품 또는 수량을 수정한다.

### Scenario 08

터치 주문 중 음성으로 전환한다.

### Scenario 09

음성 주문 중 터치로 전환한다.

### Scenario 10

음성 주문을 마치고 직접 결제를 진행한다.

### Scenario 11

할인 및 결제 브랜드를 스스로 발견한다.

### Scenario 12

세션 종료 안내 후 주문을 이어간다.

## 22.4 Test Participants

초기 탐색적 테스트 제안:

- 디지털 숙련도가 낮은 사용자 4명
- 일반 키오스크 사용자 2명

가능한 경우 청력 저하 및 물리적 접근성 요구가 있는
실제 대상 사용자를 포함한다.

소규모 테스트 결과를 전체 고객의 특성으로
일반화하지 않는다.

## 22.5 Comparison

AS-IS:
기존 메가커피 키오스크 구조

TO-BE:
UXPRESSO 개선 프로토타입

동일하거나 난이도가 유사한 과제를 수행한다.

가능한 경우 테스트 순서를 교차 배치하여
학습 효과를 줄인다.

## 22.6 Qualitative Observation

- 어떤 화면에서 멈추는가?
- 무엇을 눌러야 할지 이해하는가?
- 음성 기능을 스스로 발견하는가?
- AI의 음성을 듣지 않고도 진행하는가?
- 잘못된 인식을 스스로 수정하는가?
- 결제 단계 전환을 이해하는가?
- 주문이 정확하게 완료되었다고 확신하는가?

실제 테스트 결과가 없는 경우
개선 효과를 수치로 단정하지 않는다.

---

# 23. Design QA Checklist

## Brand

- [ ] 메가커피 브랜드 경험을 유지하는가?
- [ ] 신메뉴와 콜라보 상품이 노출되는가?
- [ ] 기존 결제 브랜드를 확인할 수 있는가?

## Navigation

- [ ] 기존 8개 대분류에 직접 접근 가능한가?
- [ ] 현재 카테고리가 명확한가?
- [ ] 이전 화면으로 돌아갈 수 있는가?
- [ ] 상품명과 가격이 명확한가?

## Voice

- [ ] 메뉴 선택 중 음성 기능에 접근 가능한가?
- [ ] 음성 인식 상태가 명확한가?
- [ ] AI 응답이 화면에 표시되는가?
- [ ] 음성 안내 없이 주문할 수 있는가?
- [ ] 필요한 정보만 질문하는가?
- [ ] 기존 UI를 재사용하는가?
- [ ] 인식 오류를 수정할 수 있는가?
- [ ] 전환 후 기존 장바구니가 유지되는가?
- [ ] 주문 확인 단계에서 마이크가 종료되는가?

## Accessibility

- [ ] 텍스트 대비가 충분한가?
- [ ] 주요 버튼의 터치 영역이 충분한가?
- [ ] 색상만으로 상태를 구분하지 않는가?
- [ ] 실제 기기에서 손이 닿는가?
- [ ] 느린 사용자를 고려한 시간 정책이 있는가?
- [ ] 음성 및 터치 대체 수단이 제공되는가?

## Payment

- [ ] 결제 금액이 명확한가?
- [ ] 할인 및 적립이 선택 사항임을 알 수 있는가?
- [ ] 결제 브랜드가 불필요하게 숨겨지지 않는가?
- [ ] 결제를 고객이 직접 실행하는가?
- [ ] 중복 결제를 방지하는가?
- [ ] 결제 오류 복구 방법이 있는가?

## Session

- [ ] 일반 상태에서 시간 압박을 줄였는가?
- [ ] 시간 연장이 가능한가?
- [ ] 초기화 전 명확한 안내가 있는가?
- [ ] 계속 주문 시 장바구니가 유지되는가?
- [ ] 결제 진행 중 세션을 보호하는가?

---

# 24. Project Scope & Limitations

## Confirmed Design Direction

- 첫 화면 상단 AD
- 매장 식사 / 포장 / 음성 주문
- 기존 8개 대분류 유지
- 하위 IA 개선
- 화면 중심 음성 주문
- 기존 UI 재사용
- 메뉴 단계 Sticky Voice Trigger
- Voice Guidance Bar
- 터치와 음성의 공통 주문 상태
- 최종 주문 확인부터 직접 조작
- 제휴 혜택 및 결제 브랜드 가시성 유지
- 세션 관리 기능 개선
- 접근성 중심 기본 UI

## Requires Validation

- 실제 키오스크 화면 크기 및 해상도
- 기기 설치 높이
- 실제 마이크 및 스피커 탑재 여부
- 매장 소음 환경
- 음성 인식 정확도
- 고령층 사용자 행태
- 실제 메뉴 데이터
- 추천 및 인기 상품 선정 정책
- 기존 메가메뉴의 운영상 의미
- 할인 및 제휴 혜택 정책
- 스탬프 적립 시점
- 현대 M포인트 적용 방식
- 결제 단말기 지원 기능
- 기존 세션 타이머 동작
- 실제 접근성 관련 요구사항

## Out of Scope

- 실제 결제 승인
- 실제 메가커피 내부 API 연동
- 실제 고객 개인정보 수집
- 매장 직원용 시스템
- 상품 제조 및 수령 시스템
- 모바일 앱 전체 리디자인
- 음성 기반 결제 실행
- 실제 매출 증가 효과 검증

---

# 25. Final Design Statement

UXPRESSO는 기존 키오스크의 기능을
무조건 제거하거나 단순화하는 프로젝트가 아니다.

기존 브랜드 경험과 비즈니스 가치를 존중하면서
고객이 겪는 탐색, 선택, 조작의 어려움을 개선한다.

음성 기술은 기존 주문 방식을 대체하지 않는다.

고객이 원하는 화면에 쉽게 도달하도록 돕고,
필요한 순간에는 직접 선택하고 수정할 수 있도록 한다.

Familiar Brand, Accessible Experience.

Reduce Decisions, Not Features.

Reduce Complexity, Not Visibility.

One Flow, Multiple Ways.

Speak to Select, Touch to Confirm.

누구나 쉽게, 혼자서도 자신 있게.

---

Document Version: 1.0
Project: UXPRESSO
Status: Proposed Design System
Platform: Kiosk
Design Type: Inclusive UX / Multimodal UI
