# AI 음성 주문 통합 — 최종 디자인 v6 (integration/final-ai)

> **비공식 프로토타입.** 메가MGC커피 공식 프로젝트·API가 아니며, 메뉴·가격은 시연·테스트용 값이다.
> 디자인 기준은 `main`(`945033f`)의 v6 키오스크(`/` → `/v6/index.html`)다. AI는 `integration/v2-ai-test-r2`(`fe78a12`)의 서버·브라우저 엔진·v6 연결부를 그대로 가져왔다(재구현 없음). 팀 파일은 수정하지 않았고 `main`에는 합치지 않았다.

## 구조 (AI 코드와 UI 코드 분리)

| 파일 | 역할 | 디자인이 바뀌면 |
|---|---|---|
| `lib/live-kiosk.js` | Gemini Live 연결, 시스템 지침, 도구 10개, 메뉴 검증 | 그대로 |
| `lib/catalog.js` | 검증용 메뉴 목록. 기본 `v6`는 키오스크가 읽는 `public/v6/menu-data.json`을 그대로 변환 | 그대로 |
| `lib/live-guard.js` | `/api/live` 보호(Origin·동시 접속·시간당·시간 제한) | 그대로 |
| `server.js` | 기존 정적 호스팅·모의 API에 WebSocket `/api/live`, `/api/live/health` 추가 | 그대로 |
| `public/live-client.js` | 브라우저 엔진(마이크 16kHz, 재생 24kHz, WS). 화면·장바구니를 모른다 | 그대로 |
| `public/v6/live-adapter.js` | **v6 연결부.** AI 요청을 v6의 `S.items`·카테고리 이동으로 바꾼다 | 새 화면에 맞게 이 파일의 `app` 도우미만 다시 연결 |
| `public/v6/app.js` | 수정은 연결 지점뿐: 어댑터 생성, 음성 시작·종료, 음성 패널의 입력줄·상태 문구 | — |
| `public/v6/style.css` | 음성 패널 안 입력줄 스타일 3줄 추가 | — |
| `data/ai/menus-128.json` | AI Studio 128개 목록(보존). 서버 테스트·가격 비교에만 사용 | — |

### 음성과 터치가 같은 장바구니를 쓰는 방식
1. AI가 도구(`add_to_cart` 등)를 부르면 **서버가 메뉴 데이터로 먼저 검증**한다(없는 메뉴·온도·옵션·한도 9잔 초과는 거절).
2. 서버가 키오스크에 `action`을 보내고 **5초 안에 `actionResult`(실제 장바구니)를 기다린다**.
3. 키오스크 어댑터가 v6와 같은 규칙으로 한 번 더 검증한 뒤 `S.items`에 반영하고, 그 결과(품목·수량·합계)를 돌려준다.
4. AI는 그 실제 결과를 받은 뒤에만 말한다 → AI가 말한 내용 = 화면 장바구니. 터치로 바꾼 장바구니도 같은 `S.items`다.
5. 주문 취소는 AI가 지우지 않고 v6의 "담은 메뉴를 모두 삭제할까요?" 확인 창을 띄운다(고객이 화면에서 직접 누름).
6. 결제·쿠폰·적립은 음성으로 실행하지 않는다. 주문 확인 화면부터 마이크를 끈다(v6 기존 규칙). 쿠폰 기능은 추가하지 않았다.

### v6에 맞춘 점 (디자인은 건드리지 않음)
- **음성 패널**: 기존 패널 그대로, 연결되면 모의 입력 버튼 대신 "말 대신 입력" 줄이 보인다. 연결 실패·키 없음·음성 끔이면 **기존 모의 입력 버튼이 그대로 나와 발표에서 터치 시연을 이어갈 수 있다.**
- **메뉴 찾기·추천**: v6에는 검색 화면이 없다. AI는 메뉴 데이터에서 찾은 결과를 말로 안내하고, 화면은 해당 분류 목록으로 이동한다(`screenCount`는 실제 카드 수). 맛 태그·HOT/ICE 하위 필터는 v6에 없어 쓰지 않는다.
- **언어**: v6 화면은 한국어만 지원하고 언어 버튼은 "준비 중"이다. AI는 한·영·중·일로 대화하지만 화면 글자는 한국어로 유지된다(1차 통합의 화면 다국어 UI는 레거시 화면에만 있어 옮기지 않았다).
- **수량 한도**: v6의 줄당 최대 9잔을 따른다. 초과 요청은 담지 않고 AI가 이유를 말한다.
- **주문 방식(매장/포장)**: v6는 주문 확인 단계에서 터치로 고르므로 AI는 설정하지 않고 화면에서 고르도록 안내한다.

