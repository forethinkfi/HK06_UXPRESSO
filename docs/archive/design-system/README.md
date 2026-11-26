# 디자인 시스템 아카이브 · 버전 기록

현행 서비스(키오스크 v6)의 기준은 [DS v6.0](../../design-system/uxpresso-design-system-v6.md)입니다. 이 폴더에는 그 전후의 디자인 시스템을 **지우지 않고** 모았습니다. 모두 비공식 제안이며 메가MGC커피의 공식 가이드라인이 아닙니다.

현행 여부는 버전 번호가 아니라 **실제 서비스 코드(`public/v6/style.css`)와 값이 맞는지**로 판단했습니다. 그래서 번호가 더 높은 v7.1은 현행이 아닙니다(아래 표 참고).

## 버전 기록

| 순서 | 버전 | 만든 사람·커밋 | 핵심 내용 | 적용 대상 | 현재 위치 |
|---|---|---|---|---|---|
| 1 | 1차 UI Kit (v0) | designoh `c8c1ef2` (2026-11-25) | 키오스크 화면 기준 버튼 Kit | 초기 프로토타입 | [v0-kit.md](v0-kit.md) |
| 2 | 2차 디자인 시스템 | designoh `4a9a477` (2026-11-25) | 메가MGC커피 **모바일 앱 UI 레퍼런스** 분석 → 토큰·컴포넌트·패턴·UX Writing·접근성(01~08), `tokens.json`/`tokens.css` | 초기 프로토타입(`public/style.css`, `/kit.html`) | [ds-2nd/](ds-2nd/README.md) |
| 3 | 팀 원문 DS v1.0 | designoh `2a7680b` (2026-11-25) | 음성 CTA·세션 정책 중심, 터치 영역·타이포 기준 | 2차 DS의 터치·타이포 기준으로 흡수 | [originals/uxpresso-kiosk-design-system-v1.md](originals/uxpresso-kiosk-design-system-v1.md) |
| 4 | 팀 원문 DS v2.0 | designoh `f502451` (2026-11-25) | 브랜드 중심 (검증 전 제안) | 참고 | [originals/uxpresso-kiosk-design-system-v2.md](originals/uxpresso-kiosk-design-system-v2.md) |
| — | v3.0 ~ v5.0 | — | DS v6.0 문서가 출처로 언급하지만 **저장소에는 없습니다** | — | 확인 필요 |
| 5 | **DS v6.0 (현행)** | designoh `21c326f` (2026-11-26, `mega-ver.2`) | v5.0 Brand-Preserved 기반 Refinement. 승인된 브랜드 값(#F8DA29·#231F20) 유지, 상호작용 토큰·컴포넌트 상태 정리 | **키오스크 v6** (`b84c826` "design system v6 styling") | [../../design-system/](../../design-system/README.md) |
| 6 | DS v7.0 → v7.1 + UI Refinement v2.1 | designoh `7700663`·`891c950` (2026-11-26, `mega-ver.2`) | v6.0에 팀 요청과 Refinement v2.1을 합친 **mega-ver.2 재구성안** 기준 | `mega-ver.2` 화면만 | [mega-ver2/](mega-ver2/) |

## 주요 디자인 의사결정 (문서에 기록된 것만)

| 결정 | 근거 문서 | 현행 반영 |
|---|---|---|
| 1차 Kit → 2차 DS로 교체: 키오스크 화면 확대가 아니라 공용 기기·먼 시청 거리·팔을 뻗는 조작 기준으로 다시 정함 | [ds-2nd/README.md](ds-2nd/README.md) | 원칙은 v6에도 유지 |
| 선택 상태는 색만 쓰지 않고 체크 + 테두리로 표현 | [ds-2nd/](ds-2nd/README.md), DS v6.0 §8 | 반영 |
| DS v6.0: 스펙 제안값(#FFDC00·#E5BA00·#171717) 대신 **승인된 브랜드 값**(#F8DA29·#E7BE0B·#231F20) 사용 | DS v6.0 §3.1 | **반영** (`public/v6/style.css`) |
| DS v6.0: HOT/ICE는 빨강/파랑 계열 색을 쓰되 항상 텍스트와 함께 | DS v6.0 §3.2 | 반영 (#C4281C / #1559B7) |
| DS v7.1: 노랑을 #FFDC00으로 바꾸고 HOT·ICE에 색을 쓰지 않음, 연노랑 배경 사용 안 함 | [mega-ver2/uxpresso-design-system-v7.md](mega-ver2/uxpresso-design-system-v7.md) §2 | **미반영** — mega-ver.2 재구성안에만 적용 |
| 음성 CTA 5상태(Default·Listening·Processing·Confirm·Error) + Hidden | [../../design-system/voice-cta-states.md](../../design-system/voice-cta-states.md) | 현행 문서로 유지 |

## 폴더 안내

| 경로 | 내용 | 비고 |
|---|---|---|
| [v0-kit.md](v0-kit.md) | 1차 UI Kit | |
| [ds-2nd/](ds-2nd/README.md) | 2차 디자인 시스템 01~08 + 토큰 | 초기 프로토타입(`public/style.css`, `public/kit.html`)이 이 토큰을 씁니다. 두 파일의 주석은 예전 경로 `docs/design-system/tokens.css`를 가리킵니다(서비스 코드를 바꾸지 않으려고 그대로 둠) |
| [originals/](originals/) | 팀이 제공한 DS v1.0·v2.0 원문 | 루트에 있던 같은 내용의 `UXPRESSO_DESIGN_SYSTEM.md`(= v2.0)는 중복이라 삭제 |
| [mega-ver2/](mega-ver2/) | DS v7.1, UI Refinement v2.1 | `mega-ver.2` 브랜치(`cf9209c`)에서 그대로 복사. 문서 안 링크는 그 커밋의 파일을 가리킵니다 |
