# CLAUDE.md — UXPRESSO 프로젝트 가이드

메가MGC커피 키오스크 UX/UI 개선 **비공식** 프로토타입 (팀 UXPRESSO). 공식 프로젝트·공식 디자인 시스템·공식 API가 아니다.

## 명령어
- 실행: `npm start` → http://localhost:3000 (`?debug=1` 로 터치수·시간·도움 횟수 표시)
- UI Kit: `/kit.html`
- 빌드·테스트·의존성 없음 (Node 내장 모듈만 사용)

## 구조
| 경로 | 역할 |
|---|---|
| `server.js` | 정적 호스팅 + 메뉴/쿠폰/모의결제 API |
| `data/*.json` | 테스트 데이터 (menus, coupons, payments) |
| `public/app.js` | 화면·상태·인터랙션 (바닐라 JS, 상태 변경 시 전체 렌더) |
| `public/style.css` | 디자인 토큰·컴포넌트 |
| `public/kit.html` | 버튼 UI Kit |
| `public/screens.html` | 시안 보드 (`?demo=` 프리셋 화면 모음, 프리셋은 `app.js`의 `demo()`) |
| `docs/` | 요구사항·디자인 시스템·API 문서 (`docs/index.md` 참고) |

## 작업 원칙
- 디자인 시스템 2차 정의는 `docs/design-system/`(토큰: `tokens.json`/`tokens.css`). 값 출처는 [확인]/[추정]/[제안]/[확인 필요]로 구분하고, 공식 값처럼 쓰지 않는다. 프로토타입(`public/`)은 2차 토큰(색상·선택 상태·모서리·HOT/ICE 라벨)과 타이포 스케일(22/24/28/32/40/56px)·Progress·세션 확인 문구를 적용했다. 상품 사진은 언스플래시 임시 이미지, 아이콘은 Lucide(CDN)다.
- 색 값을 바꾸면 `public/style.css` `:root`와 `docs/design-system/tokens.*`를 함께 맞춘다. (1차 참고: `docs/as-is-analysis.md`)
- 화면은 1080×1920 고정 스테이지를 뷰포트에 맞춰 스케일한다. 터치 영역은 v1 기준: 주요 버튼 96~120px, 일반 72~96px, 아이콘 최소 64px, 간격 16px 이상. 글자 크기 스케일도 v1(본문 24/28px, 캡션 18px) 기준이며 핵심 정보에 캡션을 쓰지 않는다.
- 선택 상태는 색상만 쓰지 않고 체크(✓) + 테두리로 표현한다.
- UX Writing: 행동과 결과가 보이는 문구, 쉬운 한국어. 재촉·실수 지적 표현 금지. 오류는 **원인 + 해결 방법**을 함께 안내한다. 대기 인원 표시 금지. 카운트다운은 종료 전 안내 대화상자(실제 남은 초)에만 쓰고 그 외 화면에는 표시하지 않는다(미사용 120초 → 60초 유예, `SESS_IDLE_MS`·`SESS_GRACE_MS`).
- 주문 상태 유지: 도움말·오류·뒤로가기 후에도 장바구니와 쿠폰은 유지한다.
- 음성 주문은 PRD v3 기준 **선택 기능**(모의 입력)이다. 대화형 챗봇·긴 자연어 입력 UI는 넣지 않고, 허용된 의도(Intent)만 기존 화면으로 연결한다. 결제·쿠폰·적립은 음성으로 실행하지 않으며 주문 확인부터 마이크를 끈다. 터치만으로 전체 주문이 가능해야 한다.
- 가격·옵션·쿠폰 계산은 서버/데이터 기준이며 임의로 생성하지 않는다. 영양·알레르기는 확인된 정보만 표시한다.
- 가상 데이터를 실제 메가MGC커피 데이터처럼 표현하지 않는다. 모든 문서·화면에서 "비공식" 고지를 유지한다.
- API 실패 시 `data/` 기본 데이터로 주문을 이어간다. 결제는 같은 `key`로 중복 결제되지 않는다.
- 매장별 조정값은 `public/app.js` 상단 `PICKUP_TEXT`, `RETURN_MS`.

## 변경 시 체크
- 음성 CTA 상태(Default·Listening·Processing·Confirm·Error, Hidden)는 `docs/design-system/voice-cta-states.md`와 `kit.html`을 따른다. 추천 요청은 "주요 메뉴(featured)" 데이터 기준이며 인기·BEST를 지어내지 않는다.
- 화면을 추가·수정하면 `app.js`의 `demo()` 프리셋과 `public/screens.html` 시안 보드도 맞춘다.
- 새 화면/문구를 추가하면 도움말(`helpFor`)에 해당 단계 항목이 있는지 확인한다.
- 스타일 변경 시 `/kit.html` 컴포넌트 상태(Default·Pressed·Selected·Disabled)가 깨지지 않는지 확인한다.
- 커밋 메시지는 영어 한 줄 요약 + 필요 시 본문.

## GitHub 관리 (Claude의 역할)
Claude는 이 저장소의 정리 담당(관리자 역할)으로 일한다. 규칙은 [`CONTRIBUTING.md`](CONTRIBUTING.md)에 있다.
- 폴더 구조, `docs/index.md` 목차, `CONTRIBUTING.md`를 최신으로 유지한다. 새 자료가 올라오면 규칙에 맞는 위치와 목차 반영 여부를 확인한다.
- 팀원이 올린 파일은 옮기거나 지우기 전에 팀에 확인한다. 기존 구조를 먼저 따르고, 바꾸자고 제안할 때는 이유를 설명한다.
- 변경은 주제 브랜치에서 PR로 올린다. `main`에 합치기, 브랜치 삭제, 강제 푸시는 사용자가 그때 직접 요청한 경우에만 한다.
- 합쳐진 브랜치와 오래된 PR은 정리를 제안한다. 삭제는 요청을 받은 뒤에 한다.
