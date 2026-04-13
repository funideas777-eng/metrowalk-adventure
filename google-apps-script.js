const SPREADSHEET_ID = '1T2W6y_h98vynj0GDBVkndW-SvFW0tC07cfyg328L1vM';
const DRIVE_FOLDER_ID = '1KGxeqM60AtekJQCLqHhrIdIVyb9FLF6y';
const ADMIN_PASSWORD = '11201120';

function doGet(e) {
  const action = e.parameter.action;
  const handlers = {
    getTeams: handleGetTeams, getPlayer: handleGetPlayer,
    getGameScores: handleGetGameScores, getTeamRankings: handleGetTeamRankings,
    getBroadcasts: handleGetBroadcasts, getGameLocations: handleGetGameLocations,
    getUnlocks: handleGetUnlocks, getConfig: handleGetConfig,
    getDashboard: handleGetDashboard, getChat: handleGetChat,
    getTeamLocations: handleGetTeamLocations, getPlayerTasks: handleGetPlayerTasks,
    getPhotoStatus: handleGetPhotoStatus, getPendingPhotos: handleGetPendingPhotos
  };
  const handler = handlers[action];
  if (!handler) return jsonResponse({ error: 'Unknown action: ' + action });
  try { return jsonResponse(handler(e.parameter)); } catch (err) { return jsonResponse({ error: err.message }); }
}

function doPost(e) {
  let body;
  try { body = JSON.parse(e.postData.contents); } catch { return jsonResponse({ error: 'Invalid JSON' }); }
  const handlers = {
    register: handleRegister, unlockGame: handleUnlockGame,
    submitScore: handleSubmitScore, uploadPhoto: handleUploadPhoto,
    broadcast: handleBroadcast, verifyPhoto: handleVerifyPhoto,
    addManualPoints: handleAddManualPoints, recalcTeamPoints: handleRecalcTeamPoints,
    sendChat: handleSendChat, updateLocation: handleUpdateLocation,
    submitPhotoTask: handleSubmitPhotoTask
  };
  const handler = handlers[body.action];
  if (!handler) return jsonResponse({ error: 'Unknown action' });
  try { return jsonResponse(handler(body)); } catch (err) { return jsonResponse({ error: err.message }); }
}

function jsonResponse(data) { return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON); }
function getSheet(name) { return SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(name); }
function getCache() { return CacheService.getScriptCache(); }

