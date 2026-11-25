# 03. Design Tokens

구조는 **Primitive → Semantic → Component** 입니다. 같은 색·수치를 컴포넌트마다 직접 입력하지 않고, 컴포넌트는 Semantic 토큰만, Semantic은 Primitive만 참조합니다. 파일: [`tokens.json`](tokens.json)(DTCG 스타일 `$value`/`$type`), [`tokens.css`](tokens.css)(CSS 변수). 두 파일은 같은 값을 담습니다.

## 7.1 Primitive

| 그룹 | 토큰 |
|---|---|
| color/brand | `yellow` `yellow-pale` `yellow-pressed` `black` `white` |
| color/neutral | `0` `50` `100` `200` `300` `400` `500` `600` `700` `800` `900` |
| color/red · green · blue · amber | `red/600` `red/50` `green/600` `green/50` `blue/600` `blue/50` `amber/700` `amber/50` |
| spacing | `4` `8` `16` `24` `32` `40` `48` `64` `80` |
| radius | `4` `8` `12` `16` `24` `full` |
| font | `family` |

## 7.2 Semantic

| 토큰 | 참조 | 값 |
|---|---|---|
| `color/text/primary` | neutral/900 | `#171717` |
| `color/text/secondary` | neutral/600 | `#595959` |
| `color/text/disabled` | neutral/500 | `#767676` |
| `color/text/on-primary` | brand/black | `#171717` |
| `color/surface/default` | neutral/0 | `#FFFFFF` |
| `color/surface/secondary` | neutral/100 | `#F5F5F5` |
| `color/surface/selected` | brand/yellow-pale | `#FFF7D6` |
| `color/surface/disabled` | neutral/200 | `#E0E0E0` |
| `color/action/primary` | brand/yellow | `#FFDC00` |
| `color/action/primary-pressed` | brand/yellow-pressed | `#E6C500` |
| `color/action/secondary` | neutral/0 | `#FFFFFF` |
| `color/action/disabled` | neutral/200 | `#E0E0E0` |
| `color/border/default` | neutral/500 | `#767676` |
| `color/border/selected` | neutral/900 | `#171717` |
| `color/border/error` | red/600 | `#C62828` |
| `color/status/success · warning · error · information` | green/600 · amber/700 · red/600 · blue/600 | `#237A45` · `#946200` · `#C62828` · `#245DB5` |

`color/action/primary-pressed`(`#E6C500`)는 눌림 상태용 제안값이며, 검정 글씨와의 대비는 10.54:1로 계산했습니다.

## 7.3 Component

| 토큰 | 참조/값 |
|---|---|
| `button/primary/background` | `color/action/primary` |
| `button/primary/text` | `color/text/on-primary` |
| `button/primary/height` | 104px (Medium 88 · Large 104 · XL 120) |
| `button/primary/radius` | `radius/16` |
| `button/secondary/background` | `color/action/secondary` |
| `button/secondary/border` | 2px `color/border/selected` |
| `card/menu/background` | `color/surface/default` |
| `card/menu/border` | 2px `color/border/subtle` |
| `card/menu/padding` | `space/24` |
| `card/menu/radius` | `radius/12` |
| `selection/default/border` | 2px `color/border/default` |
| `selection/selected/border` | 3px `color/border/selected` |
| `selection/selected/background` | `color/surface/selected` |
| `feedback/error/background · text` | `status/error-bg` · `status/error` |
| `feedback/success/background` | `status/success-bg` |
| `touch/min-target · min-gap` | 88px · 16px |

## Figma Variables 구조

| Collection | Modes | 내용 |
|---|---|---|
| `Primitives` | — | color · spacing · radius |
| `Semantic` | Default (확장: High Contrast) | color/text · surface · action · border · status |
| `Component` | — | button · card · selection · feedback |
| `Typography` | — | Text Styles 12종(02-foundations) |

## 네이밍 가이드

- 슬래시(`/`) 계층: `카테고리/역할/변형`. 값이 아니라 **역할**로 이름 짓습니다(`color/action/primary` ○, `color/yellow-button` ✕).
- 컴포넌트 토큰은 `컴포넌트/요소/속성`(`button/primary/height`).
- 상태 변형은 접미사: `-pressed`, `-disabled`, `-selected`.
- 새 색을 추가하기 전에 기존 Semantic 토큰으로 해결 가능한지 확인하고, 화면 템플릿에서 새 스타일을 만들지 않습니다.
- High Contrast 모드 등 확장은 Semantic 레이어에만 모드를 추가합니다.
