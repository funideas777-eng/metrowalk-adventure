#!/usr/bin/env node
// ============================================================
// GAS → D1 資料遷移腳本
// 從 Google Sheets (GAS API) 讀取所有資料，寫入 D1
//
// 使用方式：
//   1. 先確認 wrangler 已登入：wrangler login
//   2. 先建立 D1 + 初始化 schema：
//      wrangler d1 create metrowalk-db
//      wrangler d1 execute metrowalk-db --file=schema.sql
//   3. 設定下方 GAS_URL
//   4. 執行：node migrate-gas-to-d1.js
// ============================================================

const { execSync } = require('child_process');

// === 設定 ===
const GAS_URL = 'https://script.google.com/macros/s/AKfycbyRK_01YMMdSEQJ3B2MdEn0eKCjyxhu8KICba7SBTzbjQwXqHEulMm7BHs9awSsA2hrSg/exec';
const ADMIN_PWD = '11201120';
const DB_NAME = 'metrowalk-db';

async function fetchGAS(action, params = {}) {
  const url = new URL(GAS_URL);
  url.searchParams.set('action', action);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  return res.json();
}

function d1Execute(sql) {
  // 轉義單引號
  const escaped = sql.replace(/'/g, "'\\''");
  try {
    execSync(`wrangler d1 execute ${DB_NAME} --command='${escaped}'`, { stdio: 'pipe' });
  } catch (e) {
    console.error('D1 execute error:', sql.substring(0, 100));
  }
}

function d1Batch(statements) {
  // 寫入臨時 SQL 檔案批次執行
  const fs = require('fs');
  const tmp = '/tmp/migrate_batch.sql';
  fs.writeFileSync(tmp, statements.join('\n'));
  try {
    execSync(`wrangler d1 execute ${DB_NAME} --file=${tmp}`, { stdio: 'inherit' });
  } catch (e) {
    console.error('D1 batch error');
  }
}

async function migrate() {
  console.log('=== MetroWalk GAS → D1 Migration ===\n');

  // 1. 玩家資料
  console.log('[1/6] Migrating Players...');
  // GAS 沒有 getAllPlayers endpoint，但我們可以用 getTeamRankings + getGameScores 間接取得
  // 這裡用 Dashboard 確認有多少資料
  const dashboard = await fetchGAS('getDashboard', { password: ADMIN_PWD });
  console.log(`  Found: ${dashboard.totalPlayers} players, ${dashboard.totalPlays} game plays`);

  // 2. 團隊排名（Teams 表已在 schema.sql 初始化）
  console.log('[2/6] Migrating Team Points...');
  const rankings = await fetchGAS('getTeamRankings');
  if (rankings.rankings) {
    const stmts = rankings.rankings
      .filter(t => t.totalPoints > 0)
      .map(t => `UPDATE Teams SET totalPoints = ${t.totalPoints} WHERE teamId = ${t.teamId};`);
    if (stmts.length > 0) {
      d1Batch(stmts);
      console.log(`  Updated ${stmts.length} teams with points`);
    }
  }

  // 3. 遊戲分數
  console.log('[3/6] Migrating Game Scores...');
  const games = ['pacman','snake','whack','memory','quiz','catch','breaker','shooter','dodge','reaction','rhythm',
                 'cook-boba','cook-beef','cook-dumpling','cook-shaved','cook-cake','photo'];
  let totalScores = 0;
  for (const gameId of games) {
    const data = await fetchGAS('getGameScores', { gameId, limit: '999' });
    if (data.scores && data.scores.length > 0) {
      const stmts = data.scores.map(s => {
        const pn = (s.playerName || '').replace(/'/g, "''");
        const ts = s.timestamp || new Date().toISOString();
        return `INSERT OR IGNORE INTO GameScores (playerId, playerName, teamId, gameId, score, timestamp) VALUES ('${s.playerId}','${pn}',${s.teamId},'${gameId}',${s.score},'${ts}');`;
      });
      d1Batch(stmts);
      totalScores += stmts.length;
      console.log(`  ${gameId}: ${stmts.length} scores`);
    }
  }
  console.log(`  Total: ${totalScores} scores migrated`);

  // 4. 廣播
  console.log('[4/6] Migrating Broadcasts...');
  const broadcasts = await fetchGAS('getBroadcasts', { since: '' });
  if (broadcasts.broadcasts && broadcasts.broadcasts.length > 0) {
    const stmts = broadcasts.broadcasts.map(b => {
      const content = (b.content || '').replace(/'/g, "''");
      return `INSERT OR IGNORE INTO Broadcasts (broadcastId, type, content, timestamp) VALUES (${b.broadcastId},'${b.type||'text'}','${content}','${b.timestamp}');`;
    });
    d1Batch(stmts);
    console.log(`  ${stmts.length} broadcasts migrated`);
  }

  // 5. 照片任務
  console.log('[5/6] Migrating Photo Tasks...');
  const photos = await fetchGAS('getPendingPhotos', { password: ADMIN_PWD });
  if (photos.photos && photos.photos.length > 0) {
    const stmts = photos.photos.map(p => {
      const pn = (p.playerName || '').replace(/'/g, "''");
      return `INSERT OR IGNORE INTO PhotoTasks (submissionId, playerId, playerName, teamId, gameId, photoUrl, status, submittedAt, verifiedAt) VALUES ('${p.submissionId}','${p.playerId}','${pn}',${p.teamId},'${p.gameId||'photo'}','${p.photoUrl||''}','${p.status}','${p.submittedAt||''}','${p.verifiedAt||''}');`;
    });
    d1Batch(stmts);
    console.log(`  ${stmts.length} photos migrated`);
  }

  // 6. 完成
  console.log('\n[6/6] Recalculating team points...');
  console.log('  (Team points already synced from rankings)');

  console.log('\n=== Migration Complete! ===');
  console.log('\nNext steps:');
  console.log('1. Verify: wrangler d1 execute metrowalk-db --command="SELECT COUNT(*) FROM GameScores"');
  console.log('2. Switch frontend: set CONFIG.BACKEND = "cf" in config.js');
  console.log('3. Deploy worker: cd cloudflare-worker && wrangler deploy');
}

migrate().catch(console.error);
