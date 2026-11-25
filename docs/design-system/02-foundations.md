# 02. Foundations

기준 프레임 **1080 × 1920px, 세로, 터치**. 실제 기기 규격 확인 후 조정합니다. 모든 수치는 **[제안]** 입니다(출처 표기가 없는 한).

## 6.1 Color

공식 브랜드 컬러를 추출하지 못해 **임시 제안값**을 씁니다. 앱에서 확인한 것은 "노랑·검정·흰색 중심"이라는 구성이며 hex는 [확인 필요]입니다.

### Brand

| 이름 | 값 | 용도 |
|---|---|---|
| Brand Primary (Yellow) | `#FFDC00` | 헤더 면, Primary 버튼, 선택 포인트 |
| Brand Secondary (Pale Yellow) | `#FFF7D6` | 안내 카드, 선택된 면 (앱의 크림 노랑 카드에서 읽음 [추정]) |
| Brand Black | `#171717` | 텍스트, 선택 상태, 하단 고정 바 |
| Brand White | `#FFFFFF` | 기본 면 |

### Neutral

| 토큰 | 값 | 비고 |
|---|---|---|
| Neutral 0 | `#FFFFFF` | |
| Neutral 50 | `#FAFAFA` | |
| Neutral 100 | `#F5F5F5` | Surface Secondary |
| Neutral 200 | `#E0E0E0` | Disabled 면 |
| Neutral 300 | `#CFCFCF` | 구분선(장식) |
| Neutral 400 | `#A6A6A6` | 장식 전용 — 텍스트·경계에 쓰지 않음 |
| Neutral 500 | `#767676` | UI 경계 (흰 배경 4.54:1) |
| Neutral 600 | `#595959` | Text Secondary (7.00:1) |
| Neutral 700 | `#3D3D3D` | |
| Neutral 800 | `#262626` | |
| Neutral 900 | `#171717` | Brand Black와 동일 |

### Semantic

| 의미 | 값 | 면(Tint) | 비고 |
|---|---|---|---|
| Success | `#237A45` | `#E8F5EC` | 흰 배경 5.33:1 |
| Warning | `#946200` | `#FFF4D6` | 5.24:1 |
| Error | `#C62828` | `#FDECEA` | 5.62:1 |
| Information | `#245DB5` | `#E8F0FB` | 6.35:1 |
| Selected | Brand Black 테두리 + `#FFF7D6` 면 | | 색이 아니라 **✓ + 테두리**가 신호 |
| Disabled | 면 `#E0E0E0`, 글자 `#767676` | | 이유 문구 필수 |

### Functional

| 역할 | 토큰 | 값 |
|---|---|---|
| Text Primary | `color/text/primary` | `#171717` |
| Text Secondary | `color/text/secondary` | `#595959` |
| Text Disabled | `color/text/disabled` | `#767676` |
| Surface Default / Secondary / Selected | `color/surface/*` | `#FFFFFF` / `#F5F5F5` / `#FFF7D6` |
| Border Default / Selected / Error | `color/border/*` | `#767676` / `#171717` / `#C62828` |
| Action Primary / Secondary / Disabled | `color/action/*` | `#FFDC00` / `#FFFFFF`(+검정 테두리) / `#E0E0E0` |

### 대비 계산 (WCAG 2.x, 직접 계산)

| 조합 | 비율 | 판정 |
|---|---|---|
| Black `#171717` on Yellow `#FFDC00` | 13.22:1 | ✓ 일반 텍스트 |
| White on Black | 17.93:1 | ✓ |
| Black on Pale Yellow `#FFF7D6` | 16.67:1 | ✓ |
| Text Secondary `#595959` on White | 7.00:1 | ✓ |
| Text Secondary on Surface Secondary `#F5F5F5` | 6.42:1 | ✓ |
| Text Secondary on Pale Yellow | 6.51:1 | ✓ |
| Border `#767676` on White | 4.54:1 | ✓ UI 경계 ≥3:1 |
| Border `#767676` on `#F5F5F5` | 4.17:1 | ✓ ≥3:1 |
| Success / Warning / Error / Info on White | 5.33 / 5.24 / 5.62 / 6.35 | ✓ |
| Error on Error Tint `#FDECEA` | 4.92:1 | ✓ |
| Success on Success Tint `#E8F5EC` | 4.75:1 | ✓ |
| **Yellow `#FFDC00` on White (경계로 사용 시)** | **1.36:1** | ✗ **노랑만으로 경계·선택 표시 금지** |
| `#8A8A8A` on White (참고) | 3.45:1 | 일반 텍스트 ✗ — 큰 글씨 전용 |

### Color Guidelines

- 노란색 면 위에는 검정 텍스트만 씁니다. 노랑 위 회색·흰 글씨 금지.
- 일반 텍스트 4.5:1, 큰 텍스트 3:1, UI 경계·상태 표시 3:1 이상을 초기 기준으로 합니다.
- 색상만으로 상태를 전달하지 않습니다. 체크(✓)·텍스트·테두리를 함께 씁니다.
- HOT / ICE는 관용 표기를 유지하되 빨강/파랑 단독으로 구분하지 않습니다.
- **브랜드 노랑은 한 화면에 Primary 한 곳**과 큰 구조(헤더) 위주로 씁니다. 모든 버튼을 노랗게 만들지 않습니다.
- 위 값은 공식 브랜드 컬러가 아닌 임시 제안값입니다.

## 6.2 Typography

