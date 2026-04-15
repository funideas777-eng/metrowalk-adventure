const API = {
  cache: {}, queue: [],
  // === 10 節點負載平衡 ===
  _nodeIndex: -1,        // 此玩家綁定的節點 (-1=未初始化)
  _nodeHealth: [],       // 各節點健康狀態 [true, true, ...]
  _lastHealthCheck: 0,

  init() {
    const saved = localStorage.getItem('metrowalk_api_queue');
    if (saved) { try { this.queue = JSON.parse(saved); } catch { this.queue = []; } }
    this.processQueue();
    setInterval(() => this.processQueue(), 30000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) this.processQueue(); });
    // 初始化節點分配
    this._initLoadBalance();
  },

  // === 負載平衡初始化 ===
  _initLoadBalance() {
    var nodes = CONFIG.API_URL.READ_NODES || [];
    var activeCount = (CONFIG.LOAD_BALANCE && CONFIG.LOAD_BALANCE.activeNodes) || nodes.length;
    activeCount = Math.min(activeCount, nodes.length);
    // 初始化健康狀態
    this._nodeHealth = [];
    for (var i = 0; i < nodes.length; i++) this._nodeHealth.push(i < activeCount);
    // random-sticky：從 localStorage 讀取或隨機分配
    var savedNode = localStorage.getItem('metrowalk_api_node');
    if (savedNode !== null) {
      var idx = parseInt(savedNode);
      if (idx >= 0 && idx < activeCount && this._nodeHealth[idx]) {
        this._nodeIndex = idx;
        return;
      }
    }
    // 隨機分配到一個活躍節點
    this._nodeIndex = Math.floor(Math.random() * activeCount);
    try { localStorage.setItem('metrowalk_api_node', this._nodeIndex); } catch(e) {}
  },

  // === 取得讀取端點（含故障轉移）===
  _getReadUrl() {
    var lb = CONFIG.LOAD_BALANCE;
    var nodes = CONFIG.API_URL.READ_NODES || [];
    // 分流未啟用或無節點 → 回退舊的 READ
    if (!lb || !lb.enabled || !nodes.length) {
      return CONFIG.API_URL.READ;
    }
    var activeCount = lb.activeNodes || nodes.length;
    activeCount = Math.min(activeCount, nodes.length);
    // 確保 nodeIndex 在有效範圍
    if (this._nodeIndex < 0 || this._nodeIndex >= activeCount) {
      this._nodeIndex = Math.floor(Math.random() * activeCount);
    }
    return nodes[this._nodeIndex];
  },

  // === 故障轉移：切換到下一個健康節點 ===
  _failover(failedIndex) {
    var nodes = CONFIG.API_URL.READ_NODES || [];
    var lb = CONFIG.LOAD_BALANCE || {};
    var activeCount = Math.min(lb.activeNodes || nodes.length, nodes.length);
    // 標記故障
    this._nodeHealth[failedIndex] = false;
    // 60 秒後自動恢復（可能是暫時故障）
    var self = this;
    setTimeout(function() { self._nodeHealth[failedIndex] = true; }, lb.healthCheckInterval || 60000);
    // 找下一個健康節點
    for (var i = 1; i < activeCount; i++) {
      var next = (failedIndex + i) % activeCount;
      if (this._nodeHealth[next]) {
        this._nodeIndex = next;
        try { localStorage.setItem('metrowalk_api_node', next); } catch(e) {}
        console.warn('[API] 節點 ' + (failedIndex+1) + ' 故障，切換至節點 ' + (next+1));
        return nodes[next];
      }
    }
    // 所有節點都故障 → 用主節點
    console.warn('[API] 所有節點故障，回退主節點');
    return nodes[0];
  },

  // === 路由：根據 endpoint 決定用哪個 URL ===
  getBaseUrl(endpoint) {
    // Cloudflare Workers 模式：所有請求走同一個 URL
    if (CONFIG.BACKEND === 'cf' && CONFIG.CF_URL) {
      return CONFIG.CF_URL;
    }
    // === GAS 模式：分流路由 ===
    // 寫入類操作 → 專用寫入端點
    var writeActions = ['register','unlockGame','submitScore','sendChat','updateLocation','submitPhotoTask','answerQuiz'];
    if (writeActions.indexOf(endpoint) !== -1) return CONFIG.API_URL.WRITE;
    // 管理類操作
    var adminActions = ['addManualPoints','broadcast','verifyPhoto','recalcTeamPoints','resetAll','getDashboard','getPendingPhotos','adminLogin'];
    if (adminActions.indexOf(endpoint) !== -1) return CONFIG.API_URL.ADMIN;
    // 照片上傳
    if (endpoint === 'uploadPhoto') return CONFIG.API_URL.PHOTO;
    // ADMIN action in body
    if (endpoint === 'ADMIN') return CONFIG.API_URL.ADMIN;
    if (endpoint === 'WRITE') return CONFIG.API_URL.WRITE;
    if (endpoint === 'PHOTO') return CONFIG.API_URL.PHOTO;
    // 所有讀取 → 分流節點
    return this._getReadUrl();
  },

  // === GET 請求（含分流 + 故障轉移）===
  async get(endpoint, params, cacheTTL) {
    if (typeof cacheTTL === 'undefined') cacheTTL = 30000;
    var key = endpoint + '_' + JSON.stringify(params);
    // 記憶體快取
    if (cacheTTL > 0 && this.cache[key] && Date.now() - this.cache[key].time < cacheTTL) return this.cache[key].data;
    // localStorage 快取
    if (cacheTTL > 0) {
      var ls = localStorage.getItem('mw_cache_' + key);
      if (ls) { try { var p = JSON.parse(ls); if (Date.now() - p.time < cacheTTL) { this.cache[key] = p; return p.data; } } catch(e) {} }
    }
    // 發送請求（含重試）
    var lb = CONFIG.LOAD_BALANCE || {};
    var maxRetries = lb.maxRetries || 2;
    var timeout = lb.failoverTimeout || 5000;
    var lastError = null;

    for (var attempt = 0; attempt <= maxRetries; attempt++) {
      var baseUrl = this.getBaseUrl(endpoint);
      try {
        var url = new URL(baseUrl);
        if (params) Object.entries(params).forEach(function(kv) { url.searchParams.set(kv[0], kv[1]); });
        // 帶 timeout 的 fetch
        var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        var timer = null;
        if (controller) { timer = setTimeout(function() { controller.abort(); }, timeout); }
        var fetchOpts = controller ? { signal: controller.signal } : {};
        var res = await fetch(url.toString(), fetchOpts);
        if (timer) clearTimeout(timer);
        var data = await res.json();
        // 成功 → 快取
        if (cacheTTL > 0) {
          var entry = { data: data, time: Date.now() };
          this.cache[key] = entry;
          try { localStorage.setItem('mw_cache_' + key, JSON.stringify(entry)); } catch(e) {}
        }
        return data;
      } catch(e) {
        lastError = e;
        if (timer) clearTimeout(timer);
        // 讀取端點故障 → 切換節點重試
        var isReadEndpoint = !['WRITE','PHOTO','ADMIN'].includes(endpoint) &&
          ['register','unlockGame','submitScore','sendChat','updateLocation','submitPhotoTask',
           'addManualPoints','broadcast','verifyPhoto','recalcTeamPoints','resetAll',
           'getDashboard','getPendingPhotos','uploadPhoto'].indexOf(endpoint) === -1;
        if (isReadEndpoint && lb.enabled && attempt < maxRetries) {
          this._failover(this._nodeIndex);
          continue; // 重試下一個節點
        }
      }
    }
    // 全部失敗 → 回傳快取資料
    console.warn('API GET fail after retries:', endpoint, lastError);
    return this.cache[key] ? this.cache[key].data : null;
  },

  // === POST 請求（寫入端點，含離線佇列）===
  async post(endpoint, body) {
    try {
      var url = this.getBaseUrl(body.action || endpoint);
      var res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(body)
      });
      return await res.json();
    } catch(e) {
      this.queue.push({ endpoint: endpoint, body: body, retries: 0 });
      this.saveQueue();
      throw e;
    }
  },

  saveQueue() { try { localStorage.setItem('metrowalk_api_queue', JSON.stringify(this.queue)); } catch(e) {} },
  async processQueue() {
    if (!this.queue.length) return;
    var pending = this.queue.slice(); this.queue = [];
    for (var i = 0; i < pending.length; i++) {
      var item = pending[i];
      try {
        var url = this.getBaseUrl(item.body.action || item.endpoint);
        await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(item.body) });
      } catch(e) {
        item.retries = (item.retries || 0) + 1;
        if (item.retries < 3) this.queue.push(item);
      }
    }
    this.saveQueue();
  },

  // === 診斷：目前節點狀態 ===
  getNodeStatus() {
    var nodes = CONFIG.API_URL.READ_NODES || [];
    var lb = CONFIG.LOAD_BALANCE || {};
    return {
      currentNode: this._nodeIndex + 1,
      totalNodes: nodes.length,
      activeNodes: lb.activeNodes || nodes.length,
      health: this._nodeHealth.map(function(h, i) { return 'Node' + (i+1) + ':' + (h ? '✅' : '❌'); }),
      strategy: lb.strategy || 'none'
    };
  }
};
