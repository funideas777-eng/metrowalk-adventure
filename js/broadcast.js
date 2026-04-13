const Broadcast = {
  messages: [], lastTimestamp: null, unreadCount: 0, pollTimer: null,
  init() {
    const saved = localStorage.getItem('metrowalk_broadcasts');
    if (saved) { try { const p = JSON.parse(saved); this.messages = p.messages || []; this.lastTimestamp = p.lastTimestamp || null; } catch {} }
    this.startPolling();
  },
  startPolling() { const poll = () => { if (!document.hidden) this.fetchBroadcasts(); }; poll(); this.pollTimer = setInterval(poll, 5000 + Math.random() * 3000); },
  async fetchBroadcasts() {
    try {
      const data = await API.get('getBroadcasts', { action: 'getBroadcasts', since: this.lastTimestamp || '' }, 0);
      if (data && data.broadcasts && data.broadcasts.length > 0) {
        data.broadcasts.forEach(b => { if (!this.messages.some(m => m.broadcastId === b.broadcastId)) { this.messages.push(b); this.unreadCount++; this.showNotification(b); } });
        if (this.messages.length > 50) this.messages = this.messages.slice(-50);
        this.lastTimestamp = data.broadcasts[data.broadcasts.length - 1].timestamp;
        this.save(); this.updateBadge();
      }
    } catch {}
  },
  save() { try { localStorage.setItem('metrowalk_broadcasts', JSON.stringify({ messages: this.messages, lastTimestamp: this.lastTimestamp })); } catch {} },
  showNotification(msg) {
    AudioEngine.notification();
    const bar = document.getElementById('notification-bar');
    if (!bar) return;
    bar.innerHTML = `<span>📢 ${msg.content.substring(0, 60)}</span>`;
    bar.classList.add('show');
    setTimeout(() => bar.classList.remove('show'), 8000);
  },
  updateBadge() { const b = document.getElementById('broadcast-badge'); if (b) { b.textContent = this.unreadCount; b.style.display = this.unreadCount > 0 ? 'flex' : 'none'; } },
  openMessages() {
    this.unreadCount = 0; this.updateBadge();
    const panel = document.getElementById('message-panel');
    if (!panel) return;
    let html = `<div class="top-bar" style="position:sticky;top:0;z-index:10;"><button class="top-bar-back" onclick="Broadcast.closeMessages()">←</button><div class="top-bar-title">📢 系統通知</div><div style="width:40px;"></div></div>`;
    if (!this.messages.length) { html += '<div style="text-align:center;color:#999;padding:60px 20px"><div style="font-size:48px;margin-bottom:12px">📭</div><div>目前沒有訊息</div></div>'; }
    else { html += '<div style="padding:16px;">'; [...this.messages].reverse().forEach(m => { const time = new Date(m.timestamp).toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit'}); html += `<div style="background:white;border-radius:12px;padding:14px;margin-bottom:10px;box-shadow:0 1px 4px rgba(0,0,0,0.06);"><div style="font-size:13px;color:#999;margin-bottom:6px">📢 ${time}</div><div style="font-size:14px;line-height:1.6">${m.content}</div></div>`; }); html += '</div>'; }
    panel.innerHTML = html; panel.classList.add('show');
  },
  closeMessages() { const p = document.getElementById('message-panel'); if (p) p.classList.remove('show'); }
};
