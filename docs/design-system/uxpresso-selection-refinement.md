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
| Default | #FFFFFF | #949494 ¹ | #171717 / 500 | Radius 8, 그림자 없음. Radio: 흰 배경, #171717 테두리, 점 없음 |
| Selected | #FFFFFF | #171717 | #171717 / 600 | Radius 8. Radio: #171717 + #FFDC00 점. Checkbox: #171717 + #FFDC00 체크 |
| Pressed | #F2F2F2 | #171717 | — | 터치하는 순간만. 화면 전환을 지연하지 않는다 |
| Disabled | #F5F5F5 | #D9D9D9 | #767676 | 그림자 없음 |

¹ 원안은 #B8B8B8(흰 배경 대비 1.98:1)이었고, 팀 요청으로 3:1 이상인 #949494로 진하게 바꿨다.

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

## 적용 메모
- Secondary·삭제·아이콘 버튼, 키패드, 입력창의 기본 테두리도 #949494이다. #171717 테두리는 선택·눌림에만 쓴다.
- 고대비 포커스 링은 흰색이다(선택 테두리의 노랑과 구분).
- 대화상자의 닫기는 Secondary이다. 노란 버튼은 주문을 진행하는 행동에만 쓴다.
- 상품 이미지는 240px이다. 장바구니가 있어도 두 줄과 페이지 이동이 한 화면에 보이게 하기 위해서다.

## 탭 선택·상품 스와이프 (팀 요청, 위 내용보다 우선)
- 카테고리·하위 분류의 선택 상태는 Primary(#FFDC00) 채움 + #171717 글자이다. 체크 인디케이터는 쓰지 않는다. 처음 요청한 흰 글자는 대비 1.35:1이라 검정(약 13:1)으로 바꿨다. 고대비 모드도 같다.
- 상품 목록은 옆으로 밀어 넘긴다. 3열 + 오른쪽에 잘린 4번째 열로 더 있음을 알린다. 스와이프가 어려운 고객을 위해 이전·다음 버튼을 유지한다.
- 카테고리는 4×2 대신 한 줄이며 옆으로 민다. 다섯 번째 탭이 반쯤 잘려 더 있음을 알린다.
- 상품 옵션 화면의 섹션 제목 아래에는 설명 문구를 두지 않는다.
- 카테고리 안의 HOT·ICE 필터는 없앤다. 온도는 상품 상세에서 고른다.
- 온도 버튼은 아이콘 없이 글자만 쓴다. 한 가지 온도만 되는 상품은 그 온도만 고정 안내 상자로 보여 주고(버튼 아님), 제목 옆에 'HOT 전용' / 'ICE 전용' 라벨을 붙인다. 비활성 버튼은 보여 주지 않는다.
- 상품 상세의 이름·가격 아래에 '상세 정보 펼치기' 버튼을 두고 설명·용량·열량·알레르기·영양을 보여 준다.
- 상품 카드는 연회색 둥근(12px) 이미지 타일 + 상품명(16px 아래) + 가격(8px 아래), 왼쪽 정렬이다. 참고: 유아이볼의 더벤티 상품 목록. v6 9.8의 투명 배경·Radius 0 대신 이 항목을 쓴다.
- 카드에는 HOT·ICE 표기와 상세 정보 버튼을 두지 않는다. 상세 정보는 상품을 눌러 들어간 화면에서만 본다.

## 세로 스크롤·접근성 기능 제거 (팀 요청, 위 내용보다 우선)
- 상품 목록은 3열 세로 롱 스크롤이다. 가로 스와이프, 이전·다음 버튼, 페이지 표시는 쓰지 않는다. 분류를 바꾸면 맨 위에서 시작한다. 카테고리 줄의 가로 스와이프는 유지한다.
- 접근성 기능(접근성 버튼, 고대비, 화면 확대)은 뺀다. 11. High Contrast Mode는 적용하지 않는다. 언어 선택은 첫 화면에 남긴다.
