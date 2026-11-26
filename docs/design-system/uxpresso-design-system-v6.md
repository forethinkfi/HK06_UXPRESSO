# MEGA MGC COFFEE Kiosk Design System — UXPRESSO v6.0

> **Same Brand. Consistent Interface. Accessible Experience.**
> 메가MGC커피 셀프오더 키오스크(1080 × 1920 세로형)를 위한 디자인 시스템이다.
> 브랜드는 유지하고, 컴포넌트의 역할·상태·접근성을 일관되게 정리한다.

- 버전: v6.0 (v5.0 Brand-Preserved 기반 Refinement)
- 작성일: 2026-11-26
- 상태: 제안 / 하드웨어 검증 전 (공식 메가MGC커피 가이드라인 아님)
- 출처: UXPRESSO v4·v5·v6 스펙, Brand Color 브리프, `mega-coffee-design-system.fig` (범용 키오스크 키트)

---

## 목차
1. 원칙
2. 브랜드 보존 규칙
3. 컬러
4. 타이포그래피
5. 그리드 · 간격
6. Radius · Border · Elevation
7. 아이콘
8. 인터랙션 상태 모델
9. 컴포넌트
10. 고대비 테마
11. 콘텐츠 · 카피
12. 접근성
13. 대표 화면 플로우
14. 토큰 레퍼런스
15. 레거시 매핑 · 아카이브
16. 안티패턴
17. QA 체크리스트
18. 미해결 항목

---

## 1. 원칙

1. **브랜드는 유지한다.** 리브랜딩이 아니다. 컬러·로고·상품 이미지·카테고리·결제 브랜드는 바꾸지 않는다.
2. **역할을 구분한다.** 같은 행동은 같은 시각 언어로 표현한다.
3. **동작을 먼저 정의한다.** 컴포넌트의 상태는 모양이 아니라 동작 유형(행동·이동·선택·탭·토글·입력)으로 결정한다.
4. **선택과 포커스를 섞지 않는다.** Selected는 값 유지, Focus Visible은 보조 입력 탐색용이다.
5. **즉시 연결한다.** 상품과 결제 수단은 터치하면 바로 다음 단계로 이동한다.
6. **장식을 줄인다.** 두꺼운 외곽선, 그림자, 캡슐, 그라데이션을 쓰지 않는다.
7. **상품이 인터페이스보다 먼저 보인다.**

키워드: Familiar · Friendly · Energetic · Accessible · Functional · Consistent · Refined

---

## 2. 브랜드 보존 규칙

| 구분 | 항목 |
|---|---|
| **유지 (Preserve)** | 브랜드 컬러, 공식 로고/워드마크, 실제 상품 이미지, 시즌·콜라보 그래픽, 8개 메뉴 카테고리, 제휴사·결제 브랜드 로고, 주문 방식, HOT/ICE 구분 |
| **개선 (Refine)** | Shape, 버튼 위계, Border, 인터랙션 상태, 타이포 위계, 간격, 정렬, 아이콘, 접근성, 컴포넌트 구조 |
| **신규 (Create)** | 음성 주문(Trigger·Guidance), 도움말, 세션 연장, 오류 복구 |
| **금지 (Do Not)** | 리브랜딩, 새 Accent 컬러, 컬러 값 변경, AI 생성 상품 이미지, 결제사 로고 비율·색 변경, SaaS·AI 챗봇 스타일 |

공식 에셋이 없으면 임의로 그리거나 생성하지 않는다. 교체 가능한 Placeholder로 두고 실제 에셋과 구분한다.

### Brand Preservation Matrix
| 기존 요소 | 유지 | 개선 | 적용 규칙 |
|---|---|---|---|
| 브랜드 컬러 | ✔ | 사용 면적·역할 | Yellow = 주요 행동·선택, 값 변경 없음 |
| 로고 | ✔ | — | 공식 파일 전까지 Placeholder, 텍스트로 재현 금지 |
| 상품 이미지 | ✔ | 1:1 · contain | 공식 사진만 사용 |
| 상품명·가격 (`1,100원`) | ✔ | 기준선 통일 | 28/500 · 28/600 · 간격 8 |
| 시즌·콜라보 프로모션 | ✔ | 중복 제목 제거 | Full bleed, radius 0 |
| 제휴·결제 로고 | ✔ | 크기·그리드 | 비율/색 유지, 타일 r8 · 1px |
| 8개 카테고리 | ✔ | 4×2 그룹 탭 | 선택 = 브랜드 Yellow + 600 |
| 하단 주문 내역 | ✔ | 빈 상태 축소 | 패딩 40, 상단 1px, CTA 112 |
| 세션 타이머 | ✔ | 시각 위계 낮춤 | 빨간 카운트다운 금지 |
| 두꺼운 검은 외곽선 | ✖ 제거 | 1 / 2px | 여백으로 먼저 구분 |
| 캡슐·큰 Radius | ✖ 제거 | 0/4/8/12 | 역할별 Radius 토큰 |
| 노란 세로 강조선 | ✖ 제거 | 필수/선택 라벨 | 장식 바 금지 |

---

## 3. 컬러

새 컬러를 정의하지 않는다. 승인된 Brand Color System을 참조하고, **사용 면적·역할·위계**만 개선한다.

### 3.1 Brand Primitive (승인 값)
| 토큰 | 값 | 용도 |
|---|---|---|
| `--mc-yellow-40` | `#F8DA29` | Brand Yellow — Primary 버튼, 현재 카테고리, 배지, 체크 채움 |
| `--mc-yellow-50` | `#E7BE0B` | Primary Pressed |
| `--mc-yellow-30` | `#FBE949` | (HC) Primary Pressed |
| `--mc-yellow-10` | `#FDFBC4` | Selection 배경 (옵션·서브카테고리·필터) |
| `--mc-yellow-5` | `#FEFDE8` | Info 배경 |
| `--mc-black` | `#231F20` | Brand Black — 텍스트, 선택 테두리, 인디케이터, 음성 버튼 |
| `--mc-ink` | `#0E0F0E` | 음성 버튼 Pressed |
| `--mc-white` | `#FFFFFF` | 기본 Surface |

