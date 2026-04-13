window.WhackGame = {
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
    var canvas = this.game.canvas; canvas.style.display = 'none';
    var c = document.getElementById('whack-container');
    if (!c) { c = document.createElement('div'); c.id = 'whack-container'; canvas.parentElement.appendChild(c); }
    // Info text on top
    var ri = document.getElementById('whack-round');
    if (!ri) { ri = document.createElement('div'); ri.id = 'whack-round'; c.parentElement.insertBefore(ri, c); }
    ri.style.cssText = 'text-align:center;color:white;font-size:13px;padding:8px 0 4px;';
    ri.textContent = 'Round ' + this.round + ' | 命中: ' + this.hitCount + '/15 | 💀=扣命';
    // Full width grid, bigger holes
    c.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:8px;width:100%;max-width:100%;margin:0 auto;';
    c.innerHTML = this.holes.map(function(h, i) {
      return '<div class="whack-hole" onclick="WhackGame.hit(' + i + ')" style="aspect-ratio:1;border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:52px;background:' + (h ? '#fff3e0' : '#2a2a3e') + ';box-shadow:inset 0 4px 12px rgba(0,0,0,0.2);cursor:pointer;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;transition:background 0.15s;border:2px solid ' + (h ? '#ff9800' : '#3a3a4e') + ';">' + (h ? h.emoji : '') + '</div>';
    }).join('');
  },

  startSpawning() {
    var self = this;
    var spawn = function() {
      if (!self.game.running) return;
      if (self.game.paused) { self.spawnTimer = setTimeout(spawn, 500); return; }
      var empty = self.holes.map(function(h,i) { return h===null?i:-1; }).filter(function(i) { return i>=0; });
      if (empty.length > 0) {
        var idx = empty[Math.floor(Math.random()*empty.length)];
        var rand = Math.random();
        var dangerRate = 0.1 + self.round * 0.05;
        var emoji, points, duration = Math.max(1200, 1800 - (self.round-1)*300);
        if (rand < 0.05) { emoji = self.RARE; points = 50; duration = 1000; }
        else if (rand < 0.05 + dangerRate) { emoji = self.DANGER; points = -30; }
        else { emoji = self.TARGETS[Math.floor(Math.random()*self.TARGETS.length)]; points = 10; }
        self.holes[idx] = { emoji: emoji, points: points, timer: setTimeout(function() { self.holes[idx] = null; self.renderBoard(); }, duration) };
        self.renderBoard();
      }
      self.spawnInterval = Math.max(400, 1000 - (self.round-1)*200);
      self.spawnTimer = setTimeout(spawn, self.spawnInterval);
    };
    this.spawnTimer = setTimeout(spawn, 500);
  },

  hit(idx) {
    var t = this.holes[idx]; if (!t) return;
    clearTimeout(t.timer);
    if (t.emoji === this.DANGER) {
      // Skull = lose life
      this.game.loseLife();
      this.combo = 0;
    } else {
      this.combo++; if (this.combo > this.maxCombo) this.maxCombo = this.combo;
      this.score += t.points + Math.min(this.combo*2,20); this.hitCount++;
      AudioEngine.whackHit(); AudioEngine.comboHit(this.combo);
    }
    this.holes[idx] = null;
    this.game.score = this.score; this.game.combo = this.combo; this.game.maxCombo = this.maxCombo; this.game.updateHUD();
    // Round clear
    if (this.hitCount >= 15) {
      this.score += 150 * this.round; this.game.score = this.score; this.game.updateHUD();
      this.round++; this.hitCount = 0;
      this.game.showRoundBanner(this.round);
      var self = this;
      this.holes.forEach(function(h,i) { if (h && h.timer) clearTimeout(h.timer); self.holes[i] = null; });
      if (this.spawnTimer) clearTimeout(this.spawnTimer);
      setTimeout(function() { self.startSpawning(); }, 500);
    }
    this.renderBoard();
  },

  update() {}, render() {},
  cleanup() {
    if (this.spawnTimer) clearTimeout(this.spawnTimer);
    this.holes.forEach(function(h) { if (h && h.timer) clearTimeout(h.timer); });
    var c = document.getElementById('whack-container'); if (c) c.remove();
    var r = document.getElementById('whack-round'); if (r) r.remove();
    if (this.game.canvas) this.game.canvas.style.display = 'block';
  }
};
