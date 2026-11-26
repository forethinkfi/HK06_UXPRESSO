# 디자인 시스템 (현행)

키오스크 v6(`public/v6/`)에 실제로 적용된 디자인 시스템입니다. 비공식 제안이며 메가MGC커피의 공식 가이드라인이 아닙니다.

| 문서 | 내용 |
|---|---|
| [uxpresso-design-system-v6.md](uxpresso-design-system-v6.md) | **DS v6.0** (팀 원문, designoh) — 원칙, 브랜드 보존 규칙, 컬러, 타이포, 간격, 상태 모델, 컴포넌트, 접근성 |
| [voice-cta-states.md](voice-cta-states.md) | 음성 주문 CTA 상태 5종 + Hidden |
| [assets/uxpresso-v2/](assets/uxpresso-v2/README.md) | UXPRESSO V2 로고·카테고리 아이콘 원본 |

이전 버전(1차 Kit, 2차 DS, 팀 원문 v1·v2, mega-ver.2의 v7.1)과 **버전별 변경·의사결정 기록**은 [../archive/design-system/](../archive/design-system/README.md)에 있습니다.

## 왜 v6.0이 현행인가

버전 번호가 아니라 서비스 코드와 값이 맞는지로 판단했습니다.

- v6 화면을 처음 추가한 커밋(`b84c826`)이 "design system v6 styling"을 적용했다고 적고 있습니다.
- 브랜드 색과 타이포 스케일이 v6.0 문서와 일치합니다.
- 번호가 더 높은 v7.1은 `mega-ver.2` 재구성안 기준(노랑 #FFDC00, HOT·ICE 무채색)이라 v6 화면과 다릅니다.

## 코드 기준 값 (`public/v6/style.css`)

문서와 코드가 다르면 **코드가 기준**입니다. v6.0 문서에 이름만 있고 값이 없는 항목은 코드에서 채웠습니다.

| 역할 | 코드 토큰 | 값 | v6.0 문서 |
|---|---|---|---|
| Brand Yellow (주요 버튼·현재 카테고리) | `--yellow` | `#F8DA29` | `--mc-yellow-40` 일치 |
| Primary Pressed | `--yellow-50` | `#E7BE0B` | `--mc-yellow-50` 일치 |
| 선택 배경 | `--yellow-10` | `#FDFBC4` | `--mc-yellow-10` 일치 |
| 안내 배경 | `--yellow-5` | `#FEFDE8` | `--mc-yellow-5` 일치 |
| Brand Black (글자·선택 테두리) | `--black` | `#231F20` | `--mc-black` 일치 |
| 음성 버튼 Pressed | `--ink` | `#0E0F0E` | `--mc-ink` 일치 |
| 보조 글자 / 비활성 글자 | `--gray-70` / `--gray-60` | `#575757` / `#6E6E6E` | 이름만 있음(gray-70 / gray-60) |
| 구분선 / 일반 테두리 | `--gray-10` / `--gray-30` | `#E6E6E6` / `#B8B8B8` | 이름만 있음 |
| 오류 · HOT | `--error` · `--hot` | `#C4281C` | "빨강 계열" |
| ICE | `--ice` | `#1559B7` | "파랑 계열" |
| 모서리 | `--r-xs` / `--r-sm` / `--r-md` | 4 / 8 / 12px | §6.1 |
| 글꼴 | — | Pretendard Variable → Pretendard → Noto Sans KR | §4 일치 |
| 글자 크기 | — | 20·22·24·26·28·30·32·36·40·48·56·96px | §4 표 범위와 일치 |

## 화면에서 지키는 규칙 (요약)

- 선택 상태는 색만 쓰지 않고 체크(✓) + 테두리로 표현합니다.
- 노랑은 흰 배경 위의 글자나 유일한 경계선으로 쓰지 않습니다(대비 부족).
- HOT/ICE 색은 항상 글자와 함께 씁니다.
- 결제사 로고는 공식 색을 유지합니다.
- 확인되지 않은 정보(인기·영양·알레르기)는 표시하지 않습니다.
