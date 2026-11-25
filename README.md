# UXPRESSO — 메가MGC커피 키오스크 UX/UI 개선 (비공식 프로토타입)

```bash
npm start     # http://localhost:3000   (?debug=1 → 터치수·시간·도움 횟수 표시, UT 기록용)
```

- `/` 키오스크 프로토타입 (1080×1920 세로 화면을 뷰포트에 맞춰 스케일)
- `/kit.html` UXPRESSO Kiosk UI Kit — 버튼 6종 × 4상태
- `server.js` 자체 메뉴 API: `/api/menus`, `/api/menus/:id`, `/api/categories`, `/api/menus?tags=달콤한,커피`
- `data/menus.json` 테스트 데이터 (가격·설명은 예시). API 실패 시 이 파일로 자동 폴백
- 수령 안내 문구·자동 복귀 시간은 `public/app.js` 상단 `PICKUP_TEXT`, `RETURN_MS`
