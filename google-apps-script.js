const SPREADSHEET_ID = '1T2W6y_h98vynj0GDBVkndW-SvFW0tC07cfyg328L1vM';
const DRIVE_FOLDER_ID = '1KGxeqM60AtekJQCLqHhrIdIVyb9FLF6y';

// === 安全設定（密碼改存 PropertiesService，首次需手動設定）===
function getAdminPassword() {
  var ps = PropertiesService.getScriptProperties();
  var pwd = ps.getProperty('ADMIN_PASSWORD');
  if (!pwd) { pwd = '11201120'; ps.setProperty('ADMIN_PASSWORD', pwd); }
  return pwd;
}

// === 防作弊：遊戲分數上限 & 時長設定 ===
var GAME_LIMITS = {
  'pacman':   { maxScore: 5000,  duration: 60,  maxPerSec: 80 },
  'catch':    { maxScore: 5000,  duration: 60,  maxPerSec: 80 },
  'snake':    { maxScore: 5000,  duration: 60,  maxPerSec: 80 },
  'whack':    { maxScore: 5000,  duration: 45,  maxPerSec: 100 },
  'memory':   { maxScore: 8000,  duration: 90,  maxPerSec: 80 },
  'breaker':  { maxScore: 8000,  duration: 90,  maxPerSec: 80 },
  'quiz':     { maxScore: 5000,  duration: 60,  maxPerSec: 80 },
  'shooter':  { maxScore: 5000,  duration: 45,  maxPerSec: 100 },
  'dodge':    { maxScore: 5000,  duration: 60,  maxPerSec: 80 },
  'reaction': { maxScore: 5000,  duration: 45,  maxPerSec: 100 },
  'rhythm':   { maxScore: 5000,  duration: 60,  maxPerSec: 80 },
  'puzzle':   { maxScore: 8000,  duration: 120, maxPerSec: 60 },
  'cook-boba':     { maxScore: 5000, duration: 60, maxPerSec: 80 },
  'cook-beef':     { maxScore: 5000, duration: 60, maxPerSec: 80 },
  'cook-dumpling': { maxScore: 5000, duration: 60, maxPerSec: 80 },
  'cook-shaved':   { maxScore: 5000, duration: 60, maxPerSec: 80 },
  'cook-cake':     { maxScore: 5000, duration: 60, maxPerSec: 80 },
  'photo':    { maxScore: 300,   duration: 999, maxPerSec: 10 }
};

// === Admin Session Token 管理 ===
function generateAdminToken() {
  var token = Utilities.getUuid();
  var cache = getCache();
  // Token 有效期 2 小時
  cache.put('admin_token_' + token, 'valid', 7200);
  return token;
}
function validateAdminToken(token) {
  if (!token) return false;
  var cache = getCache();
  return cache.get('admin_token_' + token) === 'valid';
}

// === 簽章驗證 ===
var SIGN_SECRET = 'mw_s3cure_2026';
function generateGameToken(playerId, gameId) {
  var ts = Date.now();
  var raw = playerId + '|' + gameId + '|' + ts + '|' + SIGN_SECRET;
  var hash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, raw);
  var hex = hash.map(function(b) { return ('0' + (b & 0xFF).toString(16)).slice(-2); }).join('');
  return { token: hex.substring(0, 16), timestamp: ts };
}
function verifyScoreSignature(playerId, gameId, score, startTime, signature) {
  if (!signature || !startTime) return false;
  var raw = playerId + '|' + gameId + '|' + score + '|' + startTime + '|' + SIGN_SECRET;
  var hash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, raw);
  var hex = hash.map(function(b) { return ('0' + (b & 0xFF).toString(16)).slice(-2); }).join('');
  return hex.substring(0, 16) === signature;
}

// === Audit Log ===
function auditLog(action, details) {
  try {
    var sheet = getSheet('AuditLog');
    if (!sheet) {
      var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      sheet = ss.insertSheet('AuditLog');
      sheet.getRange(1,1,1,4).setValues([['timestamp','action','details','ip']]);
      sheet.getRange(1,1,1,4).setFontWeight('bold');
    }
    sheet.appendRow([new Date().toISOString(), action, JSON.stringify(details).substring(0, 500), '']);
  } catch(e) { /* 不因 log 失敗影響主流程 */ }
}

