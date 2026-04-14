const ScoreboardEngine = {
  pollTimer: null, currentTab: 'team', currentGame: 'pacman', rankings: [], maxPoints: 0,

  init() { this.startPolling(); this.fetchTeamRankings(); },
  startPolling() {
    var pi = (CONFIG.POLL_INTERVAL && CONFIG.POLL_INTERVAL.scoreboard) || { base: 15000, jitter: 5000 };
    this.pollTimer = setInterval(() => { if (!document.hidden) { if (this.currentTab === 'team') this.fetchTeamRankings(); else this.fetchGameScores(this.currentGame); } }, pi.base + Math.random() * pi.jitter);
  },
  stopPolling() { if (this.pollTimer) clearInterval(this.pollTimer); },

  async fetchTeamRankings() {
    try {
      const data = await API.get('getTeamRankings', { action: 'getTeamRankings' }, CONFIG.CACHE_TTL.rankings || 15000);
      if (data && data.rankings) { this.rankings = data.rankings; this.maxPoints = Math.max(...data.rankings.map(r => r.totalPoints), 1); this.renderTeamRankings(data.rankings); }
    } catch {}
  },

  renderTeamRankings(rankings) {
    const c = document.getElementById('rankingList'); if (!c) return;
    const session = Auth.getSession(), myTeamId = session ? session.teamId : -1;
    c.innerHTML = rankings.map((team, idx) => {
      const rank = idx + 1, isMyTeam = team.teamId === myTeamId;
      const barWidth = this.maxPoints > 0 ? (team.totalPoints / this.maxPoints * 100) : 0;
      const trophy = rank <= 3 ? ['🥇','🥈','🥉'][rank-1] : '';
      const rankClass = rank <= 3 ? ` top${rank}` : '';
      return `<div class="rank-item${isMyTeam?' my-team':''}" style="animation-delay:${idx*0.03}s"><div class="rank-number${rankClass}">${trophy||rank}</div><div class="rank-emoji">${team.teamEmoji}</div><div style="flex:1"><div class="rank-name">${team.teamName}${isMyTeam?' ⭐':''}</div><div class="rank-bar" style="width:${barWidth}%"></div></div><div class="rank-score">${team.totalPoints}</div></div>`;
    }).join('');
  },

  async fetchGameScores(gameId) {
    try {
      const data = await API.get('getGameScores', { action: 'getGameScores', gameId, limit: 30 }, CONFIG.CACHE_TTL.rankings || 15000);
      if (data && data.scores) this.renderGameScores(data.scores, gameId);
    } catch {}
  },

  renderGameScores(scores, gameId) {
    const c = document.getElementById('rankingList'); if (!c) return;
    const game = getGameById(gameId), session = Auth.getSession();
    const myId = session ? session.playerId : '', myTeamId = session ? session.teamId : -1;
    if (!scores.length) { c.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-light)">目前沒有紀錄</div>'; return; }

    // Team best (each team's highest scorer)
    const teamBest = {};
    scores.forEach(s => { if (!teamBest[s.teamId] || s.score > teamBest[s.teamId].score) teamBest[s.teamId] = s; });
    const teamRanked = Object.values(teamBest).sort((a, b) => b.score - a.score);
    const bonusAmounts = CONFIG.TEAM_BONUS || [500,400,300,200,100];

    let html = '<div style="font-size:13px;color:var(--text-light);margin-bottom:12px;font-weight:600">📊 團隊代表排名（每隊最高分）</div>';
    html += teamRanked.map((s, idx) => {
      const rank = idx + 1, rankClass = rank <= 3 ? ` top${rank}` : '';
      const team = CONFIG.TEAMS.find(t => t.id === s.teamId);
      const isMyTeam = s.teamId === myTeamId;
      const trophy = rank <= 3 ? ['🥇','🥈','🥉'][rank-1] : '';
      const bonus = rank <= 5 ? `<span style="font-size:11px;color:var(--secondary);font-weight:700">+${bonusAmounts[rank-1]}隊分</span>` : '';
      return `<div class="rank-item${isMyTeam?' my-team':''}"><div class="rank-number${rankClass}">${trophy||rank}</div><div class="rank-emoji">${team?team.emoji:''}</div><div style="flex:1"><div class="rank-name">${team?team.name:''} · ${s.playerName}${s.playerId===myId?' (我)':''}</div>${bonus}</div><div class="rank-score">${s.score}</div></div>`;
    }).join('');

    html += '<div style="font-size:13px;color:var(--text-light);margin:20px 0 12px;font-weight:600">👤 個人排行</div>';
    html += scores.slice(0, 20).map((s, idx) => {
      const rank = idx + 1, rankClass = rank <= 3 ? ` top${rank}` : '';
      const isMe = s.playerId === myId;
      const team = CONFIG.TEAMS.find(t => t.id === s.teamId);
      return `<div class="rank-item${isMe?' my-team':''}"><div class="rank-number${rankClass}">${rank}</div><div class="rank-emoji">${team?team.emoji:''}</div><div style="flex:1"><div class="rank-name">${s.playerName}${isMe?' (我)':''}</div><div style="font-size:11px;color:#999">${team?team.name:''}</div></div><div class="rank-score">${s.score}</div></div>`;
    }).join('');

    c.innerHTML = html;
  },

  switchTab(tab) {
    this.currentTab = tab;
    document.querySelectorAll('.score-tab').forEach(el => el.classList.remove('active'));
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    const gs = document.getElementById('gameSelector');
    if (gs) gs.style.display = tab === 'game' ? 'block' : 'none';
    if (tab === 'team') this.fetchTeamRankings(); else this.fetchGameScores(this.currentGame);
    AudioEngine.tapButton();
  },

  selectGame(gameId) { this.currentGame = gameId; this.fetchGameScores(gameId); AudioEngine.tapButton(); }
};
