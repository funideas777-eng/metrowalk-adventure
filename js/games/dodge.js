window.DodgeGame = {
  player: { x: 0, width: 30 },
  obstacles: [], coins: [], score: 0, round: 1,
  fallSpeed: 2, spawnRate: 800, surviveTime: 0,
  spawnTimer: null, coinTimer: null,
  canvasW: 0, canvasH: 0,

  init(game) {
    this.game = game; this.score = 0; this.round = 1; this.surviveTime = 0;
    this.fallSpeed = 2; this.spawnRate = 800;
    this.obstacles = []; this.coins = [];
    this.canvasW = game.canvas.width; this.canvasH = game.canvas.height;
    this.player.x = this.canvasW / 2;
    this._touchMove = e => {
      const rect = game.canvas.getBoundingClientRect();
      this.player.x = Math.max(this.player.width/2, Math.min(this.canvasW - this.player.width/2, e.touches[0].clientX - rect.left));
    };
    game.canvas.addEventListener('touchmove', this._touchMove, { passive: true });
    game.canvas.addEventListener('touchstart', this._touchMove, { passive: true });
    this._mouseMove = e => {
      const rect = game.canvas.getBoundingClientRect();
      this.player.x = Math.max(this.player.width/2, Math.min(this.canvasW - this.player.width/2, e.clientX - rect.left));
    };
    game.canvas.addEventListener('mousemove', this._mouseMove);
    this.startSpawning();
    this.surviveCounter = setInterval(() => {
      if (!this.game.running) return;
      this.surviveTime++;
      this.score += 5;
      this.game.score = this.score; this.game.updateHUD();
      if (this.surviveTime >= 30) {
        this.score += 200 * this.round; this.game.score = this.score; this.game.updateHUD();
        AudioEngine.roundClear(); this.round++; this.surviveTime = 0;
        this.fallSpeed = Math.min(7, 2 + this.round * 0.8);
        this.spawnRate = Math.max(300, 800 - (this.round - 1) * 150);
        this.obstacles = []; this.coins = [];
        if (this.spawnTimer) clearInterval(this.spawnTimer);
        if (this.coinTimer) clearInterval(this.coinTimer);
        setTimeout(() => this.startSpawning(), 500);
      }
    }, 1000);
  },

  startSpawning() {
    this.spawnTimer = setInterval(() => {
      if (!this.game.running) return;
      const width = 20 + Math.random() * 40;
      this.obstacles.push({ x: Math.random() * (this.canvasW - width), y: -20, width, height: 15 + Math.random() * 10 });
    }, this.spawnRate);
    this.coinTimer = setInterval(() => {
      if (!this.game.running) return;
      this.coins.push({ x: Math.random() * (this.canvasW - 20) + 10, y: -20 });
    }, 2000);
  },

  update() {
    if (!this.game.running) return;
    const pw = this.player.width;
    // Obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      this.obstacles[i].y += this.fallSpeed;
      const o = this.obstacles[i];
      if (o.y > this.canvasH + 20) { this.obstacles.splice(i, 1); continue; }
      // Collision
      if (o.y + o.height >= this.canvasH - 40 && o.y <= this.canvasH - 10 &&
          this.player.x + pw/2 > o.x && this.player.x - pw/2 < o.x + o.width) {
        this.game.running = false; AudioEngine.penalty(); return;
      }
    }
    // Coins
    for (let i = this.coins.length - 1; i >= 0; i--) {
      this.coins[i].y += this.fallSpeed * 0.8;
      const c = this.coins[i];
      if (c.y > this.canvasH + 20) { this.coins.splice(i, 1); continue; }
      if (Math.abs(c.x - this.player.x) < 20 && c.y >= this.canvasH - 50 && c.y <= this.canvasH - 10) {
        this.coins.splice(i, 1); this.score += 10;
        this.game.score = this.score; this.game.updateHUD(); AudioEngine.scoreUp();
      }
    }
  },

  render() {
    const ctx = this.game.ctx, canvas = this.game.canvas;
    ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff'; ctx.font = '12px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(`Round ${this.round} | 存活: ${this.surviveTime}/30s`, 8, 16);
    // Obstacles
    this.obstacles.forEach(o => { ctx.fillStyle = '#f44336'; ctx.fillRect(o.x, o.y, o.width, o.height); });
    // Coins
    ctx.font = '18px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    this.coins.forEach(c => { ctx.fillText('\u2B50', c.x, c.y); });
    // Player
    ctx.font = '28px serif';
    ctx.fillText('\uD83C\uDFC3', this.player.x, this.canvasH - 25);
  },

  cleanup() {
    if (this.spawnTimer) clearInterval(this.spawnTimer);
    if (this.coinTimer) clearInterval(this.coinTimer);
    if (this.surviveCounter) clearInterval(this.surviveCounter);
    const c = this.game.canvas;
    if (c) { c.removeEventListener('touchmove', this._touchMove); c.removeEventListener('touchstart', this._touchMove); c.removeEventListener('mousemove', this._mouseMove); }
  }
};