> v6 스펙의 제안값(`#FFDC00`, `#E5BA00`, `#171717`)은 **적용하지 않았다.** "승인된 토큰 우선" 규칙(v6 §04)에 따른 것이다. 브랜드 승인 시 `tokens/brand.css` 한 곳만 바꾸면 전체에 반영된다.

### 3.2 Interaction Semantic Tokens (`tokens/semantic.css`)
| 토큰 | 참조 | 용도 |
|---|---|---|
| `--action-primary-bg` / `-pressed` / `-text` | yellow-40 / yellow-50 / black | Primary 버튼 |
| `--action-secondary-bg` / `-pressed` / `-text` | white / gray-5 / text | Secondary 버튼 |
| `--action-destructive-text` | status-error | 삭제·종료 |
| `--action-voice-bg` / `-pressed` / `-text` | black / ink / white | 음성 버튼 |
| `--selection-bg` | yellow-10 | 선택 유지 옵션 배경 |
| `--selection-border` / `-indicator` | black | 선택 테두리·라디오·탭 인디케이터 |
| `--selection-strong-bg` | yellow-40 | 현재 카테고리, 현재 단계 |
| `--surface-default` / `-subtle` / `-pressed` | white / gray-5 / gray-5 | 배경 |
| `--text-primary` / `-secondary` | black / gray-70 | 텍스트 |
| `--border-color-subtle` / `-default` / `-strong` | gray-10 / gray-30 / black | 구분선·일반·조작 영역 경계 |
| `--disabled-bg` / `-text` / `-border` | gray-10 / gray-60 / gray-10 | 비활성 (모든 컴포넌트 공통) |
| `--focus-ring-color` | black (HC: yellow) | 접근성 포커스 |
| `--feedback-success` / `-warning` / `-error` / `-info` | 기존 Semantic 토큰 | 상태 피드백 |
| `--temp-hot` / `--temp-ice` | 빨강 / 파랑 계열 | HOT/ICE 구분에만 사용, 항상 텍스트와 함께 |

### 3.3 사용 규칙
- Brand Yellow: 주요 행동, 현재 카테고리, 현재 단계, 배지
- Selected Yellow(yellow-10): 선택값을 유지하는 옵션
- Yellow를 흰 배경 위 **텍스트**나 **유일한 경계선**으로 쓰지 않는다 (대비 부족).
- 같은 역할에 다른 회색을 쓰지 않는다. Disabled는 공통 토큰을 쓴다.
- 상태 변경 시 컴포넌트 전체 Opacity를 낮추지 않는다.
- 라디오 버튼에 파란 선택 컬러를 쓰지 않는다.
- 결제사 로고는 공식 색상을 유지한다.

---

## 4. 타이포그래피

- **Brand Typography:** 로고·광고·프로모션의 공식 서체는 그대로 둔다. 워드마크를 텍스트로 재현하지 않는다.
- **Functional Typography:** Pretendard (fallback Noto Sans KR). 공식 GUI 서체가 확인되면 교체한다.
- Weight는 400 / 500 / 600 / 700만 쓴다. GUI에서 800~900은 쓰지 않는다.

| Role | Size / Line | Weight | 토큰 |
|---|---|---:|---|
| Display | 56 / 72 | 700 | `--type-display` |
| Page Title | 40 / 56 | 700 | `--type-page-title` |
| Section Title | 32 / 44 | 600 | `--type-section` |
| Subsection Title | 28 / 40 | 600 | `--type-subsection` |
| Primary Button | 32 / 44 | 600 | `--type-button-primary` |
| Secondary Button | 28 / 40 | 500 | `--type-button-secondary` |
| Tertiary Button | 24 / 36 | 500 | `--type-button-tertiary` |
| Category (선택 시 600) | 28 / 40 | 500 | `--type-category` |
| Product Name | 28 / 40 | 500 | `--type-product-name` |
| Product Price | 28 / 36 | 600 | `--type-price` |
| Option Label | 28 / 40 | 500 | `--type-option` |
| Body | 24 / 36 | 400 | `--type-body` |
| Utility Label | 24 / 32 | 500 | `--type-utility` |
| Supporting Text | 22 / 32 | 400 | `--type-supporting` |
| Caption | 20 / 28 | 400 | `--type-caption` |
| Badge | 20 / 28 | 600 | `--type-badge` |
| Numeric Key | 32 / 44 | 500 | `--type-key` |
| Total Price | 48 / 60 | 700 | `--type-total` |
| Order Number | 96 / 112 | 700 | `--type-order-number` |

규칙:
- 모든 텍스트를 Bold로 표현하지 않는다. 크기·굵기·위치·여백을 조합해 위계를 만든다.
- 버튼 레이블은 줄바꿈하지 않는다(`white-space: nowrap`). Loading 상태에서도 그렇다.
- 숫자에는 tabular numerals를 쓴다.
- 장식용 영문 서브타이틀을 쓰지 않는다.

---

## 5. 그리드 · 간격

### 5.1 Reference Canvas
| 항목 | 값 |
|---|---|
| Canvas | 1080 × 1920 (Portrait) |
| Columns | 12 |
| Outer Margin | 40 |
| Gutter | 24 |
| Content Width | 1000 |
| Base / Sub Unit | 8 / 4 |
| 상품 그리드 | 3열 기본 (317.33), 대안 4열 (232) |

- 모든 화면에서 같은 좌우 기준선을 쓴다.
- 헤더·광고는 Full bleed를 허용한다.
- 고정 영역(헤더·카테고리·장바구니)과 스크롤 영역을 명확히 구분한다.
- 빈 공간을 장식으로 채우지 않는다.

