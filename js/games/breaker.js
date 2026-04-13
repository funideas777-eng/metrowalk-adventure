const BreakerGame = {
  paddle: { x: 0, width: 60, height: 10 },
  ball: { x: 0, y: 0, dx: 3, dy: -3, radius: 6 },
  bricks: [], score: 0, round: 1,
  canvasW: 0, canvasH: 0, brickRows: 5, ballSpeed: 3,

  init(game) {
    this.game = game; this.score = 0; this.round = 1; this.ballSpeed = 3;
    this.canvasW = game.canvas.width; this.canvasH = game.canvas.height;
    this.paddle.x = this.canvasW / 2 - this.paddle.width / 2;
    this._touchMove = e => {
      const rect = game.canvas.getBoundingClientRect();
      this.paddle.x = Math.max(0, Math.min(this.canvasW - this.paddle.width, e.touches[0].clientX - rect.left - this.paddle.width / 2));
    };
    game.canvas.addEventListener('touchmove', this._touchMove, { passive: true });
    game.canvas.addEventListener('touchstart', this._touchMove, { passive: true });
    // Mouse support
    this._mouseMove = e => {
      const rect = game.canvas.getBoundingClientRect();
      this.paddle.x = Math.max(0, Math.min(this.canvasW - this.paddle.width, e.clientX - rect.left - this.paddle.width / 2));
    };
    game.canvas.addEventListener('mousemove', this._mouseMove);
    this.startRound();
  },

  startRound() {
    this.brickRows = Math.min(7, 4 + this.round);
    this.ballSpeed = Math.min(6, 2 + this.round);
    this.bricks = [];
    const brickW = Math.floor(this.canvasW / 8), brickH = 16;
    const colors = ['#f44336','#ff9800','#ffeb3b','#4caf50','#2196f3','#9c27b0','#e91e63'];
    for (let r = 0; r < this.brickRows; r++) {
      for (let c = 0; c < 8; c++) {
        this.bricks.push({ x: c * brickW + 2, y: r * (brickH + 4) + 40, w: brickW - 4, h: brickH, color: colors[r % colors.length], hits: r >= 5 ? 2 : 1 });
      }
    }
    this.ball.x = this.canvasW / 2;
    this.ball.y = this.canvasH - 60;
    const angle = -Math.PI/4 + Math.random() * Math.PI/2 - Math.PI/2;
    this.ball.dx = Math.cos(angle) * this.ballSpeed;
    this.ball.dy = -Math.abs(Math.sin(angle) * this.ballSpeed);
  },

  update() {
    if (!this.game.running) return;
    const b = this.ball;
    b.x += b.dx; b.y += b.dy;
    // Wall bounce
    if (b.x <= b.radius || b.x >= this.canvasW - b.radius) b.dx = -b.dx;
    if (b.y <= b.radius) b.dy = -b.dy;
    // Ball lost
    if (b.y >= this.canvasH + 20) {
      b.x = this.canvasW / 2; b.y = this.canvasH - 60;
      b.dx = (Math.random() > 0.5 ? 1 : -1) * this.ballSpeed;
      b.dy = -this.ballSpeed;
    }
    // Paddle bounce
    if (b.y + b.radius >= this.canvasH - 30 && b.y + b.radius <= this.canvasH - 20 &&
        b.x >= this.paddle.x && b.x <= this.paddle.x + this.paddle.width) {
      b.dy = -Math.abs(b.dy);
      const hitPos = (b.x - this.paddle.x) / this.paddle.width - 0.5;
      b.dx = hitPos * this.ballSpeed * 2;
      AudioEngine.tapButton();
    }
    // Brick collision
    for (let i = this.bricks.length - 1; i >= 0; i--) {
      const br = this.bricks[i];
      if (b.x >= br.x && b.x <= br.x + br.w && b.y >= br.y && b.y <= br.y + br.h) {
        b.dy = -b.dy;
        br.hits--;
        if (br.hits <= 0) {
          this.bricks.splice(i, 1);
          this.score += 10;
          AudioEngine.whackHit();
        } else {
          br.color = '#888';
          AudioEngine.tapButton();
        }
        this.game.score = this.score; this.game.updateHUD();
        break;
      }
    }
    // Round clear
    if (this.bricks.length === 0) {
      this.score += 200 * this.round; this.game.score = this.score; this.game.updateHUD();
      AudioEngine.roundClear(); this.round++;
      this.startRound();
    }
  },

  render() {
    const ctx = this.game.ctx, canvas = this.game.canvas;
    ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff'; ctx.font = '12px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(`Round ${this.round}`, 8, 16);
    // Bricks
    this.bricks.forEach(b => { ctx.fillStyle = b.color; ctx.fillRect(b.x, b.y, b.w, b.h); ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.strokeRect(b.x, b.y, b.w, b.h); });
    // Paddle
    ctx.fillStyle = '#E91E63';
    ctx.fillRect(this.paddle.x, this.canvasH - 30, this.paddle.width, this.paddle.height);
    // Ball
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2); ctx.fill();
  },

  cleanup() {
    const c = this.game.canvas;
    if (c) { c.removeEventListener('touchmove', this._touchMove); c.removeEventListener('touchstart', this._touchMove); c.removeEventListener('mousemove', this._mouseMove); }
  }
};
