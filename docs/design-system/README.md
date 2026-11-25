# UXPRESSO Kiosk Design System

**Unofficial UX/UI Redesign Project · Based on MEGA MGC COFFEE Mobile UI References**

> Familiar Brand, Accessible Experience. — 익숙한 브랜드, 더 쉬운 주문 경험.
> 슬로건: 누구나 쉽게, 혼자서도 자신 있게.

메가MGC커피의 **공식 디자인 시스템이 아닙니다.** 공개된 모바일 앱 UI 레퍼런스를 분석해 브랜드 아이덴티티를 계승하고, 터치스크린 키오스크 환경에 맞게 재설계한 비공식 개선 시스템입니다. 모바일 화면을 확대한 것이 아니라, 공용 기기·먼 시청 거리·팔을 뻗는 조작·다양한 신체/디지털 환경을 기준으로 다시 정했습니다.

## 문서 구성

| # | 문서 | 내용 |
|---|---|---|
| 01 | [reference-audit.md](01-reference-audit.md) | 모바일 앱 UI Audit — INHERIT / ADAPT / CREATE 분류, 확인된 것과 확인 필요한 것 |
| 02 | [foundations.md](02-foundations.md) | 색상(대비 계산 포함), 타이포그래피, 간격, 모서리, 그리드, 아이콘 |
| 03 | [tokens.md](03-tokens.md) | Primitive → Semantic → Component 토큰, Figma Variables 구조, 네이밍 |
| 04 | [components.md](04-components.md) | 컴포넌트 18종 — anatomy, variants, states, properties, 가이드, Do & Don't |
| 05 | [patterns.md](05-patterns.md) | 인터랙션 패턴, 세션 관리, 예외 상황 |
| 06 | [ux-writing.md](06-ux-writing.md) | Tone & Voice, 버튼·안내·오류·완료 문구, 다국어 |
| 07 | [accessibility.md](07-accessibility.md) | 시각·터치·인지·언어·신체·시간 접근성, 터치 영역 mm 환산 |
| 08 | [decisions-and-qa.md](08-decisions-and-qa.md) | 디자인 의사결정 기록, QA 체크리스트, 검증 지표, 실기기 확인 항목 |
| — | [tokens.json](tokens.json) · [tokens.css](tokens.css) | 개발·Figma 연동용 토큰 파일 |

## 디자인 원칙 (요약)

| 원칙 | 내용 |
|---|---|
| Familiar Brand | 브랜드 컬러·로고·제품 이미지·익숙한 주문 방식 유지. 불필요한 리브랜딩 금지 |
| UNDERSTAND | 화면 목적이 바로 보이게. 모호한 문구 개선, 아이콘 + 텍스트 병기 |
| SIMPLIFY | 불필요한 선택·화면 이동 줄이기. 보조 기능은 강제하지 않음 |
| PREVENT | 선택 결과·추가 금액·쿠폰/결제 조건을 미리 안내. 선택 상태를 분명히 |
| RECOVER | 오류 원인 + 해결 방법 안내, 주문 정보 유지, 직원 지원 경로 |

우선순위: 주문 속도 단축보다 **주문 이해도, 접근성, 독립 주문 완료율**. 피크타임·매장 운영 효율에 한정된 설계는 피합니다.

## 상태 표기 약속

이 문서의 값은 출처에 따라 구분합니다.

| 표기 | 의미 |
|---|---|
| **[확인]** | 유아이볼 레퍼런스 화면에서 직접 확인한 것 |
| **[추정]** | 화면에서 눈으로 읽은 근사값. 공식 값 아님 |
| **[제안]** | UXPRESSO가 새로 제안한 값. 실기기·사용성 테스트로 검증 필요 |
| **[확인 필요]** | 자료 부족 — 임의로 단정하지 않음 |

## 레퍼런스 출처와 한계

- 출처: 유아이볼(uibowl.io) 「메가MCG커피」 iPhone 앱 스크린샷 (2026-08 수집분 표기). 열람일 2026-11-25
- 확인한 화면: 앱 소개 이미지, 메가오더 상품 목록(PLP), 메가퀵결제 관리·설정·카드 등록·결제 비밀번호 입력(오류 상태). 사이트는 무료 열람이 최신 3개 패턴으로 제한되어 **전체 48개 결과 중 일부만** 확인했습니다.
- 확인하지 못한 것: 옵션 선택, 장바구니, 쿠폰, 주문 완료, 오류 외 상태 화면, 서체 이름·정확한 색상값·정확한 px 수치
- 그래서 색상·크기는 **[추정]/[제안]** 으로 표시하고, 공식 값이라고 쓰지 않습니다.
- 키오스크 레퍼런스는 이전에 정리한 [as-is-analysis.md](../as-is-analysis.md)(허들링클럽 메가커피 키오스크편, 클론 디자인 포함)를 함께 참고했습니다.

## 이전 문서와의 관계

[`docs/design-system.md`](../design-system.md)는 키오스크 화면(갈색·주황 계열) 기준의 1차 버전이고, 이 폴더는 **모바일 앱 레퍼런스(노랑·검정) 기준으로 새로 정의한 2차 버전**입니다. `public/`의 프로토타입에는 이 문서의 색상·선택 상태·모서리·온도 라벨을 적용했고, 적용 범위와 남은 항목은 [decisions-and-qa.md](08-decisions-and-qa.md)의 "프로토타입 적용 현황"에 정리했습니다.

## Figma 구성 (제안)

페이지: 00 Cover · 01 Reference · 02 Mobile UI Audit · 03 Kiosk UI Audit · 04 Design Principles · 05 Foundations · 06 Variables & Tokens · 07 Core Components · 08 Kiosk Components · 09 Interaction Patterns · 10 UX Writing · 11 Accessibility · 12 AS-IS · 13 TO-BE · 14 Prototype · 15 Usability Test

컴포넌트 이름: `Button/Primary` `Button/Secondary` `Button/Tertiary` `Button/Destructive` · `Selection/OrderType` `Selection/Temperature` `Selection/Option` · `Navigation/CategoryTab` `Navigation/Progress` · `Card/Menu` `Card/PaymentMethod` · `Input/QuantityStepper` `Input/OptionSelector` · `Cart/Item` `Cart/Summary` · `Coupon/Check` `Coupon/Applied` `Coupon/Error` · `Feedback/Success|Warning|Error|Loading` · `Dialog/Confirmation|Error|Help|SessionTimeout`

모든 컴포넌트는 Auto Layout, Variables 연결, Text Style, Variants, Component Properties(Boolean·Instance Swap 포함)를 적용하고, 화면 템플릿은 새 스타일을 만들지 않고 같은 토큰·인스턴스만 씁니다.

## 현재 구현 상태

| 항목 | 상태 |
|---|---|
| 시스템 정의 문서(이 폴더) | 작성 |
| 토큰 파일(`tokens.json`, `tokens.css`) | 작성 |
| Figma Variables·컴포넌트 라이브러리 | 미작성 (이 문서가 명세) |
| 프로토타입(`public/`)에 새 토큰 적용 | 색상·선택 상태·모서리·온도 라벨 적용 (타이포 스케일·Progress·세션 확인은 미적용) |
| 실기기 규격·터치 영역·거리 검증 | 미실시 |
| 사용성 테스트로 검증 | 미실시 — 개선 효과를 확정적 성과로 표현하지 않음 |