### 5.2 Primitive Spacing
`0 · 4 · 8 · 12 · 16 · 24 · 32 · 40 · 48 · 64 · 80 · 96` → `--space-0` … `--space-96`

### 5.3 Semantic Spacing (관계 기반)
| 관계 | 값 | 토큰 |
|---|---:|---|
| 아이콘 ↔ 텍스트 | 12 | `--space-icon-label` |
| 관련 텍스트 사이 | 8 | `--space-related-text` |
| 상품명 ↔ 가격 | 8 | `--space-name-price` |
| 상품 이미지 ↔ 정보 | 16 | `--space-image-name` |
| 같은 그룹 버튼 사이 | 16 | `--space-button-gap` |
| 버튼 그룹 사이 | 24 | `--space-button-group` |
| 섹션 제목 ↔ 콘텐츠 | 24 | `--space-title-content` |
| 카테고리 탭 사이 | 8 | `--category-gap` |
| 옵션 사이 | 16 | `--option-selector-gap` |
| 상품 그리드 가로 / 세로 | 24 / 32 | `--product-grid-column-gap` / `-row-gap` |
| 콘텐츠 그룹 사이 | 32 | `--space-content-group` |
| 독립 섹션 사이 | 48 | `--space-section` |
| 화면 좌우 여백 | 40 | `--space-screen` |

화면별로 임의 간격을 지정하지 않는다. 버튼 내부 Padding과 버튼 사이 Gap은 구분한다.

---

## 6. Radius · Border · Elevation

### 6.1 Radius
| 토큰 | 값 | 용도 |
|---|---:|---|
| `--radius-none` | 0 | 헤더, 광고, 상품 카드, 상품 이미지 |
| `--radius-xs` | 4 | 배지, 카테고리, 서브카테고리, 필터 |
| `--radius-sm` | 8 | 모든 버튼, 옵션, 결제 타일, 유틸리티, 입력, 키패드 |
| `--radius-md` | 12 | Dialog, Guidance Panel |
| `--radius-full` | 999 | Switch, 라디오, 카운트·단계 인디케이터 |

캡슐형 버튼, 하단 입체 효과, 버튼별 다른 그림자를 쓰지 않는다.

### 6.2 Border
| 토큰 | 값 | 적용 |
|---|---:|---|
| `--border-none` | 0 | Primary 버튼, 상품 카드, 기본 카테고리 탭, Tertiary, 장바구니 행 |
| `--border-subtle` | 1 | 구분선 |
| `--border-default` | 1 | Secondary 버튼, 옵션, 결제/혜택 타일, 입력, 키패드, 스테퍼 |
| `--border-selected` | 2 | 선택값 유지 컴포넌트만 |
| `--focus-ring-width` / `-offset` | 3 / 3 | 접근성 포커스 |

- 경계선이 조작 영역의 유일한 단서이면 `--border-color-strong`을 쓴다.
- 모든 상태 변화는 **inset box-shadow / outline**으로 그려 레이아웃이 움직이지 않게 한다.
- 점선 테두리를 버튼에 쓰지 않는다. 모서리 삼각형 선택 표시를 쓰지 않는다.

### 6.3 Elevation
- 기본 없음: 카드·버튼·타일·내비게이션·음성 모두 해당.
- Dialog만 `--elevation-modal` (`0 8px 24px`).
- Sticky Cart는 그림자 대신 상단 1px 구분선을 쓴다.

### 6.4 Motion
`0 / 100 / 180 / 240ms`, `cubic-bezier(.2,0,0,1)`. 기능적 상태 변화에만 쓴다. Scale, 바운스, 장식 애니메이션은 쓰지 않는다. `prefers-reduced-motion`을 존중한다.

---

## 7. 아이콘

- 공식 메가커피 픽토그램이 있으면 우선 사용한다(현재 미제공).
- 일반 기능 아이콘: **Lucide** Outline (CDN `lucide@0.460.0`), 2px stroke, round cap/join.
- 라이브러리를 섞지 않는다. 원형 장식 배경, 반짝이, 이모지를 쓰지 않는다.
- 의미가 모호한 아이콘에는 텍스트 레이블을 붙인다.

| 역할 | 크기 |
|---|---:|
| Supporting | 24 |
| Standard / Navigation / Utility | 32 |
| Primary Action | 40 |
| Order Type Pictogram | 64 ~ 80 |

주요 매핑: house(처음으로) · mic(음성 입력) · volume-2(음성 출력) · accessibility · globe · contrast · zoom-in · shopping-cart · plus/minus · trash-2 · info · chevron-left/right · credit-card · ticket · gift · stamp · wallet-cards · clock · loader-circle · circle-check · circle-alert · triangle-alert

---

## 8. 인터랙션 상태 모델

### 8.1 동작 유형별 상태
| 유형 | 예시 | Default | Pressed | Selected | Focus | Disabled | Loading |
|---|---|:-:|:-:|:-:|:-:|:-:|:-:|
| **Action** | 시작하기, 담기, 주문 확인, 결제하기, 이전, 취소, 삭제 | ● | ● | — | ● | ● | ●* |
| **Direct Navigation** | 상품 카드, 결제 수단, 혜택 진입, 주문 방식 | ● | ● | — | ● | ● | ●* |
| **Selection** | HOT/ICE, 샷, 우유, 당도, 일회용품, 체크박스, 라디오 | ● | ● | ● | ● | ● | — |
| **Navigation Tab** | 카테고리, 서브카테고리, 필터 | ● | ● | ● | ● | (●) | — |
| **Toggle** | 고대비, 화면 확대, 음성 출력 | Off | ● | On | ● | ● | — |
| **Input** | 키패드, 수량, 전화번호, 쿠폰 | ● | ● | Filled | ● | ● | Error |

