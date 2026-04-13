window.SnakeGame = {
  snake: [], food: null, goldenFood: null,
  direction: 'right', nextDirection: 'right',
  score: 0, round: 1, speed: 150,
  cellSize: 20, cols: 0, rows: 0,
  moveTimer: null, goldenTimer: null,
  touchStartX: 0, touchStartY: 0,
  roundTarget: 10,
  FOOD_EMOJIS: ['🍎','🍊','🍋','🍇','🍓','🍒'],

  init(game) {
    this.game = game; this.score = 0; this.round = 1;
    this.speed = 150; this.roundTarget = 10;
    var canvas = game.canvas;
    this.cols = Math.floor(canvas.width / this.cellSize);
    this.rows = Math.floor(canvas.height / this.cellSize);
    this.startRound();
    this.setupControls(canvas);
    var self = this;
    this.goldenTimer = setInterval(function() { if (game.running && !game.paused && !self.goldenFood) self.goldenFood = self.randomEmpty(); }, 15000);
  },

  // D-Pad input from game.html
  setDirection(dir) {
    var opposite = { up:'down', down:'up', left:'right', right:'left' };
    if (dir !== opposite[this.direction]) this.nextDirection = dir;
  },

  startRound() {
    this.direction = 'right'; this.nextDirection = 'right';
    var midX = Math.floor(this.cols / 2), midY = Math.floor(this.rows / 2);
    this.snake = [{ x: midX, y: midY }, { x: midX-1, y: midY }, { x: midX-2, y: midY }];
    this.spawnFood();
    if (this.moveTimer) clearTimeout(this.moveTimer);
    this.startMoving();
  },

  setupControls(canvas) {
    var self = this;
    this._touchStart = function(e) { self.touchStartX = e.touches[0].clientX; self.touchStartY = e.touches[0].clientY; };
    this._touchEnd = function(e) {
      var dx = e.changedTouches[0].clientX - self.touchStartX, dy = e.changedTouches[0].clientY - self.touchStartY;
      if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
      var opposite = { up:'down', down:'up', left:'right', right:'left' };
      if (Math.abs(dx) > Math.abs(dy)) {
        var nd = dx > 0 ? 'right' : 'left';
        if (nd !== opposite[self.direction]) self.nextDirection = nd;
      } else {
        var nd = dy > 0 ? 'down' : 'up';
        if (nd !== opposite[self.direction]) self.nextDirection = nd;
      }
    };
    canvas.addEventListener('touchstart', this._touchStart, { passive: true });
    canvas.addEventListener('touchend', this._touchEnd, { passive: true });
    this._keyDown = function(e) {
      var map = { ArrowUp:'up', ArrowDown:'down', ArrowLeft:'left', ArrowRight:'right' };
      if (map[e.key]) {
        var opposite = { up:'down', down:'up', left:'right', right:'left' };
        if (map[e.key] !== opposite[self.direction]) self.nextDirection = map[e.key];
        e.preventDefault();
      }
    };
    document.addEventListener('keydown', this._keyDown);
  },

  startMoving() {
    var self = this;
    var move = function() {
      if (!self.game.running) return;
      if (self.game.paused) { self.moveTimer = setTimeout(move, self.speed); return; }
      self.direction = self.nextDirection;
      var head = { x: self.snake[0].x, y: self.snake[0].y };
      if (self.direction === 'up') head.y--; else if (self.direction === 'down') head.y++;
      else if (self.direction === 'left') head.x--; else if (self.direction === 'right') head.x++;
      // Collision check
      var died = false;
      if (head.x < 0 || head.x >= self.cols || head.y < 0 || head.y >= self.rows) died = true;
      if (!died && self.snake.some(function(s) { return s.x === head.x && s.y === head.y; })) died = true;
      if (died) {
        var livesLeft = self.game.loseLife();
        if (livesLeft > 0) {
          // Respawn
          self.startRound();
        }
        return;
      }
      self.snake.unshift(head);
      var ate = false;
      if (self.food && head.x === self.food.x && head.y === self.food.y) {
        self.score += 10 * Math.ceil(self.snake.length / 5); self.spawnFood(); ate = true; AudioEngine.snakeEat();
      } else if (self.goldenFood && head.x === self.goldenFood.x && head.y === self.goldenFood.y) {
        self.score += 50; self.goldenFood = null; ate = true; AudioEngine.scoreUp();
      }
      if (!ate) self.snake.pop();
      self.game.score = self.score; self.game.updateHUD();
      // Round clear
      if (self.snake.length >= self.roundTarget + 3) {
        self.score += 200 * self.round; self.game.score = self.score; self.game.updateHUD();
        self.round++;
        self.game.showRoundBanner(self.round);
        self.speed = Math.max(70, 150 - (self.round - 1) * 30);
        self.roundTarget += 5;
        self.startRound(); return;
      }
      self.moveTimer = setTimeout(move, self.speed);
    };
    this.moveTimer = setTimeout(move, this.speed);
  },

  spawnFood() { this.food = this.randomEmpty(); this.food.emoji = this.FOOD_EMOJIS[Math.floor(Math.random() * this.FOOD_EMOJIS.length)]; },
  randomEmpty() { var p; var self = this; do { p = { x: Math.floor(Math.random()*self.cols), y: Math.floor(Math.random()*self.rows) }; } while (self.snake.some(function(s) { return s.x===p.x && s.y===p.y; })); return p; },
  update() {},
  render() {
    var ctx = this.game.ctx, cs = this.cellSize, canvas = this.game.canvas;
    ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    for (var x = 0; x < this.cols; x++) for (var y = 0; y < this.rows; y++) ctx.strokeRect(x*cs, y*cs, cs, cs);
    var self = this;
    this.snake.forEach(function(s, i) { ctx.fillStyle = i === 0 ? '#4CAF50' : 'rgba(76,175,80,'+(1-i/self.snake.length*0.5)+')'; ctx.fillRect(s.x*cs+1, s.y*cs+1, cs-2, cs-2); });
    if (this.food) { ctx.font = (cs-4)+'px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(this.food.emoji, this.food.x*cs+cs/2, this.food.y*cs+cs/2); }
    if (this.goldenFood) { ctx.font = (cs-2)+'px serif'; ctx.fillText('⭐', this.goldenFood.x*cs+cs/2, this.goldenFood.y*cs+cs/2); }
    ctx.fillStyle = '#fff'; ctx.font = '12px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('Round ' + this.round + ' | 目標長度: ' + (this.roundTarget + 3), 4, 14);
  },
  cleanup() {
    if (this.moveTimer) clearTimeout(this.moveTimer);
    if (this.goldenTimer) clearInterval(this.goldenTimer);
    var c = this.game.canvas;
    if (c) { c.removeEventListener('touchstart', this._touchStart); c.removeEventListener('touchend', this._touchEnd); }
    document.removeEventListener('keydown', this._keyDown);
  }
};
