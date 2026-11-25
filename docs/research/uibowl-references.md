# UIBowl 레퍼런스 (주문 흐름)

UIBowl(uibowl.io)에서 확인한 국내 카페 앱 화면. 비공식 프로젝트의 참고용이며 화면을 복제하지 않는다. 2026-11-25 조회.

| 참고 화면 | 본 것 | 적용 |
|---|---|---|
| [더벤티 픽업주문 - 준비완료](https://uibowl.io/name/%EB%8D%94%EB%B2%A4%ED%8B%B0?patterns=%EC%A1%B0%ED%9A%8C%ED%95%98%EA%B8%B0&patternName=%ED%94%BD%EC%97%85%EC%A3%BC%EB%AC%B8%20-%20%EC%A4%80%EB%B9%84%EC%99%84%EB%A3%8C) | 3단계 진행 표시 + 큰 주문번호 박스 | 주문 완료 화면에 3단계 진행 표시 추가 (`.steps`) |
| [바나프레소 주문상세](https://uibowl.io/name/%EB%B0%94%EB%82%98%ED%94%84%EB%A0%88%EC%86%8C?patterns=%EC%A1%B0%ED%9A%8C%ED%95%98%EA%B8%B0&patternName=%EC%A3%BC%EB%AC%B8%EC%83%81%EC%84%B8%20-%20%EC%A0%9C%EC%A1%B0%EC%99%84%EB%A3%8C) | 현재 단계 강조, 다음 행동 문구 | 현재 단계는 체크 + 테두리로 표시 (색상만 쓰지 않음) |
| [더벤티 장바구니](https://uibowl.io/name/%EB%8D%94%EB%B2%A4%ED%8B%B0?patterns=%EC%9E%A5%EB%B0%94%EA%B5%AC%EB%8B%88) | 하단 CTA에 금액·개수 표시 | 장바구니 CTA를 "주문 내역 확인 · N개 금액"으로 변경 |

- 진행 단계 중 2·3번은 안내용이다. 이 시안은 실제 제조 상태를 받지 않는다.
