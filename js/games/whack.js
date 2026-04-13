const WhackGame = {
  holes: [], score: 0, combo: 0, maxCombo: 0, round: 1,
  spawnTimer: null, spawnInterval: 1000, hitCount: 0,
  TARGETS: ['😀','🤪','🤩','🥳','😎','🤓'], RARE: '🌟', DANGER: '💀',

  init(game) {
    this.game = game; this.score = 0; this.combo = 0; this.maxCombo = 0;
    this.round = 1; this.hitCount = 0; this.spawnInterval = 1000;
    this.holes = Array(9).fill(null);
    this.renderBoard(); this.startSpawning();
  },

  renderBoard() {
    const canvas = this.game.canvas; canvas.style.display = 'none';
    let c = document.getElementById('whack-container');
    if (!c) { c = document.createElement('div'); c.id = 'whack-container'; canvas.parentElement.appendChild(c); }
    c.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:12px;width:100%;max-width:360px;margin:0 auto;';
    c.innerHTML = this.holes.map((h, i) => `<div class="whack-hole" onclick="WhackGame.hit(${i})" style="aspect-ratio:1;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:40px;background:${h?'#fff3e0':'#f5f5f5'};box-shadow:inset 0 4px 8px rgba(0,0,0,0.1);cursor:pointer;user-select:none;position:relative;">${h?h.emoji:''}</div>`).join('');
    // Round indicator
    let ri = document.getElementById('whack-round');
    if (!ri) { ri = document.createElement('div'); ri.id = 'whack-round'; ri.style.cssText = 'text-align:center;color:white;font-size:13px;margin-bottom:8px;'; c.parentElement.insertBefore(ri, c); }
    ri.textContent = `Round ${this.round} | 命中: ${this.hitCount}/15`;
  },

  startSpawning() {
    const spawn = () => {
      if (!this.game.running) return;
      const empty = this.holes.map((h,i) => h===null?i:-1).filter(i=>i>=0);
      if (empty.length > 0) {
        const idx = empty[Math.floor(Math.random()*empty.length)];
        const rand = Math.random();
        const dangerRate = 0.1 + this.round * 0.05;
        let emoji, points, duration = Math.max(1200, 1800 - (this.round-1)*300);
        if (rand < 0.05) { emoji = this.RARE; points = 50; duration = 1000; }
        else if (rand < 0.05 + dangerRate) { emoji = this.DANGER; points = -30; }
        else { emoji = this.TARGETS[Math.floor(Math.random()*this.TARGETS.length)]; points = 10; }
        this.holes[idx] = { emoji, points, timer: setTimeout(() => { this.holes[idx] = null; this.renderBoard(); }, duration) };
        this.renderBoard();
      }
      this.spawnInterval = Math.max(400, 1000 - (this.round-1)*200);
      this.spawnTimer = setTimeout(spawn, this.spawnInterval);
    };
    this.spawnTimer = setTimeout(spawn, 500);
  },

  hit(idx) {
    const t = this.holes[idx]; if (!t) return;
    clearTimeout(t.timer);
    if (t.emoji === this.DANGER) { this.score = Math.max(0, this.score + t.points); this.combo = 0; AudioEngine.penalty(); }
    else { this.combo++; if (this.combo > this.maxCombo) this.maxCombo = this.combo; this.score += t.points + Math.min(this.combo*2,20); this.hitCount++; AudioEngine.whackHit(); AudioEngine.comboHit(this.combo); }
    this.holes[idx] = null;
    this.game.score = this.score; this.game.combo = this.combo; this.game.maxCombo = this.maxCombo; this.game.updateHUD();
    // Round clear
    if (this.hitCount >= 15) {
      this.score += 150 * this.round; this.game.score = this.score; this.game.updateHUD();
      AudioEngine.roundClear(); this.round++; this.hitCount = 0;
      this.holes.forEach((h,i) => { if (h && h.timer) clearTimeout(h.timer); this.holes[i] = null; });
      if (this.spawnTimer) clearTimeout(this.spawnTimer);
      setTimeout(() => { this.startSpawning(); }, 500);
    }
    this.renderBoard();
  },

  update() {}, render() {},
  cleanup() { if (this.spawnTimer) clearTimeout(this.spawnTimer); this.holes.forEach(h => { if (h && h.timer) clearTimeout(h.timer); }); const c = document.getElementById('whack-container'); if (c) c.remove(); const r = document.getElementById('whack-round'); if (r) r.remove(); if (this.game.canvas) this.game.canvas.style.display = 'block'; }
};