// GET handlers
function handleGetTeams(p) { const c = getCache(), cached = c.get('teams'); if (cached) return JSON.parse(cached); const s = getSheet('Teams'), d = s.getDataRange().getValues(); const teams = d.slice(1).map(r => ({ teamId:r[0], teamName:r[1], teamEmoji:r[2], totalPoints:r[3]||0 })); const result = { teams }; c.put('teams', JSON.stringify(result), 60); return result; }
function handleGetPlayer(p) { const d = getSheet('Players').getDataRange().getValues(); const r = d.find(r => r[0]===p.playerId); if (!r) return { error:'Not found' }; return { player:{ playerId:r[0], name:r[1], teamId:r[2] }}; }
function handleGetGameScores(p) { const gid = p.gameId, limit = parseInt(p.limit)||30; const c = getCache(), ck = 'scores_'+gid, cached = c.get(ck); if (cached) return JSON.parse(cached); const d = getSheet('GameScores').getDataRange().getValues(); const scores = d.slice(1).filter(r=>r[3]===gid).map(r=>({playerId:r[0],playerName:r[1],teamId:r[2],gameId:r[3],score:r[4],timestamp:r[5]})).sort((a,b)=>b.score-a.score).slice(0,limit); const result = { scores }; c.put(ck, JSON.stringify(result), 5); return result; }
function handleGetTeamRankings(p) { const c = getCache(), cached = c.get('rankings'); if (cached) return JSON.parse(cached); const d = getSheet('Teams').getDataRange().getValues(); const rankings = d.slice(1).map(r=>({teamId:r[0],teamName:r[1],teamEmoji:r[2],totalPoints:r[3]||0})).sort((a,b)=>b.totalPoints-a.totalPoints); const result = { rankings }; c.put('rankings', JSON.stringify(result), 10); return result; }
function handleGetBroadcasts(p) { const since = p.since||''; const d = getSheet('Broadcasts').getDataRange().getValues(); let b = d.slice(1).map(r=>({broadcastId:r[0],type:r[1],content:r[2],timestamp:r[3]})); if (since) b = b.filter(x=>x.timestamp>since); b.sort((a,b)=>a.timestamp>b.timestamp?1:-1); return { broadcasts:b.slice(-20) }; }
function handleGetGameLocations(p) { return { locations: [ {gameId:'pacman',lat:24.95740,lng:121.22560},{gameId:'catch',lat:24.95760,lng:121.22600},{gameId:'snake',lat:24.95730,lng:121.22570},{gameId:'whack',lat:24.95750,lng:121.22590},{gameId:'memory',lat:24.95740,lng:121.22580},{gameId:'breaker',lat:24.95760,lng:121.22560},{gameId:'quiz',lat:24.95750,lng:121.22570},{gameId:'shooter',lat:24.95730,lng:121.22590},{gameId:'dodge',lat:24.95740,lng:121.22600},{gameId:'reaction',lat:24.95760,lng:121.22580},{gameId:'rhythm',lat:24.95750,lng:121.22560},{gameId:'photo',lat:24.95730,lng:121.22600} ]}; }
function handleGetUnlocks(p) { const d = getSheet('GameUnlocks').getDataRange().getValues(); return { unlocks: d.slice(1).filter(r=>r[0]===p.playerId).map(r=>({gameId:r[1],unlockedAt:r[2]})) }; }
function handleGetConfig(p) { return { eventName:'大江購物冒險', eventDate:'2026-05-01', eventTime:'10:00-17:00' }; }
function handleGetDashboard(p) {
  if (p.password !== ADMIN_PASSWORD) return { error:'Unauthorized' };
  const players = getSheet('Players').getLastRow()-1, plays = getSheet('GameScores').getLastRow()-1;
  let pendingPhotos = 0; const ps = getSheet('PhotoTasks');
  if (ps && ps.getLastRow()>1) { pendingPhotos = ps.getDataRange().getValues().slice(1).filter(r=>r[6]==='pending').length; }
  return { totalPlayers:Math.max(0,players), totalPlays:Math.max(0,plays), pendingPhotos };
}
function handleGetChat(p) { const ch=p.channel||'world',tid=p.teamId,since=p.since||''; const s=getSheet('Chat'); if(!s) return {messages:[]}; const d=s.getDataRange().getValues(); let msgs=d.slice(1).map(r=>({msgId:r[0],channel:r[1],teamId:r[2],playerId:r[3],playerName:r[4],teamName:r[5],teamEmoji:r[6],content:r[7],timestamp:r[8]})); if(ch==='team') msgs=msgs.filter(m=>m.channel==='team'&&String(m.teamId)===String(tid)); else msgs=msgs.filter(m=>m.channel==='world'); if(since) msgs=msgs.filter(m=>m.timestamp>since); return {messages:msgs.slice(-50)}; }
function handleGetTeamLocations(p) { const s=getSheet('PlayerLocations'); if(!s) return {locations:[]}; const d=s.getDataRange().getValues(),now=new Date().getTime(); return {locations:d.slice(1).filter(r=>String(r[2])===String(p.teamId)&&(now-new Date(r[5]).getTime())<120000).map(r=>({playerId:r[0],playerName:r[1],teamId:r[2],lat:r[3],lng:r[4],timestamp:r[5]}))}; }
function handleGetPlayerTasks(p) { const pid=p.playerId; const ud=getSheet('GameUnlocks').getDataRange().getValues(),sd=getSheet('GameScores').getDataRange().getValues(); const unlocked=new Set(ud.slice(1).filter(r=>r[0]===pid).map(r=>r[1])), played=new Set(sd.slice(1).filter(r=>r[0]===pid).map(r=>r[3])); return {tasks:['pacman','snake','whack','memory','quiz','catch','breaker','shooter','dodge','reaction','rhythm','photo'].map(g=>({gameId:g,unlocked:unlocked.has(g),played:played.has(g)}))}; }
function handleGetPhotoStatus(p) {
  const s=getSheet('PhotoTasks'); if(!s) return {submission:null}; const d=s.getDataRange().getValues();
  const rows=d.slice(1).filter(r=>r[1]===p.playerId&&r[4]===(p.gameId||'photo'));
  if(!rows.length) return {submission:null};
  const l=rows[rows.length-1]; const photoUrl=l[5]||'';
  let thumbUrl=photoUrl; const match=photoUrl.match(/\/d\/([^\/\?]+)/); if(match) thumbUrl='https://drive.google.com/thumbnail?id='+match[1]+'&sz=w400';
  return {submission:{submissionId:l[0],playerId:l[1],playerName:l[2],teamId:l[3],gameId:l[4],photoUrl,thumbUrl,status:l[6],submittedAt:l[7],verifiedAt:l[8],points:l[6]==='approved'?300:0}};
}
function handleGetPendingPhotos(p) {
  if(p.password!==ADMIN_PASSWORD) return {error:'Unauthorized'}; const s=getSheet('PhotoTasks'); if(!s) return {photos:[]};
  return {photos:s.getDataRange().getValues().slice(1).map((r,i)=>{const url=r[5]||'';let thumb=url;const m=url.match(/\/d\/([^\/\?]+)/);if(m)thumb='https://drive.google.com/thumbnail?id='+m[1]+'&sz=w400';return{row:i+2,submissionId:r[0],playerId:r[1],playerName:r[2],teamId:r[3],gameId:r[4],photoUrl:url,thumbUrl:thumb,status:r[6],submittedAt:r[7],verifiedAt:r[8]};})};
}

