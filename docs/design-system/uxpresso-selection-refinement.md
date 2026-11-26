# UXPRESSO Design System — Selection State & Outline Refinement

> 팀 제공 개선 지시. [v6](uxpresso-design-system-v6.md)과 다른 항목은 **이 문서를 우선**합니다. 비공식 제안이며 하드웨어 검증 전입니다.

## 1. Objective
기존 메가MGC커피의 브랜드 아이덴티티를 유지하면서 선택 상태의 과도한 아웃라인 강조를 개선한다.
시각적으로 가볍고 정돈된 키오스크 UI를 설계하되, 디지털 환경에 익숙하지 않은 사용자도 선택 여부를 명확하게 인지할 수 있도록 한다.

## 2. Design Direction
Minimal Outline · Clear Selection Indicator · Familiar Brand Identity · Consistent Visual Hierarchy · Accessible Interaction.
선택 상태를 굵은 테두리로 강조하지 않는다. 브랜드 컬러와 선택 인디케이터를 활용한다.

## 3. Global Border Rules
- Default / Selected / Pressed / Disabled: 1px
- Focus Visible Ring: 2px, Offset 3px
- 선택 상태에 2px 이상의 테두리를 쓰지 않는다(Focus Visible은 예외).
- 테두리 두께 변경으로 인한 레이아웃 이동을 금지한다.

## 4–8. States
| State | Background | Border (1px) | Text | 기타 |
|---|---|---|---|---|
| Default | #FFFFFF | #B8B8B8 | #171717 / 500 | Radius 8, 그림자 없음. Radio: 흰 배경, #171717 테두리, 점 없음 |
| Selected | #FFFFFF | #171717 | #171717 / 600 | Radius 8. Radio: #171717 + #FFDC00 점. Checkbox: #171717 + #FFDC00 체크 |
| Pressed | #F2F2F2 | #171717 | — | 터치하는 순간만. 화면 전환을 지연하지 않는다 |
| Disabled | #F5F5F5 | #D9D9D9 | #767676 | 그림자 없음 |

- 선택의 핵심 단서는 라디오·체크 인디케이터다. 색상 차이만으로 표현하지 않는다.
- Focus Visible: #171717 2px, offset 3px. 키보드·보조 입력 전용. Selected와 독립적으로 관리한다.

## 9. Primary Action
Background #FFDC00 · Text #171717 · Border 없음 · 700 · Radius 8. 브랜드 옐로우 전체 배경은 주요 행동 버튼에 우선한다.

## 10. Navigation Action
상품 카드·결제 수단은 지속 Selected가 없다. Default → Pressed → Navigate.

## 11. High Contrast
Background #000000 · Text #FFFFFF · Default Border #FFFFFF · Selected Border / Indicator #FFDC00 · Indicator Inner Mark #171717. 포커스 링은 배경과 구분되도록 별도 관리한다.

## 12. Do Not
3px 이상 Selected Outline · 일반 터치 시 이중 아웃라인 · 연노랑 Selected 배경 · 모든 옵션에 옐로우 배경 · 과도한 Bold · 불필요한 Shadow · 상태 변경에 따른 크기 변화 · 상품·결제 수단의 지속 선택 강조 · 브랜드 컬러 임의 변경 · 불필요한 컴포넌트 신규 생성

## 13. Update Scope
Interaction States, Option / Select Buttons, Radio, Checkbox, Product Cards, Payment Tiles, Category / Filter Tabs, Accessibility Toggles, Cart Rows. 모두 공통 Semantic Token을 참조한다. PRD, 주문 플로우, 로고, 메뉴 데이터, 결제 기능은 바꾸지 않는다.

## 14. Acceptance Criteria
- [ ] 선택 전후 버튼의 외부 크기가 같다.
- [ ] Selected Outline은 1px이다.
- [ ] 선택 여부를 흑백에서도 구분할 수 있다.
- [ ] 주요 CTA와 옵션 버튼의 위계가 명확하다.
- [ ] 선택 인디케이터의 명암 대비를 검증한다.
- [ ] 일반 터치 후 포커스 링이 남지 않는다.
- [ ] 보조 입력 장치의 탐색 위치가 표시된다.
- [ ] 실제 키오스크 크기와 조명에서 가독성을 검증한다.
