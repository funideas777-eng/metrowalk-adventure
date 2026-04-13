const API = {
  cache: {}, queue: [],
  init() {
    const saved = localStorage.getItem('metrowalk_api_queue');
    if (saved) { try { this.queue = JSON.parse(saved); } catch { this.queue = []; } }
    this.processQueue();
    setInterval(() => this.processQueue(), 30000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) this.processQueue(); });
  },
  getBaseUrl(endpoint) {
    if (['getChat','getChat_team','getChat_world','getTeamLocations','getPlayerTasks','getPhotoStatus','getPendingPhotos'].includes(endpoint)) return CONFIG.API_URL.READ;
    const map = { register:'WRITE', unlockGame:'WRITE', submitScore:'WRITE', sendChat:'WRITE', updateLocation:'WRITE', submitPhotoTask:'WRITE', addManualPoints:'ADMIN', broadcast:'ADMIN', verifyPhoto:'ADMIN', recalcTeamPoints:'ADMIN', uploadPhoto:'PHOTO' };
    return CONFIG.API_URL[map[endpoint] || 'READ'];
  },
  async get(endpoint, params = {}, cacheTTL = 30000) {
    const key = endpoint + '_' + JSON.stringify(params);
    if (cacheTTL > 0 && this.cache[key] && Date.now() - this.cache[key].time < cacheTTL) return this.cache[key].data;
    if (cacheTTL > 0) { const ls = localStorage.getItem('mw_cache_' + key); if (ls) { try { const p = JSON.parse(ls); if (Date.now() - p.time < cacheTTL) { this.cache[key] = p; return p.data; } } catch {} } }
    try {
      const url = new URL(this.getBaseUrl(endpoint));
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
      const res = await fetch(url.toString()); const data = await res.json();
      if (cacheTTL > 0) { const entry = { data, time: Date.now() }; this.cache[key] = entry; try { localStorage.setItem('mw_cache_' + key, JSON.stringify(entry)); } catch {} }
      return data;
    } catch (e) { console.warn('API GET fail:', endpoint, e); return this.cache[key] ? this.cache[key].data : null; }
  },
  async post(endpoint, body) {
    try {
      const url = this.getBaseUrl(body.action || endpoint);
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) });
      return await res.json();
    } catch (e) { this.queue.push({ endpoint, body, retries: 0 }); this.saveQueue(); throw e; }
  },
  saveQueue() { try { localStorage.setItem('metrowalk_api_queue', JSON.stringify(this.queue)); } catch {} },
  async processQueue() {
    if (!this.queue.length) return;
    const pending = [...this.queue]; this.queue = [];
    for (const item of pending) {
      try { const url = this.getBaseUrl(item.body.action || item.endpoint); await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(item.body) }); }
      catch { item.retries = (item.retries || 0) + 1; if (item.retries < 3) this.queue.push(item); }
    }
    this.saveQueue();
  }
};