function doGet(e) {
  var action = e.parameter.action;
  var handlers = {
    getTeams: handleGetTeams, getPlayer: handleGetPlayer,
    getGameScores: handleGetGameScores, getTeamRankings: handleGetTeamRankings,
    getBroadcasts: handleGetBroadcasts, getGameLocations: handleGetGameLocations,
    getUnlocks: handleGetUnlocks, getConfig: handleGetConfig,
    getDashboard: handleGetDashboard, getChat: handleGetChat,
    getTeamLocations: handleGetTeamLocations, getPlayerTasks: handleGetPlayerTasks,
    getPhotoStatus: handleGetPhotoStatus, getPendingPhotos: handleGetPendingPhotos,
    // Quiz 後端出題
    getQuizQuestion: handleGetQuizQuestion,
    // 遊戲開始 Token
    startGame: handleStartGame,
    initSpreadsheet: function() { initSpreadsheet(); return { success: true, message: 'Spreadsheet initialized' }; }
  };
  var handler = handlers[action];
  if (!handler) return jsonResponse({ error: 'Unknown action: ' + action });
  try { return jsonResponse(handler(e.parameter)); } catch (err) { return jsonResponse({ error: err.message }); }
}

function doPost(e) {
  var body;
  try { body = JSON.parse(e.postData.contents); } catch(ex) { return jsonResponse({ error: 'Invalid JSON' }); }
  var handlers = {
    register: handleRegister, unlockGame: handleUnlockGame,
    submitScore: handleSubmitScore, uploadPhoto: handleUploadPhoto,
    broadcast: handleBroadcast, verifyPhoto: handleVerifyPhoto,
    addManualPoints: handleAddManualPoints, recalcTeamPoints: handleRecalcTeamPoints,
    sendChat: handleSendChat, updateLocation: handleUpdateLocation,
    submitPhotoTask: handleSubmitPhotoTask,
    // Quiz 答題驗證
    answerQuiz: handleAnswerQuiz,
    // Admin 登入（取得 token）
    adminLogin: handleAdminLogin
  };
  var handler = handlers[body.action];
  if (!handler) return jsonResponse({ error: 'Unknown action' });
  try { return jsonResponse(handler(body)); } catch (err) { return jsonResponse({ error: err.message }); }
}

function jsonResponse(data) { return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON); }
function getSheet(name) { return SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(name); }
function getCache() { return CacheService.getScriptCache(); }

// ================================================================
// GET handlers
// ================================================================
function handleGetTeams(p) { var c = getCache(), cached = c.get('teams'); if (cached) return JSON.parse(cached); var s = getSheet('Teams'), d = s.getDataRange().getValues(); var teams = d.slice(1).map(function(r) { return { teamId:r[0], teamName:r[1], teamEmoji:r[2], totalPoints:r[3]||0 }; }); var result = { teams: teams }; c.put('teams', JSON.stringify(result), 60); return result; }
function handleGetPlayer(p) { var d = getSheet('Players').getDataRange().getValues(); var r = d.find(function(r) { return r[0]===p.playerId; }); if (!r) return { error:'Not found' }; return { player:{ playerId:r[0], name:r[1], teamId:r[2] }}; }
function handleGetGameScores(p) { var gid = p.gameId, limit = parseInt(p.limit)||30; var c = getCache(), ck = 'scores_'+gid, cached = c.get(ck); if (cached) return JSON.parse(cached); var d = getSheet('GameScores').getDataRange().getValues(); var scores = d.slice(1).filter(function(r){return r[3]===gid;}).map(function(r){return {playerId:r[0],playerName:r[1],teamId:r[2],gameId:r[3],score:r[4],timestamp:r[5]};}).sort(function(a,b){return b.score-a.score;}).slice(0,limit); var result = { scores: scores }; c.put(ck, JSON.stringify(result), 5); return result; }
function handleGetTeamRankings(p) { var c = getCache(), cached = c.get('rankings'); if (cached) return JSON.parse(cached); var d = getSheet('Teams').getDataRange().getValues(); var rankings = d.slice(1).map(function(r){return {teamId:r[0],teamName:r[1],teamEmoji:r[2],totalPoints:r[3]||0};}).sort(function(a,b){return b.totalPoints-a.totalPoints;}); var result = { rankings: rankings }; c.put('rankings', JSON.stringify(result), 10); return result; }
function handleGetBroadcasts(p) { var since = p.since||''; var d = getSheet('Broadcasts').getDataRange().getValues(); var b = d.slice(1).map(function(r){return {broadcastId:r[0],type:r[1],content:r[2],timestamp:r[3]};}); if (since) b = b.filter(function(x){return x.timestamp>since;}); b.sort(function(a,b){return a.timestamp>b.timestamp?1:-1;}); return { broadcasts:b.slice(-20) }; }
function handleGetGameLocations(p) { return { locations: [ {gameId:'pacman',lat:24.95740,lng:121.22560},{gameId:'catch',lat:24.95760,lng:121.22600},{gameId:'snake',lat:24.95730,lng:121.22570},{gameId:'whack',lat:24.95750,lng:121.22590},{gameId:'memory',lat:24.95740,lng:121.22580},{gameId:'breaker',lat:24.95760,lng:121.22560},{gameId:'quiz',lat:24.95750,lng:121.22570},{gameId:'shooter',lat:24.95730,lng:121.22590},{gameId:'dodge',lat:24.95740,lng:121.22600},{gameId:'reaction',lat:24.95760,lng:121.22580},{gameId:'rhythm',lat:24.95750,lng:121.22560},{gameId:'photo',lat:24.95730,lng:121.22600} ]}; }
function handleGetUnlocks(p) { var d = getSheet('GameUnlocks').getDataRange().getValues(); return { unlocks: d.slice(1).filter(function(r){return r[0]===p.playerId;}).map(function(r){return {gameId:r[1],unlockedAt:r[2]};}) }; }
function handleGetConfig(p) { return { eventName:'大江購物冒險', eventDate:'2026-05-01', eventTime:'10:00-17:00' }; }

