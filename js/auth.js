const Auth = {
  SESSION_KEY: 'metrowalk_session',
  generateId() { return 'p_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6); },
  async register(name, teamId) {
    const team = getTeamById(teamId);
    const session = { playerId: this.generateId(), name, teamId: parseInt(teamId), teamName: team ? team.name : '', teamEmoji: team ? team.emoji : '', registeredAt: new Date().toISOString() };
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    try { await API.post('WRITE', { action: 'register', ...session }); } catch (e) { console.warn('註冊API失敗', e); }
    return session;
  },
  getSession() { const s = localStorage.getItem(this.SESSION_KEY); return s ? JSON.parse(s) : null; },
  isLoggedIn() { return !!this.getSession(); },
  logout() { localStorage.removeItem(this.SESSION_KEY); },
  requireLogin() { if (!this.isLoggedIn()) { window.location.href = 'index.html'; return false; } return true; }
};
