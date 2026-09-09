/**
 * OurBoard - Google Sheets + Apps Script 게시판
 * 시트: Posts, Comments
 */

var POSTS_SHEET = 'Posts';
var COMMENTS_SHEET = 'Comments';
var PAGE_SIZE = 10;

var CATEGORIES = [
  { key: 'all',    label: '전체 게시판', icon: 'home' },
  { key: 'free',   label: '자유게시판',  icon: 'chat' },
  { key: 'qna',    label: '질문과 답변', icon: 'question' },
  { key: 'info',   label: '정보공유',    icon: 'info' },
  { key: 'daily',  label: '일상 이야기', icon: 'heart' },
  { key: 'photo',  label: '사진/추억',   icon: 'photo' },
  { key: 'hobby',  label: '취미 생활',   icon: 'palette' },
  { key: 'notice', label: '공지사항',    icon: 'megaphone' }
];

var POSTS_HEADER = ['id','category','title','content','author','date','views','likes','commentCount','image','pinned'];
var COMMENTS_HEADER = ['id','postId','author','content','date'];

/* ---------------- 웹앱 진입점 ---------------- */

function doGet(e) {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('OurBoard')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/* ---------------- 시트 유틸 ---------------- */

function getSS() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getOrCreateSheet(name, header) {
  var ss = getSS();
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(header);
    sh.setFrozenRows(1);
  }
  return sh;
}

function getPostsSheet() {
  return getOrCreateSheet(POSTS_SHEET, POSTS_HEADER);
}

function getCommentsSheet() {
  return getOrCreateSheet(COMMENTS_SHEET, COMMENTS_HEADER);
}

function rowsToObjects(sheet, header) {
  var last = sheet.getLastRow();
  if (last < 2) return [];
  var values = sheet.getRange(2, 1, last - 1, header.length).getValues();
  var out = [];
  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    if (!row[0]) continue;
    var obj = {};
    for (var c = 0; c < header.length; c++) obj[header[c]] = row[c];
    obj._row = i + 2;
    out.push(obj);
  }
  return out;
}

function nextId(objects) {
  var max = 0;
  objects.forEach(function (o) {
    var n = parseInt(o.id, 10);
    if (!isNaN(n) && n > max) max = n;
  });
  return max + 1;
}

/* ---------------- 초기 데이터 세팅 ---------------- */

function initializeSheets() {
  var postsSheet = getPostsSheet();
  var commentsSheet = getCommentsSheet();

  if (postsSheet.getLastRow() > 1) {
    return '이미 데이터가 있습니다. (Posts 시트에 ' + (postsSheet.getLastRow() - 1) + '개 행)';
  }

  var now = new Date();
  function hoursAgo(h) { return new Date(now.getTime() - h * 3600 * 1000).toISOString(); }
  function daysAgo(d) { return new Date(now.getTime() - d * 24 * 3600 * 1000).toISOString(); }

  var seed = [
    [1, 'notice', '게시판 이용 수칙 안내드립니다.', '건전한 커뮤니티 문화를 위해 게시판 이용 수칙을 꼭 확인해주세요!\n\n1. 서로를 존중하는 말을 사용해주세요.\n2. 광고성 게시글은 삭제될 수 있습니다.\n3. 즐겁고 따뜻한 공간을 함께 만들어가요.', '운영자', daysAgo(3), 1200, 32, 12, '', true],
    [2, 'free', '오늘 날씨 너무 좋네요 ☀️', '다들 주말에 뭐 하시나요? 저는 오늘 카페에서 여유롭게 커피 한 잔 했어요.', '하늘구름', hoursAgo(1), 256, 18, 5, '', false],
    [3, 'daily', '강아지랑 산책 다녀왔어요🐾', '날씨가 좋아서 오랜만에 공원에 다녀왔는데 너무 행복해하더라구요 ㅎㅎ', '몽실이', hoursAgo(3), 312, 24, 8, '', false],
    [4, 'info', '요즘 핫한 여름 카페 추천해요!', '분위기도 좋고 음료도 맛있어서 강추해요. 사진도 같이 올려볼게요 :)', '카페좋아', hoursAgo(5), 489, 37, 11, '', false],
    [5, 'qna', '노트북 추천 부탁드려요!', '대학생인데 가성비 좋은 노트북 어떤 게 좋을까요? 사용 목적은 과제랑...', '지니', hoursAgo(6), 210, 12, 7, '', false],
    [6, 'hobby', '요즘 꽃꽂이에 빠졌어요🌷', '집에서 꽃꽂이 해보려고 재료를 모으는 중인데, 혹시 추천할 만한 사이트...', '꽃길만걷자', hoursAgo(8), 167, 9, 4, '', false],
    [7, 'free', '주말에 뭐 하세요?', '저는 친구들이랑 영화 보러 갈 예정이에요! 다들 뭐 하실지 궁금하네요ㅎㅎ', '달콤한커피', hoursAgo(10), 298, 16, 6, '', false],
    [8, 'daily', '오늘도 수고했어요 :)', '하루가 정말 빨리 지나가는 것 같아요. 모두들 오늘도 고생했어요!', '행복한나', hoursAgo(12), 423, 27, 10, '', false]
  ];

  seed.forEach(function (row) { postsSheet.appendRow(row); });

  commentsSheet.appendRow([1, 2, '커피러버', '저도 오늘 커피 한잔 했어요 ㅎㅎ', hoursAgo(1)]);
  commentsSheet.appendRow([2, 2, '산책러', '날씨 진짜 좋네요!', hoursAgo(0.5)]);

  return 'Posts ' + seed.length + '개, Comments 2개 생성 완료!';
}