function handleGetDashboard(p) {
  // Admin 驗證：支援 token 或密碼
  if (!validateAdminToken(p.token) && p.password !== getAdminPassword()) return { error:'Unauthorized' };
  var players = getSheet('Players').getLastRow()-1, plays = getSheet('GameScores').getLastRow()-1;
  var pendingPhotos = 0; var ps = getSheet('PhotoTasks');
  if (ps && ps.getLastRow()>1) { pendingPhotos = ps.getDataRange().getValues().slice(1).filter(function(r){return r[6]==='pending';}).length; }
  return { totalPlayers:Math.max(0,players), totalPlays:Math.max(0,plays), pendingPhotos:pendingPhotos };
}

function handleGetChat(p) { var ch=p.channel||'world',tid=p.teamId,since=p.since||''; var s=getSheet('Chat'); if(!s) return {messages:[]}; var d=s.getDataRange().getValues(); var msgs=d.slice(1).map(function(r){return {msgId:r[0],channel:r[1],teamId:r[2],playerId:r[3],playerName:r[4],teamName:r[5],teamEmoji:r[6],content:r[7],timestamp:r[8]};}); if(ch==='team') msgs=msgs.filter(function(m){return m.channel==='team'&&String(m.teamId)===String(tid);}); else msgs=msgs.filter(function(m){return m.channel==='world';}); if(since) msgs=msgs.filter(function(m){return m.timestamp>since;}); return {messages:msgs.slice(-50)}; }
function handleGetTeamLocations(p) { var s=getSheet('PlayerLocations'); if(!s) return {locations:[]}; var d=s.getDataRange().getValues(),now=new Date().getTime(); return {locations:d.slice(1).filter(function(r){return String(r[2])===String(p.teamId)&&(now-new Date(r[5]).getTime())<120000;}).map(function(r){return {playerId:r[0],playerName:r[1],teamId:r[2],lat:r[3],lng:r[4],timestamp:r[5]};})}; }
function handleGetPlayerTasks(p) { var pid=p.playerId; var ud=getSheet('GameUnlocks').getDataRange().getValues(),sd=getSheet('GameScores').getDataRange().getValues(); var unlocked=[], played=[]; ud.slice(1).forEach(function(r){if(r[0]===pid) unlocked.push(r[1]);}); sd.slice(1).forEach(function(r){if(r[0]===pid) played.push(r[3]);}); return {tasks:['pacman','snake','whack','memory','quiz','catch','breaker','shooter','dodge','reaction','rhythm','photo'].map(function(g){return {gameId:g,unlocked:unlocked.indexOf(g)!==-1,played:played.indexOf(g)!==-1};})}; }

function handleGetPhotoStatus(p) {
  var s=getSheet('PhotoTasks'); if(!s) return {submission:null}; var d=s.getDataRange().getValues();
  var rows=d.slice(1).filter(function(r){return r[1]===p.playerId&&r[4]===(p.gameId||'photo');});
  if(!rows.length) return {submission:null};
  var l=rows[rows.length-1]; var photoUrl=l[5]||'';
  var thumbUrl=photoUrl; var match=photoUrl.match(/\/d\/([^\/\?]+)/); if(match) thumbUrl='https://drive.google.com/thumbnail?id='+match[1]+'&sz=w400';
  return {submission:{submissionId:l[0],playerId:l[1],playerName:l[2],teamId:l[3],gameId:l[4],photoUrl:photoUrl,thumbUrl:thumbUrl,status:l[6],submittedAt:l[7],verifiedAt:l[8],points:l[6]==='approved'?300:0}};
}

