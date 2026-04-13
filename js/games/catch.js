window.CatchGame = {
  basket: { x: 0, width: 70 },
  items: [], score: 0, round: 1, catches: 0,
  spawnTimer: null, fallSpeed: 3, spawnRate: 800,
  canvasW: 0, canvasH: 0,
  FRUITS: ['🍎','🍊','🍋','🍇','🍓','🍌','🍑','🥝'],
  BOMB: '💣',

  init(game) {
    this.game = game; this.score = 0; this.round = 1; this.catches = 0;
    this.fallSpeed = 3; this.spawnRate = 800;
    this.items = [];
    this.canvasW = game.canvas.width; this.canvasH = game.canvas.height;
    this.basket.x = this.canvasW / 2 - this.basket.width / 2;
    var self = this;
    this._touchMove = function(e) {
      var rect = game.canvas.getBoundingClientRect();
      var x = e.touches[0].clientX - rect.left;
      self.basket.x = Math.max(0, Math.min(self.canvasW - self.basket.width, x - self.basket.width/2));
    };
    game.canvas.addEventListener('touchmove', this._touchMove, { passive: true });
    game.canvas.addEventListener('touchstart', this._touchMove, { passive: true });
    this._mouseMove = function(e) {
      var rect = game.canvas.getBoundingClientRect();
      self.basket.x = Math.max(0, Math.min(self.canvasW - self.basket.width, e.clientX - rect.left - self.basket.width/2));
    };
    game.canvas.addEventListener('mousemove', this._mouseMove);
    this.startSpawning();
  },

  startSpawning() {
    if (this.spawnTimer) clearInterval(this.spawnTimer);
    var self = this;
    this.spawnTimer = setInterval(function() {
      if (!self.game.running || self.game.paused) return;
      var bombChance = self.round >= 2 ? 0.15 + (self.round-2)*0.05 : 0;
      var isBomb = Math.random() < bombChance;
      self.items.push({
        x: Math.random() * (self.canvasW - 40) + 20,
        y: -30,
        emoji: isBomb ? self.BOMB : self.FRUITS[Math.floor(Math.random()*self.FRUITS.length)],
        isBomb: isBomb
      });
    }, this.spawnRate);
  },

  update() {
    if (!this.game.running || this.game.paused) return;
    for (var i = this.items.length - 1; i >= 0; i--) {
      this.items[i].y += this.fallSpeed;
      var item = this.items[i];
      // Caught by basket
      if (item.y >= this.canvasH - 55 && item.y <= this.canvasH - 20 &&
          item.x >= this.basket.x - 10 && item.x <= this.basket.x + this.basket.width + 10) {
        if (item.isBomb) {
          // Bomb = lose life
          this.game.loseLife();
          AudioEngine.penalty();
        } else {
          this.score += 10; this.catches++;
          this.game.addCombo();
          AudioEngine.scoreUp();
        }
        this.items.splice(i, 1);
        this.game.score = this.score; this.game.updateHUD();
        continue;
      }
      // Fell off screen
      if (item.y > this.canvasH + 30) {
        if (!item.isBomb) this.game.resetCombo();
        this.items.splice(i, 1);
      }
    }
    // Round clear
    if (this.catches >= 20) {
      this.score += 150 * this.round; this.game.score = this.score; this.game.updateHUD();
      this.round++; this.catches = 0;
      this.game.showRoundBanner(this.round);
      this.fallSpeed = Math.min(7, 3 + (this.round-1) * 0.8);
      this.spawnRate = Math.max(400, 800 - (this.round-1)*150);
      this.items = [];
      this.startSpawning();
    }
  },

  render() {
    var ctx = this.game.ctx, canvas = this.game.canvas;
    ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Round info
    ctx.fillStyle = '#fff'; ctx.font = '12px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('Round ' + this.round + ' | 接住: ' + this.catches + '/20', 8, 16);
    // Items - LARGER fruit emoji (40px instead of 24px)
    ctx.font = '40px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    this.items.forEach(function(item) { ctx.fillText(item.emoji, item.x, item.y); });
    // Basket
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(this.basket.x, this.canvasH - 45, this.basket.width, 22);
    ctx.fillRect(this.basket.x + 5, this.canvasH - 55, this.basket.width - 10, 15);
    ctx.font = '24px serif'; ctx.fillText('🧺', this.basket.x + this.basket.width/2, this.canvasH - 38);
  },

  cleanup() {
    if (this.spawnTimer) clearInterval(this.spawnTimer);
    var c = this.game.canvas;
    if (c) { c.removeEventListener('touchmove', this._touchMove); c.removeEventListener('touchstart', this._touchMove); c.removeEventListener('mousemove', this._mouseMove); }
  }
};