\* 실제 비동기 처리일 때만 Loading을 쓴다.

### 8.2 상태 정의
- **Default:** 역할별 기본 배경과 경계. 불필요한 테두리는 넣지 않는다.
- **Pressed:** 터치 순간의 배경 변화만 있다(Primary는 더 어두운 Yellow, 나머지는 연회색). 크기·Border·텍스트 위치를 유지하고, 터치가 끝나거나 취소되면 해제한다. Scale 애니메이션은 쓰지 않는다.
- **Selected:** 선택값을 유지할 때만 쓴다. Selection 배경 + 2px 테두리(필요 시) + 체크/라디오 인디케이터 + 600 굵기. **상품 카드와 결제 수단에는 쓰지 않는다.**
- **Focus Visible:** 키보드·방향키·보조 입력 장치 전용이다. 3px 링, 3px 오프셋, 전역 `:focus-visible`로 적용한다. 터치 후에는 남지 않는다. Pressed·Selected와 함께 나타날 수 있다. 화면이 바뀌면 포커스를 제목이나 첫 조작 요소로 옮긴다.
- **Disabled:** 공통 Disabled 토큰, 그림자 없음, 실제로 비활성화한다. 고객에게 중요하면 이유를 안내한다.
- **Loading:** 스피너 + 짧은 처리 레이블(처리 중 · 결제 확인 중 · 주문 확인 중). 같은 크기를 유지하고 중복 실행을 막는다.
- **Error:** 버튼 Variant로 만들지 않는다. 입력 필드나 Feedback 컴포넌트에서 원인과 해결 방법을 함께 표시한다. 아이콘과 텍스트를 쓰고, 색상만으로 표현하지 않는다.

---

## 9. 컴포넌트

공통 규칙: 모든 크기·색은 토큰을 참조한다. 같은 역할을 별도 Master Component로 중복 생성하지 않는다.

### 9.1 Button
| Role | 사용 | 높이 | Padding | 배경 / 텍스트 | Border | Type |
|---|---|---:|---:|---|---|---|
| **Primary** | 시작하기, 장바구니에 담기, 주문 확인, 결제하기, 계속 주문하기 | 112 | 32 | Yellow / Black | 없음 | 32/600 |
| **Secondary** | 이전, 취소, 직접 수정하기, 다시 말하기 | 88 | 24 | White / Black | 1px strong | 28/500 |
| **Tertiary (text)** | 상세 정보, 시간 연장, 도움말 | 80 (터치) | 12 | 투명 / Black | 없음 | 24/500 |
| **Destructive** | 상품 삭제, 전체 삭제, 주문 종료 | 88 | 24 | White / Error | 1px strong | 28/500 |
| **Voice** | 음성으로 주문하기 | 88 | 24 | Black / White | 없음 | 28/500 |

- Radius는 모두 8, 그림자는 없다.
- 결정 영역당 Primary는 하나만 둔다. 같은 행의 Primary·Secondary는 높이를 맞춘다.
- 버튼 그룹 내부 간격은 16, 그룹 사이는 24 이상으로 한다.
- 전체 삭제처럼 영향이 큰 행동에는 확인 절차를 둔다.
- 검은 Fill 버튼을 일반 행동 스타일로 쓰지 않는다(Voice만 기능적 예외).

```jsx
<Button label="장바구니에 담기" />
<Button variant="secondary" label="이전" />
<Button variant="text" icon="info" label="상세 정보" />
<Button variant="destructive" icon="trash-2" label="전체 삭제" />
<Button variant="voice" icon="mic" label="음성으로 주문하기" />
<Button label="결제하기" loading loadingLabel="결제 확인 중" />
```

### 9.2 Icon Button
닫기·수량 증감·페이지 이동·음성 다시 듣기에 쓴다. 터치 영역 최소 80×80, 아이콘 32, Radius 8, 필요 시 1px 테두리. `label`(aria-label)은 필수다.

### 9.3 Utility Button / Toggle
- 언어, 접근성, 고대비, 화면 확대, 화면 내리기, 음량, 도움말, 시간 연장, 직원 호출(지원 시)에 쓴다.
- 80 높이, Radius 8, 아이콘 32, 간격 12, 24/32 500, 투명 배경, 필요 시 1px 테두리.
- **Toggle:** 상태를 `ON` / `OFF` 텍스트로 함께 표시하고 `aria-pressed`를 쓴다. On 상태는 Selection 배경 + 1px 테두리다.
- 구현되지 않은 기능은 작동하는 것처럼 보이지 않게 Disabled로 표시한다.

### 9.4 Global Header
- 높이 112, 좌우 40, 유틸리티 간격 16, 수직 중앙 정렬, 배경 White, 하단 1px 구분선.
- 구성: 처음으로(아이콘+텍스트) · 공식 로고(≤ 56 높이, 현재 Placeholder) · 현재 주문 방식 · 유틸리티 · 음성 주문.
- 로고가 기능 버튼 영역을 침범하지 않게 한다. 버튼 레이블은 줄바꿈하지 않는다. 주문 방식 텍스트는 공간이 부족할 때만 말줄임한다.

### 9.5 Category Tabs (Navigation/CategoryTab)
- 8개 고정: 신메뉴 · 추천메뉴 · 커피 · 디카페인 / 음료 · 티 · 푸드 · 상품
- 4열 × 2행, 높이 88, 간격 8, Radius 4, 기본 테두리 없음.
- Default는 Neutral 배경(gray-5) + Black 텍스트 28/500이다.
- Selected는 Brand Yellow 배경 + Black 텍스트 600이다.
- Pressed는 일시적인 State Layer다.
- 하나의 `tablist`로 묶는다. 카테고리를 삭제하거나 숨기지 않는다.