function handleGetPendingPhotos(p) {
  if(!validateAdminToken(p.token) && p.password!==getAdminPassword()) return {error:'Unauthorized'}; var s=getSheet('PhotoTasks'); if(!s) return {photos:[]};
  return {photos:s.getDataRange().getValues().slice(1).map(function(r,i){var url=r[5]||'';var thumb=url;var m=url.match(/\/d\/([^\/\?]+)/);if(m)thumb='https://drive.google.com/thumbnail?id='+m[1]+'&sz=w400';return{row:i+2,submissionId:r[0],playerId:r[1],playerName:r[2],teamId:r[3],gameId:r[4],photoUrl:url,thumbUrl:thumb,status:r[6],submittedAt:r[7],verifiedAt:r[8]};})};
}

// === 遊戲開始 Token（後端記錄開始時間）===
function handleStartGame(p) {
  var playerId = p.playerId, gameId = p.gameId;
  if (!playerId || !gameId) return { error: 'Missing params' };
  if (!GAME_LIMITS[gameId]) return { error: 'Invalid game' };
  var tokenData = generateGameToken(playerId, gameId);
  var cache = getCache();
  // 記錄此玩家此遊戲的開始時間（有效 10 分鐘）
  cache.put('game_start_' + playerId + '_' + gameId, String(tokenData.timestamp), 600);
  return { gameToken: tokenData.token, startTime: tokenData.timestamp };
}

// === Quiz 後端出題（不暴露答案）===
var QUIZ_QUESTIONS_BANK = [
  { id:1, q:'大江購物中心位於哪個城市？', options:['桃園','台北','新竹','台中'], answer:0 },
  { id:2, q:'台灣最高的建築物是？', options:['台北101','高雄85大樓','新光三越','圓山大飯店'], answer:0 },
  { id:3, q:'台灣的國花是什麼？', options:['櫻花','梅花','蓮花','菊花'], answer:1 },
  { id:4, q:'台灣有幾個直轄市？', options:['4個','5個','6個','7個'], answer:2 },
  { id:5, q:'日月潭位於哪個縣市？', options:['嘉義縣','南投縣','花蓮縣','台中市'], answer:1 },
  { id:6, q:'台灣最長的河流是？', options:['大甲溪','濁水溪','淡水河','高屏溪'], answer:1 },
  { id:7, q:'阿里山位於哪個縣市？', options:['嘉義縣','南投縣','雲林縣','台南市'], answer:0 },
  { id:8, q:'台灣的貨幣單位是？', options:['日圓','美元','新台幣','人民幣'], answer:2 },
  { id:9, q:'墾丁國家公園位於哪裡？', options:['台東','屏東','花蓮','高雄'], answer:1 },
  { id:10, q:'台灣哪個城市被稱為港都？', options:['基隆','高雄','台中','台南'], answer:1 },
  { id:11, q:'太魯閣國家公園以什麼地形聞名？', options:['火山','峽谷','沙漠','草原'], answer:1 },
  { id:12, q:'珍珠奶茶起源於台灣的哪個城市？', options:['台北','台中','台南','高雄'], answer:1 },
  { id:13, q:'九份老街位於哪個城市？', options:['基隆市','新北市','台北市','宜蘭縣'], answer:1 },
  { id:14, q:'玉山的海拔約為幾公尺？', options:['2952','3492','3952','4952'], answer:2 },
  { id:15, q:'桃園國際機場的代碼是？', options:['TSA','TPE','KHH','RMQ'], answer:1 },
  { id:16, q:'台灣面積最大的縣市是？', options:['花蓮縣','南投縣','台東縣','屏東縣'], answer:0 },
  { id:17, q:'台灣第一條高速公路是？', options:['國道一號','國道三號','國道五號','台61線'], answer:0 },
  { id:18, q:'台灣最南端的地標是？', options:['鵝鑾鼻燈塔','墾丁大街','貓鼻頭','龍磐公園'], answer:0 },
  { id:19, q:'中壢區屬於哪個縣市？', options:['台北市','新北市','桃園市','新竹市'], answer:2 },
  { id:20, q:'大江購物中心英文名是？', options:['Metro Walk','Global Mall','Mega City','Far Eastern'], answer:0 },
  { id:21, q:'桃園的特產是什麼？', options:['鳳梨酥','花生糖','大溪豆干','太陽餅'], answer:2 },
  { id:22, q:'台灣高鐵最南站是？', options:['台南站','高雄站','左營站','屏東站'], answer:2 },
  { id:23, q:'台灣四面環海，不與哪個海域相鄰？', options:['太平洋','台灣海峽','南海','日本海'], answer:3 },
  { id:24, q:'台積電的英文縮寫是？', options:['TSMC','TMSC','TSPC','TCMS'], answer:0 },
  { id:25, q:'台積電總部位於哪個城市？', options:['台北','桃園','新竹','台中'], answer:2 },
  { id:26, q:'台積電的創辦人是誰？', options:['郭台銘','張忠謀','林百里','施振榮'], answer:1 },
  { id:27, q:'台積電成立於哪一年？', options:['1980','1987','1991','1995'], answer:1 },
  { id:28, q:'晶圓製造的第一步通常是？', options:['蝕刻','氧化','晶圓清洗','封裝'], answer:2 },
  { id:29, q:'半導體製程中「光刻」的英文是？', options:['Etching','Lithography','Doping','Deposition'], answer:1 },
  { id:30, q:'台積電目前最先進的製程節點是？', options:['7nm','5nm','3nm','2nm'], answer:3 },
  { id:31, q:'半導體的基本材料是什麼？', options:['銅','鋁','矽','鐵'], answer:2 },
  { id:32, q:'晶圓的標準尺寸為幾吋？', options:['6吋','8吋','12吋','16吋'], answer:2 },
  { id:33, q:'「摩爾定律」預測電晶體密度幾年翻一倍？', options:['1年','18個月','3年','5年'], answer:1 },
  { id:34, q:'IC設計公司不擁有工廠，稱為？', options:['IDM','Fabless','Foundry','OSAT'], answer:1 },
  { id:35, q:'台積電的商業模式屬於？', options:['IDM','Fabless','晶圓代工','IC設計'], answer:2 },
  { id:36, q:'EUV光刻技術中EUV是什麼意思？', options:['超紫外光','極紫外光','遠紫外光','近紫外光'], answer:1 },
  { id:37, q:'半導體製程中nm代表？', options:['毫米','微米','奈米','皮米'], answer:2 }
];