// POST handlers
function handleRegister(b) { getSheet('Players').appendRow([b.playerId,b.name,b.teamId,new Date().toISOString()]); getCache().remove('teams'); return {success:true}; }
function handleUnlockGame(b) { getSheet('GameUnlocks').appendRow([b.playerId,b.gameId,new Date().toISOString(),b.lat||'',b.lng||'']); return {success:true}; }
function handleSubmitScore(b) { getSheet('GameScores').appendRow([b.playerId,b.playerName,b.teamId,b.gameId,b.score,new Date().toISOString()]); getCache().remove('scores_'+b.gameId); getCache().remove('rankings'); updateGameBonusForGame(b.gameId); return {success:true}; }

function updateGameBonusForGame(gameId) {
  const sd=getSheet('GameScores').getDataRange().getValues(); const gs=sd.slice(1).filter(r=>r[3]===gameId);
  const teamBest={}; gs.forEach(r=>{const tid=r[2],score=r[4]; if(!teamBest[tid]||score>teamBest[tid]) teamBest[tid]=score;});
  const sorted=Object.entries(teamBest).sort((a,b)=>b[1]-a[1]);
  const bonusPoints=[500,400,300,200,100]; // Top 5
  const ps=getSheet('TeamPoints'),pd=ps.getDataRange().getValues();
  for(let i=pd.length-1;i>=1;i--) { if(pd[i][1]==='game_bonus_'+gameId) ps.deleteRow(i+1); }
  sorted.slice(0,5).forEach(([tid,score],idx)=>{ ps.appendRow([parseInt(tid),'game_bonus_'+gameId,bonusPoints[idx],`${gameId} 第${idx+1}名`,new Date().toISOString()]); });
  recalcAllTeamPoints();
}

function recalcAllTeamPoints() {
  const pd=getSheet('TeamPoints').getDataRange().getValues(); const totals={};
  pd.slice(1).forEach(r=>{ totals[r[0]]=(totals[r[0]]||0)+(r[2]||0); });
  const ts=getSheet('Teams'),td=ts.getDataRange().getValues();
  for(let i=1;i<td.length;i++) ts.getRange(i+1,4).setValue(totals[td[i][0]]||0);
  getCache().remove('teams'); getCache().remove('rankings');
}

function handleUploadPhoto(b) {
  try {
    const blob=Utilities.newBlob(Utilities.base64Decode(b.photoData),'image/jpeg','photo_'+Date.now()+'.jpg');
    const file=DriveApp.getFolderById(DRIVE_FOLDER_ID).createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW);
    const fid=file.getId();
    return {success:true,photoUrl:'https://lh3.googleusercontent.com/d/'+fid,thumbUrl:'https://drive.google.com/thumbnail?id='+fid+'&sz=w400',fileId:fid};
  } catch(e) { return {error:e.message}; }
}

function handleBroadcast(b) { if(b.password!==ADMIN_PASSWORD) return {error:'Unauthorized'}; getSheet('Broadcasts').appendRow([Date.now(),b.type||'text',b.content,new Date().toISOString()]); return {success:true}; }

function handleVerifyPhoto(b) {
  if(b.password!==ADMIN_PASSWORD) return {error:'Unauthorized'};
  const s=getSheet('PhotoTasks'),d=s.getDataRange().getValues();
  for(let i=1;i<d.length;i++) {
    if(d[i][0]===b.submissionId) {
      const st=b.approved?'approved':'rejected'; s.getRange(i+1,7).setValue(st); s.getRange(i+1,9).setValue(new Date().toISOString());
      if(b.approved) {
        const tid=d[i][3],pid=d[i][1],pn=d[i][2],pts=300;
        getSheet('GameScores').appendRow([pid,pn,tid,'photo',pts,new Date().toISOString()]);
        getSheet('TeamPoints').appendRow([tid,'photo_task',pts,'拍照打卡通過',new Date().toISOString()]);
        recalcAllTeamPoints(); getCache().remove('scores_photo');
      }
      return {success:true,status:st};
    }
  }
  return {error:'Not found'};
}