### 9.6 Subcategory · Filter
- 카테고리보다 낮은 위계를 쓴다. 터치 높이 80, 좌우 24, Radius 4, 24/500.
- **Subcategory** 선택: Selection 배경 + 하단 3px 인디케이터 + 600.
- **Filter** (HOT/ICE, 취향): Default는 White + 1px, Selected는 Selection 배경 + 2px + 체크 아이콘.

### 9.7 Pagination (MenuPagination)
- 이전 · `현재 / 전체` · 다음. 80 터치, Radius 8, 1px 테두리.
- 화살표 방향과 실제 이동 방향을 맞춘다. 첫 페이지에서는 이전, 마지막 페이지에서는 다음을 비활성화한다(숨기지 않음).

### 9.8 Product Card
구조: 이미지(1:1, contain) → 배지 → 상품명(최대 2줄, 고정 높이 80) → 온도 → 가격 → 상세 정보

| 항목 | 값 |
|---|---|
| 배경 / 테두리 / Radius / 그림자 | 투명 / 없음 / 0 / 없음 |
| 이미지 ↔ 상품명 | 16 |
| 상품명 ↔ 가격 | 8 |
| 상세 정보 버튼 | 별도 행동, 터치 80 |

- **동작:** 터치하면 해당 상품의 옵션 화면으로 즉시 이동한다(선택 후 확인 단계 없음).
- **상태:** Default · Pressed(Neutral layer) · Focus Visible · Sold Out.
- **Sold Out:** `품절` 배지 + 가격 자리에 `품절`, 주문 비활성화. 상품명은 읽을 수 있게 두고 상세 정보는 유지한다. 카드 전체를 흐리게 처리하지 않는다.
- **제거:** Selected Variant, 터치 후 남는 포커스, 두꺼운 외곽선, 모서리 삼각형, 체크박스, 그림자.
- 공식 상품 이미지만 쓴다(스톡·AI 이미지 금지).

### 9.9 Badge
| 종류 | 배경 / 텍스트 |
|---|---|
| NEW · BEST · 할인 · 시즌 한정 · 콜라보 | Brand Yellow / Black |
| 품절 | Black / White |

Radius 4, Padding 8 / 12, 20/28 600. 크기·굵기·위치는 통일한다. 실제 상품 데이터에 근거해서만 표시한다. AI PICK, SMART CHOICE 같은 임의 배지는 금지한다.

### 9.10 Option Selector (Selection/RadioTile · CheckboxTile)
| 항목 | 값 |
|---|---|
| 최소 높이 / Padding / Radius | 96 / 24 / 8 |
| 인디케이터 ↔ 텍스트 | 12 |
| 옵션 사이 | 16 |
| Type | 28/500 (선택 시 600) |

- **Default:** White, 1px 테두리, 빈 인디케이터.
- **Selected:** Selection 배경 + 2px Black 테두리 + 체크된 인디케이터.
- **Pressed:** 일시적인 State Layer. 기존 선택값은 유지한다.
- **Radio**(단일 선택: HOT/ICE, 우유, 당도): 빈 원 + 진한 테두리 → 검은 링 + 검은 내부 점.
- **Checkbox**(복수 선택): 빈 사각형 + 1px 진한 테두리 → Yellow 채움 + Black 체크. 미선택 상태에 흐린 체크를 표시하지 않는다.
- 추가 금액은 오른쪽에 `+500원`처럼 표시한다.
- 선택할 수 없는 옵션은 불필요하게 노출하지 않는다. 단일 옵션만 가능하면 자동 적용하고 안내한다.
- 옵션 그룹: 섹션 제목 + `필수` / `선택` 라벨 + (보조 설명) + 옵션. 노란 세로 강조선은 쓰지 않는다.

### 9.11 Temperature Selector
HOT / ICE 라디오 그룹(높이 112). 온도 색은 이 컴포넌트에서만 쓰고, 항상 텍스트 레이블·아이콘과 함께 쓴다. 한 가지 온도만 가능하면 다른 쪽은 비활성화하고 안내한다.

### 9.12 Quantity Stepper
- − / 수량 / + 구성. 버튼은 80×80 동일 크기, Radius 8, 1px 진한 테두리. 수량은 고정 폭 72에 가운데 정렬한다.
- 최소 수량에서 −를 비활성화한다. 수량 감소와 상품 삭제는 별도 컨트롤로 둔다.

### 9.13 Numeric Keypad · Numeric Key
- 3열, 키 최소 96×96, 간격 16, Radius 8, White, 1px, 32/500, Pressed는 Neutral.
- 키: `1–9`, `0`, `전체 지우기`, `한 글자 지우기`.
- 전화번호·쿠폰 입력을 우선으로 한다. 일반 키보드·Passcode는 실제 주문 기능에 필요할 때만 쓴다.

### 9.14 Input Field (TextInput)
- 상태: Empty · Filled · Focus Visible · Error · Disabled.
- 높이 88, Radius 8, 좌우 24, 1px 진한 테두리, 28 글자. Placeholder는 400 회색, 입력값은 500 검정.
- Error는 2px 오류 테두리 + 아래에 아이콘과 해결 방법을 표시한다.
- 개인정보 동의를 미리 체크해 두지 않는다. 전화번호는 적립 등 필요한 절차에서만 받는다.

### 9.15 Cart Item · Sticky Cart
**Cart Item:** 상품명 · 온도 · 옵션 · 옵션 변경 · 수량 스테퍼 · 금액 · 삭제. White, 테두리 없음, 행 구분 1px. 행 전체에 노란 포커스 배경을 쓰지 않는다. 변경 결과는 금액에 즉시 반영한다.

**Sticky Cart:**
- 좌우 40, 내부 간격 16~24, 상단 1px, CTA 최소 112.
- **Empty:** 한 줄 안내 + 0개 + 총액 + `주문 확인` 비활성화 + 세션 유틸리티. 공간을 과하게 쓰지 않는다.
- **Filled:** 최근 항목 + `전체 삭제`(Destructive, 확인 절차) + 총 결제금액(48/700) + `주문 확인`.

