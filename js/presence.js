// ============================================================
// Presence 模組：心跳保活 + 隊伍在線查詢
// 每 30 秒送一次 heartbeat，後端 TTL 90s
// ============================================================
const Presence = {
  _timer: null,
  _teamCache: { data: null, time: 0 },

  start() {
    if (this._timer) return;
    this._sendBeat();
    this._timer = setInterval(() => this._sendBeat(), 30000);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) this._sendBeat();
    });
  },

  async _sendBeat() {
    const p = Auth && Auth.getSession && Auth.getSession();
    if (!p || !p.playerId) return;
    try {
      await API.post('heartbeat', {
        action: 'heartbeat',
        playerId: p.playerId,
        teamId: p.teamId,
        playerName: p.name || '',
        teamName: p.teamName || '',
        teamEmoji: p.teamEmoji || ''
      });
    } catch (e) { /* ignore */ }
  },

  // 取得隊伍在線（5 秒記憶體快取）
  async getTeamOnline(teamId) {
    if (this._teamCache.data && Date.now() - this._teamCache.time < 5000 &&
        this._teamCache.teamId === teamId) {
      return this._teamCache.data;
    }
    const data = await API.get('getOnlineTeam', { teamId }, 5000);
    if (data && !data.error) {
      this._teamCache = { data, time: Date.now(), teamId };
    }
    return data || { count: 0, members: [] };
  },

  async getEventStatus(token) {
    return await API.get('getEventStatus', token ? { token } : {}, 10000);
  }
};
