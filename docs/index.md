# UXPRESSO 문서 목차

메가MGC커피 키오스크 UX/UI 개선 **비공식** 프로젝트의 문서 목차입니다. 프로젝트 소개와 실행 방법은 루트 [README](../README.md), 만든 순서는 [process.md](process.md)에 있습니다.

> 본 프로젝트는 메가MGC커피의 공식 프로젝트가 아닙니다. 메뉴·가격·쿠폰·결제는 모두 테스트 데이터입니다.

새 문서를 올리면 해당 표에 한 줄을 추가해 주세요. 올리는 위치 규칙: [../CONTRIBUTING.md](../CONTRIBUTING.md)

| 폴더 | 내용 |
|---|---|
| [process.md](process.md) | **제작 과정** — 리서치부터 v6·음성 주문까지 단계별 결과물 |
| [research/](research/README.md) | AS-IS 분석, 현장 화면 재구성, UI 감사, 레퍼런스, 사용성 테스트 |
| [personas/](personas/README.md) | 페르소나·여정 지도 |
| [prd/](prd/prd-v3.0.md) | 현행 PRD v3.0, 요약·구현 매핑, 요구사항 |
| [design-system/](design-system/README.md) | 현행 디자인 시스템 DS v6.0, 음성 CTA 상태, 로고·아이콘 |
| [prototype/](prototype/README.md) | 현행 키오스크 v6 설명, 원본 시안 v2-I |
| [api/](api/README.md) | 모의 API, 음성 주문(Gemini Live) 구조·배포 설정 |
| [testing/](testing/README.md) | 자동 테스트 실행 방법과 결과 |
| [presentation/](presentation/README.md) | 발표 자료 |
| [meetings/](meetings/README.md) | 회의록 |
| [menu-image-links/](menu-image-links/README.md) | 메뉴 이미지 링크 목록 (v6 메뉴 데이터가 참조) |
| [archive/](archive/README.md) | 이전 디자인 시스템·프로토타입·PRD, 폐기 기능, **브랜치 기록과 복구 방법** |

## 1. 리서치

| 문서 | 내용 |
|---|---|
| [research/as-is-analysis.md](research/as-is-analysis.md) | AS-IS 키오스크 분석(UI Audit 초안), TO-BE 유지/개선 표 |
| [research/as-is-ui-audit.md](research/as-is-ui-audit.md) | 실제 키오스크 화면 12장 기반 UI 감사 |
| [research/as-is-flow/](research/as-is-flow/README.md) | 매장 영상 기반 AS-IS 주문 플로우 정면 재구성 (28화면) |
| [research/as-is-normal-mode/](research/as-is-normal-mode/README.md) | 일반모드 AS-IS 주문 플로우 (8화면) |
| [research/uibowl-references.md](research/uibowl-references.md) | 모바일 앱 UI 레퍼런스 |
| [research/usability-test/](research/usability-test/README.md) | 사용성 테스트 (미작성) |

## 2. 페르소나 · 기획

| 문서 | 내용 |
|---|---|
| [personas/](personas/README.md) | 페르소나 2명과 여정 지도 |
| [prd/prd-v3.0.md](prd/prd-v3.0.md) | **현행 PRD v3.0** (팀 제공) — 음성 주문·세션 정책 |
| [prd/prd-v3-summary.md](prd/prd-v3-summary.md) | PRD v3.0 요약과 구현/미구현 매핑 |
| [prd/requirements.md](prd/requirements.md) | 요구사항 요약 |
| [archive/prd/](archive/README.md#폴더) | PRD 원문 Ver. 2.0, mega-ver.2용 PRD v3.1 (보관) |

## 3. 디자인 시스템

| 문서 | 내용 |
|---|---|
| [design-system/](design-system/README.md) | **현행 DS v6.0**과 코드 기준 값 대조표 |
| [design-system/voice-cta-states.md](design-system/voice-cta-states.md) | 음성 주문 CTA 상태 5종 + Hidden |
| [archive/design-system/](archive/design-system/README.md) | 이전 버전(1차 Kit, 2차 DS, 팀 원문 v1·v2, v7.1)과 **버전별 변경·의사결정** |

## 4. 프로토타입 · API

| 문서·주소 | 내용 |
|---|---|
| [prototype/](prototype/README.md) | 키오스크 v6 화면 흐름·코드 구성 |
| [prototype/v2-i/](prototype/v2-i/README.md) | v6의 원본 시안 v2-I (캔버스 소스, 단독 프로토타입, HTML 화면 35장) |
| [api/](api/README.md) | 메뉴·결제 모의 API와 테스트 시나리오 |
| [api/ai-integration.md](api/ai-integration.md) | 음성 주문 구조, Render 배포 설정, 문제 구분법 |
| [api/ai-menu-price-comparison.md](api/ai-menu-price-comparison.md) | AI용 메뉴 목록과 키오스크 메뉴의 가격 차이 보고 |
| `/` (`/v6/index.html`) | 현행 키오스크 — 서버 실행 후 http://localhost:3000 |
| `/index.html` · `/screens.html` · `/kit.html` | 초기 프로토타입 · 시안 보드 · UI Kit ([보관 안내](archive/prototypes/README.md)) |

## 5. 검증 · 협업

| 문서 | 내용 |
|---|---|
| [testing/](testing/README.md) | 서버 테스트·브라우저 E2E 결과 (모의 / 실제 구분) |
| [presentation/](presentation/README.md) | 발표 자료 PDF와 원본 덱 |
| [meetings/](meetings/README.md) | 회의록 (템플릿 포함) |
