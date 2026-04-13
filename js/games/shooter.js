window.ShooterGame = {
  targets: [], score: 0, round: 1, hits: 0, combo: 0, maxCombo: 0,
  targetSize: 50, moveSpeed: 1, targetsToHit: 10,
  spawnTimer: null, canvasW: 0, canvasH: 0,

  init(game) {
    this.game = game; this.score = 0; this.round = 1; this.hits = 0;
    this.combo = 0; this.maxCombo = 0;
    this.targetSize = 50; this.moveSpeed = 1; this.targetsToHit = 10;
    this.canvasW = game.canvas.width; this.canvasH = game.canvas.height;
    this.targets = [];
    this._lastTap = 0;
    this._tap = e => {
      if (Date.now() - this._lastTap < 100) return;
      this._lastTap = Date.now();
      const rect = game.canvas.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
      this.checkHit(x, y);
    };
    game.canvas.addEventListener('touchstart', this._tap, { passive: true });
    game.canvas.addEventListener('click', this._tap);
    this.startSpawning();
  },

  startSpawning() {
    if (this.spawnTimer) clearInterval(this.spawnTimer);
    const rate = Math.max(500, 1200 - (this.round - 1) * 200);
    this.spawnTimer = setInterval(() => {
      if (!this.game.running || this.targets.length >= 5) return;
      const size = this.targetSize;
      this.targets.push({
        x: Math.random() * (this.canvasW - size * 2) + size,
        y: Math.random() * (this.canvasH - size * 2 - 60) + size + 30,
        size, dx: (Math.random() - 0.5) * this.moveSpeed * 2,
        dy: (Math.random() - 0.5) * this.moveSpeed * 2,
        life: 3000, born: Date.now(),
        color: `hsl(${Math.random()*360},70%,50%)`
      });
    }, rate);
  },

  checkHit(x, y) {
    for (let i = this.targets.length - 1; i >= 0; i--) {
      const t = this.targets[i];
      const dist = Math.sqrt((x - t.x) ** 2 + (y - t.y) ** 2);
      if (dist <= t.size) {
        this.targets.splice(i, 1);
        this.hits++; this.combo++;
        if (this.combo > this.maxCombo) this.maxCombo = this.combo;
        const bonus = Math.min(this.combo * 5, 30);
        this.score += 15 + bonus;
        this.game.score = this.score; this.game.combo = this.combo; this.game.maxCombo = this.maxCombo;
        this.game.updateHUD();
        AudioEngine.whackHit(); AudioEngine.comboHit(this.combo);
        // Round clear
        if (this.hits >= this.targetsToHit) {
          this.score += 200 * this.round; this.game.score = this.score; this.game.updateHUD();
          AudioEngine.roundClear(); this.round++; this.hits = 0;
          this.targetSize = Math.max(25, 50 - (this.round - 1) * 8);
          this.moveSpeed = Math.min(5, 1 + (this.round - 1) * 0.8);
          this.targetsToHit = Math.min(20, 10 + (this.round - 1) * 3);
          this.targets = [];
          if (this.spawnTimer) clearInterval(this.spawnTimer);
          setTimeout(() => this.startSpawning(), 500);
        }
        return;
      }
    }
    this.combo = 0; this.game.combo = 0; this.game.updateHUD();
  },

  update() {
    if (!this.game.running) return;
    const now = Date.now();
    for (let i = this.targets.length - 1; i >= 0; i--) {
      const t = this.targets[i];
      t.x += t.dx; t.y += t.dy;
      if (t.x <= t.size || t.x >= this.canvasW - t.size) t.dx = -t.dx;
      if (t.y <= t.size + 20 || t.y >= this.canvasH - t.size) t.dy = -t.dy;
      if (now - t.born > t.life) { this.targets.splice(i, 1); this.combo = 0; }
    }
  },

  render() {
    const ctx = this.game.ctx, canvas = this.game.canvas;
    ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff'; ctx.font = '12px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(`Round ${this.round} | 命中: ${this.hits}/${this.targetsToHit}`, 8, 16);
    // Crosshair grid
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    for (let x = 0; x < canvas.width; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
    for (let y = 0; y < canvas.height; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }
    // Targets
    this.targets.forEach(t => {
      const life = 1 - (Date.now() - t.born) / t.life;
      ctx.globalAlpha = Math.max(0.3, life);
      ctx.fillStyle = t.color;
      ctx.beginPath(); ctx.arc(t.x, t.y, t.size, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'white'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(t.x, t.y, t.size * 0.6, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(t.x, t.y, t.size * 0.3, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(t.x, t.y, 3, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    });
  },

  cleanup() {
    if (this.spawnTimer) clearInterval(this.spawnTimer);
    if (this.game.canvas) { this.game.canvas.removeEventListener('touchstart', this._tap); this.game.canvas.removeEventListener('click', this._tap); }
  }
};
