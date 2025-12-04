# 상품 이미지 업로드 가이드

이 폴더에 스크린샷 이미지 파일을 저장하면 자동으로 상품 이미지로 등록됩니다.

## 사용 방법

1. **이미지 파일 저장**
   - 스크린샷 이미지 파일을 이 폴더(`server/images/`)에 저장하세요
   - 지원 형식: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`

2. **파일명 규칙**
   - 파일명에 상품 키워드를 포함하세요
   - 예시:
     - `screenshot-1.jpg` (첫 번째 상품)
     - `멜빵.jpg` (DAUB 멜빵 팬츠)
     - `dau.jpg` (DAUB 약자)
     - `보쉬.jpg` (라스텔지아 보쉬)
     - `아미-후드.jpg` (아미 후드티)

3. **스크립트 실행**
   ```bash
   cd server
   node scripts/process-screenshot-images.js
   ```

## 상품별 추천 파일명

- `DAUB 여성 멜빵 팬츠 BLACK`: `멜빵.jpg`, `dau.jpg`, `screenshot-1.jpg`
- `라스텔지아 보쉬 BOSH Black`: `보쉬.jpg`, `las.jpg`, `선글라스.jpg`
- `공용 보아 리버시블 점퍼`: `보아.jpg`, `리버시블.jpg`, `점퍼.jpg`
- `HIDE BALL CAP (CHARCOAL)`: `hide.jpg`, `ball-cap.jpg`, `cap.jpg`
- `발로 그로시 숏패딩 2color`: `발로.jpg`, `그로시.jpg`, `숏패딩.jpg`
- `꼼데가르송 하트 패치 울 가디건`: `꼼데.jpg`, `가디건.jpg`
- `맥포스 코브라 벨트`: `맥포스.jpg`, `코브라.jpg`, `벨트.jpg`
- `옐로우삭스 ALPHABET 알파벳`: `옐로우.jpg`, `삭스.jpg`, `양말.jpg`
- `어그 K타즈 체스트넛`: `어그-k.jpg`, `k타즈.jpg`
- `어그 W 타즈 2슬리퍼 블랙`: `어그-w.jpg`, `w타즈.jpg`
- `쉐입오브디오션 MS Pearl gloss ring`: `쉐입.jpg`, `ring.jpg`, `반지.jpg`
- `레츠고 나일론 캠프캡 스위밍`: `레츠고.jpg`, `캠프캡.jpg`
- `1st. ECWCS Parka Smoky Brown`: `ecwcs.jpg`, `parka.jpg`
- `뉴베리니팅 사슴가죽 글로밋장갑`: `뉴베리.jpg`, `장갑.jpg`
- `N-SNOW/COCOA`: `n-snow.jpg`, `cocoa.jpg`
- `TIC TACC-307 (p)/BLACK`: `tic.jpg`, `tacc.jpg`
- `Grandma Fairisle Sweater Navy`: `grandma.jpg`, `fairisle.jpg`
- `와이드 데님팬츠 light blue`: `와이드.jpg`, `데님.jpg`
- `안느백 (Anne Bag)`: `안느.jpg`, `백.jpg`, `가방.jpg`
- `아미 남여공용 스몰 하트 로고 패치 후드티셔츠`: `아미.jpg`, `후드.jpg`

## 주의사항

- 파일명에 한글, 영문, 숫자 모두 사용 가능합니다
- 대소문자는 구분하지 않습니다
- 여러 키워드를 조합한 파일명도 인식됩니다 (예: `아미-후드티.jpg`)