function handleAddManualPoints(b) { if(b.password!==ADMIN_PASSWORD) return {error:'Unauthorized'}; getSheet('TeamPoints').appendRow([b.teamId,'manual',b.points,b.detail||'',new Date().toISOString()]); recalcAllTeamPoints(); return {success:true}; }
function handleRecalcTeamPoints(b) { if(b.password!==ADMIN_PASSWORD) return {error:'Unauthorized'}; recalcAllTeamPoints(); return {success:true}; }
function handleSendChat(b) { getSheet('Chat').appendRow([Date.now(),b.channel,b.teamId,b.playerId,b.playerName,b.teamName,b.teamEmoji,b.content,new Date().toISOString()]); return {success:true}; }
function handleUpdateLocation(b) { const s=getSheet('PlayerLocations'),d=s.getDataRange().getValues(); for(let i=1;i<d.length;i++){if(d[i][0]===b.playerId){s.getRange(i+1,4).setValue(b.lat);s.getRange(i+1,5).setValue(b.lng);s.getRange(i+1,6).setValue(new Date().toISOString());return{success:true};}} s.appendRow([b.playerId,b.playerName,b.teamId,b.lat,b.lng,new Date().toISOString()]); return{success:true}; }
function handleSubmitPhotoTask(b) { const id='ph_'+Date.now(); getSheet('PhotoTasks').appendRow([id,b.playerId,b.playerName,b.teamId,b.gameId||'photo',b.photoUrl,'pending',new Date().toISOString(),'']); return{success:true,submissionId:id}; }

// Init spreadsheet
function initSpreadsheet() {
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheets={
    'Teams':['teamId','teamName','teamEmoji','totalPoints'],
    'Players':['playerId','name','teamId','registeredAt'],
    'GameScores':['playerId','playerName','teamId','gameId','score','timestamp'],
    'GameUnlocks':['playerId','gameId','unlockedAt','lat','lng'],
    'TeamPoints':['teamId','source','points','detail','timestamp'],
    'Broadcasts':['broadcastId','type','content','timestamp'],
    'Config':['key','value'],
    'Chat':['msgId','channel','teamId','playerId','playerName','teamName','teamEmoji','content','timestamp'],
    'PlayerLocations':['playerId','playerName','teamId','lat','lng','timestamp'],
    'PhotoTasks':['submissionId','playerId','playerName','teamId','gameId','photoUrl','status','submittedAt','verifiedAt']
  };
  Object.entries(sheets).forEach(([name,headers])=>{
    let sheet=ss.getSheetByName(name); if(!sheet) sheet=ss.insertSheet(name);
    const existing=sheet.getRange(1,1,1,headers.length).getValues()[0];
    if(!existing[0]){sheet.getRange(1,1,1,headers.length).setValues([headers]);sheet.getRange(1,1,1,headers.length).setFontWeight('bold');}
  });
  // 60 teams
  const ts=ss.getSheetByName('Teams');
  if(ts.getLastRow()<=1){
    const names=[['火焰','🔥'],['雷霆','⚡'],['海浪','🌊'],['星辰','⭐'],['旋風','🌪️'],['鑽石','💎'],['火箭','🚀'],['極光','✨'],['彩虹','🌈'],['閃電','🌩️'],['獅王','🦁'],['飛鷹','🦅'],['猛虎','🐯'],['黑豹','🐆'],['巨熊','🐻'],['銀狼','🐺'],['金龍','🐲'],['鳳凰','🔮'],['麒麟','🦄'],['飛魚','🐟'],['戰神','⚔️'],['守護','🛡️'],['征服','🏴'],['榮耀','🏆'],['傳說','📜'],['霸王','👑'],['勇者','🗡️'],['先鋒','🚩'],['突擊','💥'],['無敵','🔱'],['烈日','☀️'],['寒冰','❄️'],['暴風','💨'],['雷電','🔋'],['岩石','🪨'],['流星','☄️'],['月光','🌙'],['朝陽','🌅'],['夜影','🌑'],['曙光','🌤️'],['幻影','👻'],['疾風','🍃'],['烈焰','🌋'],['冰晶','💠'],['雷鳴','🎯'],['颶風','🌀'],['隕石','💫'],['極速','⏱️'],['巔峰','🏔️'],['王牌','🃏'],['勝利','🎖️'],['榮光','🌟'],['無畏','💪'],['絕影','🦇'],['蒼穹','🌌'],['狂潮','🌊'],['赤焰','🧨'],['紫電','💜'],['翠風','🍀'],['金剛','💛']];
    const teams=names.map((n,i)=>[i+1,n[0]+'隊',n[1],0]);
    ts.getRange(2,1,teams.length,4).setValues(teams);
  }
  Logger.log('初始化完成！');
}
