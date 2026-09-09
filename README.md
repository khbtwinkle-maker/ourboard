# OurBoard — Google Sheets 기반 커뮤니티 게시판

디자인 시안(`d2ba298f-8487-4da8-88d1-3e84f62d415c.png`)을 기반으로 만든 커뮤니티 게시판입니다.

**구조**: 화면(HTML/CSS/JS)은 정적 사이트로 **Cloudflare Pages**에서 서비스하고, **Google Apps Script**는 Google Sheets를 데이터베이스로 다루는 순수 JSON API 역할만 합니다. 화면이 `fetch()`로 Apps Script API를 호출하는 구조라서, 사용자가 보는 주소는 `script.google.com/...` 이 아니라 Cloudflare Pages 주소(예: `ourboard.pages.dev`)가 되고, Google Apps Script 안내 배너도 뜨지 않습니다.

```
브라우저 ──fetch()──> Apps Script(JSON API) ──> Google Sheets (Posts, Comments)
   ↑                                          └──(이미지 업로드 시)──> Cloudflare R2
Cloudflare Pages가 정적 파일(public/) 서빙
```

## 파일 구성

| 경로 | 역할 |
|---|---|
| `Code.js` | Apps Script 백엔드 — 시트 CRUD, R2 업로드, `doGet`/`doPost` JSON API |
| `appsscript.json` | Apps Script 매니페스트 (웹앱 실행 설정) |
| `public/index.html` | 정적 페이지 골격(HTML) — Cloudflare Pages가 이 폴더를 그대로 서빙 |
| `public/style.css` | 전체 스타일(CSS) |
| `public/app.js` | 프론트엔드 로직(JS) — `fetch()`로 Apps Script API 호출 |
| `.clasp.json` / `.claspignore` | clasp 설정 — `Code.js`, `appsscript.json`만 Apps Script로 push됨 |

## 설치 방법

### 1) 백엔드 (Google Sheets + Apps Script)

1. **새 Google Sheets 문서를 만듭니다.** (sheets.new)
2. 메뉴에서 **확장 프로그램 → Apps Script** 클릭.
3. 기본 생성된 `코드.gs` 내용을 전부 지우고, 이 프로젝트의 `Code.js` 내용을 붙여넣습니다. (파일명은 `Code`로 두면 됩니다.)
4. 상단 툴바의 함수 선택 드롭다운에서 **`initializeSheets`** 를 선택하고 ▶(실행) 버튼을 누릅니다.
   - 처음 실행 시 "승인 필요" 팝업이 뜨면 본인 계정으로 권한을 승인해주세요.
   - 실행이 끝나면 스프레드시트에 `Posts`, `Comments` 시트가 생성되고 샘플 게시글 8개가 들어갑니다.
5. **배포 → 새 배포** → 유형에서 톱니바퀴를 눌러 **웹 앱** 선택.
   - 실행 사용자: **나**
   - 액세스 권한: **전체(익명 포함)**
   - **배포** 클릭 → 발급된 웹 앱 URL(`.../exec`)을 복사해두세요. 이게 API 주소입니다.
6. `public/app.js` 맨 위쪽의 `API_URL` 값을 방금 복사한 주소로 바꿔주세요.

### 2) 프론트엔드 (Cloudflare Pages)

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers 및 Pages** → **애플리케이션 만들기** → **Pages** 탭 → **Git에 연결**
2. 이 프로젝트의 GitHub 저장소 선택
3. 빌드 설정:
   - **프레임워크 프리셋**: None
   - **빌드 명령어**: (비워둠 — 정적 파일이라 빌드 불필요)
   - **빌드 출력 디렉터리**: `public`
4. **저장 및 배포** 클릭 → 몇 초 뒤 `https://ourboard.pages.dev` 같은 주소가 발급됩니다.
5. 이후에는 GitHub에 `git push`만 하면 Cloudflare Pages가 자동으로 다시 배포합니다.

## 주요 기능

- 카테고리별 게시판: 전체/자유게시판/질문과 답변/정보공유/일상 이야기/사진·추억/취미 생활/공지사항 (사이드바에 실시간 글 개수 표시)
- 정렬: 최신순 / 인기순(조회수) / 추천순(좋아요)
- 검색: 상단 히어로 검색창에서 제목+본문 검색
- 글쓰기: 카테고리 선택, 작성자(선택, 미입력시 "익명"), 제목/내용, 이미지 파일 업로드(Cloudflare R2)
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

## API (Apps Script가 제공하는 JSON API)

