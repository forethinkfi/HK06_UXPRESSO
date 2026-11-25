# 메뉴 이미지 링크

시안·프로토타입에서 쓰는 메가MGC커피 메뉴 이미지의 **링크 목록**입니다. 이미지 파일은 저장소에 없고, ImageKit에 올려 둔 주소만 정리했습니다.

> 본 프로젝트는 메가MGC커피의 공식 프로젝트가 아닙니다. 이미지·메뉴 이름·영양 정보는 메가MGC커피 홈페이지 자료이며, 가격과 옵션은 시연용입니다. 이미지는 이 프로젝트의 시안 작업에만 쓰고, 다른 곳에 공개하거나 다시 올리지 않습니다.

## 파일

| 파일 | 용도 |
|---|---|
| `mega_menu_image_links.csv` | 엑셀·구글 시트용 (UTF-8 BOM) |
| `mega_menu_image_links.json` | 코드용. `base`, `pattern`, `items` 포함 |

항목 237개: 음료 164, 푸드 39, 상품 34. 열: `category, folder, number, name, temp, english_name, file, url`

## 주소 규칙

```
https://ik.imagekit.io/siney0051/메가커피_키오스크_IMG/mega_kiosk/{drink|food|goods}/{종류}_{번호}.webp
```

- 이미지는 400×400 webp입니다. 화면 크기는 CSS로 맞춰 쓰세요.
- 한글 폴더 이름은 주소에서 `%EB%A9%94…`처럼 인코딩되어 있습니다. CSV·JSON의 `url`을 그대로 쓰면 됩니다.
- 번호는 대분류 안에서의 순서이고, 같은 메뉴의 HOT·ICE는 번호가 따로입니다.
- 인터넷 연결이 필요합니다. ImageKit 쪽 파일이 지워지면 이미지가 보이지 않습니다.
