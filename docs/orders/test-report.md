# 주문 저장 테스트 결과 (2026-11-26)

**실제 Supabase 프로젝트에는 연결하지 않았습니다.** 아래는 모의 서버와 로컬 PostgreSQL 16에서 확인한 결과입니다. 실제 연결은 `npm run smoke:supabase -- --confirm`으로 직접 확인해야 합니다(README 참고).

| 구분 | 대상 | 방법 | 결과 |
|---|---|---|---|
| 빌드 | `npm run build` | `node --check` (서버·lib·화면 스크립트) | 통과 |
| 기존 음성 서버 | `scripts/live-test.mjs` | 가짜 Gemini | 69 통과 / 0 실패 |
| 주문 저장 API | `scripts/orders-test.mjs` | 가짜 Supabase(`scripts/fake-supabase.mjs`) + 서버 실행 | 45 통과 / 0 실패 |
| 브라우저 주문 | `scripts/e2e-orders-browser.cjs` | Playwright + 가짜 Supabase | 15 통과 / 0 실패 |
| 기존 음성 브라우저 | `scripts/e2e-browser.cjs` | Playwright + 가짜 Gemini | 32 통과 / 0 실패 (※) |
| SQL 함수·권한 | `supabase/tests/rpc_checks.sql` | 로컬 PostgreSQL 16, Supabase와 같은 역할(anon·authenticated·service_role) 생성 | 아래 참고 |
| 실제 Supabase | `scripts/supabase-smoke.mjs` | — | **실행하지 않음** |

※ 같은 포트를 쓰는 e2e 두 개를 동시에 돌렸을 때 1건이 실패했습니다. 하나씩 실행하면 32건 모두 통과합니다.

## 확인한 시나리오

- **일반(터치) 주문**: 저장 후 `A-001` 표시, `order_channel=touch`, 세션 UUID와 결제 키 저장, 다음 주문은 새 세션 UUID
- **음성 주문**: AI 도구 호출로 담은 주문 → `voice`, 포장 → `takeout`
- **혼합 주문**: 음성으로 담고 터치로 수량 변경 → `mixed`
- **복수 메뉴·옵션**: 2줄 저장, 옵션 스냅샷(그룹명·선택지명·추가 가격), 화면 합계 = 저장 `total_price`
- **서버 재계산**: 브라우저 금액 불일치 거절, 끼워 넣은 `price` 무시, 없는 메뉴·수량 범위·온도·옵션·가격 미확인 거절, 쿠폰 할인 서버 계산
- **결제 확인**: 결제 내역 없음, 금액·수단·txId 불일치, 승인 대기(pending) 상태는 저장 거절. 승인 후 저장됨
- **중복 요청**: 같은 `paymentKey` 재요청 → 같은 번호, 1건만 저장. 동시 4건 요청도 1건
- **저장 실패와 재시도**: DB 장애 시 번호·완료 화면을 보여 주지 않고, 장바구니 유지, `/api/pay`는 1회만 호출. 재시도 성공 시 저장 1건
- **새로고침**: 미확정 주문이 같은 키로 자동 재전송되어 1건만 저장
- **환경변수 없음**: `disabled` 응답, 데모 번호와 "저장되지 않았어요" 안내 표시
- **키 보호**: 응답·로그·health에 서비스 키 값 없음. `sb_secret_` 키는 `apikey` 헤더만 전송

## SQL(로컬 PostgreSQL 16) 결과

- 원본 DDL → 마이그레이션 → 마이그레이션 재실행(오류 없음)
- `create_order`: 신규 저장(`duplicate=false`), 같은 키 재호출(`duplicate=true`, 같은 번호), 합계 불일치는 `order_total_mismatch`로 거절
- 항목 삽입 중 오류(`menu_name` null)가 나면 `orders` 행도 함께 롤백(주문 1건·항목 2건 그대로)
- 같은 키 동시 6건 호출 → 주문 1건, 항목 1줄
- `anon`·`authenticated`: `create_order`, `kitchen_order_json`, `orders`, `kitchen_orders_v` 모두 `permission denied`
- 주방 JSON 함수와 `kitchen_orders_v` 출력 확인
- 알게 된 점: 롤백된 저장도 identity 번호를 하나 소모합니다(번호 gap). 설계 문서에 적었습니다.

## 하지 않은 것

- 실제 Supabase 연결, Render 배포 환경 확인
- 실제 Gemini 음성(가짜 Gemini 사용)
- 상용 결제·실제 주방 시스템 연동(범위 밖)
