# AI 음성 주문 통합 (integration/v2-ai-test)

> **비공식 프로토타입.** 메가MGC커피 공식 프로젝트·API가 아니며, 메뉴·가격은 테스트 데이터다.
> 이 브랜치는 Google AI Studio의 Gemini Live 음성 주문 코드를 팀의 V2 디자인(`docs/v2-i-artboard`) 위에 옮긴 **테스트용 통합본**이다. `main`에는 합치지 않았다.

## 구조 (AI 코드와 UI 코드 분리)

| 파일 | 역할 | 최종 디자인 적용 시 |
|---|---|---|
| `lib/live-kiosk.js` | Gemini Live 연결, 시스템 지침, 도구 10개, 메뉴 검증 | 그대로 둠 |
| `lib/live-guard.js` | `/api/live` 보호(Origin·동시 접속·시간당·시간 제한) | 그대로 둠 |
| `server.js` | 정적 호스팅 + 기존 API + WebSocket `/api/live` + `/api/live/health` | 그대로 둠 |
| `public/live-client.js` | 브라우저 엔진(마이크 16kHz, 재생 24kHz, WS). 화면·장바구니를 모른다 | 그대로 둠 |
| `public/app.js`의 "live" 어댑터 | `applyLiveAction`, `liveCart`, `liveContext` 등 — 엔진 이벤트를 화면·`S.cart`에 연결 | **새 디자인에서 이 부분만 다시 연결** |
| `public/i18n.js` | ko/en/zh/ja 문구(`UI()`, `mName`) | 문구 키 유지 |
| `data/menus.json` | 128개 메뉴(AI Studio 데이터 + 팀 사진 링크) | 서버·키오스크·AI 공통 |

### 음성과 터치가 같은 장바구니를 쓰는 방식
1. AI가 도구(`add_to_cart` 등)를 부르면 **서버가 `data/menus.json`으로 먼저 검증**한다(없는 메뉴·온도·옵션·수량 20 초과는 거절).
2. 서버가 키오스크에 `action`을 보내고 **5초 안에 `actionResult`(실제 장바구니 스냅샷)를 기다린다**.
3. AI는 그 실제 결과를 받은 뒤에만 말한다 → AI가 말한 내용 = 화면 장바구니.
4. 터치로 바꾼 장바구니도 같은 `S.cart`이므로 다음 음성 응답에 반영된다.
5. 주문 취소는 AI가 지우지 않고 **키오스크의 확인 창을 띄운다**(고객이 화면에서 직접 누름). 결제·쿠폰은 음성으로 실행하지 않는다. 쿠폰 기능은 추가하지 않았다.
6. 가격이 없는 메뉴(`price: null`)는 임의로 채우지 않고 담기는 되지만 결제를 막는다(`hasUnpricedCart`).

## Render 배포에 필요한 것 (설정은 바꾸지 않았다 — 안내만)

**기존 사이트에서 AI가 동작하지 않던 이유:** Render가 배포하던 `experiment/ai-poc`에는 Gemini Live 코드(`ws`, `@google/genai`, `/api/live`)가 없고, 의존성이 없는 서버라 `npm install`로 받을 패키지도, API 키 환경변수도 없었다. 이 브랜치를 배포해야 동작한다.

| 항목 | 값 |
|---|---|
| Build Command | `npm install` (`npm run build`는 문법 검사만) |
| Start Command | `npm start` (`node server.js`) |
| Node | 20 이상 (`engines`) |
| 필수 환경변수 | `GEMINI_API_KEY` — **서버에만** 저장. 브라우저로 나가지 않는다 |
| 선택 환경변수 | `GEMINI_LIVE_MODEL`, `GEMINI_LIVE_VOICE`, `LIVE_ENABLED`(`false`면 음성 끔), `LIVE_ALLOWED_ORIGINS`, `LIVE_MAX_SESSIONS`, `LIVE_MAX_PER_IP`, `LIVE_SESSIONS_PER_HOUR`, `LIVE_MAX_SECONDS`, `LIVE_IDLE_SECONDS` |
| 접속 | HTTPS 필수(마이크 권한). Render는 HTTPS/WSS를 기본 제공하므로 별도 설정 없음 |
| 확인 | 배포 후 `GET /api/live/health` → `keyConfigured: true` |

`.env.example`에 이름만 있고 값은 비어 있다. 키를 저장소에 넣지 않는다.

## 테스트 결과 요약

- 서버 69개 점검(`npm test`) · 브라우저 E2E 32개(`scripts/e2e-browser.cjs`) 통과 — **가짜 Gemini Live(`scripts/fake-live.mjs`)와 가짜 마이크**로 한 결과다.
- **실제 Gemini API 응답 품질, 실제 마이크·스피커, 실제 Render 환경은 검증하지 못했다.**
- 디자인 회귀: 팀 V2와 픽셀 비교 시 의도한 화면(도움말 음성 문구, 언어 선택 창, 음성 상태 화면)만 다르다.

## 알려진 한계 · 후속
- AI Studio 데이터 기준으로 원래 16개 메뉴 중 일부 가격이 달라졌다(원본 데이터 확인 필요).
- 다국어 메뉴명 번역은 기존 16개 id만 있고, 나머지 메뉴는 한국어 이름으로 표시된다.
- 실제 Gemini 키로 한국어·외국어 음성 인식 정확도, 끼어들기(barge-in), 소음 환경을 현장 점검해야 한다.
- 오류 화면의 "마이크 켜짐" 보조 라벨은 연결 실패 때도 남는다(디자인 확정 시 정리).
