# 테스트와 검증

> 비공식 프로토타입입니다. 아래 결과는 모두 테스트 데이터 기준입니다.

## 결과 (2026-11-26, 저장소 정리 브랜치 `chore/repository-cleanup`)

정리 전 `main`(`4d5d24b`)과 정리 후 브랜치에서 같은 테스트를 돌려 비교했습니다. 정리 작업은 서비스 코드(`server.js`, `lib/`, `public/`, `data/`, `scripts/`, `package*.json`)를 바꾸지 않았습니다(`git diff` 결과 없음).

| 구분 | 테스트 | 명령 | 정리 전 `main` | 정리 후 | 실제/모의 |
|---|---|---|---|---|---|
| 문법 | 서버·음성·v6 스크립트 문법 검사 | `npm run build` | 통과 | 통과 | — |
| 서버 | 음성 주문 서버(도구 검증, 접속 보호, 오류 코드, 메뉴 목록) | `npm test` | 85 통과 / 0 실패 | 85 통과 / 0 실패 | **모의** (가짜 Gemini Live) |
| 브라우저 | v6 화면 E2E(음성 담기·취소·목록, 오류 안내, 마이크 거부, 크레딧 소진, 터치만으로 주문 완료) | `node scripts/e2e-v6.cjs . <스크린샷 폴더>` | 37 통과 / 0 실패 | 37 통과 / 0 실패 | **모의** (가짜 Live + 가짜 마이크) |
| 경로 | `/`→v6 이동, v6·초기 프로토타입 파일, `/data/*`, 메뉴·결제·쿠폰 API, `/api/live/health` (23개) | 로컬 서버에 `curl` | — | 모두 정상 (302/200) | 로컬 |
| 결제 | 같은 `key`로 두 번 결제 요청 → 같은 거래 번호 | `POST /api/pay` 두 번 | — | 중복 결제 없음 | 모의 결제 |
| 배포 | `https://hk06-uxpresso.onrender.com/api/live/health` | `curl` | 응답 정상, `keyConfigured: true`, `supportsLive: true` | (정리 브랜치는 배포하지 않음) | **실제 사이트** — 상태 확인만, 음성 대화는 하지 않음 |

## 확인하지 못한 것

- 실제 Gemini 응답 품질, 실제 마이크·스피커로 하는 음성 주문
- 실제 Render 환경에서 음성 주문 전체 흐름
- 사용성 테스트(시나리오·참가자 기록) — [../research/usability-test/](../research/usability-test/README.md) 미작성
- 이 환경에서는 메뉴 이미지 호스트(ImageKit)에 접속할 수 없어, 화면 캡처에 상품 사진이 나오지 않았습니다. 사진 확인은 브라우저에서 직접 해 주세요.

## 배포 사이트 버전 (2026-11-26 확인)

배포 사이트의 `v6/app.js`·`v6/index.html`·`v6/live-adapter.js`·`live-client.js`는 커밋 `2b1a500`("Add Gemini Live voice ordering to the final v6 design")과 같습니다. `main`의 최신 코드보다 코드 커밋 두 개가 뒤처진 상태입니다. 아직 반영되지 않은 커밋은 `ea701d6`(모의 음성 칩 숨김, 크레딧 소진 안내)와 `942b752`(음성 패널 텍스트 입력 제거)입니다. Render의 배포 브랜치와 자동 배포 설정은 Render 대시보드에서 확인해야 합니다.

## 실행 방법

```bash
npm install
```

```bash
npm test
```

브라우저 E2E는 Playwright가 필요합니다(프로젝트 의존성 아님).

```bash
node scripts/e2e-v6.cjs . /tmp/e2e-shots
```