앱의 서체는 [확인 필요]. **Pretendard** 또는 한글·영문 가독성이 좋은 대체 서체를 검토합니다(라이선스 확인 필요). 1080×1920 기준 초기 제안값:

| Style | Size | Weight | Line Height | 용도 |
|---|---|---|---|---|
| Display | 56px | Bold | 72px | 시작 화면 핵심 문구, 주문번호 |
| Heading 1 | 40px | Bold | 56px | 화면 제목 |
| Heading 2 | 32px | Bold | 44px | 섹션 제목 |
| Heading 3 | 28px | SemiBold | 40px | 메뉴명, 카드 제목 |
| Body Large | 28px | Medium | 40px | 핵심 안내 문구 |
| Body Default | 24px | Regular | 36px | 일반 정보 |
| Body Small | 22px | Regular | 32px | 보조 정보 |
| Caption | 18px | Medium | 28px | 비핵심 보조 정보만 |
| Button Large | 32px | Bold | 44px | 주요 CTA |
| Button Default | 28px | SemiBold | 40px | 일반 버튼 |
| Price Large | 40px | Bold | 52px | 총 결제 금액 |
| Price Default | 28px | Bold | 40px | 상품 가격 |

> 글자 크기는 [uxpresso-kiosk-design-system-v1.md](uxpresso-kiosk-design-system-v1.md) 4.5절 기준으로 합쳤습니다(2차 초안의 22/24px 본문 → 24/28px).

가이드: 제목과 주요 행동을 분명히 구분 · 가격·수량은 빨리 읽히게 · Regular 미만 굵기 금지 · **핵심 정보에 Caption 사용 금지** · 다국어에서 줄바꿈·길이 확장 고려 · 실제 화면 크기·시청 거리에서 가독성 검증.

> 참고: 현재 프로토타입(`public/`)은 본문 32px 등 이 스케일보다 더 큰 값을 씁니다(최소 글자 22px 이상). 스케일 토큰 자체는 아직 CSS에 연결하지 않았고, 실기기 가독성은 [확인 필요]입니다.

## 6.3 Spacing (8px 기반)

| 토큰 | 값 | 용도 |
|---|---|---|
| space/4 | 4 | Micro |
| space/8 | 8 | XS (아이콘-텍스트) |
| space/16 | 16 | S (인접 터치 요소 최소 간격) |
| space/24 | 24 | M (컴포넌트 내부 패딩, 그리드 거터) |
| space/32 | 32 | L |
| space/40 | 40 | XL (화면 마진) |
| space/48 | 48 | 섹션 간격 |
| space/64 | 64 | 주요 섹션 |
| space/80 | 80 | 큰 레이아웃 간격 |

컴포넌트 **내부** 간격(padding)과 **외부** 간격(gap/margin)을 구분해 각각 토큰을 씁니다.

## 6.4 Radius

| 토큰 | 값 | 사용처 |
|---|---|---|
| radius/xs | 4 | 배지 |
| radius/sm | 8 | 입력 필드 |
| radius/md | 12 | 메뉴 카드, 이미지 |
| radius/lg | 16 | 버튼, Selection Card |
| radius/xl | 24 | 모달, 시트 |
| radius/full | 999 | 칩, 탭, 수량 버튼 |

앱의 모서리 형태(버튼·입력 작은 모서리, 이미지 중간, 칩 완전 둥근 형태 [추정])를 비율로 계승하되, 모든 요소를 둥글게 만들지 않습니다.

## 6.5 Layout & Grid

| 항목 | 값 |
|---|---|
| Frame | 1080 × 1920 |
| Grid | 12 columns, margin 40, gutter 24 → 콘텐츠 폭 1000, 컬럼 폭 약 61.3 |
| 메뉴 그리드 | **2열 권장**(카드 폭 488). 3열(폭 317)은 한 줄 설명·특징·가격이 좁아져 가독성 저하 — 실기기 비교 전까지 2열을 기본으로 함 [제안] |

### 화면 구조 (위 → 아래)

1. Brand Header (노랑 면, 로고)
2. Language & Accessibility Controls (언어·주문 도움·글자 크기 등)
3. Order Progress (메뉴 선택 → 주문 확인 → 결제 → 주문 완료)
4. Screen Title
5. Category Navigation
6. Main Content
7. Cart Summary (하단 고정)
8. Primary Action Area (하단 고정, 화면마다 같은 위치)

가이드: 주요 행동 버튼 위치 일관 · 주요 조작 요소는 손이 닿기 쉬운 영역 · 하단 고정 영역이 콘텐츠를 가리지 않게 스크롤 여백 확보 · **모바일 하단 탭 내비게이션은 쓰지 않음** · 설치 높이·휠체어 도달 범위는 실기기에서 검증.

## Iconography

- 앱 아이콘은 선형(line) 스타일 [확인]. 키오스크도 선형을 유지하되 선 두께를 키웁니다(64px 아이콘 기준 선 ≥3px).
- **아이콘은 항상 텍스트와 함께** 씁니다(`매장에서 먹기`, `포장하기`, `주문 도움`).
- 최소 크기: 터치 요소 안 아이콘 40px, 장식 아이콘 24px.
- 상태 아이콘: ✓ 성공/선택, ! 경고·오류, ⓘ 안내, ? 도움. 색 + 형태 + 문구를 함께 사용.
- 아이콘 세트는 자체 제작/오픈 라이선스 사용 — 앱의 아이콘 파일을 복제하지 않습니다.