/* ---------------- 조회 API ---------------- */

function getInitData() {
  var posts = rowsToObjects(getPostsSheet(), POSTS_HEADER);

  var counts = { all: posts.length };
  CATEGORIES.forEach(function (c) { if (c.key !== 'all') counts[c.key] = 0; });
  posts.forEach(function (p) { if (counts[p.category] !== undefined) counts[p.category]++; });

  var byViews = posts.slice().sort(function (a, b) { return (b.views || 0) - (a.views || 0); }).slice(0, 5);
  var byDate = posts.slice().sort(function (a, b) { return new Date(b.date) - new Date(a.date); }).slice(0, 5);

  return {
    categories: CATEGORIES,
    counts: counts,
    popular: byViews.map(stripRow),
    recent: byDate.map(stripRow)
  };
}

function stripRow(p) {
  var copy = {};
  for (var k in p) { if (k !== '_row') copy[k] = p[k]; }
  return copy;
}

function getPosts(params) {
  params = params || {};
  var category = params.category || 'all';
  var sort = params.sort || 'latest';
  var page = params.page || 1;
  var keyword = (params.keyword || '').trim().toLowerCase();

  var all = rowsToObjects(getPostsSheet(), POSTS_HEADER);

  var filtered = all.filter(function (p) {
    if (category !== 'all' && p.category !== category) return false;
    if (keyword) {
      var hay = (String(p.title) + ' ' + String(p.content)).toLowerCase();
      if (hay.indexOf(keyword) === -1) return false;
    }
    return true;
  });

  var pinned = filtered.filter(function (p) { return p.pinned === true; });
  var rest = filtered.filter(function (p) { return p.pinned !== true; });

  rest.sort(function (a, b) {
    if (sort === 'popular') return (b.views || 0) - (a.views || 0);
    if (sort === 'liked') return (b.likes || 0) - (a.likes || 0);
    return new Date(b.date) - new Date(a.date);
  });
  pinned.sort(function (a, b) { return new Date(b.date) - new Date(a.date); });

  var ordered = pinned.concat(rest);
  var total = ordered.length;
  var totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  page = Math.min(Math.max(1, page), totalPages);
  var start = (page - 1) * PAGE_SIZE;
  var pageItems = ordered.slice(start, start + PAGE_SIZE).map(stripRow);

  return {
    posts: pageItems,
    total: total,
    page: page,
    totalPages: totalPages,
    category: category,
    sort: sort,
    keyword: params.keyword || ''
  };
}

