window.BreakerGame = {
  paddle: { x: 0, width: 70, height: 10 },
  balls: [],
  bricks: [], score: 0, round: 1,
  canvasW: 0, canvasH: 0, brickRows: 5, ballSpeed: 4,

  init(game) {
    this.game = game; this.score = 0; this.round = 1; this.ballSpeed = 4;
    this.canvasW = game.canvas.width; this.canvasH = game.canvas.height;
    this.paddle.x = this.canvasW / 2 - this.paddle.width / 2;
    var self = this;
    this._touchMove = function(e) {
      var rect = game.canvas.getBoundingClientRect();
      self.paddle.x = Math.max(0, Math.min(self.canvasW - self.paddle.width, e.touches[0].clientX - rect.left - self.paddle.width / 2));
    };
    game.canvas.addEventListener('touchmove', this._touchMove, { passive: true });
    game.canvas.addEventListener('touchstart', this._touchMove, { passive: true });
    this._mouseMove = function(e) {
      var rect = game.canvas.getBoundingClientRect();
      self.paddle.x = Math.max(0, Math.min(self.canvasW - self.paddle.width, e.clientX - rect.left - self.paddle.width / 2));
    };
    game.canvas.addEventListener('mousemove', this._mouseMove);
    this.startRound();
  },

  createBall(offsetAngle) {
    var angle = (offsetAngle || 0) + (-Math.PI/4 + Math.random() * Math.PI/2 - Math.PI/2);
    return {
      x: this.canvasW / 2 + (offsetAngle ? (Math.random()-0.5)*60 : 0),
      y: this.canvasH - 60,
      dx: Math.cos(angle) * this.ballSpeed,
      dy: -Math.abs(Math.sin(angle) * this.ballSpeed),
      radius: 6
    };
  },

  startRound() {
    this.brickRows = Math.min(7, 4 + this.round);
    this.ballSpeed = Math.min(7, 3 + this.round * 0.5);
    this.bricks = [];
    var brickW = Math.floor(this.canvasW / 8), brickH = 16;
    var colors = ['#f44336','#ff9800','#ffeb3b','#4caf50','#2196f3','#9c27b0','#e91e63'];
    for (var r = 0; r < this.brickRows; r++) {
      for (var c = 0; c < 8; c++) {
        this.bricks.push({ x: c * brickW + 2, y: r * (brickH + 4) + 40, w: brickW - 4, h: brickH, color: colors[r % colors.length], hits: r >= 5 ? 2 : 1 });
      }
    }
    // Start with main ball + extra ball
    this.balls = [this.createBall(0)];
    if (this.round >= 1) {
      // Extra ball from the start
      this.balls.push(this.createBall(0.3));
    }
  },

  update() {
    if (!this.game.running || this.game.paused) return;
    var self = this;
    for (var bi = this.balls.length - 1; bi >= 0; bi--) {
      var b = this.balls[bi];
      b.x += b.dx; b.y += b.dy;
      // Wall bounce
      if (b.x <= b.radius || b.x >= this.canvasW - b.radius) b.dx = -b.dx;
      if (b.y <= b.radius) b.dy = -b.dy;
      // Ball lost
      if (b.y >= this.canvasH + 20) {
        this.balls.splice(bi, 1);
        if (this.balls.length === 0) {
          // All balls lost = lose life
          var livesLeft = this.game.loseLife();
          if (livesLeft > 0) {
            // Respawn a ball
            this.balls.push(this.createBall(0));
          }
        }
        continue;
      }
      // Paddle bounce
      if (b.y + b.radius >= this.canvasH - 30 && b.y + b.radius <= this.canvasH - 18 &&
          b.x >= this.paddle.x - 5 && b.x <= this.paddle.x + this.paddle.width + 5) {
        b.dy = -Math.abs(b.dy);
        var hitPos = (b.x - this.paddle.x) / this.paddle.width - 0.5;
        b.dx = hitPos * this.ballSpeed * 2;
        AudioEngine.paddleBounce();
      }
      // Brick collision
      for (var i = this.bricks.length - 1; i >= 0; i--) {
        var br = this.bricks[i];
        if (b.x >= br.x && b.x <= br.x + br.w && b.y >= br.y && b.y <= br.y + br.h) {
          b.dy = -b.dy;
          br.hits--;
          if (br.hits <= 0) {
            this.bricks.splice(i, 1);
            this.score += 10;
            AudioEngine.brickBreak();
            this.game.addCombo();
          } else {
            br.color = '#888';
            AudioEngine.tapButton();
          }
          this.game.score = this.score; this.game.updateHUD();
          break;
        }
      }
    }
    // Round clear
    if (this.bricks.length === 0) {
      this.score += 200 * this.round; this.game.score = this.score; this.game.updateHUD();
      this.round++;
      this.game.showRoundBanner(this.round);
      this.startRound();
    }
  },

  render() {
    var ctx = this.game.ctx, canvas = this.game.canvas;
    ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff'; ctx.font = '12px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('Round ' + this.round + ' | 球: ' + this.balls.length, 8, 16);
    // Bricks
    this.bricks.forEach(function(b) {
      ctx.fillStyle = b.color; ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.strokeRect(b.x, b.y, b.w, b.h);
    });
    // Paddle
    ctx.fillStyle = '#E91E63';
    ctx.fillRect(this.paddle.x, this.canvasH - 30, this.paddle.width, this.paddle.height);
    // Balls
    ctx.fillStyle = '#fff';
    this.balls.forEach(function(b) {
      ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2); ctx.fill();
    });
  },

  cleanup() {
    var c = this.game.canvas;
    if (c) { c.removeEventListener('touchmove', this._touchMove); c.removeEventListener('touchstart', this._touchMove); c.removeEventListener('mousemove', this._mouseMove); }
  }
};
