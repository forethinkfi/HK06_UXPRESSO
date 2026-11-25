# UXPRESSO 문서 목차

메가MGC커피 키오스크 UX/UI 개선 비공식 프로젝트의 문서 모음입니다. 실행 방법은 루트 [README](../README.md)를 보세요.

| 문서 | 내용 |
|---|---|
| [prd.md](prd.md) | **PRD 원문 (Ver. 2.0)** — 기획 단계 원본. 일부 항목(자연어 검색·AI Q&A 등)은 이후 요구사항으로 대체됨 |
| [requirements.md](requirements.md) | 요구사항 요약 — 기획 PRD, UX/UI 개선(대기열·UX Writing), 쿠폰·결제 경험 |
| [as-is-analysis.md](as-is-analysis.md) | AS-IS 키오스크 분석(UI Audit 초안) — 메가커피 실제 화면 수집 자료 기반, TO-BE 유지/개선 표 |
| [design-system/](design-system/README.md) | **UXPRESSO Kiosk Design System (2차, 모바일 앱 레퍼런스 기반)** — Reference Audit, Foundations, Tokens, Components, Patterns, UX Writing, Accessibility, 의사결정·QA |
| [design-system.md](design-system.md) | 디자인 시스템 1차 버전 (키오스크 화면 기준) — 2차로 대체됨 | UXPRESSO — Kiosk UI Kit: 토큰, 버튼 6종, 접근성 기준, UX Writing 규칙 |
| [api.md](api.md) | 자체 테스트 API(메뉴·쿠폰·모의 결제)와 테스트 시나리오 |
| 시안 보드 (`/screens.html`) | 개선된 핵심 화면 모음. 서버 실행 후 http://localhost:3000/screens.html |
| [../CLAUDE.md](../CLAUDE.md) | Claude Code 작업 가이드 |

## 화면 흐름

```
주문 방식 선택 ─┬→ 메뉴 탐색 → 메뉴 상세·옵션 → 장바구니 → 주문 확인 → 쿠폰·결제 → 주문 완료
               └→ (선택) 쿠폰·결제 수단 미리 확인 → 처음으로
공통: 주문 도움 · 주문 방식 바꾸기 · 이전 화면 · 전체 주문 취소
결제 분기: 승인 → 완료 / 승인 확인 중 → 완료 / 실패 → 재시도·다른 수단·주문 수정·직원 도움
```

## 구현 상태

| 영역 | 상태 |
|---|---|
| 주문 플로우(방식 선택 ~ 완료), 취향 필터, 옵션, 장바구니 수정 | 구현 |
| 주문 도움(단계별), 직원 도움 요청 | 구현 |
| 쿠폰 미리 확인·적용, 결제 수단 선택, 오류 복구, 승인 확인 중 | 구현 (모의) |
| UI Audit (공개 자료 기반 초안) | 작성 — 매장 직접 관찰로 보완 필요 |
| AS-IS 재현 프로토타입·사용성 테스트 결과 | 미작성 (리서치 필요) |
| 자연어 검색·AI 질의응답 | 제외 (기본 플로우에 넣지 않음) |

> 본 프로젝트는 메가MGC커피의 공식 프로젝트가 아닙니다. 메뉴·가격·쿠폰·결제는 모두 테스트 데이터입니다.
