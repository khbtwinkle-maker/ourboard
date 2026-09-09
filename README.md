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

## 알려진 제한사항

- 별도 로그인 기능은 없습니다(닉네임만 입력). 실제 서비스로 쓰려면 Google 계정 인증(`Session.getActiveUser()`) 또는 별도 로그인 로직 추가를 권장합니다.
- 좋아요는 중복 방지 로직이 없어 같은 사람이 여러 번 누를 수 있습니다.
- 동시 편집이 매우 잦은 환경(수십 명 동시 접속)에서는 Sheets API 특성상 다소 느릴 수 있습니다. 소규모 커뮤니티용으로 적합합니다.
