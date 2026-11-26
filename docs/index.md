# UXPRESSO 문서 목차

메가MGC커피 키오스크 UX/UI 개선 비공식 프로젝트의 문서 모음입니다. 실행 방법은 루트 [README](../README.md)를 보세요.

| 문서 | 내용 |
|---|---|
| [prd-v3.0.md](prd-v3.0.md) | **PRD v3.0 전문 (팀 제공)** — 음성 주문·세션 정책 포함 원문 (검증 전 제안) |
| [design-system/uxpresso-design-system-v6.md](design-system/uxpresso-design-system-v6.md) | **디자인 시스템 v6.0 (팀 제공, 현재 기준)** — `mega-ver.2` 새 화면의 기준. 제안 / 하드웨어 검증 전 |
| [requirements.md](requirements.md) | 요구사항 요약 — 기획 PRD, UX/UI 개선(대기열·UX Writing), 쿠폰·결제 경험 |
| [as-is-analysis.md](as-is-analysis.md) | AS-IS 키오스크 분석(UI Audit 초안) — 메가커피 실제 화면 수집 자료 기반, TO-BE 유지/개선 표 |
| [Figma 시안](https://www.figma.com/design/RPhFB3P8rftlJ1k0E9QmA7/UXPRESSO--%EC%9C%A0%EC%97%91%EC%8A%A4%ED%94%84%EB%A0%88%EC%86%8C-%ED%8C%80---%EC%B9%B4%ED%8E%98-%ED%82%A4%EC%98%A4%EC%8A%A4%ED%81%AC-%EA%B0%9C%EC%84%A0?node-id=0-1) | UXPRESSO 팀 Figma 파일 — 카페 키오스크 개선 시안 (Figma 계정 필요) |
| [research/](research/README.md) | 리서치 — AS-IS 주문 플로우 재구성, 사용성 테스트, [UIBowl 레퍼런스](research/uibowl-references.md) |
| [meetings/](meetings/README.md) | 회의록 (템플릿 포함) |
| [presentation/](presentation/README.md) | 발표 자료 |
| [../CONTRIBUTING.md](../CONTRIBUTING.md) | **작업 방법** — 파일 올리는 위치, 브랜치 규칙, 커밋 메시지 |
| [api.md](api.md) | 자체 테스트 API(메뉴·쿠폰·모의 결제)와 테스트 시나리오 |
| [../CLAUDE.md](../CLAUDE.md) | Claude Code 작업 가이드 |

## 화면 흐름

```
주문 방식 선택 ─┬→ 메뉴 탐색 → 메뉴 상세·옵션 → 장바구니 → 주문 확인 → 쿠폰·결제 → 주문 완료
               └→ (선택) 쿠폰·결제 수단 미리 확인 → 처음으로
공통: 주문 도움 · 주문 방식 바꾸기 · 이전 화면 · 전체 주문 취소
결제 분기: 승인 → 완료 / 승인 확인 중 → 완료 / 실패 → 재시도·다른 수단·주문 수정·직원 도움
```

## 구현 상태

`mega-ver.2` 브랜치는 디자인 시스템 v6으로 새로 만든 화면이에요. 이전 화면·디자인 시스템 문서는 `main` 브랜치에 있어요.

| 영역 | 상태 |
|---|---|
| 시작 → 메뉴 → 옵션 → 주문 확인 → 할인·결제 → 완료 | 구현 (결제는 모의) |
| 음성 주문 | 모의 발화 버튼 (실제 음성 인식 없음) |
| 세션 안내, 도움말, 고대비 | 구현 |
| 화면 확대, 다국어, 공식 로고·결제사 로고·광고 그래픽 | 미구현 (자리 표시) |
| 푸드·상품·신메뉴 | 이미지 링크 목록 기준, 가격·분류·신메뉴 지정은 시연용 |

> 본 프로젝트는 메가MGC커피의 공식 프로젝트가 아닙니다. 메뉴·가격·쿠폰·결제는 모두 테스트 데이터입니다.
