window.ReactionGame = {
  score: 0, round: 1, hits: 0, combo: 0, maxCombo: 0,
  currentColor: null, targetColor: '#4CAF50', isTarget: false,
  reactionWindow: 1000, targetsToHit: 10,
  colorTimer: null, showTime: 0, tapped: false,
  COLORS: [
    { bg: '#f44336', name: '\u7D05' }, { bg: '#2196F3', name: '\u85CD' },
    { bg: '#FFEB3B', name: '\u9EC3' }, { bg: '#9C27B0', name: '\u7D2B' },
    { bg: '#FF9800', name: '\u6A58' }, { bg: '#4CAF50', name: '\u7DA0 \u2713' }
  ],

  init(game) {
    this.game = game; this.score = 0; this.round = 1; this.hits = 0;
    this.combo = 0; this.maxCombo = 0;
    this.reactionWindow = 1000; this.targetsToHit = 10;
    const canvas = game.canvas; canvas.style.display = 'none';
    let c = document.getElementById('reaction-container');
    if (!c) { c = document.createElement('div'); c.id = 'reaction-container'; c.style.cssText = 'width:100%;max-width:400px;margin:0 auto;padding:16px;text-align:center;'; canvas.parentElement.appendChild(c); }
    this._lastTap = 0;
    this._tap = () => { if (Date.now() - this._lastTap < 100) return; this._lastTap = Date.now(); this.handleTap(); };
    c.addEventListener('touchstart', this._tap, { passive: true });
    c.addEventListener('click', this._tap);
    this.nextColor();
  },

  nextColor() {
    this.tapped = false;
    const isTarget = Math.random() < 0.3;
    this.isTarget = isTarget;
    this.currentColor = isTarget ? this.COLORS[5] : this.COLORS[Math.floor(Math.random() * 5)];
    this.showTime = Date.now();
    this.renderState();

    if (this.colorTimer) clearTimeout(this.colorTimer);
    this.colorTimer = setTimeout(() => {
      if (!this.tapped && this.isTarget) { this.combo = 0; }
      if (this.game.running) this.nextColor();
    }, this.isTarget ? this.reactionWindow : 800 + Math.random() * 600);
  },

  handleTap() {
    if (this.tapped || !this.game.running) return;
    this.tapped = true;
    if (this.isTarget) {
      const reaction = Date.now() - this.showTime;
      this.hits++; this.combo++;
      if (this.combo > this.maxCombo) this.maxCombo = this.combo;
      const timeBonus = Math.max(0, Math.floor((this.reactionWindow - reaction) / 10));
      this.score += 20 + timeBonus + Math.min(this.combo * 5, 30);
      AudioEngine.quizCorrect(); AudioEngine.comboHit(this.combo);
      if (this.hits >= this.targetsToHit) {
        this.score += 200 * this.round; AudioEngine.roundClear();
        this.round++; this.hits = 0;
        this.reactionWindow = Math.max(500, 1000 - (this.round - 1) * 150);
        this.targetsToHit = Math.min(20, 10 + (this.round - 1) * 3);
      }
    } else {
      this.score = Math.max(0, this.score - 15); this.combo = 0;
      AudioEngine.penalty();
    }
    this.game.score = this.score; this.game.combo = this.combo; this.game.maxCombo = this.maxCombo; this.game.updateHUD();
    this.renderState();
    if (this.colorTimer) clearTimeout(this.colorTimer);
    setTimeout(() => { if (this.game.running) this.nextColor(); }, 400);
  },

  renderState() {
    const c = document.getElementById('reaction-container'); if (!c) return;
    c.innerHTML = `
      <div style="color:white;font-size:13px;margin-bottom:16px;">Round ${this.round} | \u547D\u4E2D: ${this.hits}/${this.targetsToHit}</div>
      <div style="font-size:14px;color:rgba(255,255,255,0.6);margin-bottom:24px;">\u770B\u5230 <span style="color:#4CAF50;font-weight:900;">\u7DA0\u8272</span> \u6642\u7ACB\u523B\u9EDE\u64CA\uFF01</div>
      <div style="width:180px;height:180px;border-radius:50%;background:${this.currentColor.bg};margin:0 auto;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 32px rgba(0,0,0,0.4);transition:background 0.1s;">
        <span style="font-size:32px;font-weight:900;color:white;">${this.currentColor.name}</span>
      </div>
      <div style="margin-top:24px;font-size:13px;color:rgba(255,255,255,0.4);">\u53CD\u61C9\u6642\u9593\u9650\u5236: ${this.reactionWindow}ms</div>
      ${this.combo >= 3 ? `<div style="color:var(--primary);font-weight:700;margin-top:8px;">\uD83D\uDD25 \u9023\u64CA ${this.combo}</div>` : ''}
    `;
  },

  update() {}, render() {},
  cleanup() {
    if (this.colorTimer) clearTimeout(this.colorTimer);
    const c = document.getElementById('reaction-container');
    if (c) { c.removeEventListener('touchstart', this._tap); c.removeEventListener('click', this._tap); c.remove(); }
    if (this.game.canvas) this.game.canvas.style.display = 'block';
  }
};