function handleGetQuizQuestion(p) {
  var playerId = p.playerId, idx = parseInt(p.index) || 0;
  if (!playerId) return { error: 'Missing playerId' };
  // 用玩家 ID 做 seed 打亂題序（同一玩家每次順序一致，不同玩家不同）
  var seed = 0;
  for (var i = 0; i < playerId.length; i++) seed += playerId.charCodeAt(i);
  var shuffled = QUIZ_QUESTIONS_BANK.slice();
  for (var i = shuffled.length - 1; i > 0; i--) {
    var j = (seed * (i + 1) + 7) % (i + 1);
    var tmp = shuffled[i]; shuffled[i] = shuffled[j]; shuffled[j] = tmp;
  }
  var totalQuestions = 10;
  if (idx >= totalQuestions || idx >= shuffled.length) return { done: true, totalQuestions: totalQuestions };
  var q = shuffled[idx];
  // 打亂選項順序並記錄正確答案位置到快取
  var optionIndices = [0, 1, 2, 3];
  for (var i = optionIndices.length - 1; i > 0; i--) {
    var j = (seed * (idx + 1) * (i + 1) + 13) % (i + 1);
    var tmp = optionIndices[i]; optionIndices[i] = optionIndices[j]; optionIndices[j] = tmp;
  }
  var shuffledOptions = optionIndices.map(function(oi) { return q.options[oi]; });
  var correctShuffled = optionIndices.indexOf(q.answer);
  // 將正確答案位置存入快取（60 秒有效）
  var cache = getCache();
  cache.put('quiz_' + playerId + '_' + idx, String(correctShuffled), 60);
  return { index: idx, total: totalQuestions, question: q.q, options: shuffledOptions, questionId: q.id };
}

function handleAnswerQuiz(body) {
  var playerId = body.playerId, idx = body.index, selected = body.selected;
  if (playerId === undefined || idx === undefined || selected === undefined) return { error: 'Missing params' };
  var cache = getCache();
  var correctStr = cache.get('quiz_' + playerId + '_' + idx);
  if (correctStr === null) return { error: 'Question expired, please reload' };
  var correct = parseInt(correctStr) === selected;
  // 清除已用答案
  cache.remove('quiz_' + playerId + '_' + idx);
  return { correct: correct, correctIndex: parseInt(correctStr) };
}

// ================================================================
// POST handlers
// ================================================================
function handleRegister(b) {
  // 驗證輸入
  if (!b.playerId || !b.name || b.teamId === undefined) return { error: 'Missing fields' };
  if (typeof b.name !== 'string' || b.name.length > 20) return { error: 'Invalid name' };
  var tid = parseInt(b.teamId);
  if (isNaN(tid) || tid < 1 || tid > 60) return { error: 'Invalid teamId' };
  getSheet('Players').appendRow([b.playerId, b.name.substring(0, 20), tid, new Date().toISOString()]);
  getCache().remove('teams');
  auditLog('register', { playerId: b.playerId, name: b.name, teamId: tid });
  return { success: true };
}

