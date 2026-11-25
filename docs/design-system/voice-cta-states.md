# 음성 주문 CTA 상태 정의 (시안 이미지 기준)

팀 제공 시안 "5. 음성 주문 컴포넌트 상태 정의"를 옮겨 적은 문서입니다. 색 값은 [추정](이미지에서 읽음)이며 토큰 매핑은 [제안]입니다. 원문 규칙은 [uxpresso-kiosk-design-system-v1.md](uxpresso-kiosk-design-system-v1.md) 9.4~9.6절을 따릅니다. 프로토타입(`public/app.js`의 `vbar()`, `style.css` `.vb-*`)과 `kit.html`에 반영했습니다.

공통: 가로 전체 폭 바, 높이 약 100px, 모서리 약 16px, 왼쪽 아이콘 + 텍스트, 바 아래 한 줄 보조 설명. 상태는 색상만이 아니라 **아이콘 + 문구**로도 구분합니다.

| 상태 | 배경 / 글자 | 아이콘 | 문구 | 보조 설명 | 토큰 매핑 [제안] |
|---|---|---|---|---|---|
| Default | 검정 / 흰색 | 마이크 | 음성으로 주문하기 | 메뉴 탐색 및 상품 구성 | `brand.black` / `text.inverse` |
| Listening | 옐로우 / 검정 | 음성 파형 | 듣고 있어요 | 사용자 음성 입력 중 | `brand.primary` / `text.primary` |
| Processing | 연회색 / 검정 | 로딩 스피너 | 말씀하신 내용을 확인하고 있어요 | 음성 인식 결과 처리 | `surface.secondary` / `text.primary` |
| Confirm | 연초록 / 초록 | 체크 원 | 이 메뉴가 맞나요? | 메뉴 및 옵션 확인 | `status.success.bg` / `status.success` |
| Error | 연빨강 / 빨강 | 마이크 꺼짐 | 잘 듣지 못했어요 | 인식 실패 및 재시도 | `status.error.bg` / `status.error` |
| Hidden | 흰색 + 테두리 카드(시안 설명용) | — | 컴포넌트 미노출 | 주문 확인 및 결제 단계 · 마이크 비활성화 | 실제 화면에서는 바 자체를 렌더링하지 않음 |

## 상태 전이
`Default → Listening → Processing → Confirm → (담기 후) Default`, 실패 시 `Processing → Error → Listening(다시 말하기)`. 주문 확인·결제 단계에 들어가면 `Hidden`(마이크 종료).

## 문구 통일 (결정)
시안 이미지와 PRD v3·DS v1의 문구가 달라, **PRD v3 12.6 / DS v1 15.3 문구를 기준**으로 통일했습니다(시안의 색·아이콘·레이아웃은 그대로).

| 상태 | 시안 이미지 문구 | 채택(PRD v3) |
|---|---|---|
| Processing | 주문을 확인하고 있어요 | 말씀하신 내용을 확인하고 있어요 |
| Confirm | 이 메뉴를 담을까요? | 이 메뉴가 맞나요? |
| Error | 다시 말해 주세요 | 잘 듣지 못했어요 (다음 행동은 패널의 "다시 말하기"·"화면에서 선택하기"가 안내) |

Success("장바구니에 담았어요.")는 시안에 없어 패널 안내문으로 표시하고, 시안에 없는 Awaiting Input·Ended는 PRD 기준으로 구현했습니다.
