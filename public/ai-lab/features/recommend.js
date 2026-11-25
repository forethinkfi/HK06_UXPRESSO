// Feature "추천" — designed, not built yet (PHASE 5). Same contract as features/order.js.
import { soonCard } from '../core.js';

export default {
  id: 'recommend',
  label: '추천',
  title: '메뉴 추천',
  soon: true,
  mount({ kiosk }) {
    kiosk.append(soonCard('메뉴 추천·비교', 'PHASE 5', [
      '“달달한 거 추천해 줘”, “3,000원 이하 커피”, “카페라떼랑 비슷한 음료”를 POST /api/ai/recommend로 분석해요.',
      '추천은 메뉴 데이터 안에서만, 최대 3개까지 고르고 추천 이유를 보여줘요. 없는 메뉴·가격은 만들지 않아요.',
      '가격·취향 조건은 서버가 메뉴 데이터로 다시 확인해요. 조건에 맞는 메뉴가 없으면 다른 조건을 제안해요.',
      '영양·알레르기 정보는 데이터가 없으면 “확인할 수 없어요”라고 안내해요.',
      '추천 카드에서 바로 옵션을 고르고 장바구니에 담을 수 있게 「주문」 탭의 확인·담기 흐름을 재사용해요.',
    ]));
  },
};