function handleUnlockGame(b) {
  if (!b.playerId || !b.gameId) return { error: 'Missing fields' };
  if (!GAME_LIMITS[b.gameId]) return { error: 'Invalid gameId' };
  // 驗證座標範圍
  var lat = parseFloat(b.lat), lng = parseFloat(b.lng);
  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    lat = ''; lng = '';
  }
  getSheet('GameUnlocks').appendRow([b.playerId, b.gameId, new Date().toISOString(), lat, lng]);
  return { success: true };
}

// === 核心防禦：分數提交驗證 ===
function handleSubmitScore(b) {
  var playerId = b.playerId, gameId = b.gameId, score = parseInt(b.score);
  var playerName = b.playerName, teamId = b.teamId;

  // 1. 基本驗證
  if (!playerId || !gameId || isNaN(score)) return { error: 'Missing fields' };
  var limits = GAME_LIMITS[gameId];
  if (!limits) return { error: 'Invalid gameId: ' + gameId };

  // 2. 分數上限驗證
  if (score < 0) return { error: 'Invalid score' };
  if (score > limits.maxScore) {
    auditLog('CHEAT_BLOCKED', { playerId: playerId, gameId: gameId, score: score, reason: 'exceeds_max', max: limits.maxScore });
    return { error: 'Score exceeds maximum', blocked: true };
  }

  // 3. 遊戲時間驗證（檢查是否有 startGame token）
  var cache = getCache();
  var startTimeStr = cache.get('game_start_' + playerId + '_' + gameId);
  if (startTimeStr) {
    var elapsed = (Date.now() - parseInt(startTimeStr)) / 1000;
    // 容許 10 秒誤差（網路延遲 + 倒數）
    if (elapsed < 3) {
      auditLog('CHEAT_BLOCKED', { playerId: playerId, gameId: gameId, score: score, reason: 'too_fast', elapsed: elapsed });
      return { error: 'Game too short', blocked: true };
    }
    // 驗證分數是否超過時間內理論最大值
    var maxPossible = limits.maxPerSec * Math.min(elapsed, limits.duration + 10);
    if (score > maxPossible) {
      auditLog('CHEAT_BLOCKED', { playerId: playerId, gameId: gameId, score: score, reason: 'score_vs_time', elapsed: elapsed, maxPossible: maxPossible });
      return { error: 'Score impossible for duration', blocked: true };
    }
  }

  // 4. 頻率限制：同一玩家同一遊戲 5 分鐘內只能提交 1 次
  var rateLimitKey = 'rate_' + playerId + '_' + gameId;
  var lastSubmit = cache.get(rateLimitKey);
  if (lastSubmit) {
    auditLog('RATE_LIMITED', { playerId: playerId, gameId: gameId, score: score });
    return { error: 'Please wait before submitting again', rateLimited: true };
  }
  cache.put(rateLimitKey, '1', 300); // 5 分鐘冷卻

  // 5. 簽章驗證（如果前端有傳簽章）
  if (b.signature && b.startTime) {
    if (!verifyScoreSignature(playerId, gameId, score, b.startTime, b.signature)) {
      auditLog('CHEAT_BLOCKED', { playerId: playerId, gameId: gameId, score: score, reason: 'bad_signature' });
      return { error: 'Invalid signature', blocked: true };
    }
  }

  // 6. 寫入分數
  getSheet('GameScores').appendRow([playerId, playerName, teamId, gameId, score, new Date().toISOString()]);
  getCache().remove('scores_' + gameId);
  getCache().remove('rankings');

  // 7. 更新遊戲獎勵排名
  updateGameBonusForGame(gameId);

  auditLog('submitScore', { playerId: playerId, gameId: gameId, score: score });
  return { success: true };
}

function updateGameBonusForGame(gameId) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var sd=getSheet('GameScores').getDataRange().getValues(); var gs=sd.slice(1).filter(function(r){return r[3]===gameId;});
    var teamBest={}; gs.forEach(function(r){var tid=r[2],score=r[4]; if(!teamBest[tid]||score>teamBest[tid]) teamBest[tid]=score;});
    var sorted=Object.entries(teamBest).sort(function(a,b){return b[1]-a[1];});
    var bonusPoints=[500,400,300,200,100];
    var ps=getSheet('TeamPoints'),pd=ps.getDataRange().getValues();
    for(var i=pd.length-1;i>=1;i--) { if(pd[i][1]==='game_bonus_'+gameId) ps.deleteRow(i+1); }
    sorted.slice(0,5).forEach(function(entry,idx){ ps.appendRow([parseInt(entry[0]),'game_bonus_'+gameId,bonusPoints[idx],gameId+' 第'+(idx+1)+'名',new Date().toISOString()]); });
    recalcAllTeamPoints();
  } finally {
    lock.releaseLock();
  }
}

