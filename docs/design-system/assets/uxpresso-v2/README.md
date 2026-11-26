# UXPRESSO V2 시안 원본과 로고·아이콘 분리본

팀이 전달한 `UXPRESSO_V2_original_2.svg`와, 그 안에서 로고·아이콘 요소만 따로 잘라낸 SVG·PNG입니다.

> 비공식 프로젝트의 시안 자료입니다. 시안 속 "MEGA COFFEE" 표기는 공식 로고 이미지가 아닙니다.

## 원본

| 파일 | 내용 |
|---|---|
| [`UXPRESSO_V2_original_2.svg`](UXPRESSO_V2_original_2.svg) | **전달받은 원본 그대로** (수정 없음, 바이트 단위로 동일) |
| [`UXPRESSO_V2_original_2.png`](UXPRESSO_V2_original_2.png) | 원본을 4배(1360×1760)로 렌더링한 미리보기 |

원본은 키오스크 시작 화면 일러스트(`오늘의 한 잔.`, 카테고리 6개 원형 아이콘, 가운데 컵, `말로 주문하기` 버튼, `전체 메뉴`·`쿠폰 · 빠른 주문` 버튼)이고, 규격은 340×440입니다.

## 분리본

각 SVG는 원본의 해당 요소를 **그대로 복사**한 것이고, `viewBox`만 그 요소에 맞춰 잘랐습니다. 같은 이름의 PNG는 투명 배경으로 렌더링한 것입니다(너비 약 400~930px).

### `logos/`

| 파일 | 내용 |
|---|---|
| `uxpresso-wordmark.svg` / `.png` | `UXPRESSO.` 워드마크 (진한 글자, 투명 배경) |
| `uxpresso-wordmark-on-yellow.svg` / `.png` | 같은 워드마크 + 시안의 노란색 `#ffdf37` 배경 |
| `mega-coffee-wordmark.svg` / `.png` | `MEGA COFFEE` 표기 (투명 배경) |
| `mega-coffee-wordmark-on-yellow.svg` / `.png` | 같은 표기 + 노란색 배경 |
| `mega-coffee-label.svg` / `.png` | 컵에 붙은 노란색 `MEGA COFFEE` 라벨 |

### `icons/`

| 파일 | 내용 |
|---|---|
| `category-coffee` · `category-latte` · `category-ade` · `category-tea` · `category-smoothie` · `category-decaf` | 카테고리 원형 아이콘 6종 (커피, 라떼, 에이드, 티, 스무디, 디카페인), 각 `.svg`/`.png` |
| `cup-main.svg` / `.png` | 가운데 큰 아이스 커피 컵 일러스트 |
| `mic-button.svg` / `.png` | `말로 주문하기` 버튼의 노란 마이크 아이콘 |

## 주의

- **글자는 윤곽선이 아니라 텍스트**입니다. 원본이 `NanumSquare` 글꼴을 지정하고 글꼴 파일은 들어 있지 않아서, **PNG는 이 글꼴이 없는 환경에서 대체 글꼴로 렌더링**했습니다. 원본 글꼴과 모양이 다를 수 있습니다. SVG를 NanumSquare가 설치되지 않은 곳에서 열어도 마찬가지입니다.
- 최종 로고 파일이 필요하면 원본 디자인 파일(Figma 등)에서 글자를 윤곽선으로 바꿔 내보낸 것으로 교체하세요.
- 색상은 시안 값 그대로입니다. 대표 색: 노란색 `#ffdf37`, 진한 글자 `#202020`.