`public/app.js`의 `callApi(action, payload)`가 Apps Script 웹앱 URL로 `POST { action, payload }`를 보내고 JSON을 돌려받습니다. (Apps Script는 커스텀 CORS 헤더 설정이 안 되기 때문에, preflight를 피하려고 `Content-Type: text/plain;charset=utf-8`로 보냅니다 — 실제 본문은 JSON 문자열입니다.)

| action | payload | 설명 |
|---|---|---|
| `getInitData` | - | 카테고리별 글 개수, 인기글 Top5, 최근글 Top5 |
| `getPosts` | `{category, sort, page, keyword}` | 목록 조회 |
| `getPost` | `{id}` | 상세 조회 (조회수 +1) |
| `createPost` | `{category, title, content, author, image}` | 글쓰기 |
| `addComment` | `{postId, author, content}` | 댓글 작성 |
| `likePost` | `{id}` | 좋아요 +1 |
| `uploadImage` | `{base64Data, fileName, mimeType}` | R2에 이미지 업로드, 공개 URL 반환 |

## 커스터마이징 팁

- **색상/톤**: `public/style.css` 상단 `:root` 변수(`--primary`, `--bg` 등)와 카테고리 배지(`.badge-*`) 색상만 바꾸면 전체 톤이 바뀝니다.
- **히어로 배경 사진**: 지금은 이모지(🌼)로 꽃 장식을 흉내냈습니다. 실제 사진을 쓰려면 `.hero`에 `background-image: url('이미지주소')`를 추가하세요.
- **카테고리 추가/변경**: `Code.js`의 `CATEGORIES` 배열과 `public/app.js`의 `CATEGORY_ICON` / `CATEGORY_BADGE_CLASS`, `public/style.css`의 `.badge-*`를 함께 수정하세요.
- **커스텀 도메인**: Cloudflare Pages 프로젝트 설정 → **사용자 지정 도메인**에서 보유한 도메인을 연결할 수 있습니다.

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

## clasp로 Apps Script 동기화하기

이 프로젝트는 [`clasp`](https://github.com/google/clasp)(구글 공식 CLI)로 Apps Script 프로젝트와 연결되어 있습니다. `.clasp.json`에 스크립트 ID가, `.claspignore`에 "Code.js와 appsscript.json만 push한다"는 설정이 들어있습니다 (public/ 폴더는 Cloudflare Pages가 별도로 서빙하므로 Apps Script에는 올리지 않습니다).

```bash
npm install -g @google/clasp   # 최초 1회
clasp login                    # 최초 1회, 구글 로그인
clasp push                     # 로컬 Code.js 수정사항 -> Apps Script에 반영
clasp pull                     # Apps Script 내용 -> 로컬로 가져오기
clasp open                     # 브라우저에서 Apps Script 편집기 열기
clasp deploy -i <배포ID>       # 기존 웹앱 URL에 새 버전 반영
```

- `clasp deploy`를 `-i <배포ID>` 없이 실행하면 **완전히 새로운 URL의 배포가 생성됩니다.** 기존 URL(`API_URL`)을 유지하려면 반드시 `-i`로 기존 배포 ID를 지정하세요. (`clasp deployments`로 확인 가능)
- 백엔드 파일은 로컬에서 **`Code.js`** 로 관리됩니다 (clasp가 Apps Script의 `.gs` 파일을 로컬에서는 `.js`로 다룹니다).
- `clasp push`만으로는 **기존 배포에 반영되지 않습니다.** 실제 API URL에 반영하려면 `clasp deploy -i <배포ID>`까지 실행해야 합니다.
- 프론트엔드(`public/`)는 clasp와 무관하게 GitHub push → Cloudflare Pages 자동 배포로 반영됩니다.

## 알려진 제한사항

- 별도 로그인 기능은 없습니다(닉네임만 입력).
- 좋아요는 중복 방지 로직이 없어 같은 사람이 여러 번 누를 수 있습니다.
- Apps Script를 공개 JSON API로 쓰는 구조라서 API URL을 아는 사람은 누구나 글쓰기/댓글 API를 직접 호출할 수 있습니다 (원래 웹 화면에서도 동일하게 열려있던 범위입니다). 스팸이 걱정되면 간단한 요청 검증(예: 고정 토큰 검사)을 `Code.js`에 추가하는 걸 권장합니다.
- 동시 편집이 매우 잦은 환경(수십 명 동시 접속)에서는 Sheets API 특성상 다소 느릴 수 있습니다. 소규모 커뮤니티용으로 적합합니다.