function recalcAllTeamPoints() {
  var pd=getSheet('TeamPoints').getDataRange().getValues(); var totals={};
  pd.slice(1).forEach(function(r){ totals[r[0]]=(totals[r[0]]||0)+(r[2]||0); });
  var ts=getSheet('Teams'),td=ts.getDataRange().getValues();
  for(var i=1;i<td.length;i++) ts.getRange(i+1,4).setValue(totals[td[i][0]]||0);
  getCache().remove('teams'); getCache().remove('rankings');
}

function handleUploadPhoto(b) {
  try {
    var blob=Utilities.newBlob(Utilities.base64Decode(b.photoData),'image/jpeg','photo_'+Date.now()+'.jpg');
    var file=DriveApp.getFolderById(DRIVE_FOLDER_ID).createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW);
    var fid=file.getId();
    return {success:true,photoUrl:'https://lh3.googleusercontent.com/d/'+fid,thumbUrl:'https://drive.google.com/thumbnail?id='+fid+'&sz=w400',fileId:fid};
  } catch(e) { return {error:e.message}; }
}

// === Admin 登入（密碼換 Token）===
function handleAdminLogin(b) {
  if (b.password !== getAdminPassword()) return { error: 'Unauthorized' };
  var token = generateAdminToken();
  auditLog('adminLogin', { method: 'password' });
  return { success: true, token: token };
}

// === Admin 操作（改用 Token 驗證）===
function adminCheck(b) {
  return validateAdminToken(b.token) || b.password === getAdminPassword();
}

function handleBroadcast(b) {
  if (!adminCheck(b)) return { error: 'Unauthorized' };
  if (!b.content || typeof b.content !== 'string') return { error: 'Empty content' };
  getSheet('Broadcasts').appendRow([Date.now(), b.type||'text', b.content.substring(0, 500), new Date().toISOString()]);
  auditLog('broadcast', { type: b.type, contentLength: b.content.length });
  return { success:true };
}

function handleVerifyPhoto(b) {
  if (!adminCheck(b)) return { error: 'Unauthorized' };
  var s=getSheet('PhotoTasks'),d=s.getDataRange().getValues();
  for(var i=1;i<d.length;i++) {
    if(d[i][0]===b.submissionId) {
      var st=b.approved?'approved':'rejected'; s.getRange(i+1,7).setValue(st); s.getRange(i+1,9).setValue(new Date().toISOString());
      if(b.approved) {
        var tid=d[i][3],pid=d[i][1],pn=d[i][2],pts=300;
        getSheet('GameScores').appendRow([pid,pn,tid,'photo',pts,new Date().toISOString()]);
        getSheet('TeamPoints').appendRow([tid,'photo_task',pts,'拍照打卡通過',new Date().toISOString()]);
        recalcAllTeamPoints(); getCache().remove('scores_photo');
      }
      auditLog('verifyPhoto', { submissionId: b.submissionId, approved: b.approved, playerId: d[i][1] });
      return {success:true,status:st};
    }
  }
  return {error:'Not found'};
}

function handleAddManualPoints(b) {
  if (!adminCheck(b)) return { error: 'Unauthorized' };
  var pts = parseInt(b.points);
  if (isNaN(pts) || pts < -10000 || pts > 10000) return { error: 'Invalid points' };
  var tid = parseInt(b.teamId);
  if (isNaN(tid) || tid < 1 || tid > 60) return { error: 'Invalid teamId' };
  getSheet('TeamPoints').appendRow([tid, 'manual', pts, (b.detail||'').substring(0, 200), new Date().toISOString()]);
  recalcAllTeamPoints();
  auditLog('addManualPoints', { teamId: tid, points: pts, detail: b.detail });
  return { success: true };
}

function handleRecalcTeamPoints(b) { if (!adminCheck(b)) return { error:'Unauthorized' }; recalcAllTeamPoints(); return { success:true }; }

