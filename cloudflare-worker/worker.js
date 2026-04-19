// ============================================================
// MetroWalk Adventure - Cloudflare Workers Backend
// 完整對應 GAS 22 個 API 端點 + 防作弊 + R2 照片儲存
// ============================================================

// === 遊戲分數上限（與 GAS 一致）===
const GAME_LIMITS = {
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

// === Quiz 題庫（後端保存，答案不送前端）===
const QUIZ_BANK = [
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

// === 遊戲座標 ===
const GAME_LOCATIONS = [
  {gameId:'pacman',lat:24.95740,lng:121.22560},{gameId:'catch',lat:24.95760,lng:121.22600},
  {gameId:'snake',lat:24.95730,lng:121.22570},{gameId:'whack',lat:24.95750,lng:121.22590},
  {gameId:'memory',lat:24.95740,lng:121.22580},{gameId:'breaker',lat:24.95760,lng:121.22560},
  {gameId:'quiz',lat:24.95750,lng:121.22570},{gameId:'shooter',lat:24.95730,lng:121.22590},
  {gameId:'dodge',lat:24.95740,lng:121.22600},{gameId:'reaction',lat:24.95760,lng:121.22580},
  {gameId:'rhythm',lat:24.95750,lng:121.22560},{gameId:'photo',lat:24.95730,lng:121.22600}
];

// ============================================================
// 主入口
// ============================================================
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const corsHeaders = {
      'Access-Control-Allow-Origin': env.CORS_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // === IP Rate Limit（防 DDoS / 作弊腳本爆擊）===
    // 每 IP 每 10 秒最多 60 次請求
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const rlKey = 'ip_rl_' + ip;
    const rlData = await env.KV.get(rlKey, 'json') || { count: 0, start: Date.now() };
    const now = Date.now();
    if (now - rlData.start > 10000) { rlData.count = 0; rlData.start = now; }
    rlData.count++;
    if (rlData.count > 60) {
      return new Response(JSON.stringify({ error: 'Rate limited', retry: 10 }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    // 非同步更新計數（不阻擋回應）
    ctx.waitUntil(env.KV.put(rlKey, JSON.stringify(rlData), { expirationTtl: 60 }));

    try {
      let result;
      if (request.method === 'GET') {
        const params = Object.fromEntries(url.searchParams);
        result = await handleGet(params, env);
      } else if (request.method === 'POST') {
        const body = await request.json();
        result = await handlePost(body, env, request, ctx);
      } else {
        result = { error: 'Method not allowed' };
      }
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }
};

// ============================================================
// Durable Object：團隊分數分散式計數器
// 每個 TeamCounter 實例管理一支隊伍的分數
// 記憶體內即時更新，背景同步到 D1
// 優點：原子遞增、無競態條件、<10ms 延遲
// ============================================================
export class TeamCounter {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.scores = new Map(); // teamId → totalPoints
    this.dirty = false;
  }

  async fetch(request) {
    const url = new URL(request.url);
    const op = url.searchParams.get('op');

    // 首次載入：從 D1 讀取所有隊伍分數
    if (this.scores.size === 0) {
      const { results } = await this.env.DB.prepare(
        'SELECT teamId, totalPoints FROM Teams'
      ).all();
      results.forEach(r => this.scores.set(r.teamId, r.totalPoints || 0));
    }

    if (op === 'get') {
      return Response.json({ rankings: [...this.scores.entries()].map(([teamId, pts]) => ({ teamId, totalPoints: pts })) });
    }

    if (op === 'increment') {
      const { teamId, delta } = await request.json();
      const cur = this.scores.get(teamId) || 0;
      this.scores.set(teamId, cur + delta);
      this.dirty = true;
      // 背景 flush 到 D1（不阻擋回應）
      this.state.waitUntil(this.flushToD1());
      return Response.json({ success: true, teamId, newTotal: cur + delta });
    }

    if (op === 'set') {
      const { teamId, total } = await request.json();
      this.scores.set(teamId, total);
      this.dirty = true;
      this.state.waitUntil(this.flushToD1());
      return Response.json({ success: true });
    }

    if (op === 'resync') {
      // 從 D1 TeamPoints 重新計算
      const { results } = await this.env.DB.prepare(
        'SELECT teamId, SUM(points) as total FROM TeamPoints GROUP BY teamId'
      ).all();
      this.scores.clear();
      results.forEach(r => this.scores.set(r.teamId, r.total || 0));
      this.dirty = true;
      this.state.waitUntil(this.flushToD1());
      return Response.json({ success: true, count: results.length });
    }

    return new Response('Unknown op', { status: 400 });
  }

  async flushToD1() {
    if (!this.dirty) return;
    this.dirty = false;
    const entries = [...this.scores.entries()];
    if (!entries.length) return;
    // 批次寫入 Teams 表
    const stmts = entries.map(([teamId, pts]) =>
      this.env.DB.prepare('UPDATE Teams SET totalPoints = ? WHERE teamId = ?').bind(pts, teamId)
    );
    try {
      await this.env.DB.batch(stmts);
      await this.env.KV.delete('teams');
      await this.env.KV.delete('rankings');
    } catch (e) {
      this.dirty = true; // 失敗保留 dirty flag 下次再試
    }
  }
}

// 工具函數：取得單一 global TeamCounter（所有請求共用同一實例）
function getTeamCounter(env) {
  const id = env.TEAM_COUNTER.idFromName('global');
  return env.TEAM_COUNTER.get(id);
}

async function doIncrement(env, teamId, delta) {
  const stub = getTeamCounter(env);
  await stub.fetch('https://do/counter?op=increment', {
    method: 'POST',
    body: JSON.stringify({ teamId, delta })
  });
}

async function doGetRankings(env) {
  const stub = getTeamCounter(env);
  const res = await stub.fetch('https://do/counter?op=get');
  return await res.json();
}

async function doResync(env) {
  const stub = getTeamCounter(env);
  const res = await stub.fetch('https://do/counter?op=resync');
  return await res.json();
}

// ============================================================
// GET 路由
// ============================================================
async function handleGet(p, env) {
  const action = p.action;
  switch (action) {
    case 'getTeams':         return getTeams(env);
    case 'getPlayer':        return getPlayer(p, env);
    case 'getGameScores':    return getGameScores(p, env);
    case 'getTeamRankings':  return getTeamRankings(env);
    case 'getBroadcasts':    return getBroadcasts(p, env);
    case 'getGameLocations': return { locations: GAME_LOCATIONS };
    case 'getUnlocks':       return getUnlocks(p, env);
    case 'getConfig':        return { eventName:'大江購物冒險', eventDate:'2026-05-01', eventTime:'10:00-17:00' };
    case 'getDashboard':     return getDashboard(p, env);
    case 'getChat':          return getChat(p, env);
    case 'getTeamLocations': return getTeamLocations(p, env);
    case 'getPlayerTasks':   return getPlayerTasks(p, env);
    case 'getPhotoStatus':   return getPhotoStatus(p, env);
    case 'getPendingPhotos': return getPendingPhotos(p, env);
    case 'getQuizQuestion':  return getQuizQuestion(p, env);
    case 'startGame':        return startGame(p, env);
    case 'getOnlineTeam':    return getOnlineTeam(p, env);
    case 'getEventStatus':   return getEventStatus(p, env);
    default: return { error: 'Unknown action: ' + action };
  }
}

// ============================================================
// POST 路由
// ============================================================
async function handlePost(body, env, request, ctx) {
  const action = body.action;
  switch (action) {
    case 'register':         return register(body, env);
    case 'unlockGame':       return unlockGame(body, env);
    case 'submitScore':      return submitScore(body, env);
    case 'uploadPhoto':      return uploadPhoto(body, env);
    case 'broadcast':        return broadcast(body, env);
    case 'verifyPhoto':      return verifyPhoto(body, env);
    case 'addManualPoints':  return addManualPoints(body, env);
    case 'recalcTeamPoints': return recalcTeamPoints(body, env);
    case 'sendChat':         return sendChat(body, env);
    case 'updateLocation':   return updateLocation(body, env);
    case 'submitPhotoTask':  return submitPhotoTask(body, env);
    case 'answerQuiz':       return answerQuiz(body, env);
    case 'adminLogin':       return adminLogin(body, env);
    case 'resetAll':         return resetAll(body, env);
    case 'heartbeat':        return heartbeat(body, env);
    case 'updateEventTotal': return updateEventTotal(body, env);
    default: return { error: 'Unknown action' };
  }
}

// ============================================================
// 工具函數
// ============================================================
async function sha256hex(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return [...new Uint8Array(buf)].map(b => ('0' + b.toString(16)).slice(-2)).join('');
}

async function auditLog(env, action, details) {
  try {
    await env.DB.prepare('INSERT INTO AuditLog (timestamp, action, details) VALUES (?, ?, ?)')
      .bind(new Date().toISOString(), action, JSON.stringify(details).substring(0, 500))
      .run();
  } catch (e) { /* ignore */ }
}

// Admin 驗證
async function adminCheck(tokenOrPwd, env) {
  if (!tokenOrPwd) return false;
  // 先查 KV token
  const valid = await env.KV.get('admin_token_' + tokenOrPwd);
  if (valid === 'valid') return true;
  // 再比密碼
  return tokenOrPwd === env.ADMIN_PASSWORD;
}

// ============================================================
// GET Handlers
// ============================================================
async function getTeams(env) {
  // KV 快取 60 秒
  const cached = await env.KV.get('teams', 'json');
  if (cached) return cached;
  const { results } = await env.DB.prepare('SELECT teamId, teamName, teamEmoji, totalPoints FROM Teams ORDER BY teamId').all();
  const data = { teams: results };
  await env.KV.put('teams', JSON.stringify(data), { expirationTtl: 60 });
  return data;
}

async function getPlayer(p, env) {
  const row = await env.DB.prepare('SELECT playerId, name, teamId FROM Players WHERE playerId = ?').bind(p.playerId).first();
  if (!row) return { error: 'Not found' };
  return { player: row };
}

async function getGameScores(p, env) {
  const gameId = p.gameId;
  const limit = parseInt(p.limit) || 30;
  const cached = await env.KV.get('scores_' + gameId, 'json');
  if (cached) return cached;
  const { results } = await env.DB.prepare(
    'SELECT playerId, playerName, teamId, gameId, score, timestamp FROM GameScores WHERE gameId = ? ORDER BY score DESC LIMIT ?'
  ).bind(gameId, limit).all();
  const data = { scores: results };
  await env.KV.put('scores_' + gameId, JSON.stringify(data), { expirationTtl: 60 });
  return data;
}

async function getTeamRankings(env) {
  // KV 快取 60s（免費層級讀取）
  const cached = await env.KV.get('rankings', 'json');
  if (cached) return cached;
  // 優先從 Durable Object 讀（即時分數）+ 合併 Teams 名稱
  try {
    const doData = await doGetRankings(env);
    const { results: teams } = await env.DB.prepare(
      'SELECT teamId, teamName, teamEmoji FROM Teams'
    ).all();
    const nameMap = {};
    teams.forEach(t => { nameMap[t.teamId] = t; });
    const rankings = doData.rankings
      .map(r => ({
        teamId: r.teamId,
        teamName: nameMap[r.teamId]?.teamName || '',
        teamEmoji: nameMap[r.teamId]?.teamEmoji || '',
        totalPoints: r.totalPoints
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints);
    const data = { rankings };
    await env.KV.put('rankings', JSON.stringify(data), { expirationTtl: 60 });
    return data;
  } catch (e) {
    // DO 失敗 fallback 到 D1
    const { results } = await env.DB.prepare(
      'SELECT teamId, teamName, teamEmoji, totalPoints FROM Teams ORDER BY totalPoints DESC'
    ).all();
    const data = { rankings: results };
    await env.KV.put('rankings', JSON.stringify(data), { expirationTtl: 60 });
    return data;
  }
}

async function getBroadcasts(p, env) {
  const since = p.since || '';
  let results;
  if (since) {
    ({ results } = await env.DB.prepare(
      'SELECT broadcastId, type, content, timestamp FROM Broadcasts WHERE timestamp > ? ORDER BY timestamp ASC LIMIT 20'
    ).bind(since).all());
  } else {
    ({ results } = await env.DB.prepare(
      'SELECT broadcastId, type, content, timestamp FROM Broadcasts ORDER BY timestamp DESC LIMIT 20'
    ).all());
    results = results.reverse();
  }
  return { broadcasts: results };
}

async function getUnlocks(p, env) {
  const { results } = await env.DB.prepare(
    'SELECT gameId, unlockedAt FROM GameUnlocks WHERE playerId = ?'
  ).bind(p.playerId).all();
  return { unlocks: results };
}

async function getDashboard(p, env) {
  if (!await adminCheck(p.token || p.password, env)) return { error: 'Unauthorized' };
  const players = await env.DB.prepare('SELECT COUNT(*) as c FROM Players').first();
  const plays = await env.DB.prepare('SELECT COUNT(*) as c FROM GameScores').first();
  const pending = await env.DB.prepare("SELECT COUNT(*) as c FROM PhotoTasks WHERE status = 'pending'").first();
  return { totalPlayers: players.c, totalPlays: plays.c, pendingPhotos: pending.c };
}

async function getChat(p, env) {
  const ch = p.channel || 'world';
  const teamId = p.teamId;
  const since = p.since || '';
  // === 優化：無 since 的初次載入走 KV 快取 5 秒（降 D1 讀取）===
  if (!since) {
    const cacheKey = 'chat_' + ch + '_' + (teamId || '0');
    const cached = await env.KV.get(cacheKey, 'json');
    if (cached) return cached;
  }
  let results;
  if (ch === 'team') {
    if (since) {
      ({ results } = await env.DB.prepare(
        "SELECT msgId, channel, teamId, playerId, playerName, teamName, teamEmoji, content, timestamp FROM Chat WHERE channel = 'team' AND teamId = ? AND timestamp > ? ORDER BY timestamp ASC LIMIT 50"
      ).bind(parseInt(teamId), since).all());
    } else {
      ({ results } = await env.DB.prepare(
        "SELECT msgId, channel, teamId, playerId, playerName, teamName, teamEmoji, content, timestamp FROM Chat WHERE channel = 'team' AND teamId = ? ORDER BY timestamp DESC LIMIT 50"
      ).bind(parseInt(teamId)).all());
      results = results.reverse();
    }
  } else {
    if (since) {
      ({ results } = await env.DB.prepare(
        "SELECT msgId, channel, teamId, playerId, playerName, teamName, teamEmoji, content, timestamp FROM Chat WHERE channel = 'world' AND timestamp > ? ORDER BY timestamp ASC LIMIT 50"
      ).bind(since).all());
    } else {
      ({ results } = await env.DB.prepare(
        "SELECT msgId, channel, teamId, playerId, playerName, teamName, teamEmoji, content, timestamp FROM Chat WHERE channel = 'world' ORDER BY timestamp DESC LIMIT 50"
      ).all());
      results = results.reverse();
    }
  }
  const data = { messages: results };
  // 寫回 KV 快取（僅無 since 的初次載入）
  if (!since) {
    const cacheKey = 'chat_' + ch + '_' + (teamId || '0');
    await env.KV.put(cacheKey, JSON.stringify(data), { expirationTtl: 60 });
  }
  return data;
}

async function getTeamLocations(p, env) {
  // === 優化：KV 快取 10 秒（隊友位置不需即時）===
  const cacheKey = 'teamloc_' + p.teamId;
  const cached = await env.KV.get(cacheKey, 'json');
  if (cached) return cached;
  const cutoff = new Date(Date.now() - 120000).toISOString();
  const { results } = await env.DB.prepare(
    'SELECT playerId, playerName, teamId, lat, lng, timestamp FROM PlayerLocations WHERE teamId = ? AND timestamp > ?'
  ).bind(parseInt(p.teamId), cutoff).all();
  const data = { locations: results };
  await env.KV.put(cacheKey, JSON.stringify(data), { expirationTtl: 60 });
  return data;
}

async function getPlayerTasks(p, env) {
  const pid = p.playerId;
  const { results: unlocks } = await env.DB.prepare('SELECT DISTINCT gameId FROM GameUnlocks WHERE playerId = ?').bind(pid).all();
  const { results: scores } = await env.DB.prepare('SELECT DISTINCT gameId FROM GameScores WHERE playerId = ?').bind(pid).all();
  const unlockedSet = new Set(unlocks.map(r => r.gameId));
  const playedSet = new Set(scores.map(r => r.gameId));
  const games = ['pacman','snake','whack','memory','quiz','catch','breaker','shooter','dodge','reaction','rhythm','photo'];
  return { tasks: games.map(g => ({ gameId: g, unlocked: unlockedSet.has(g), played: playedSet.has(g) })) };
}

async function getPhotoStatus(p, env) {
  const row = await env.DB.prepare(
    'SELECT submissionId, playerId, playerName, teamId, gameId, photoUrl, status, submittedAt, verifiedAt FROM PhotoTasks WHERE playerId = ? AND gameId = ? ORDER BY submittedAt DESC LIMIT 1'
  ).bind(p.playerId, p.gameId || 'photo').first();
  if (!row) return { submission: null };
  let thumbUrl = row.photoUrl || '';
  // R2 URL 直接用
  return { submission: { ...row, thumbUrl, points: row.status === 'approved' ? 300 : 0 } };
}

async function getPendingPhotos(p, env) {
  if (!await adminCheck(p.token || p.password, env)) return { error: 'Unauthorized' };
  const { results } = await env.DB.prepare(
    'SELECT submissionId, playerId, playerName, teamId, gameId, photoUrl, status, submittedAt, verifiedAt FROM PhotoTasks ORDER BY CASE WHEN status = \'pending\' THEN 0 ELSE 1 END, submittedAt DESC'
  ).all();
  return { photos: results.map(r => ({ ...r, thumbUrl: r.photoUrl })) };
}

// === 遊戲開始 Token ===
async function startGame(p, env) {
  const { playerId, gameId } = p;
  if (!playerId || !gameId || !GAME_LIMITS[gameId]) return { error: 'Invalid params' };
  const ts = Date.now();
  const hash = await sha256hex(playerId + '|' + gameId + '|' + ts + '|' + env.SIGN_SECRET);
  const gameToken = hash.substring(0, 16);
  // KV 記錄開始時間（10 分鐘有效）
  await env.KV.put('game_start_' + playerId + '_' + gameId, String(ts), { expirationTtl: 600 });
  return { gameToken, startTime: ts };
}

// === Quiz 後端出題 ===
async function getQuizQuestion(p, env) {
  const { playerId } = p;
  const idx = parseInt(p.index) || 0;
  if (!playerId) return { error: 'Missing playerId' };

  // 用 playerId 做 seed 打亂題序
  let seed = 0;
  for (let i = 0; i < playerId.length; i++) seed += playerId.charCodeAt(i);
  const shuffled = [...QUIZ_BANK];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = (seed * (i + 1) + 7) % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const totalQuestions = 10;
  if (idx >= totalQuestions || idx >= shuffled.length) return { done: true, totalQuestions };

  const q = shuffled[idx];
  // 打亂選項
  const optionIndices = [0, 1, 2, 3];
  for (let i = optionIndices.length - 1; i > 0; i--) {
    const j = (seed * (idx + 1) * (i + 1) + 13) % (i + 1);
    [optionIndices[i], optionIndices[j]] = [optionIndices[j], optionIndices[i]];
  }
  const shuffledOptions = optionIndices.map(oi => q.options[oi]);
  const correctShuffled = optionIndices.indexOf(q.answer);

  // KV 記錄正確答案（60 秒有效）
  await env.KV.put('quiz_' + playerId + '_' + idx, String(correctShuffled), { expirationTtl: 60 });
  return { index: idx, total: totalQuestions, question: q.q, options: shuffledOptions, questionId: q.id };
}

// ============================================================
// POST Handlers
// ============================================================
async function register(b, env) {
  if (!b.playerId || !b.name || b.teamId === undefined) return { error: 'Missing fields' };
  const name = String(b.name).substring(0, 20);
  const teamId = parseInt(b.teamId);
  if (isNaN(teamId) || teamId < 1 || teamId > 60) return { error: 'Invalid teamId' };
  await env.DB.prepare('INSERT OR REPLACE INTO Players (playerId, name, teamId, registeredAt) VALUES (?, ?, ?, ?)')
    .bind(b.playerId, name, teamId, new Date().toISOString()).run();
  await env.KV.delete('teams');
  await auditLog(env, 'register', { playerId: b.playerId, name, teamId });
  return { success: true };
}

async function unlockGame(b, env) {
  if (!b.playerId || !b.gameId) return { error: 'Missing fields' };
  if (!GAME_LIMITS[b.gameId]) return { error: 'Invalid gameId' };
  let lat = parseFloat(b.lat), lng = parseFloat(b.lng);
  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) { lat = null; lng = null; }
  await env.DB.prepare('INSERT INTO GameUnlocks (playerId, gameId, unlockedAt, lat, lng) VALUES (?, ?, ?, ?, ?)')
    .bind(b.playerId, b.gameId, new Date().toISOString(), lat, lng).run();
  return { success: true };
}

// === 核心：分數提交（含完整防作弊）===
async function submitScore(b, env) {
  const { playerId, gameId, playerName, teamId } = b;
  const score = parseInt(b.score);
  if (!playerId || !gameId || isNaN(score)) return { error: 'Missing fields' };
  const limits = GAME_LIMITS[gameId];
  if (!limits) return { error: 'Invalid gameId' };

  // 1. 分數上限
  if (score < 0 || score > limits.maxScore) {
    await auditLog(env, 'CHEAT_BLOCKED', { playerId, gameId, score, reason: 'exceeds_max' });
    return { error: 'Score exceeds maximum', blocked: true };
  }

  // 2. 遊戲時間驗證
  const startTimeStr = await env.KV.get('game_start_' + playerId + '_' + gameId);
  if (startTimeStr) {
    const elapsed = (Date.now() - parseInt(startTimeStr)) / 1000;
    if (elapsed < 3) {
      await auditLog(env, 'CHEAT_BLOCKED', { playerId, gameId, score, reason: 'too_fast', elapsed });
      return { error: 'Game too short', blocked: true };
    }
    const maxPossible = limits.maxPerSec * Math.min(elapsed, limits.duration + 10);
    if (score > maxPossible) {
      await auditLog(env, 'CHEAT_BLOCKED', { playerId, gameId, score, reason: 'score_vs_time', elapsed, maxPossible });
      return { error: 'Score impossible for duration', blocked: true };
    }
  }

  // 3. 頻率限制：5 分鐘 1 次
  const rateKey = 'rate_' + playerId + '_' + gameId;
  if (await env.KV.get(rateKey)) {
    await auditLog(env, 'RATE_LIMITED', { playerId, gameId, score });
    return { error: 'Please wait before submitting again', rateLimited: true };
  }
  await env.KV.put(rateKey, '1', { expirationTtl: 300 });

  // 4. 簽章驗證
  if (b.signature && b.startTime) {
    const raw = playerId + '|' + gameId + '|' + score + '|' + b.startTime + '|' + env.SIGN_SECRET;
    const hash = await sha256hex(raw);
    if (hash.substring(0, 16) !== b.signature) {
      await auditLog(env, 'CHEAT_BLOCKED', { playerId, gameId, score, reason: 'bad_signature' });
      return { error: 'Invalid signature', blocked: true };
    }
  }

  // 5. 寫入
  await env.DB.prepare('INSERT INTO GameScores (playerId, playerName, teamId, gameId, score, timestamp) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(playerId, playerName, parseInt(teamId), gameId, score, new Date().toISOString()).run();
  await env.KV.delete('scores_' + gameId);
  await env.KV.delete('rankings');

  // 6. 更新遊戲獎勵
  await updateGameBonus(gameId, env);
  await auditLog(env, 'submitScore', { playerId, gameId, score });
  return { success: true };
}

async function updateGameBonus(gameId, env) {
  // 每隊最高分
  const { results } = await env.DB.prepare(
    'SELECT teamId, MAX(score) as bestScore FROM GameScores WHERE gameId = ? GROUP BY teamId ORDER BY bestScore DESC LIMIT 5'
  ).bind(gameId).all();

  const bonusPoints = [500, 400, 300, 200, 100];
  const now = new Date().toISOString();

  // === 優化：D1 batch() 一次送多個 query（降 90% round-trip）===
  const stmts = [
    env.DB.prepare("DELETE FROM TeamPoints WHERE source = ?").bind('game_bonus_' + gameId)
  ];
  for (let i = 0; i < results.length && i < 5; i++) {
    stmts.push(
      env.DB.prepare('INSERT INTO TeamPoints (teamId, source, points, detail, timestamp) VALUES (?, ?, ?, ?, ?)')
        .bind(results[i].teamId, 'game_bonus_' + gameId, bonusPoints[i], gameId + ' 第' + (i + 1) + '名', now)
    );
  }
  await env.DB.batch(stmts);
  await recalcPoints(env);
}

async function recalcPoints(env) {
  // === 優化：單一 SQL UPDATE 一次算完所有隊伍（取代 N 次 UPDATE）===
  await env.DB.prepare(`
    UPDATE Teams SET totalPoints = COALESCE(
      (SELECT SUM(points) FROM TeamPoints WHERE TeamPoints.teamId = Teams.teamId), 0
    )
  `).run();
  // 通知 Durable Object 重新同步
  try { await doResync(env); } catch (e) { /* DO 失敗不影響主流程 */ }
  await env.KV.delete('teams');
  await env.KV.delete('rankings');
}

// === 照片上傳 → R2 ===
async function uploadPhoto(b, env) {
  try {
    const photoData = b.photoData; // base64
    const bytes = Uint8Array.from(atob(photoData), c => c.charCodeAt(0));
    const key = 'photos/photo_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8) + '.jpg';
    await env.R2.put(key, bytes, { httpMetadata: { contentType: 'image/jpeg' } });
    // R2 公開 URL（優先使用 env.R2_PUBLIC_URL，否則 fallback 到預設 r2.dev 網址）
    const r2Base = (env.R2_PUBLIC_URL || 'https://pub-974830b23d4947ddb6250ae13ca82197.r2.dev').replace(/\/$/, '');
    const photoUrl = `${r2Base}/${key}`;
    return { success: true, photoUrl, thumbUrl: photoUrl, fileId: key };
  } catch (e) {
    return { error: e.message };
  }
}

// === Admin 登入 ===
async function adminLogin(b, env) {
  if (b.password !== env.ADMIN_PASSWORD) return { error: 'Unauthorized' };
  const token = crypto.randomUUID();
  await env.KV.put('admin_token_' + token, 'valid', { expirationTtl: 7200 });
  await auditLog(env, 'adminLogin', { method: 'password' });
  return { success: true, token };
}

// === Admin 操作 ===
async function broadcast(b, env) {
  if (!await adminCheck(b.token, env)) return { error: 'Unauthorized' };
  if (!b.content) return { error: 'Empty content' };
  await env.DB.prepare('INSERT INTO Broadcasts (broadcastId, type, content, timestamp) VALUES (?, ?, ?, ?)')
    .bind(Date.now(), b.type || 'text', String(b.content).substring(0, 500), new Date().toISOString()).run();
  await auditLog(env, 'broadcast', { type: b.type, contentLength: b.content.length });
  return { success: true };
}

async function verifyPhoto(b, env) {
  if (!await adminCheck(b.token, env)) return { error: 'Unauthorized' };
  const row = await env.DB.prepare('SELECT * FROM PhotoTasks WHERE submissionId = ?').bind(b.submissionId).first();
  if (!row) return { error: 'Not found' };
  const status = b.approved ? 'approved' : 'rejected';
  await env.DB.prepare('UPDATE PhotoTasks SET status = ?, verifiedAt = ? WHERE submissionId = ?')
    .bind(status, new Date().toISOString(), b.submissionId).run();
  if (b.approved) {
    const now = new Date().toISOString();
    await env.DB.prepare('INSERT INTO GameScores (playerId, playerName, teamId, gameId, score, timestamp) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(row.playerId, row.playerName, row.teamId, 'photo', 300, now).run();
    await env.DB.prepare('INSERT INTO TeamPoints (teamId, source, points, detail, timestamp) VALUES (?, ?, ?, ?, ?)')
      .bind(row.teamId, 'photo_task', 300, '拍照打卡通過', now).run();
    await recalcPoints(env);
    await env.KV.delete('scores_photo');
  }
  await auditLog(env, 'verifyPhoto', { submissionId: b.submissionId, approved: b.approved });
  return { success: true, status };
}

async function addManualPoints(b, env) {
  if (!await adminCheck(b.token, env)) return { error: 'Unauthorized' };
  const pts = parseInt(b.points);
  const tid = parseInt(b.teamId);
  if (isNaN(pts) || pts < -10000 || pts > 10000) return { error: 'Invalid points' };
  if (isNaN(tid) || tid < 1 || tid > 60) return { error: 'Invalid teamId' };
  await env.DB.prepare('INSERT INTO TeamPoints (teamId, source, points, detail, timestamp) VALUES (?, ?, ?, ?, ?)')
    .bind(tid, 'manual', pts, String(b.detail || '').substring(0, 200), new Date().toISOString()).run();
  await recalcPoints(env);
  await auditLog(env, 'addManualPoints', { teamId: tid, points: pts, detail: b.detail });
  return { success: true };
}

async function recalcTeamPoints(b, env) {
  if (!await adminCheck(b.token, env)) return { error: 'Unauthorized' };
  await recalcPoints(env);
  return { success: true };
}

// ============================================================
// 在線狀態系統（KV + TTL 90s）
// ============================================================
// Key 格式：presence_<teamId>_<playerId> → value: playerName|teamName|teamEmoji|timestamp
// 使用 KV.list({ prefix: 'presence_' }) 查詢所有在線

async function heartbeat(b, env) {
  if (!b.playerId || b.teamId === undefined) return { error: 'Missing fields' };
  const teamId = parseInt(b.teamId);
  const key = `presence_${teamId}_${b.playerId}`;
  const val = JSON.stringify({
    n: String(b.playerName || '').substring(0, 20),
    tn: String(b.teamName || '').substring(0, 20),
    te: String(b.teamEmoji || '').substring(0, 4),
    t: Date.now()
  });
  // TTL 90s（超過未續約 → 視為離線）
  await env.KV.put(key, val, { expirationTtl: 90 });
  return { success: true };
}

// 取得特定隊伍在線列表
async function getOnlineTeam(p, env) {
  const teamId = parseInt(p.teamId);
  if (isNaN(teamId)) return { error: 'Invalid teamId' };
  const list = await env.KV.list({ prefix: `presence_${teamId}_` });
  // 批次讀取 value（前 100 人）
  const keys = list.keys.slice(0, 100);
  const members = [];
  for (const k of keys) {
    const raw = await env.KV.get(k.name);
    if (!raw) continue;
    try {
      const v = JSON.parse(raw);
      const playerId = k.name.split('_').slice(2).join('_');
      members.push({ playerId, name: v.n, lastSeen: v.t });
    } catch (e) { /* ignore */ }
  }
  return { teamId, count: members.length, members };
}

// Admin 儀表板：整體在線狀態 + 各隊報到
async function getEventStatus(p, env) {
  // KV 快取 10 秒（昂貴操作）
  const cached = await env.KV.get('event_status', 'json');
  if (cached) return cached;

  // 1. 全體在線：列出所有 presence_ key
  const all = await env.KV.list({ prefix: 'presence_' });
  const onlineByTeam = {};
  let totalOnline = 0;
  all.keys.forEach(k => {
    const parts = k.name.split('_'); // presence_<teamId>_<playerId>
    const tid = parseInt(parts[1]);
    if (isNaN(tid)) return;
    onlineByTeam[tid] = (onlineByTeam[tid] || 0) + 1;
    totalOnline++;
  });

  // 2. 註冊總數 + 各隊註冊數
  const { results: teamCounts } = await env.DB.prepare(
    'SELECT teamId, COUNT(*) as registered FROM Players GROUP BY teamId'
  ).all();
  const registeredByTeam = {};
  let totalRegistered = 0;
  teamCounts.forEach(r => { registeredByTeam[r.teamId] = r.registered; totalRegistered += r.registered; });

  // 3. 預計總人數（從 Config 表）
  const cfg = await env.DB.prepare("SELECT value FROM Config WHERE key = 'event_total_people'").first();
  const eventTotal = cfg ? parseInt(cfg.value) || 0 : 0;

  // 4. 組合資料
  const { results: teams } = await env.DB.prepare('SELECT teamId, teamName, teamEmoji FROM Teams ORDER BY teamId').all();
  const teamStatus = teams.map(t => ({
    teamId: t.teamId,
    teamName: t.teamName,
    teamEmoji: t.teamEmoji,
    registered: registeredByTeam[t.teamId] || 0,
    online: onlineByTeam[t.teamId] || 0
  }));

  const data = {
    totalOnline,
    totalRegistered,
    eventTotal,
    onlinePercent: eventTotal > 0 ? Math.round(totalOnline / eventTotal * 100) : 0,
    registeredPercent: eventTotal > 0 ? Math.round(totalRegistered / eventTotal * 100) : 0,
    teams: teamStatus,
    timestamp: Date.now()
  };
  await env.KV.put('event_status', JSON.stringify(data), { expirationTtl: 60 });
  return data;
}

async function updateEventTotal(b, env) {
  if (!await adminCheck(b.token, env)) return { error: 'Unauthorized' };
  const total = parseInt(b.total);
  if (isNaN(total) || total < 0 || total > 100000) return { error: 'Invalid total' };
  await env.DB.prepare(
    "INSERT INTO Config (key, value) VALUES ('event_total_people', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  ).bind(String(total)).run();
  await env.KV.delete('event_status');
  await auditLog(env, 'updateEventTotal', { total });
  return { success: true, total };
}

async function sendChat(b, env) {
  if (!b.playerId || !b.content) return { error: 'Missing fields' };
  // 頻率限制：3 秒（KV 最小 TTL 60s，改用 timestamp 比對）
  const chatKey = 'chat_rate_' + b.playerId;
  const lastTs = await env.KV.get(chatKey);
  const now = Date.now();
  if (lastTs && now - parseInt(lastTs) < 3000) return { error: 'Too fast', rateLimited: true };
  await env.KV.put(chatKey, String(now), { expirationTtl: 60 });
  const content = String(b.content).substring(0, 200).replace(/<[^>]*>/g, '');
  await env.DB.prepare('INSERT INTO Chat (msgId, channel, teamId, playerId, playerName, teamName, teamEmoji, content, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(Date.now(), b.channel, parseInt(b.teamId), b.playerId, b.playerName, b.teamName || '', b.teamEmoji || '', content, new Date().toISOString()).run();
  // 失效相關快取
  await env.KV.delete('chat_' + (b.channel || 'world') + '_' + (b.teamId || '0'));
  return { success: true };
}

async function updateLocation(b, env) {
  // === 優化：每位玩家最多 15 秒寫一次（降 80% 寫入）===
  // 2000 人 × 每 15s 寫入 = 133 次/秒，D1 可承受
  const throttleKey = 'loc_throttle_' + b.playerId;
  const lastTs = await env.KV.get(throttleKey);
  const now = Date.now();
  if (lastTs && now - parseInt(lastTs) < 15000) return { success: true, throttled: true };
  await env.KV.put(throttleKey, String(now), { expirationTtl: 60 });

  await env.DB.prepare(
    'INSERT OR REPLACE INTO PlayerLocations (playerId, playerName, teamId, lat, lng, timestamp) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(b.playerId, b.playerName, parseInt(b.teamId), b.lat, b.lng, new Date().toISOString()).run();
  return { success: true };
}

async function submitPhotoTask(b, env) {
  const id = 'ph_' + Date.now();
  await env.DB.prepare('INSERT INTO PhotoTasks (submissionId, playerId, playerName, teamId, gameId, photoUrl, status, submittedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(id, b.playerId, b.playerName, parseInt(b.teamId), b.gameId || 'photo', b.photoUrl, 'pending', new Date().toISOString()).run();
  return { success: true, submissionId: id };
}

async function answerQuiz(b, env) {
  const { playerId, index, selected } = b;
  if (playerId === undefined || index === undefined || selected === undefined) return { error: 'Missing params' };
  const correctStr = await env.KV.get('quiz_' + playerId + '_' + index);
  if (correctStr === null) return { error: 'Question expired' };
  const correct = parseInt(correctStr) === selected;
  await env.KV.delete('quiz_' + playerId + '_' + index);
  return { correct, correctIndex: parseInt(correctStr) };
}

async function resetAll(b, env) {
  if (!await adminCheck(b.token, env)) return { error: 'Unauthorized' };
  await env.DB.exec('DELETE FROM GameScores');
  await env.DB.exec('DELETE FROM GameUnlocks');
  await env.DB.exec('DELETE FROM TeamPoints');
  await env.DB.exec('DELETE FROM Chat');
  await env.DB.exec('DELETE FROM PlayerLocations');
  await env.DB.exec('DELETE FROM PhotoTasks');
  await env.DB.exec('DELETE FROM Broadcasts');
  await env.DB.exec('DELETE FROM Players');
  await env.DB.exec('UPDATE Teams SET totalPoints = 0');
  await env.KV.delete('teams');
  await env.KV.delete('rankings');
  await auditLog(env, 'resetAll', {});
  return { success: true };
}
