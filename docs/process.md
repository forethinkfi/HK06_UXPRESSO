# 제작 과정

UXPRESSO(비공식) 키오스크 프로토타입이 어떤 순서로 만들어졌는지 단계별로 정리했습니다. 날짜는 커밋 기준(2026-11-25 ~ 11-26)이고, 각 단계의 결과물 위치를 함께 적었습니다. 전체 문서 목차는 [index.md](index.md)입니다.

> 본 프로젝트는 메가MGC커피의 공식 프로젝트가 아닙니다. 메뉴·가격·쿠폰·결제는 모두 테스트 데이터입니다.

## 한눈에 보기

```
1 리서치 → 2 기획 → 3 디자인 시스템 → 4 프로토타입 v1~v5 → 5 시안 v2-I → 6 키오스크 v6 → 7 저장소 정리
```

## 1. 리서치 — 현재 키오스크는 어떤가

- 공개 자료와 매장 영상으로 AS-IS 주문 플로우를 재구성했습니다 (정면 28화면, 일반모드 8화면).
- 화면마다 유지·개선할 점을 UI Audit 표로 정리했습니다.
- 모바일 앱 레퍼런스(UIBowl)를 모아 디자인 방향의 근거로 삼았습니다.

결과물: [as-is-analysis.md](as-is-analysis.md) · [research/](research/README.md) · [research/uibowl-references.md](research/uibowl-references.md)

## 2. 기획 — 무엇을 만들 것인가

- PRD Ver. 2.0으로 문제 정의와 요구사항을 정했습니다.
- PRD v3.0에서 음성 주문(선택 기능)과 세션 정책(미사용 120초 → 60초 안내)을 추가했습니다.
- 자연어 검색·AI 질의응답은 범위에서 제외하고, 허용된 의도만 기존 화면으로 연결하기로 했습니다.

결과물: [prd.md](prd.md) → [prd-v3.0.md](prd-v3.0.md) · [prd-v3-summary.md](prd-v3-summary.md)(구현 매핑) · [requirements.md](requirements.md)

## 3. 디자인 시스템 — 어떤 규칙으로 만들 것인가

- 1차(키오스크 화면 기준) UI Kit을 만들었다가, 모바일 앱 레퍼런스 기반 2차로 대체했습니다.
- 2차에서 색상·선택 상태·타이포 스케일·터치 영역·UX Writing·접근성 기준을 정하고 토큰(`tokens.json`/`tokens.css`)으로 만들었습니다.
- 팀이 제공한 Design System v1.0(음성·세션 중심), v2.0(브랜드 중심) 원문을 함께 보관합니다.

결과물: [design-system/](design-system/README.md) · [artboard/](artboard/README.md)(Claude Design 아트보드 백업) · 이전 버전 [archive/](archive/design-system-v0-kit.md)

## 4. 프로토타입 — 주문 흐름 구현 (`public/app.js`)

1. 주문 방식 선택 → 메뉴 → 옵션 → 장바구니 → 결제 → 완료의 기본 흐름과 메뉴 API
2. 쿠폰 미리 확인, 결제 수단 선택, 오류 복구, 승인 확인 중 상태
3. AS-IS 패턴과 2차 토큰 적용, 시안 보드(`/screens.html`)와 UI Kit(`/kit.html`)
4. 음성 주문 CTA(모의)·주문 도움·종료 전 안내(PRD v3)
5. 상품 사진(Unsplash 임시)·Lucide 아이콘·진행 단계·540×960 참고 시안 레이아웃

결과물: `public/` · `data/` · `server.js` · [api.md](api.md) · [menu-image-links/](menu-image-links/README.md)

## 5. 시안 v2-I — 새 레이아웃과 모션

- 프로모션·오비트 메인·메뉴 서브카테고리·영수증 발행을 담은 시안을 만들고 메뉴 192개 데이터와 생성 도구를 함께 정리했습니다.

결과물: [artboard/v2-i/](artboard/v2-i/README.md)

## 6. 키오스크 v6 — 시안을 동작하는 화면으로

- v2-I 레이아웃과 모션을 코드로 옮겼습니다.
- 결제 화면(브랜드 로고 포함)과 상품 상세(히어로 + 옵션 시트)를 다시 짜고, 우선순위별 UI 점검 이슈를 고쳤습니다.
- 루트 주소(`/`)가 v6로 열립니다. 이전 프로토타입은 `/index.html`에 남아 있습니다.

결과물: `public/v6/`

## 7. 저장소 정리

- 루트와 `docs/`에 똑같이 올라온 PRD v3.0·디자인 시스템 v2 사본을 하나로 합쳤습니다.
- 흩어진 목차를 `docs/index.md` 하나로 모으고, 대체된 1차 UI Kit은 `docs/archive/`로 옮겼습니다.
- 규칙: [../CONTRIBUTING.md](../CONTRIBUTING.md)

## 아직 하지 않은 것

사용성 테스트(시나리오·결과), 매장 직접 관찰로 UI Audit 보완, 발표 자료, 8개 대분류·상단 AD·언어/접근성 설정. 자세한 구현 상태는 [index.md](index.md)의 "구현 상태" 표에 있습니다.