function handleSendChat(b) {
  if (!b.playerId || !b.content) return { error: 'Missing fields' };
  // 聊天頻率限制：每 3 秒 1 條
  var cache = getCache();
  var chatRateKey = 'chat_rate_' + b.playerId;
  if (cache.get(chatRateKey)) return { error: 'Too fast', rateLimited: true };
  cache.put(chatRateKey, '1', 3);
  var content = b.content.substring(0, 200).replace(/<[^>]*>/g, ''); // 移除 HTML 標籤
  getSheet('Chat').appendRow([Date.now(), b.channel, b.teamId, b.playerId, b.playerName, b.teamName, b.teamEmoji, content, new Date().toISOString()]);
  return { success:true };
}

function handleUpdateLocation(b) { var s=getSheet('PlayerLocations'),d=s.getDataRange().getValues(); for(var i=1;i<d.length;i++){if(d[i][0]===b.playerId){s.getRange(i+1,4).setValue(b.lat);s.getRange(i+1,5).setValue(b.lng);s.getRange(i+1,6).setValue(new Date().toISOString());return{success:true};}} s.appendRow([b.playerId,b.playerName,b.teamId,b.lat,b.lng,new Date().toISOString()]); return{success:true}; }
function handleSubmitPhotoTask(b) { var id='ph_'+Date.now(); getSheet('PhotoTasks').appendRow([id,b.playerId,b.playerName,b.teamId,b.gameId||'photo',b.photoUrl,'pending',new Date().toISOString(),'']); return{success:true,submissionId:id}; }

// Init spreadsheet
function initSpreadsheet() {
  var ss=SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheets={
    'Teams':['teamId','teamName','teamEmoji','totalPoints'],
    'Players':['playerId','name','teamId','registeredAt'],
    'GameScores':['playerId','playerName','teamId','gameId','score','timestamp'],
    'GameUnlocks':['playerId','gameId','unlockedAt','lat','lng'],
    'TeamPoints':['teamId','source','points','detail','timestamp'],
    'Broadcasts':['broadcastId','type','content','timestamp'],
    'Config':['key','value'],
    'Chat':['msgId','channel','teamId','playerId','playerName','teamName','teamEmoji','content','timestamp'],
    'PlayerLocations':['playerId','playerName','teamId','lat','lng','timestamp'],
    'PhotoTasks':['submissionId','playerId','playerName','teamId','gameId','photoUrl','status','submittedAt','verifiedAt'],
    'AuditLog':['timestamp','action','details','ip']
  };
  Object.entries(sheets).forEach(function(entry){
    var name = entry[0], headers = entry[1];
    var sheet=ss.getSheetByName(name); if(!sheet) sheet=ss.insertSheet(name);
    var existing=sheet.getRange(1,1,1,headers.length).getValues()[0];
    if(!existing[0]){sheet.getRange(1,1,1,headers.length).setValues([headers]);sheet.getRange(1,1,1,headers.length).setFontWeight('bold');}
  });
  // 60 teams
  var ts=ss.getSheetByName('Teams');
  if(ts.getLastRow()<=1){
    var names=[['火焰','🔥'],['雷霆','⚡'],['海浪','🌊'],['星辰','⭐'],['旋風','🌪️'],['鑽石','💎'],['火箭','🚀'],['極光','✨'],['彩虹','🌈'],['閃電','🌩️'],['獅王','🦁'],['飛鷹','🦅'],['猛虎','🐯'],['黑豹','🐆'],['巨熊','🐻'],['銀狼','🐺'],['金龍','🐲'],['鳳凰','🔮'],['麒麟','🦄'],['飛魚','🐟'],['戰神','⚔️'],['守護','🛡️'],['征服','🏴'],['榮耀','🏆'],['傳說','📜'],['霸王','👑'],['勇者','🗡️'],['先鋒','🚩'],['突擊','💥'],['無敵','🔱'],['烈日','☀️'],['寒冰','❄️'],['暴風','💨'],['雷電','🔋'],['岩石','🪨'],['流星','☄️'],['月光','🌙'],['朝陽','🌅'],['夜影','🌑'],['曙光','🌤️'],['幻影','👻'],['疾風','🍃'],['烈焰','🌋'],['冰晶','💠'],['雷鳴','🎯'],['颶風','🌀'],['隕石','💫'],['極速','⏱️'],['巔峰','🏔️'],['王牌','🃏'],['勝利','🎖️'],['榮光','🌟'],['無畏','💪'],['絕影','🦇'],['蒼穹','🌌'],['狂潮','🌊'],['赤焰','🧨'],['紫電','💜'],['翠風','🍀'],['金剛','💛']];
    var teams=names.map(function(n,i){return [i+1,n[0]+'隊',n[1],0];});
    ts.getRange(2,1,teams.length,4).setValues(teams);
  }
  Logger.log('初始化完成！');
}
