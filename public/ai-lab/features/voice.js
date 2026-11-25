// Feature "음성" — designed, not built yet (PHASE 4). Same contract as features/order.js.
import { soonCard } from '../core.js';

export default {
  id: 'voice',
  label: '음성',
  title: '음성으로 주문',
  soon: true,
  mount({ kiosk }) {
    kiosk.append(soonCard('음성 주문', 'PHASE 4', [
      '브라우저 Web Speech API(ko-KR)로 말을 글자로 바꿔요. 마이크 버튼, 인식 중 글자 표시, 수정, 다시 말하기를 넣어요.',
      '바뀐 글자는 「주문」 탭과 같은 POST /api/ai/order로 분석해요. 서버 검증·가격 계산·확인 카드를 그대로 재사용해요.',
      '음성 인식 성공과 주문 분석 성공을 따로 표시해요. 마이크 권한 거부, 미지원 브라우저, 인식 실패도 안내해요.',
      '결제·쿠폰·적립은 음성으로 실행하지 않아요.',
    ]));
  },
};
