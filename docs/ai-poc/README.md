# AI Lab / Gemini API PoC

음성 주문과 메뉴 추천을 **실제 API로 검증**하는 실험입니다. 최종 제품 개발이 아니고, 기존 키오스크 흐름은 바꾸지 않습니다. 실험 브랜치 `experiment/ai-poc`에서만 진행하며 `main`에는 병합하지 않습니다.

> 비공식 프로젝트입니다. 메뉴·가격은 테스트 데이터입니다.

## 브랜치와 배포

| 항목 | 내용 |
|---|---|
| 실험 브랜치 | `experiment/ai-poc` (`main` `cd99fe8`에서 분기) |
| 배포 | 기존 Render 서비스 `https://hk06-uxpresso.onrender.com/`의 배포 브랜치를 `experiment/ai-poc`으로 변경 (새 서비스 생성 안 함) |
| 규칙 | `main`에 직접 커밋·병합하지 않음. 기존 팀 파일·디자인 시스템 삭제 금지 |

### Render 설정 방법 (직접 설정 필요)

1. Render 대시보드 → 해당 Web Service → **Settings → Build & Deploy → Branch**를 `experiment/ai-poc`으로 변경
2. **Auto-Deploy**가 `On Commit`인지 확인
3. **Environment** 탭에서 환경변수 설정 (값은 Render 화면에만 입력)
   - `GEMINI_API_KEY` — 필수. 코드는 이 이름을 읽습니다. `GOOGLE_API_KEY`도 대체로 인식합니다.
   - `GEMINI_MODEL` — 선택. 비워 두면 사용 가능한 flash 모델을 자동 선택합니다.
4. **Manual Deploy → Deploy latest commit** 실행 후 Events 탭에서 배포된 커밋이 `experiment/ai-poc`의 최신 커밋인지 확인
5. 무료 플랜은 유휴 시 잠들 수 있어 첫 요청이 느릴 수 있습니다.

### 배포 후 연결 확인

배포가 끝나면 브라우저에서 `https://hk06-uxpresso.onrender.com/api/ai/status`를 엽니다. 서버가 Gemini를 실제로 한 번 호출하고 결과를 JSON으로 보여줍니다 (60초 캐시, 키 값은 포함되지 않음).

| 필드 | 의미 |
|---|---|
| `configured` | `false`면 서버가 `GEMINI_API_KEY`를 읽지 못한 것 (환경변수 이름·저장 여부 확인) |
| `ok` | `true`면 모델 목록 조회와 `generateContent`가 모두 성공하고 JSON 파싱까지 된 것 |
| `model` | 사용된 모델 (`GEMINI_MODEL`이 없으면 자동 선택) |
| `calls[].ms` | Gemini 응답 시간 |
| `error` | 실패 원인 (예: `API key not valid`면 키 오류, `HTTP 429`면 한도 초과) |

### 키 보안

- 키는 서버 환경변수로만 사용합니다. 코드, 클라이언트, 로그, GitHub에 값을 쓰지 않습니다.
- 저장소 전체 이력에서 키 형태의 문자열은 발견되지 않았습니다 (`.env`는 `.gitignore`에 포함).
- 키를 채팅·스크린샷·문서 등에 한 번이라도 붙여 넣은 적이 있다면 Google AI Studio에서 폐기하고 새 키를 발급해 Render 환경변수를 교체하세요.

## 진행 단계

| PHASE | 내용 | 상태 |
|---|---|---|
| 1 | 브랜치 생성, 기존 코드 점검 | 완료 |
| 2 | Gemini 실제 API 연결 검증 (`GET /api/ai/status`, `scripts/gemini-check.mjs`) | 코드 작성·로컬 검증 완료. **실제 키로 호출한 결과는 아직 없음** (Render 배포 후 `/api/ai/status` 확인 필요) |
| 3 | 텍스트 기반 주문 분석 (서버 검증 포함) | 미착수 |
| 4 | 실제 마이크 음성 인식(Web Speech API) 연결 | 미착수 |
| 5 | 자연어 메뉴 추천·비교 | 미착수 |
| 6 | 대화형 주문 수정, 임시 장바구니 | 미착수 |
| 7 | 개발자 테스트 패널, 검증 기록 | 미착수 |
| 8 | Render 배포, 최종 테스트 | 미착수 |

## 기존 코드 점검 결과 (`main` `cd99fe8`)

- `server.js`(99줄)는 의존성 없는 Node 서버입니다. 환경변수는 `PORT`만 읽고, **Gemini 호출 코드는 없습니다.** 배포 설정 파일(`render.yaml` 등)도 없어 Render 설정은 대시보드에서만 확인할 수 있습니다.
- `data/menus.json`: 메뉴 16개(`id`, `name`, `price`, `temperature`, `options`, `tags`, `featured`, `hotExtra`, `summary`). `nutrition`·`allergens`는 전부 `null`이라 영양·알레르기 기반 추천은 "확인할 수 없음"으로 안내해야 합니다. 옵션은 `shot`(+500/+1000원), `syrup`(+500원), `ice`이고, HOT 추가금은 `hotExtra`입니다.
- `public/app.js`에는 음성 주문 **모의 구현**(PRD v3)이 이미 있습니다. 실제 음성 인식 없이 예시 문장 버튼을 누르는 방식이고, 의도는 화이트리스트로 제한하며 메뉴 데이터로 검증합니다. 결제·쿠폰·적립은 음성으로 실행하지 않습니다.
- 프로젝트 지침(`CLAUDE.md`)은 "대화형 챗봇·긴 자연어 입력 UI를 기본 플로우에 넣지 않는다"고 정해 두었습니다. 그래서 AI Lab은 `/ai-test.html` **별도 페이지**로 두고 기존 키오스크 화면은 수정하지 않습니다. 이 실험이 `main`에 합쳐진다면 지침을 먼저 팀이 정해야 합니다.

## 설계 원칙

- Gemini의 출력은 제안일 뿐입니다. 메뉴 ID·온도·옵션·수량은 서버가 `data/menus.json`으로 검증하고, 금액도 서버가 메뉴 데이터로 계산합니다.
- 데이터에 없는 메뉴·가격·옵션·영양 정보를 만들지 않습니다.
- 모의 응답은 실제 API 연결 성공으로 세지 않고, 화면과 로그에 "실제 API / Mock"을 구분해 표시합니다.
- 의존성 추가 없이 공식 REST API를 `fetch`로 호출합니다. 프로젝트의 "의존성 없음" 원칙을 유지하기 위해서이고, SDK(`@google/genai`)가 필요해지면 그때 바꿉니다.
