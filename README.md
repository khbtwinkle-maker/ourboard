# OurBoard — Google Sheets + Apps Script 게시판

디자인 시안(`d2ba298f-8487-4da8-88d1-3e84f62d415c.png`)을 기반으로 만든 커뮤니티 게시판입니다.
Google Sheets를 데이터베이스로, Google Apps Script를 백엔드/웹서버로 사용하고, HTML/CSS/JS로 프론트엔드를 구현했습니다.

## 파일 구성

| 파일 | 역할 |
|---|---|
| `Code.gs` | 백엔드 로직 — 시트 CRUD, 웹앱 진입점(`doGet`), API 함수 |
| `Index.html` | 페이지 골격(HTML) |
| `Stylesheet.html` | 전체 스타일(CSS) |
| `JavaScript.html` | 프론트엔드 로직(JS) — `google.script.run`으로 백엔드 호출 |

## 설치 방법 (5분)

1. **새 Google Sheets 문서를 만듭니다.** (sheets.new)
2. 메뉴에서 **확장 프로그램 → Apps Script** 클릭.
3. 기본 생성된 `코드.gs`(또는 `Code.gs`) 내용을 전부 지우고, 이 프로젝트의 `Code.gs` 내용을 붙여넣습니다.
4. 왼쪽 파일 목록의 **+ → HTML** 을 눌러 파일을 3개 추가합니다. 파일명은 반드시 아래와 **정확히** 일치해야 합니다 (확장자 `.html`은 자동으로 붙습니다).
   - `Index` → 이 프로젝트의 `Index.html` 내용 붙여넣기
   - `Stylesheet` → 이 프로젝트의 `Stylesheet.html` 내용 붙여넣기
   - `JavaScript` → 이 프로젝트의 `JavaScript.html` 내용 붙여넣기
5. 상단 툴바의 함수 선택 드롭다운에서 **`initializeSheets`** 를 선택하고 ▶(실행) 버튼을 누릅니다.
   - 처음 실행 시 "승인 필요" 팝업이 뜨면 본인 계정으로 권한을 승인해주세요.
   - 실행이 끝나면 스프레드시트에 `Posts`, `Comments` 시트가 생성되고 샘플 게시글 8개가 들어갑니다.
6. **배포 → 새 배포** 클릭 → 유형에서 톱니바퀴를 눌러 **웹 앱** 선택.
   - 실행 사용자: **나**
   - 액세스 권한: **전체(익명 포함)** 또는 조직 내 전체 (원하는 공개 범위 선택)
   - **배포** 클릭 → 발급된 웹 앱 URL로 접속하면 게시판이 열립니다.
7. 코드를 수정한 뒤에는 **배포 → 배포 관리 → 수정(연필 아이콘) → 새 버전** 으로 다시 배포해야 반영됩니다.

## 주요 기능

- 카테고리별 게시판: 전체/자유게시판/질문과 답변/정보공유/일상 이야기/사진·추억/취미 생활/공지사항 (사이드바에 실시간 글 개수 표시)
- 정렬: 최신순 / 인기순(조회수) / 추천순(좋아요)
- 검색: 상단 히어로 검색창에서 제목+본문 검색
- 글쓰기: 카테고리 선택, 작성자(선택, 미입력시 "익명"), 제목/내용, 이미지 URL(선택)
- 게시글 상세: 조회수 자동 증가, 좋아요, 댓글 작성/목록
- 공지글은 `pinned = TRUE`로 표시하면 목록 최상단에 고정
- 오른쪽 사이드바: 오늘의 인기글 Top5(조회수 기준), 최근 작성 글 Top5
- 페이지네이션 (10개씩)

## 데이터 구조 (직접 시트에서 확인/수정 가능)

**Posts 시트**
`id | category | title | content | author | date | views | likes | commentCount | image | pinned`

**Comments 시트**
`id | postId | author | content | date`

시트에 직접 행을 추가/수정해도 새로고침하면 바로 반영됩니다. `category` 값은 코드의 `CATEGORIES` 배열 key(`free`, `qna`, `info`, `daily`, `photo`, `hobby`, `notice`)와 일치해야 배지 색상이 정상 표시됩니다.

## 커스터마이징 팁

- **색상/톤**: `Stylesheet.html` 상단 `:root` 변수(`--primary`, `--bg` 등)와 카테고리 배지(`.badge-*`) 색상만 바꾸면 전체 톤이 바뀝니다.
- **히어로 배경 사진**: 지금은 이모지(🌼)로 꽃 장식을 흉내냈습니다. 실제 사진을 쓰려면 `.hero`에 `background-image: url('이미지주소')`를 추가하세요.
- **카테고리 추가/변경**: `Code.gs`의 `CATEGORIES` 배열과 `JavaScript.html`의 `CATEGORY_ICON` / `CATEGORY_BADGE_CLASS`, `Stylesheet.html`의 `.badge-*`를 함께 수정하세요.
- **이미지 업로드**: 현재는 URL 입력 방식입니다. 실제 파일 업로드가 필요하면 Google Drive API(`DriveApp`)를 이용해 업로드 후 URL을 저장하는 방식으로 확장할 수 있습니다.

