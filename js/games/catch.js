window.CatchGame = {
  basket: { x: 0, width: 60 },
  items: [], score: 0, round: 1, catches: 0,
  spawnTimer: null, fallSpeed: 2, spawnRate: 1200,
  canvasW: 0, canvasH: 0,
  FRUITS: ['🍎','🍊','🍋','🍇','🍓','🍌','🍑','🥝'],
  BOMB: '💣',

  init(game) {
    this.game = game; this.score = 0; this.round = 1; this.catches = 0;
    this.fallSpeed = 2; this.spawnRate = 1200;
    this.items = [];
    this.canvasW = game.canvas.width; this.canvasH = game.canvas.height;
    this.basket.x = this.canvasW / 2 - this.basket.width / 2;
    this._touchMove = e => {
      const rect = game.canvas.getBoundingClientRect();
      const x = e.touches[0].clientX - rect.left;
      this.basket.x = Math.max(0, Math.min(this.canvasW - this.basket.width, x - this.basket.width/2));
    };
    game.canvas.addEventListener('touchmove', this._touchMove, { passive: true });
    game.canvas.addEventListener('touchstart', this._touchMove, { passive: true });
    // Mouse support
    this._mouseMove = e => {
      const rect = game.canvas.getBoundingClientRect();
      this.basket.x = Math.max(0, Math.min(this.canvasW - this.basket.width, e.clientX - rect.left - this.basket.width/2));
    };
    game.canvas.addEventListener('mousemove', this._mouseMove);
    this.startSpawning();
  },

  startSpawning() {
    if (this.spawnTimer) clearInterval(this.spawnTimer);
    this.spawnTimer = setInterval(() => {
      if (!this.game.running) return;
      const bombChance = this.round >= 2 ? 0.15 + (this.round-2)*0.05 : 0;
      const isBomb = Math.random() < bombChance;
      this.items.push({
        x: Math.random() * (this.canvasW - 30) + 15,
        y: -20,
        emoji: isBomb ? this.BOMB : this.FRUITS[Math.floor(Math.random()*this.FRUITS.length)],
        isBomb
      });
    }, this.spawnRate);
  },

  update() {
    if (!this.game.running) return;
    for (let i = this.items.length - 1; i >= 0; i--) {
      this.items[i].y += this.fallSpeed;
      const item = this.items[i];
      // Caught by basket
      if (item.y >= this.canvasH - 50 && item.y <= this.canvasH - 20 &&
          item.x >= this.basket.x && item.x <= this.basket.x + this.basket.width) {
        if (item.isBomb) { this.score = Math.max(0, this.score - 20); AudioEngine.penalty(); }
        else { this.score += 10; this.catches++; AudioEngine.scoreUp(); }
        this.items.splice(i, 1);
        this.game.score = this.score; this.game.updateHUD();
        continue;
      }
      // Fell off screen
      if (item.y > this.canvasH + 20) { this.items.splice(i, 1); }
    }
    // Round clear
    if (this.catches >= 20) {
      this.score += 150 * this.round; this.game.score = this.score; this.game.updateHUD();
      AudioEngine.roundClear(); this.round++; this.catches = 0;
      this.fallSpeed = Math.min(6, 2 + (this.round-1));
      this.spawnRate = Math.max(400, 1200 - (this.round-1)*300);
      this.items = [];
      this.startSpawning();
    }
  },

  render() {
    const ctx = this.game.ctx, canvas = this.game.canvas;
    ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Round info
    ctx.fillStyle = '#fff'; ctx.font = '12px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(`Round ${this.round} | 接住: ${this.catches}/20`, 8, 16);
    // Items
    ctx.font = '24px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    this.items.forEach(item => { ctx.fillText(item.emoji, item.x, item.y); });
    // Basket
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(this.basket.x, this.canvasH - 40, this.basket.width, 20);
    ctx.fillRect(this.basket.x + 5, this.canvasH - 50, this.basket.width - 10, 15);
    ctx.font = '20px serif'; ctx.fillText('🧺', this.basket.x + this.basket.width/2, this.canvasH - 35);
  },

  cleanup() {
    if (this.spawnTimer) clearInterval(this.spawnTimer);
    const c = this.game.canvas;
    if (c) { c.removeEventListener('touchmove', this._touchMove); c.removeEventListener('touchstart', this._touchMove); c.removeEventListener('mousemove', this._mouseMove); }
  }
};