### 9.16 Payment · Benefit Tiles
| 컴포넌트 | 동작 |
|---|---|
| Payment / MethodTile | 터치하면 해당 결제 안내로 **즉시 이동** |
| Benefit / EntryTile | 할인·적립 절차 시작 (같은 Direct Action 스타일) |
| Benefit / AppliedTile | 실제 적용에 성공한 경우에만 `적용됨` + 체크 + 실제 혜택 정보 |

- 높이 112, Padding 16, Radius 8, White, 1px, 그림자 없음.
- 공식 로고(≤ 160×56, contain) + 결제 수단명 + (보조 설명).
- 상태: Default · Pressed · Focus · Disabled(+이유) · Loading(실제 승인·준비 중일 때만).
- **제거:** 결제 수단의 지속적인 Selected, 체크박스, 선택 후 확인 버튼 단계.
- 그룹: 할인·적립 / 결제 수단(카드·간편결제 강조) / 상품권·선불카드. 쿠폰과 상품권은 같은 역할로 합치지 않는다.
- PRD의 22개 할인·결제 수단을 모두 직접 접근할 수 있게 유지하고, 추가 메뉴 안에 숨기지 않는다.

### 9.17 Step Indicator
- 단계: 메뉴 선택 · 주문 확인 · 할인·적립 · 결제 · 주문 완료(PRD에 맞춰 조정).
- **Completed:** 검은 원 + 체크.
- **Current:** Brand Yellow 원 + 검은 숫자 + 600 레이블 + `aria-current`.
- **Upcoming:** Neutral + 1px + 회색 텍스트.
- 이중 검은 외곽선은 쓰지 않는다. 모든 화면에 강제하지 않는다.
- 실제 제조 상태 API가 없으면 제조 진행률을 표시하지 않는다.

### 9.18 Voice (Trigger · Guidance Bar)
- **Trigger:** Voice 버튼(Black/White, 88, Radius 8, mic 아이콘). 상태: idle · listening · processing · active · error · unavailable. 일반 Selected와 구분한다.
- **Guidance Bar:** 음성이 켜졌을 때만 표시한다. 인식 상태 · 인식된 발화 · 시스템 응답 · 다음 행동 · 음성 출력 설정 · 종료로 구성된다.
- 고객이 명시적으로 켠다. 결과는 기존 메뉴·옵션 화면에 반영한다(챗봇 화면 없음).
- 모든 음성 안내를 화면 텍스트로도 제공한다. 할인·적립·결제는 터치로 진행한다.
- AI 그라데이션, 반짝이 아이콘, 캐릭터, 말풍선, 과한 파형 애니메이션은 금지한다. 음성 버튼은 화면당 하나만 둔다.

### 9.19 Dialog · Help · Empty State
- **Dialog:** 여백 40, Padding 32~40, Radius 12, 섹션 간격 24, 버튼 간격 16, `--elevation-modal`. 간단한 확인·오류에만 쓴다. 모달 위에 모달을 중첩하지 않고 Scrim도 중복하지 않는다.
- **복잡한 상품 옵션은 독립 화면**으로 구성한다(Dialog 아님).
- **Help Accordion:** 행 최소 88, 1px 구분선, 28/500, 쉐브론 32. 도움말을 굵은 테두리 카드로 반복하지 않는다. 사용 후에도 주문 상태를 유지한다.
- **Empty State:** 한 문장 + (다음 행동). 아이콘은 Lucide이고 원형 배경과 일러스트는 없다. `compact`는 빈 장바구니에 쓴다.

### 9.20 Feedback · Session
**Feedback (InlineFeedback):** 아이콘 + 메시지 + (상세) + (복구 행동). Tone: success · warning · error · info · pending.

| 상황 | 메시지 |
|---|---|
| 결제 실패 확정 | 결제가 완료되지 않았어요. 카드를 확인한 후 다시 시도해 주세요. |
| 결제 상태 불명 | 결제 결과를 확인하고 있어요. 확인이 끝날 때까지 다시 결제하지 마세요. |
| 결제 승인 후 주문 접수 실패 | 결제는 승인되었어요. 다시 결제하지 마세요. (재결제를 유도하지 않음) |

**Session:**
- 기본 안내: *2분 동안 조작이 없으면 종료 안내가 표시돼요.* 회색 Caption과 Tertiary `시간 연장`으로 보여 준다.
- 빨간 카운트다운을 계속 강조하지 않는다.
- 경고 Dialog에는 남은 시간, `계속 주문하기`(Primary), `주문 종료하기`(Secondary)를 둔다.
- 결제 처리 중에는 세션을 초기화하지 않는다.
- 120초 미조작 + 60초 경고는 가설 규격이므로 운영 정책으로 검증해야 한다.

### 9.21 Focus Indicator
스펙·시안용 정적 포커스 링(3px / 3px)이다. 실제 UI는 전역 `:focus-visible`이 처리한다.

---

## 10. 고대비 테마

별도 컴포넌트를 만들지 않는다. **같은 컴포넌트에 Theme Token만 바꾼다.** `<html data-mode="high-contrast">`로 적용한다.

| 토큰 | 일반 | 고대비 |
|---|---|---|
| Surface | White | Black |
| Text primary / secondary | Black / gray-70 | White / gray-20 |
| Primary 버튼 | Yellow / Black | Yellow / Black |
| Secondary 버튼 | White / Black + 1px | White / Black |
| Selected 배경 / 테두리 | yellow-10 / Black | Black / Yellow |
| Focus Ring | Black | Yellow |
| Disabled | gray-10 / gray-60 | gray-90 / gray-40 |
| 결제 타일 | White | White (로고 보호) |