## 이미지 업로드 (Cloudflare R2) 설정

글쓰기 화면에서 이미지 파일을 선택하면 Cloudflare R2에 업로드되고, 그 공개 URL이 게시글에 저장됩니다. 작동하려면 아래를 먼저 준비해야 합니다.

### 1) Cloudflare에서 R2 버킷 만들기
1. [dash.cloudflare.com](https://dash.cloudflare.com) → 왼쪽 메뉴 **R2 Object Storage**
2. **버킷 만들기** → 이름 입력(예: `ourboard-images`) → 생성
3. 버킷 상세 페이지 → **설정(Settings)** 탭 → **공개 액세스(Public access)** → **R2.dev 서브도메인 허용**을 켜서 `https://pub-xxxxxxxx.r2.dev` 같은 공개 URL을 발급받으세요. (이 URL이 아래 `R2_PUBLIC_BASE_URL` 입니다.)

### 2) API 토큰 만들기
1. R2 개요 페이지 → **R2 API 토큰 관리** → **API 토큰 만들기**
2. 권한: **개체 읽기 및 쓰기(Object Read & Write)**, 방금 만든 버킷으로 범위 제한 권장
3. 생성하면 **Access Key ID**, **Secret Access Key**, **계정 ID(Account ID)** 가 표시됩니다 — 이 화면을 벗어나면 Secret Key는 다시 볼 수 없으니 꼭 복사해두세요.

### 3) Apps Script에 자격증명 등록 (코드에 직접 쓰지 않음)
1. Apps Script 편집기 → 왼쪽 **프로젝트 설정(⚙️)** 클릭
2. 맨 아래 **스크립트 속성(Script properties)** → **속성 추가** 를 5번 눌러 아래 값을 각각 등록:

| 속성 이름 | 값 |
|---|---|
| `R2_ACCOUNT_ID` | Cloudflare 계정 ID |
| `R2_ACCESS_KEY_ID` | API 토큰의 Access Key ID |
| `R2_SECRET_ACCESS_KEY` | API 토큰의 Secret Access Key |
| `R2_BUCKET` | 버킷 이름 (예: `ourboard-images`) |
| `R2_PUBLIC_BASE_URL` | 1)에서 발급받은 공개 URL (예: `https://pub-xxxxxxxx.r2.dev`) |

3. 저장하면 바로 적용됩니다 (재배포 불필요 — Script properties는 배포와 무관하게 즉시 반영됩니다).

### 참고
- 이미지는 최대 8MB까지 허용됩니다 (`Code.js`의 `R2_MAX_BYTES`에서 조절 가능).
- 업로드는 브라우저 → Apps Script(base64 전송) → R2 (AWS SigV4 서명 요청) 순서로 이뤄지며, R2 버킷 자체에 CORS 설정을 할 필요가 없습니다 (서버-서버 통신이라서요).
- `preview.html`(로컬 미리보기)에서는 실제 R2를 쓰지 않고, 선택한 이미지를 그대로 화면에 보여주는 가짜 업로드로 동작합니다.

## clasp로 동기화하기 (선택, 권장)

이 프로젝트는 [`clasp`](https://github.com/google/clasp)(구글 공식 CLI)로 Apps Script 프로젝트와 연결되어 있습니다. `.clasp.json`에 스크립트 ID가 저장되어 있어서, 아래 명령어로 브라우저 복사·붙여넣기 없이 바로 동기화할 수 있습니다.

```bash
npm install -g @google/clasp   # 최초 1회
clasp login                    # 최초 1회, 구글 로그인
clasp push                     # 로컬 수정사항 -> Apps Script에 반영
clasp pull                     # Apps Script 내용 -> 로컬로 가져오기
clasp open                     # 브라우저에서 Apps Script 편집기 열기
clasp deploy                   # 새 버전으로 배포 (웹 앱 URL 갱신)
```

- 백엔드 파일은 로컬에서 **`Code.js`** 로 관리됩니다 (clasp가 Apps Script의 `.gs` 파일을 로컬에서는 `.js`로 다룹니다). Apps Script 편집기에는 그대로 `Code.gs`로 보입니다.
- `appsscript.json`은 프로젝트 매니페스트(권한 범위, 웹앱 실행 설정 등)입니다. 실수로 지우지 마세요.
- 코드를 고친 뒤 `clasp push`만으로는 **기존 배포에 반영되지 않습니다.** 배포된 웹앱 URL에 반영하려면 `clasp deploy` 를 실행하거나, Apps Script 편집기에서 배포 관리 후 새 버전으로 재배포해야 합니다.

## 알려진 제한사항

- 별도 로그인 기능은 없습니다(닉네임만 입력). 실제 서비스로 쓰려면 Google 계정 인증(`Session.getActiveUser()`) 또는 별도 로그인 로직 추가를 권장합니다.
- 좋아요는 중복 방지 로직이 없어 같은 사람이 여러 번 누를 수 있습니다.
- 동시 편집이 매우 잦은 환경(수십 명 동시 접속)에서는 Sheets API 특성상 다소 느릴 수 있습니다. 소규모 커뮤니티용으로 적합합니다.
