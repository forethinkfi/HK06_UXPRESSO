# 아카이브

현행 서비스(`main`의 키오스크 v6)에 쓰이지 않지만 프로젝트가 어떻게 발전했는지 보여 주는 작업물을 모아 둔 곳입니다. **지운 작업은 없습니다.** 문서와 대표 화면은 이 폴더에 있고, 실행 코드는 원래 브랜치(또는 브랜치를 정리한 뒤에는 `archive/*` 태그)에 그대로 남아 있습니다.

> 본 프로젝트는 메가MGC커피의 공식 프로젝트가 아닙니다. 메뉴·가격·쿠폰·결제는 모두 테스트 데이터입니다.

- 정리 기준일: 2026-11-26 (정리 브랜치 `chore/repository-cleanup`)
- 현행 문서 목차: [../index.md](../index.md) · 제작 과정: [../process.md](../process.md)

## 폴더

| 폴더 | 내용 |
|---|---|
| [design-system/](design-system/README.md) | 이전 디자인 시스템(v0 UI Kit, 2차 DS, 팀 원문 v1·v2, mega-ver.2의 v7.1)과 **버전별 변경·의사결정 기록** |
| [prototypes/](prototypes/README.md) | 이전 프로토타입(초기 키오스크, mega-ver.2 재구성, v2-I 앱, DS v2 아트보드)의 대표 화면과 설명 |
| [prd/](prd/) | PRD 원문 Ver. 2.0, mega-ver.2용 PRD v3.1 |
| [deprecated-features/](deprecated-features/coupons.md) | 폐기한 기능 기록 (쿠폰) |

## 프로젝트 발전 과정 (포트폴리오용 요약)