- 컴포넌트 구조, 크기, 배치, 아이콘, 인터랙션 규칙은 같다. 고대비에서만 다른 Radius나 입체 버튼을 쓰지 않는다.
- Selected와 Focus Visible을 고대비에서도 구분한다.
- 전환해도 장바구니와 주문 상태를 유지한다.

---

## 11. 콘텐츠 · 카피

- 한국어 우선, 짧은 해요체: "주문 방법을 선택해 주세요", "원하시는 메뉴를 말씀해 주세요", "장바구니에 담았어요".
- 물리적 행동을 구체적으로 안내한다: "IC칩이 위로 향하게 카드 투입구에 넣어 주세요."
- 레이블은 동사형 또는 명사형이다: 처음으로 · 장바구니에 담기 · 주문 확인 · 결제하기 · 메뉴 더 담기 · 전체 삭제 · 시간 연장 · 음성으로 주문하기.
- 숫자: `1,100원`, `2개`, tabular numerals, 주문 번호 `A-127`.
- 오류는 사실과 다음 행동을 함께 쓴다.
- 이모지, 장식용 영문 서브타이틀, 과장 표현을 쓰지 않는다.
- 설명·가격·인기도·프로모션을 임의로 만들지 않는다.
- 언어 이름은 텍스트로 제공한다: 한국어 · English · 日本語 · 中文 (국기만 쓰지 않음).

---

## 12. 접근성

| 항목 | 기준 |
|---|---|
| 일반 최소 터치 영역 | 80 × 80 |
| 표준 조작 / 숫자 키 | 96 |
| 주요 CTA | ≥ 112 |
| 일반 텍스트 대비 | ≥ 4.5 : 1 |
| 큰 텍스트 대비 | ≥ 3 : 1 |
| 필수 GUI·상태 표시 대비 | ≥ 3 : 1 |
| 포커스 | 3px 링 / 3px 오프셋, 보조 입력 전용 |

- 선택 상태에는 색 외의 단서(체크, 라디오, 굵기, aria)를 준다.
- 터치와 음성 대체 경로를 모두 제공한다. 음성 없이도 주문을 완료할 수 있어야 한다.
- 충분한 읽기·조작 시간을 주고, 주문 상태 유지와 오류 복구를 지원한다.
- 접근성을 이유로 모든 요소에 두꺼운 테두리나 굵은 텍스트를 쓰지 않는다.
- 물리 크기 목표는 15~20mm다. 실제 키오스크 크기, 설치 높이, 해상도에서 검증한다.

---

## 13. 대표 화면 플로우

| # | 화면 | 핵심 구성 |
|---|---|---|
| 01 | 주문 시작 | 브랜드 광고 · 매장에서 먹기 / 포장하기(동일 위계, 간격 24) · 음성으로 주문하기(Voice 버튼) · 언어·접근성·쿠폰 유틸리티 |
| 02 | 메뉴 탐색 | 헤더 · 8개 카테고리 · 서브카테고리 · 3열 상품 카드 · 페이지 이동 · Sticky Cart · 세션 |
| 03 | 상품 옵션 | 독립 화면 · 상품 정보 · HOT/ICE · 필수/선택 옵션 그룹 · 수량 · 장바구니에 담기 |
| 04 | 주문 확인 | 단계 표시 · 상품·온도·옵션·수량 · 수정·삭제 · 총 금액 |
| 05 | 할인·결제 | 할인·적립(스탬프: 전화번호 입력 + 키패드 → 적용됨) · 결제 수단(터치 즉시 이동) · 상품권·선불카드 |
| 06 | 결제 처리 | 결제 방법 안내 · 금액 · 처리 상태(pending) · 오류 복구 |
| 07 | 접근성 | 고대비 토글 · 화면 확대·화면 내리기(미지원 시 Disabled) · 언어 |
| 08 | 음성 주문 | 활성화 → 인식 결과 → 기존 옵션 화면 반영 → 장바구니 → 음성 종료 |
| 09 | 주문 완료 | 결제·주문 접수 완료 · 주문 번호(96/700) · 픽업 안내 · 처음으로 |

---

## 14. 토큰 레퍼런스 (컴포넌트 토큰)

| 토큰 | 값 |
|---|---|
| `--header-height` | 112 |
| `--button-primary-height` · `--button-height-primary` | 112 |
| `--button-secondary-height` · `--button-height-secondary` | 88 |
| `--button-tertiary-height` | 80 |
| `--button-padding-horizontal` / `-secondary` | 32 / 24 |
| `--button-group-gap` | 16 |
| `--icon-button-size` | 80 |
| `--utility-height` / `-icon-size` / `-radius` | 80 / 32 / 8 |
| `--category-height` / `-gap` | 88 / 8 |
| `--filter-height` / `-padding` | 80 / 24 |
| `--product-grid-column-gap` / `-row-gap` | 24 / 32 |
| `--product-image-ratio` | 1 / 1 |
| `--option-selector-height` / `-gap` / `--option-padding` | 96 / 16 / 24 |
| `--payment-tile-height` | 112 |
| `--input-height` / `-padding` | 88 / 24 |
| `--numeric-key-size` | 96 |
| `--cart-padding` / `-gap` | 40 / 24 |
| `--dialog-padding` / `-margin` / `-section-gap` / `-button-gap` | 40 / 40 / 24 / 16 |
| `--accordion-row-height` | 88 |
| `--badge-padding` | 8px 12px |
| `--focus-ring-width` / `-offset` | 3 / 3 |

**토큰 계층:** Primitive(`brand.css`, `uxpresso.css`) → Semantic(`semantic.css`) → Component(`semantic.css`, `uxpresso.css`). 컴포넌트에 컬러 값을 직접 쓰지 않는다. 일반·고대비는 Theme Mode로 관리한다.

**파일:** `styles.css` → `tokens/fonts.css` · `fig-tokens.css` · `brand.css` · `semantic.css` · `typography.css` · `uxpresso.css` · `interaction.css` · `layout.css`