function getPost(id) {
  id = Number(id);
  var sheet = getPostsSheet();
  var posts = rowsToObjects(sheet, POSTS_HEADER);
  var post = null;
  for (var i = 0; i < posts.length; i++) {
    if (Number(posts[i].id) === id) { post = posts[i]; break; }
  }
  if (!post) throw new Error('게시글을 찾을 수 없습니다.');

  var newViews = (Number(post.views) || 0) + 1;
  sheet.getRange(post._row, POSTS_HEADER.indexOf('views') + 1).setValue(newViews);
  post.views = newViews;

  var comments = rowsToObjects(getCommentsSheet(), COMMENTS_HEADER)
    .filter(function (c) { return Number(c.postId) === id; })
    .sort(function (a, b) { return new Date(a.date) - new Date(b.date); })
    .map(stripRow);

  var result = stripRow(post);
  result.comments = comments;
  return result;
}

/* ---------------- 작성 API ---------------- */

function createPost(data) {
  data = data || {};
  var title = (data.title || '').trim();
  var content = (data.content || '').trim();
  if (!title || !content) throw new Error('제목과 내용을 입력해주세요.');

  var category = data.category || 'free';
  var author = (data.author || '').trim() || '익명';
  var image = data.image || '';

  var sheet = getPostsSheet();
  var posts = rowsToObjects(sheet, POSTS_HEADER);
  var id = nextId(posts);

  var row = [id, category, title, content, author, new Date().toISOString(), 0, 0, 0, image, false];
  sheet.appendRow(row);

  // 닉네임/제목/내용 등이 숫자로만 되어 있으면 시트가 자동으로 숫자 타입으로 저장해버리는 걸 방지
  forceTextColumns(sheet, sheet.getLastRow(), {
    2: category, 3: title, 4: content, 5: author, 10: image
  });

  return { id: id };
}

function forceTextColumns(sheet, row, colToValue) {
  Object.keys(colToValue).forEach(function (col) {
    sheet.getRange(row, Number(col)).setNumberFormat('@').setValue(colToValue[col]);
  });
}

function addComment(data) {
  data = data || {};
  var postId = Number(data.postId);
  var content = (data.content || '').trim();
  if (!postId || !content) throw new Error('댓글 내용을 입력해주세요.');

  var commentsSheet = getCommentsSheet();
  var comments = rowsToObjects(commentsSheet, COMMENTS_HEADER);
  var id = nextId(comments);
  var date = new Date().toISOString();
  var author = (data.author || '').trim() || '익명';

  commentsSheet.appendRow([id, postId, author, content, date]);
  forceTextColumns(commentsSheet, commentsSheet.getLastRow(), { 3: author, 4: content });

  var postsSheet = getPostsSheet();
  var posts = rowsToObjects(postsSheet, POSTS_HEADER);
  var newCount = 0;
  for (var i = 0; i < posts.length; i++) {
    if (Number(posts[i].id) === postId) {
      newCount = (Number(posts[i].commentCount) || 0) + 1;
      postsSheet.getRange(posts[i]._row, POSTS_HEADER.indexOf('commentCount') + 1).setValue(newCount);
      break;
    }
  }

  return { id: id, postId: postId, author: author, content: content, date: date, commentCount: newCount };
}

function likePost(id) {
  id = Number(id);
  var sheet = getPostsSheet();
  var posts = rowsToObjects(sheet, POSTS_HEADER);
  for (var i = 0; i < posts.length; i++) {
    if (Number(posts[i].id) === id) {
      var newLikes = (Number(posts[i].likes) || 0) + 1;
      sheet.getRange(posts[i]._row, POSTS_HEADER.indexOf('likes') + 1).setValue(newLikes);
      return { likes: newLikes };
    }
  }
  throw new Error('게시글을 찾을 수 없습니다.');
}

/* ---------------- 이미지 업로드 (Cloudflare R2) ---------------- */
/**
 * 스크립트 속성(Project Settings > Script properties)에 아래 5개를 등록해야 동작합니다.
 * R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_BASE_URL
 */
var R2_MAX_BYTES = 8 * 1024 * 1024; // 8MB

