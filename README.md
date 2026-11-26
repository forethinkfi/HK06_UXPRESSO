# UXPRESSO — 메가MGC커피 키오스크 UX/UI 개선

> 고민하는 시간을 줄이고, 선택의 확신을 높이다.
> 주문을 서두르게 만드는 키오스크가 아니라, 짧은 시간 안에도 만족스러운 선택을 할 수 있도록 돕는 키오스크.

피크타임 대기열 속 고객의 **심리적·인지적 부담**을 줄이기 위한 세로형(1080×1920) 키오스크 인터랙티브 프로토타입입니다.
메가MGC커피의 공식 프로젝트가 아닌 **비공식 UX/UI 개선 프로젝트**이며, 메뉴 이름·설명·영양·알레르기는 메가MGC커피 홈페이지(2026-11-26 확인) 자료이고, 가격·옵션·쿠폰·결제는 테스트 데이터입니다.

팀: **UXPRESSO**

> **`mega-ver.2` 브랜치**: [디자인 시스템 v6](docs/design-system/uxpresso-design-system-v6.md)과 [현재 적용 규칙](docs/design-system/uxpresso-selection-refinement.md)으로 새로 만든 화면입니다. 이전 화면은 `main` 브랜치에 있습니다. 메뉴 사진은 [ImageKit 링크](docs/menu-image-links/README.md)를 씁니다.

## 실행

```bash
npm start     # http://localhost:3000
```

Node.js 18 이상이면 되고, 설치할 패키지는 없습니다.

## 디자인 전략

- **SEE** 한눈에 발견하다 — 주요 메뉴, 카테고리, 이미지 중심 메뉴 카드
- **UNDERSTAND** 직관적으로 이해하다 — 행동·결과가 보이는 버튼 문구, 쉬운 옵션 설명
- **DECIDE** 확신을 가지고 선택하다 — 언제든 수정 가능, 주문 확인 전 전체 내역 제공

## API

자체 테스트 API이며 메가MGC커피의 공식 API가 아닙니다.

| Method | Endpoint | 설명 |
|---|---|---|
| GET | `/api/menus` | 전체 메뉴 |
| GET | `/api/menus?tags=달콤한,커피` | 태그 조건을 모두 만족하는 메뉴 |
| GET | `/api/menus/:id` | 메뉴 상세 (옵션·옵션별 추가 금액 포함) |
| GET | `/api/categories` | 카테고리 |

쿠폰·결제 모의 API (실제 쿠폰·결제 시스템과 연결되지 않음):

| Method | Endpoint | 설명 |
|---|---|---|
| GET | `/api/coupons` | 쿠폰 종류(사용 조건·방법·키오스크 사용 가능 여부·제한 사유·대체 방법) |
| POST | `/api/coupons/apply` | `{code, items?}` 쿠폰 확인·적용. `ok` / `unusable` / `unknown`. `items`가 없으면 사용 가능 여부만 확인 |
| GET | `/api/payment-methods` | 결제 수단(지원 여부·사용 방법·불가 사유) |
| POST | `/api/pay` | `{method, amount, key, attempt}` 모의 결제. `approved` / `pending` / `failed`. 같은 `key`는 중복 결제되지 않음 |
| GET | `/api/pay/:txId` | 승인 확인 중 결제의 상태 조회 |

테스트용 쿠폰 번호: `WELCOME10`(10%·5,000원 이상), `DRINK1000`(1,000원·3,000원 이상), `FREEAMERICANO`(교환권), `GIFT5000`(금액권), `APP-ONLY`(앱 전용 → 불가), `OLD2024`(만료 → 불가), 그 외 번호(확인 불가 → 직원 확인).
결제 시나리오: 신용·체크카드 = 즉시 승인, 카카오페이 = 승인 확인 중(약 3초 뒤 승인), 네이버페이 = 첫 시도 실패 후 재시도 승인, 그 밖의 간편결제·상품권 = 즉시 승인(모의), 현금 = 사용 불가.

API 호출이 실패하면 `data/menus.json` 기본 데이터로 자동 전환되어 주문을 이어갈 수 있습니다.
영양·알레르기 정보는 홈페이지에 있는 값만 상품 화면에 보여 주고, 없는 값은 지어내지 않습니다.

## 문서

[`docs/index.md`](docs/index.md)에서 PRD v3.0, 요구사항, API 문서, 리서치를 볼 수 있습니다. 작업 가이드는 [`CLAUDE.md`](CLAUDE.md), 자료를 올리는 위치는 [`CONTRIBUTING.md`](CONTRIBUTING.md)를 보세요. 디자인 시안은 [Figma 파일](https://www.figma.com/design/RPhFB3P8rftlJ1k0E9QmA7/UXPRESSO--%EC%9C%A0%EC%97%91%EC%8A%A4%ED%94%84%EB%A0%88%EC%86%8C-%ED%8C%80---%EC%B9%B4%ED%8E%98-%ED%82%A4%EC%98%A4%EC%8A%A4%ED%81%AC-%EA%B0%9C%EC%84%A0?node-id=0-1)에서 볼 수 있습니다.

## 구조

```
server.js          정적 파일(public/) + 메뉴·쿠폰·모의 결제 API (의존성 없음)
data/              테스트 데이터 (menus, coupons, payments)
public/            키오스크 화면 (디자인 시스템 v6)
test.cjs           음성 의도 분류 확인 (node test.cjs)
docs/              PRD·요구사항·API 문서, 리서치, 회의록, 발표 자료
```

저장소: https://github.com/forethinkfi/HK06_UXPRESSO