---

## 15. 레거시 매핑 · 아카이브

| 레거시 | v6 컴포넌트 |
|---|---|
| MainButton / MainButton2 / PayButton / PayButton2 / ActionButton(fill) | `Button` primary |
| ActionButton(line) | `Button` secondary |
| NormalBtn | `UtilityButton` |
| CloseBtn | `IconButton` |
| ProductButton 1–4 | `ProductCard` |
| ProductItemButton / OptionItemButton / OptionTab | `OptionSelector` · `TemperatureSelector` |
| ProductCategoryButton / TabAsset | `CategoryTabs` |
| FilterTab | `Filter` |
| Pagination / PaginationBar | `MenuPagination` |
| Accessibility 15 / 27 / 43 | `UtilityButton` + 접근성 패널 |
| LanguageSelector 계열 | 언어 라디오(`OptionSelector`) |
| NumericStepper | `QuantityStepper` |
| Numpad / NumpadAsset | `NumericKeypad` / `NumericKey` |
| InputField / InputField27 | `TextInput` |
| CartTable / CartTable2 / OrderHistoryTable | `CartItem` + `StickySummary` |
| Header 15 / 27 / 43 | `GlobalHeader` |
| StepIndicator27 | `StepIndicator` |
| Payment Brand Tile | `PaymentBrandTile` |

**Legacy Archive** (메가커피 라이브러리에서 제외, 참조 관계 때문에 원본 보존): Locker · LockerPagenation · MachineSelectButton · MachineIcon · ServiceSelectButton(세탁기 선택) · CourseSelectButton · TouristMenuTab(+Asset) · PhoteElement · PhoteFestivalElement · IconAttractions · InformationElement(Facility) · TimeNumericStepper(30분 연장) · Header15/27/43(NIA 헤더) · CCTVAnimation · CCTVRecording · BoxAnimation

---

## 16. 안티패턴

과도한 검은 테두리 · 두꺼운 선택 외곽선 · 임의 간격 · 과한 굵기 · 과한 Radius · 모든 것을 캡슐로 · 중첩 카드 · 중첩 모달 · 장식용 아이콘 컨테이너 · 반복되는 도움말 카드 · 섹션 강조 바 · 일관되지 않은 상품 사진 · 불필요한 영문 서브타이틀 · 범용 AI·챗봇 UI · SaaS 대시보드 · Bento Grid · Glassmorphism · 장식 그라데이션 · 고급 카페 리브랜딩 · 상품 카드/결제 수단의 Selected 상태 · 모서리 삼각형 선택 표시 · 터치 후 남는 포커스 링

기존 브랜드의 특징까지 지우는 과도한 미니멀리즘도 피한다.

---

## 17. QA 체크리스트

**시각 일관성**
- [ ] 모든 Primary 버튼이 같은 Brand Yellow인가
- [ ] 같은 역할의 버튼이 같은 Radius인가
- [ ] 그림자와 입체 효과가 제거되었는가 (Dialog 제외)
- [ ] 같은 상태에 같은 토큰을 쓰는가
- [ ] Border 두께가 역할에 맞는가
- [ ] Loading 상태에서 레이블이 잘리지 않는가

**인터랙션**
- [ ] 상품 터치 시 옵션 화면으로 바로 이동하는가
- [ ] 결제 수단 터치 시 결제 안내로 바로 이동하는가
- [ ] 상품 카드·결제 수단에 Selected·체크박스가 없는가
- [ ] 선택값을 유지하는 옵션에만 Selected가 적용되는가
- [ ] Pressed와 Focus Visible이 구분되는가
- [ ] 상태 변경으로 레이아웃이 움직이지 않는가
- [ ] Disabled 요소가 실제로 비활성인가
- [ ] 비동기 처리 중 중복 실행이 막히는가

**접근성**
- [ ] 대비 4.5:1 / 3:1 / 3:1을 충족하는가
- [ ] 색 외의 선택 단서가 있는가
- [ ] 터치와 접근성 포커스가 구분되는가
- [ ] 물리 터치 영역이 충분한가
- [ ] 고대비에서 모든 기능이 유지되는가
- [ ] 음성 없이 주문을 완료할 수 있는가

**브랜드**
- [ ] 브랜드 컬러·로고·상품 이미지를 유지하는가
- [ ] 8개 카테고리, 신메뉴·콜라보 노출을 유지하는가
- [ ] 제휴사·결제 수단 가시성을 유지하는가

---

## 18. 미해결 항목 (공식 자료 필요)

| 항목 | 현재 상태 |
|---|---|
| 공식 로고 · 워드마크 | Placeholder |
| 공식 상품 이미지 · 시즌/콜라보 그래픽 | Placeholder |
| 주문 방식 픽토그램 | Lucide `utensils` / `shopping-bag` 대체 |
| 제휴사 · 결제 브랜드 로고 | Placeholder |
| 공식 GUI 서체 | Pretendard로 대체 중 |
| v6 제안 컬러(#FFDC00 등) 적용 여부 | 미적용 (승인 필요) |
| PRD의 22개 할인·결제 수단 목록 | 일부만 반영 |
| 실제 옵션·주문 정책 | 샘플(샷·컵) |
| 세션 정책 (120 + 60초) | 가설 |
| 3열 vs 4열 상품 그리드 | 3열 기본, 하드웨어에서 비교 필요 |
| Before / After 비교 | 현재 키오스크 스크린샷 필요 |
| 제조 상태 API | 없음 → 진행률 미표시 |

---

*이 문서는 디자인 시스템 프로젝트의 `tokens/`, `components/uxpresso/`, `ui_kits/uxpresso-kiosk/` 구현과 같은 내용이다. 세부 변경 이력은 `guidelines/UXPRESSO_MEGA_Design_System_v6.0.md`를 참고한다.*
