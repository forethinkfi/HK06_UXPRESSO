# UXPRESSO 문서 목차

메가MGC커피 키오스크 UX/UI 개선 **비공식** 프로젝트의 문서 모음입니다. 실행 방법은 루트 [README](../README.md), 만든 순서는 [process.md](process.md)를 보세요. 공식 프로젝트·디자인 시스템·API가 아니며 메뉴·가격·쿠폰·결제는 테스트 데이터입니다.

문서를 새로 올리면 해당 단계 표에 한 줄을 추가해 주세요. 작업 규칙은 [../CONTRIBUTING.md](../CONTRIBUTING.md), Claude Code 가이드는 [../CLAUDE.md](../CLAUDE.md)입니다.

| 단계 | 문서 | 내용 |
|---|---|---|
| 전체 | [process.md](process.md) | **제작 과정** — 리서치부터 v6까지 단계별 결과물 |

## 1. 리서치

| 문서 | 내용 |
|---|---|
| [as-is-analysis.md](as-is-analysis.md) | AS-IS 키오스크 분석(UI Audit 초안), TO-BE 유지/개선 표 |
| [research/](research/README.md) | AS-IS 주문 플로우 재구성(28화면·8화면), [UIBowl 레퍼런스](research/uibowl-references.md), 사용성 테스트(미작성) |

## 2. 기획

| 문서 | 내용 |
|---|---|
| [prd.md](prd.md) | PRD 원문 Ver. 2.0 — 일부 항목(자연어 검색·AI Q&A)은 이후 대체됨 |
| [prd-v3.0.md](prd-v3.0.md) | PRD v3.0 전문 (팀 제공) — 음성 주문·세션 정책 (검증 전 제안) |
| [prd-v3-summary.md](prd-v3-summary.md) | PRD v3.0 요약과 구현/미구현 매핑 |
| [requirements.md](requirements.md) | 요구사항 요약 |

## 3. 디자인 시스템

| 문서 | 내용 |
|---|---|
| [design-system/](design-system/README.md) | **2차 디자인 시스템** — Reference Audit, Foundations, Tokens, Components, Patterns, UX Writing, Accessibility, 의사결정·QA |
| [design-system/voice-cta-states.md](design-system/voice-cta-states.md) | 음성 주문 CTA 상태 5종 + Hidden |
| [design-system/uxpresso-kiosk-design-system-v1.md](design-system/uxpresso-kiosk-design-system-v1.md) | Design System v1.0 원문 (팀 제공) |
| [design-system/uxpresso-kiosk-design-system-v2.md](design-system/uxpresso-kiosk-design-system-v2.md) | Design System v2.0 원문 (팀 제공, 검증 전 제안) |
| [artboard/](artboard/README.md) | Claude Design 아트보드 소스 백업 (화면 12장) |
| [archive/design-system-v0-kit.md](archive/design-system-v0-kit.md) | 1차 UI Kit — 2차로 대체됨 (이전 기록) |
| [Figma 시안](https://www.figma.com/design/RPhFB3P8rftlJ1k0E9QmA7/UXPRESSO--%EC%9C%A0%EC%97%91%EC%8A%A4%ED%94%84%EB%A0%88%EC%86%8C-%ED%8C%80---%EC%B9%B4%ED%8E%98-%ED%82%A4%EC%98%A4%EC%8A%A4%ED%81%AC-%EA%B0%9C%EC%84%A0?node-id=0-1) | 팀 Figma 파일 (Figma 계정 필요) |

## 4. 프로토타입

| 문서·주소 | 내용 |
|---|---|
| [api.md](api.md) | 자체 테스트 API(메뉴·쿠폰·모의 결제)와 테스트 시나리오 |
| [menu-image-links/](menu-image-links/README.md) | 메뉴 이미지 링크 목록 |
| [artboard/v2-i/](artboard/v2-i/README.md) | 시안 v2-I — 메인·서브카테고리·영수증, 메뉴 192개 데이터와 생성 도구 |
| `/` (`/v6/index.html`) | 키오스크 v6 시안 — 서버 실행 후 http://localhost:3000 |
| `/index.html` · `/screens.html` · `/kit.html` | 이전 프로토타입 · 시안 보드 · UI Kit |

## 5. 협업

| 문서 | 내용 |
|---|---|
| [meetings/](meetings/README.md) | 회의록 (템플릿 포함) |
| [presentation/](presentation/README.md) | 발표 자료 |

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
| 음성 주문(모의 입력), 음성 CTA 5상태, 종료 전 안내(120s/60s) | 구현 (PRD v3) |
| 자연어 검색·AI 질의응답(챗봇형) | 제외 (허용된 Intent만 기존 화면 연결) |
| 8개 대분류, 상단 AD, 언어·접근성 설정, 사용성 이벤트 | 미구현 |

> 본 프로젝트는 메가MGC커피의 공식 프로젝트가 아닙니다. 메뉴·가격·쿠폰·결제는 모두 테스트 데이터입니다.
