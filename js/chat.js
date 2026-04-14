const Chat = {
  channel: 'team', messages: { team: [], world: [] }, lastTimestamp: { team: null, world: null },
  pollTimer: null, isOpen: false, danmakuQueue: [], danmakuActive: false,
  init() {
    // 首次連線隨機延遲 2-12 秒，錯開 600 人同時請求
    var self = this;
    setTimeout(function() { self.startPolling(); }, 2000 + Math.random() * 10000);
  },
  startPolling() {
    var pi = (CONFIG.POLL_INTERVAL && CONFIG.POLL_INTERVAL.chat) || { base: 15000, jitter: 5000 };
    const poll = () => { if (!document.hidden) { this.fetchMessages('team'); this.fetchMessages('world'); } };
    poll();
    this.pollTimer = setInterval(poll, pi.base + Math.random() * pi.jitter);
  },
  async fetchMessages(channel) {
    const session = Auth.getSession(); if (!session) return;
    try {
      // 只讀取最近 3 分鐘的訊息（降低 GAS 負載 + 傳輸量）
      var sinceTime = this.lastTimestamp[channel] || '';
      var chatWindow = (CONFIG.POLL_INTERVAL && CONFIG.POLL_INTERVAL.chatWindow) || 180000; // 3 分鐘
      if (!sinceTime) { sinceTime = new Date(Date.now() - chatWindow).toISOString(); }
      const data = await API.get('getChat_' + channel, { action: 'getChat', channel, teamId: session.teamId, since: sinceTime }, CONFIG.CACHE_TTL.chat || 5000);
      if (data && data.messages && data.messages.length > 0) {
        data.messages.forEach(msg => { if (!this.messages[channel].some(m => m.msgId === msg.msgId)) { this.messages[channel].push(msg); if (channel === 'world') this.danmakuQueue.push(msg); } });
        // 清除超過 3 分鐘的舊訊息
        var cutoff = Date.now() - chatWindow;
        this.messages[channel] = this.messages[channel].filter(function(m) { return new Date(m.timestamp).getTime() > cutoff; });
        if (this.messages[channel].length > 100) this.messages[channel] = this.messages[channel].slice(-100);
        this.lastTimestamp[channel] = data.messages[data.messages.length - 1].timestamp;
        if (this.isOpen && this.channel === channel) this.renderMessages();
      }
    } catch {}
  },
  async send(content) {
    if (!content.trim()) return;
    const session = Auth.getSession(), team = CONFIG.TEAMS.find(t => t.id === session.teamId);
    try {
      await API.post('WRITE', { action: 'sendChat', channel: this.channel, teamId: session.teamId, playerId: session.playerId, playerName: session.name, teamName: team ? team.name : '', teamEmoji: team ? team.emoji : '', content: content.trim().substring(0, 200) });
      const localMsg = { msgId: Date.now(), channel: this.channel, teamId: session.teamId, playerId: session.playerId, playerName: session.name, teamName: team ? team.name : '', teamEmoji: team ? team.emoji : '', content: content.trim(), timestamp: new Date().toISOString() };
      this.messages[this.channel].push(localMsg);
      if (this.channel === 'world') this.danmakuQueue.push(localMsg);
      if (this.isOpen) this.renderMessages();
    } catch {}
  },
  open() { this.isOpen = true; const p = document.getElementById('chat-panel'); if (p) { p.classList.add('open'); this.renderMessages(); } },
  close() { this.isOpen = false; const p = document.getElementById('chat-panel'); if (p) p.classList.remove('open'); },
  switchChannel(ch) { this.channel = ch; document.querySelectorAll('.chat-ch-btn').forEach(b => b.classList.remove('active')); const btn = document.querySelector(`[data-channel="${ch}"]`); if (btn) btn.classList.add('active'); this.renderMessages(); },
  renderMessages() {
    const c = document.getElementById('chat-messages'); if (!c) return;
    const session = Auth.getSession(), msgs = this.messages[this.channel];
    c.innerHTML = msgs.map(m => { const isMe = m.playerId === session.playerId; return `<div class="chat-msg ${isMe?'chat-msg-me':''}"><div class="chat-msg-head">${m.teamEmoji} ${m.playerName}${this.channel==='world'?' · '+m.teamName:''}</div><div class="chat-msg-body">${this.escapeHtml(m.content)}</div></div>`; }).join('') || '<div style="text-align:center;color:#999;padding:40px">還沒有訊息</div>';
    c.scrollTop = c.scrollHeight;
  },
  escapeHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; },
  initDanmaku(id) { this.danmakuContainer = document.getElementById(id); if (!this.danmakuContainer) return; this.danmakuActive = true; this.processDanmaku(); },
  stopDanmaku() { this.danmakuActive = false; },
  processDanmaku() { if (!this.danmakuActive) return; if (this.danmakuQueue.length > 0) this.spawnDanmaku(this.danmakuQueue.shift()); setTimeout(() => this.processDanmaku(), 2000 + Math.random() * 1500); },
  spawnDanmaku(msg) { if (!this.danmakuContainer) return; const el = document.createElement('div'); el.className = 'danmaku-item'; el.textContent = `${msg.teamEmoji} ${msg.playerName}: ${msg.content}`; el.style.top = (10 + Math.random() * 60) + '%'; this.danmakuContainer.appendChild(el); el.addEventListener('animationend', () => el.remove()); }
};
