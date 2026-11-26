# 자체 테스트 API

프로젝트 자체 API이며 메가MGC커피의 공식 API·쿠폰·결제 시스템과 무관합니다. 모든 응답은 JSON입니다. 서버: `server.js`, 데이터: `data/`.

## 메뉴
| Method | Endpoint | 설명 |
|---|---|---|
| GET | `/api/menus` | 전체 메뉴 |
| GET | `/api/menus?tags=달콤한,커피` | 태그를 모두 만족하는 메뉴 |
| GET | `/api/menus/:id` | 메뉴 상세(온도, 옵션, 옵션별 추가 금액) |
| GET | `/api/categories` | 카테고리 |

메뉴 필드: `id, name, category, price, image_url, description, summary, tags, temperature, options, nutrition, allergens, available, source`. 영양·알레르기는 확인된 정보가 없어 `null`이며 화면에 "확인되지 않았어요"로 표시합니다.
프런트는 API 실패 시 `/data/menus.json`으로 폴백합니다.

## 쿠폰
| Method | Endpoint | 설명 |
|---|---|---|
| GET | `/api/coupons` | 쿠폰 종류(조건·사용 방법·키오스크 사용 가능 여부·불가 사유·대체 방법) |
| POST | `/api/coupons/apply` | `{code, items?}` → `{status: ok｜unusable｜unknown, ...}` |

`items`(`[{menuId, qty, opts}]`)를 보내면 장바구니 기준으로 할인액을 계산하고, 보내지 않으면 사용 가능 여부만 확인합니다. 가격은 서버가 메뉴 데이터로 다시 계산합니다.

| 번호 | 종류 | 결과 |
|---|---|---|
| `WELCOME10` | 10% 할인 (최대 3,000원, 5,000원 이상) | 조건 미달 시 `unusable` + 부족 금액 안내 |
| `DRINK1000` | 1,000원 할인 (3,000원 이상) | 조건 미달 시 `unusable` |
| `FREEAMERICANO` | 아메리카노 교환권 | 장바구니에 없으면 `unusable` |
| `GIFT5000` | 5,000원 금액권 | 결제 금액까지 차감 |
| `APP-ONLY` | 앱 전용 | `unusable` + 대체 방법 |
| `OLD2024` | 만료 | `unusable` |
| 그 외 | — | `unknown` → 직원 확인 안내 |

## 결제 (모의)
| Method | Endpoint | 설명 |
|---|---|---|
| GET | `/api/payment-methods` | 결제 수단(지원 여부, 사용 방법, 불가 사유) |
| POST | `/api/pay` | `{method, amount, key, attempt}` → `approved ｜ pending ｜ failed` |
| GET | `/api/pay/:txId` | `pending` 결제의 현재 상태 |

- **중복 결제 방지** 같은 `key`로 다시 요청하면 새로 결제하지 않고 기존 결과를 돌려줍니다. 실패 결과는 저장하지 않아 같은 `key`로 재시도할 수 있습니다.
- **시나리오** `card` 즉시 승인 · `kakao` 승인 확인 중(약 3초 뒤 승인) · `naver` 첫 시도 실패 후 재시도 승인 · 그 밖의 간편결제·상품권 수단은 즉시 승인(모의) · `cash` 사용 불가 (삼성페이는 `card` 타일 이름에 합침). 혜택 멤버십은 `benefits` 목록으로만 표시되고 할인은 적용되지 않음
- 서버 재시작 시 결제 기록은 초기화됩니다(메모리 저장).