### 1. 디자인
| 단계 | 결과물 | 현행 반영 |
|---|---|---|
| 1차 UI Kit (v0) | 키오스크 화면 기준 버튼 Kit | 대체됨 → [design-system/v0-kit.md](design-system/v0-kit.md) |
| 2차 디자인 시스템 | 메가MGC커피 모바일 UI 레퍼런스 기반 토큰·컴포넌트(01~08) — 초기 프로토타입에 적용 | 대체됨 → [design-system/ds-2nd/](design-system/ds-2nd/README.md) |
| 팀 원문 DS v1.0 · v2.0 | 음성·세션 중심(v1), 브랜드 중심(v2) | 보관 → [design-system/originals/](design-system/originals/) |
| 540×960 참고 시안 레이아웃 | 메뉴·결제 화면 재구성 (PR #9) | 초기 프로토타입에 반영, 이후 v6로 대체 |
| 시안 v2-I | 프로모션·오비트 메인·영수증 | **v6의 레이아웃 원본** → [../prototype/v2-i/](../prototype/v2-i/README.md) |
| **DS v6.0 + 키오스크 v6** | 브랜드 보존 Refinement | **현행** → [../design-system/](../design-system/README.md) |
| mega-ver.2 재구성 + DS v7.1 | v6.0을 바탕으로 한 별도 재구성안 | 현행 아님 → [prototypes/README.md#mega-ver2-재구성](prototypes/README.md#mega-ver2-재구성) |

### 2. 음성 주문
| 단계 | 브랜치 | 내용 | 현행 반영 |
|---|---|---|---|
| 모의 음성 CTA | `main` 초기 커밋 (`8d356dc`) | PRD v3 기준 음성 CTA 5상태 + 모의 입력(실제 인식 없음) | 초기 프로토타입에 남아 있음, v6는 실제 연결로 대체 |
| AI Lab 실험 | `experiment/ai-poc` | `/ai-test.html`, 텍스트 주문 분석, 추천 API, Gemini 연결 확인 | 미반영 (실험) |
| AI Studio 원본 | `backup/ai-studio-1126` | Gemini Live 실시간 음성 주문 원본 소스 백업 | 원본 보관 |
| V2 디자인 연결 시험 | `integration/v2-ai-test` | Gemini Live를 V2 디자인에 연결(1차) | 미반영 (r2로 대체) |
| v6 연결 시험 | `integration/v2-ai-test-r2` | Gemini Live를 v6에 이식, 첫 안내 | **현행 AI 코드의 출처** (`docs/api/ai-integration.md`) |
| **최종 통합** | `integration/final-ai` → `main` | v6 + Gemini Live, 텍스트 입력·모의 칩 제거 | **현행** |

### 3. 쿠폰
초기 프로토타입은 쿠폰 미리 확인·번호 입력·할인 계산까지 구현했지만, 최종 v6에서는 쿠폰 기능을 넣지 않기로 했습니다. 자세한 내용: [deprecated-features/coupons.md](deprecated-features/coupons.md)

## 브랜치 기록

2026-11-26 기준 원격 브랜치 전체입니다. "아카이브 태그"는 브랜치를 지우기 전에 만들 태그 이름입니다. **아직 원격에 만들어지지 않았습니다**(아래 [태그 만들기](#태그-만들기) 참고). 태그를 만들기 전까지는 브랜치 자체가 보존 위치입니다.

| 기존 브랜치 | 작업 목적 | 주요 변경 사항 | 현재 상태 | 보존 위치 | 아카이브 태그 | 마지막 커밋 | 현행 반영 | 복구 방법 |
|---|---|---|---|---|---|---|---|---|
| `main` | 최종 서비스 | 키오스크 v6 + Gemini Live 음성 주문 | **유지** (기준 브랜치) | 브랜치 | — | `4d5d24b` | — | — |
| `feature/supabase-orders` | 완료 주문을 Supabase에 저장 | 원자적 RPC, 서버 재계산, 스키마·테스트, v2-I 문서 | **유지** (미통합 기능) | 브랜치 | — | `d19077c` | 미반영 — 실제 DB 연결·검증 후 선별 통합 예정 | — |
| `backup/ai-studio-1126` | AI Studio 원본 백업 | `hk06_uxpresso.zip`(2026-11-26) 소스를 `231e90f` 위에 보관 | **유지** (원본 백업) | 브랜치 | — | `8da554a` | 원본 보관 | — |
| `integration/final-ai` | 음성 주문 최종 통합 작업 | `main`과 같은 커밋 | **유지 (확인 필요)** — Render 배포 브랜치일 수 있음 | 브랜치 | `archive/integration-final-ai` | `4d5d24b` | 전부 반영 | `git checkout -b integration/final-ai archive/integration-final-ai` |
| `mega-ver.2` | v6.0 기반 별도 재구성안 | public 전체 재구성(32커밋), DS v7.1, PRD v3.1, refinement v2.1 | **유지 (팀 확인 필요)** — designoh 진행 작업 | 브랜치 · 문서는 [design-system/mega-ver2/](design-system/mega-ver2/), [prd/](prd/) | `archive/mega-ver.2` | `cf9209c` | 문서만 보관, 화면 미반영 | `git checkout -b mega-ver.2 archive/mega-ver.2` |
| `feat/v2-i-prototype-app` | v2-I 시안을 앱 첫 화면으로 서비스 | `public/index.html` 교체, `.figma/make`, v6 수정 병합 | **유지** — PR #11 열림 | 브랜치 · 시안 문서는 `docs/prototype/v2-i/` | `archive/feat-v2-i-prototype-app` | `cf6c887` | 문서 부분만 반영 (서비스 교체는 미반영) | `git checkout -b feat/v2-i-prototype-app archive/feat-v2-i-prototype-app` |
| `docs/add-personas` | 페르소나·여정 지도, AS-IS UI 감사 | `personas.md`, 이미지, `as-is-ui-audit.md`, `kiosk-ui-png/` | 종료 — 정리 브랜치에 병합 (PR #4) | `docs/personas/`, `docs/research/` | `archive/docs-add-personas` | `a29568e` | 반영 (`kiosk-ui-png/`는 `docs/research/as-is-flow/`와 동일 파일이라 제외) | `git checkout -b docs/add-personas archive/docs-add-personas` |
| `feat/v2-logo-assets` | UXPRESSO V2 로고·아이콘 | SVG·PNG 에셋 | 종료 — 정리 브랜치에 병합 | `docs/design-system/assets/uxpresso-v2/` | `archive/feat-v2-logo-assets` | `0f90103` | 반영 (문서 에셋) | `git checkout -b feat/v2-logo-assets archive/feat-v2-logo-assets` |
| `docs/v2-i-artboard` | v2-I 단독 프로토타입·HTML 화면 | `html/` 35장, `prototype/` | 종료 — 정리 브랜치에 병합 | `docs/prototype/v2-i/` | `archive/docs-v2-i-artboard` | `073b4f2` | 반영 (문서) | `git checkout -b docs/v2-i-artboard archive/docs-v2-i-artboard` |
| `feature/motion-mega-coffee` | 발표 자료, 팀원 PC 실행 보완 | 10쪽 덱·PDF, `server.js` 경로 수정, `randomUUID` 대체, `.nvmrc` | 종료 — 발표 자료만 반영 (PR #10은 이전에 병합) | `docs/presentation/` · 코드 수정은 태그 | `archive/feature-motion-mega-coffee` | `31a9d65` | 발표 자료 반영, **코드 수정은 미반영** | `git checkout -b feature/motion-mega-coffee archive/feature-motion-mega-coffee` |
| `claude/wonderful-volta-bp3aia` | 문서 단계별 정리 초안 | 루트 중복 파일 삭제, `process.md` | 종료 — 정리 브랜치에 병합 | `docs/process.md` | `archive/claude-wonderful-volta-bp3aia` | `a8ecc07` | 반영 | `git checkout -b claude/wonderful-volta-bp3aia archive/claude-wonderful-volta-bp3aia` |
| `integration/v2-ai-test-r2` | Gemini Live를 v6에 이식 | AI 엔진·v6 어댑터 | 종료 — 내용은 `main`에 반영 | 태그 | `archive/integration-v2-ai-test-r2` | `fe78a12` | 반영 (`integration/final-ai` 경유) | `git checkout -b integration/v2-ai-test-r2 archive/integration-v2-ai-test-r2` |
| `integration/v2-ai-test` | Gemini Live를 V2 디자인에 연결 (1차) | V2 화면에 AI 연결 (1차) | 종료 — r2로 대체 | 태그 | `archive/integration-v2-ai-test` | `b653970` | 미반영 | `git checkout -b integration/v2-ai-test archive/integration-v2-ai-test` |
| `experiment/ai-poc` | AI 연결 실험 (AI Lab) | `/ai-test.html`, `/api/ai/*`, 추천·텍스트 주문 분석 | 종료 — 실험 (이전 Render 배포 브랜치, 현재 사이트는 이 코드가 아님) | 태그 | `archive/experiment-ai-poc` | `ba831c9` | 미반영 | `git checkout -b experiment/ai-poc archive/experiment-ai-poc` |
| `feat/photos-lucide-type-scale` | 사진·아이콘·타이포 스케일 | PR #5, #9 | 종료 — 전부 `main`에 병합됨 | `main` 히스토리 | `archive/feat-photos-lucide-type-scale` | `3fa0823` | 전부 반영 | `git checkout -b feat/photos-lucide-type-scale archive/feat-photos-lucide-type-scale` |
| `claude/zealous-meitner-05f4g0` | Claude 작업 브랜치 | `main`과 같은 커밋 | 종료 — 전부 `main`에 있음 | `main` 히스토리 | 필요 없음 | `4d5d24b` | 전부 반영 | `main`에서 같은 커밋 |

정리 직전 상태 전체는 `backup/pre-cleanup-2026-11-26/<브랜치>` 태그로도 남깁니다(브랜치마다 1개).

## 태그 만들기

이 저장소를 정리한 Claude 세션 환경에서는 태그를 원격에 올릴 수 없어서(브랜치 푸시만 허용), **브랜치를 지우기 전에 팀원 PC에서 한 번** 실행해야 합니다. 태그만 만들고 아무것도 지우지 않습니다.

```bash
bash docs/archive/create-archive-tags.sh          # 태그 생성 + SHA 확인
git push origin --tags                             # 원격에 올리기
bash docs/archive/create-archive-tags.sh --verify  # 원격 태그가 기록한 SHA를 가리키는지 확인
```

## 복구 방법

- 브랜치 되살리기: 위 표의 "복구 방법" 명령 실행 후 `git push -u origin <브랜치>`.
- 파일 하나만 꺼내 보기: `git show archive/mega-ver.2:public/style.css`
- 태그 시점 전체 실행: `git worktree add ../old archive/experiment-ai-poc && cd ../old && npm install && npm start`
- 정리 전 `main`으로 되돌리기(정리 PR을 병합한 뒤에도 가능): `git revert -m 1 <정리 PR 병합 커밋>` — 히스토리를 지우지 않고 되돌립니다.
