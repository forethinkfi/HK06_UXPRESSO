# UXPRESSO — 메가MGC커피 키오스크 UX/UI 개선 (비공식 프로토타입)

```bash
npm start            # http://localhost:3000  (?debug=1 → 터치수·시간·도움 횟수 표시, UT 기록용)
OPENAI_API_KEY=sk-... npm start   # 선택: 자연어 검색·Q&A에 OpenAI 사용 (없으면 키워드 검색 폴백)
```

- `server.js` 메뉴 API(`/api/menus`, `/api/menus/:id`, `/api/categories`, `?tags=`) + `/api/search`, `/api/ask`
- `data/menus.json` 테스트 데이터 (가격·설명은 예시, 영양·알레르기는 "확인되지 않음")
- `public/` 키오스크 UI (1080×1920 세로 화면을 뷰포트에 맞춰 스케일)