function uploadImage(base64Data, fileName, mimeType) {
  if (!base64Data) throw new Error('이미지 데이터가 없습니다.');

  var props = PropertiesService.getScriptProperties();
  var accountId = props.getProperty('R2_ACCOUNT_ID');
  var accessKeyId = props.getProperty('R2_ACCESS_KEY_ID');
  var secretAccessKey = props.getProperty('R2_SECRET_ACCESS_KEY');
  var bucket = props.getProperty('R2_BUCKET');
  var publicBaseUrl = props.getProperty('R2_PUBLIC_BASE_URL');

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicBaseUrl) {
    throw new Error('R2 설정이 안 되어 있습니다. 스크립트 속성(R2_ACCOUNT_ID 등)을 먼저 등록해주세요.');
  }

  var bytes = Utilities.base64Decode(base64Data);
  if (bytes.length > R2_MAX_BYTES) {
    throw new Error('이미지 용량이 너무 큽니다 (최대 8MB).');
  }

  var ext = (String(fileName || '').match(/\.[a-zA-Z0-9]+$/) || [''])[0].toLowerCase();
  var safeExt = /^\.[a-z0-9]{1,5}$/.test(ext) ? ext : '';
  var key = 'uploads/' + Utilities.getUuid() + safeExt;

  r2PutObject(accountId, accessKeyId, secretAccessKey, bucket, key, bytes, mimeType || 'application/octet-stream');

  var base = publicBaseUrl.replace(/\/$/, '');
  return { url: base + '/' + key };
}

function r2PutObject(accountId, accessKeyId, secretAccessKey, bucket, key, bytes, contentType) {
  var region = 'auto';
  var service = 's3';
  var host = accountId + '.r2.cloudflarestorage.com';
  var endpoint = 'https://' + host + '/' + bucket + '/' + key;

  var now = new Date();
  var amzDate = Utilities.formatDate(now, 'UTC', "yyyyMMdd'T'HHmmss'Z'");
  var dateStamp = Utilities.formatDate(now, 'UTC', 'yyyyMMdd');

  var payloadHash = toHex(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, bytes));

  var canonicalUri = '/' + bucket + '/' + key.split('/').map(encodeURIComponent).join('/');
  var canonicalHeaders = 'host:' + host + '\n' +
    'x-amz-content-sha256:' + payloadHash + '\n' +
    'x-amz-date:' + amzDate + '\n';
  var signedHeaders = 'host;x-amz-content-sha256;x-amz-date';

  var canonicalRequest = ['PUT', canonicalUri, '', canonicalHeaders, signedHeaders, payloadHash].join('\n');

  var algorithm = 'AWS4-HMAC-SHA256';
  var credentialScope = dateStamp + '/' + region + '/' + service + '/aws4_request';
  var stringToSign = [
    algorithm,
    amzDate,
    credentialScope,
    toHex(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, canonicalRequest))
  ].join('\n');

  var signingKey = getSignatureKey(secretAccessKey, dateStamp, region, service);
  var signature = toHex(Utilities.computeHmacSha256Signature(stringToSign, signingKey));

  var authorizationHeader = algorithm + ' Credential=' + accessKeyId + '/' + credentialScope +
    ', SignedHeaders=' + signedHeaders + ', Signature=' + signature;

  var options = {
    method: 'put',
    contentType: contentType,
    payload: bytes,
    headers: {
      'x-amz-date': amzDate,
      'x-amz-content-sha256': payloadHash,
      'Authorization': authorizationHeader
    },
    muteHttpExceptions: true
  };

  var resp = UrlFetchApp.fetch(endpoint, options);
  var code = resp.getResponseCode();
  if (code < 200 || code >= 300) {
    throw new Error('R2 업로드 실패 (' + code + '): ' + resp.getContentText());
  }
}

function getSignatureKey(secretKey, dateStamp, regionName, serviceName) {
  var kDate = Utilities.computeHmacSha256Signature(dateStamp, 'AWS4' + secretKey);
  var kRegion = Utilities.computeHmacSha256Signature(regionName, kDate);
  var kService = Utilities.computeHmacSha256Signature(serviceName, kRegion);
  return Utilities.computeHmacSha256Signature('aws4_request', kService);
}

function toHex(bytes) {
  return bytes.reduce(function (str, b) {
    var v = (b < 0 ? b + 256 : b).toString(16);
    return str + (v.length === 1 ? '0' + v : v);
  }, '');
}