## Render 배포에 필요한 것 (설정은 바꾸지 않았다 — 안내만)

**기존 사이트에서 AI가 동작하지 않던 이유:** Render가 배포하던 `experiment/ai-poc`에는 Gemini Live 코드(`ws`, `@google/genai`, `/api/live`)가 없고, 설치할 패키지도, API 키 환경변수도 없었다. 이 브랜치를 배포해야 동작한다.

| 항목 | 값 |
|---|---|
| 배포 브랜치 | `integration/final-ai` (배포 전 테스트용) |
| Build Command | `npm install` |
| Start Command | `npm start` (`node server.js`) |
| Node | 20 이상 |
| 필수 환경변수 | `GEMINI_API_KEY` — **서버에만** 저장. 브라우저로 나가지 않는다 |
| 선택 환경변수 | `GEMINI_LIVE_MODEL`, `GEMINI_LIVE_VOICE`, `LIVE_ENABLED`(`false`면 음성 끔), `LIVE_ALLOWED_ORIGINS`, `LIVE_MAX_SESSIONS`, `LIVE_MAX_PER_IP`, `LIVE_SESSIONS_PER_HOUR`, `LIVE_MAX_SECONDS`, `LIVE_IDLE_SECONDS` |
| 접속 | HTTPS 필수(마이크 권한). Render는 HTTPS/WSS를 기본 제공 |
| 확인 | 배포 후 `GET /api/live/health` → `keyConfigured: true`, `modelStatus.supportsLive: true` |

`.env.example`에는 이름만 있고 값은 비어 있다. 키를 저장소에 넣지 않는다.

## 테스트
- 서버: `npm test` — 82개 (1차 69개 재사용 + v6 메뉴 목록 10개 + 첫 안내·진단 3개, 가짜 Gemini Live).
- 브라우저: `node scripts/e2e-v6.cjs <저장소 폴더> <스크린샷 폴더>` — v6 화면 33개 (가짜 Live + 가짜 마이크, Playwright 필요).
- **실제 Gemini 응답 품질, 실제 마이크·스피커, 실제 Render 환경은 검증하지 못했다.**

## 알려진 한계 · 후속
- 메뉴 가격 불일치 보고: [ai-menu-price-comparison.md](ai-menu-price-comparison.md). 어느 값도 수정하지 않았다.
- 시스템 지침이 약 31,000자(메뉴 192개)다. 실제 응답 속도·비용은 키로 확인해야 하고, 느리면 설명·영문명을 줄일 수 있다.
- 음성으로 열린 옵션 화면에서는 v6의 터치 규칙(온도 필수 등)이 그대로 적용된다.

## 음성이 안 들릴 때 (Render에서 구분하는 법)
서버는 세션이 끝날 때 **카운터만** 로그에 남긴다(대화·메뉴 내용은 기록하지 않음). 브라우저 콘솔에는 `[live] diag`가 한 줄 남고, 콘솔에서 `UXLive.diag()`로도 볼 수 있다.

```
[live] first audio from Gemini after 840ms (mime=audio/pcm;rate=24000)
[live] session end reason=... micChunksFromBrowser=.. textFromBrowser=.. initPrompt=true audioChunksFromGemini=.. firstAudioMs=.. outTranscripts=.. toolCalls=..
```

| 서버 로그 | 브라우저 `diag` | 의미 |
|---|---|---|
| `audioChunksFromGemini=0`, `outTranscripts=0` | — | Gemini가 응답하지 않음: 모델 이름·키 권한·쿼터 문제(`/api/live/health`의 `modelStatus`, 로그의 `[live] error code=`) |
| `audioChunksFromGemini=0`, `outTranscripts>0` | — | 글자 응답만 오고 오디오가 없음: 선택한 모델/음성 설정이 오디오 출력을 지원하는지 확인 |
| `audioChunksFromGemini>0` | `audioIn=0` | 서버→브라우저 전달 문제(프록시·WebSocket) |
| `audioChunksFromGemini>0` | `audioIn>0`, `outState` ≠ `running` | 브라우저가 소리 재생을 막음(자동재생 정책·탭 음소거). 음성 시작 버튼을 누른 직후 생성되는 컨텍스트라 보통은 `running` |
| `audioChunksFromGemini>0` | `audioIn>0`, `ended>0`, `running` | 재생은 정상. 기기 볼륨·출력 장치 확인 |
| `initPrompt=false` | — | 배포 코드가 `fe78a12` 이전(첫 안내 없음). 고객이 말하기 전에는 AI가 조용한 것이 정상 |
