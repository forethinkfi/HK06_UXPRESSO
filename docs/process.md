# 제작 과정

UXPRESSO(비공식) 키오스크 프로토타입이 어떤 순서로 만들어졌는지 단계별로 정리했습니다. 날짜는 커밋 기준(2026-11-25 ~ 11-26)이고, 각 단계의 결과물 위치를 함께 적었습니다. 전체 목차는 [index.md](index.md), 이전 작업물과 브랜치 기록은 [archive/](archive/README.md)에 있습니다.

> 본 프로젝트는 메가MGC커피의 공식 프로젝트가 아닙니다. 메뉴·가격·쿠폰·결제는 모두 테스트 데이터입니다.

## 한눈에 보기

```
1 리서치 → 2 페르소나·기획 → 3 디자인 시스템 → 4 초기 프로토타입 → 5 시안 v2-I
  → 6 키오스크 v6 + DS v6.0 → 7 음성 주문(Gemini Live) → 8 발표 자료 → 9 저장소 정리
```

## 1. 리서치 — 현재 키오스크는 어떤가

- 공개 자료와 매장 영상으로 AS-IS 주문 플로우를 재구성했습니다(정면 28화면, 일반모드 8화면).
- 화면마다 유지·개선할 점을 UI Audit 표로 정리하고, 실제 키오스크 화면 12장으로 UI 감사를 했습니다.
- 모바일 앱 레퍼런스(UIBowl)를 모아 디자인 방향의 근거로 삼았습니다.

결과물: [research/](research/README.md)

## 2. 페르소나 · 기획 — 누구를 위해, 무엇을 만들 것인가

- 페르소나 2명과 여정 지도를 만들었습니다.
- PRD Ver. 2.0으로 문제 정의와 요구사항을 정했습니다.
- PRD v3.0에서 음성 주문(선택 기능)과 세션 정책(미사용 120초 → 60초 안내)을 추가했습니다.
- 챗봇형 자연어 검색·AI 질의응답은 범위에서 빼고, 허용된 의도만 기존 화면으로 연결하기로 했습니다.

결과물: [personas/](personas/README.md) · [prd/prd-v3.0.md](prd/prd-v3.0.md) · [prd/prd-v3-summary.md](prd/prd-v3-summary.md) · 원문 Ver. 2.0은 [archive/prd/](archive/README.md#폴더)

## 3. 디자인 시스템 — 어떤 규칙으로 만들 것인가

- 1차 UI Kit을 만들었다가, 메가MGC커피 모바일 앱 레퍼런스 기반의 2차 디자인 시스템으로 바꿨습니다.
- 2차에서 색상·선택 상태·타이포·터치 영역·UX Writing·접근성 기준을 정하고 토큰으로 만들었습니다.
- 팀이 제공한 Design System v1.0(음성·세션 중심), v2.0(브랜드 중심) 원문을 함께 보관합니다.

결과물: [archive/design-system/](archive/design-system/README.md) (버전별 변경·의사결정 기록 포함)

## 4. 초기 프로토타입 — 주문 흐름 구현 (`public/app.js`)

1. 주문 방식 선택 → 메뉴 → 옵션 → 장바구니 → 결제 → 완료의 기본 흐름과 메뉴 API
2. 쿠폰 미리 확인, 결제 수단 선택, 오류 복구, 승인 확인 중 상태
3. AS-IS 패턴과 2차 토큰 적용, 시안 보드(`/screens.html`)와 UI Kit(`/kit.html`)
4. 모의 음성 주문 CTA·주문 도움·종료 전 안내(PRD v3)
5. 상품 사진(Unsplash 임시)·Lucide 아이콘·진행 단계·540×960 참고 시안 레이아웃 (PR #5, #9)

결과물: [archive/prototypes/](archive/prototypes/README.md) (화면 캡처, 코드는 `public/`에서 지금도 실행 가능) · [api/](api/README.md)

## 5. 시안 v2-I — 새 레이아웃과 모션

- 프로모션·오비트 메인·메뉴 서브카테고리·영수증 발행을 담은 시안을 만들고, 메뉴 192개 데이터와 생성 도구를 정리했습니다.
- Figma로 옮기기 좋은 HTML 화면 35장과 단독 실행 프로토타입을 만들었습니다.

결과물: [prototype/v2-i/](prototype/v2-i/README.md)

## 6. 키오스크 v6 + DS v6.0 — 시안을 동작하는 화면으로

- DS v6.0(브랜드 보존 Refinement)을 기준으로 v2-I 레이아웃과 모션을 코드로 옮겼습니다.
- 결제 화면(결제사 로고)과 상품 상세(히어로 + 옵션 시트)를 다시 짜고, 우선순위별 UI 점검 이슈를 고쳤습니다.
- 루트 주소(`/`)가 v6로 열립니다.
- 같은 시기에 DS v6.0을 바탕으로 한 별도 재구성안(mega-ver.2, DS v7.1)도 진행했습니다. 현행에는 반영하지 않았고 [archive/](archive/prototypes/README.md#mega-ver2-재구성)에 기록했습니다.

결과물: `public/v6/` · [prototype/](prototype/README.md) · [design-system/](design-system/README.md)

## 7. 음성 주문 — Gemini Live 연결

- AI Lab 실험(`experiment/ai-poc`) → AI Studio 원본(`backup/ai-studio-1126`) → V2·v6 연결 시험(`integration/v2-ai-test`, `-r2`)을 거쳐 v6에 통합했습니다(`integration/final-ai`).
- 서버가 메뉴 데이터로 먼저 검증하고, AI는 실제 장바구니 결과를 받은 뒤에만 말합니다. 결제·쿠폰·적립은 음성으로 하지 않습니다.
- 텍스트 입력창과 모의 입력 칩을 없애고, Gemini 크레딧 소진을 따로 안내하게 했습니다.

결과물: `lib/`, `public/live-client.js`, `public/v6/live-adapter.js` · [api/ai-integration.md](api/ai-integration.md)

## 8. 발표 자료

결과물: [presentation/](presentation/README.md) (10쪽 PDF와 원본 덱)

## 9. 저장소 정리 (2026-11-26)

- 브랜치에만 있던 결과물(페르소나, 로고, v2-I 화면, 발표 자료, DS v6.0)을 원래 커밋과 작성자를 유지한 채 `main`으로 모았습니다.
- 문서를 단계별 폴더로 나누고, 현행이 아닌 디자인 시스템·프로토타입·PRD를 `archive/`로 옮겼습니다. 서비스 코드는 바꾸지 않았습니다.
- 브랜치별 목적·마지막 커밋·복구 방법: [archive/README.md](archive/README.md)

## 아직 하지 않은 것

사용성 테스트(시나리오·결과), 매장 직접 관찰로 UI Audit 보완, 실제 Gemini 응답·마이크·Render 환경 검증, 주문 저장(Supabase) 통합, 언어 설정(v6는 "준비 중"). 현재 상태는 루트 [README](../README.md)의 "구현 현황"에 있습니다.
