const SnakeGame = {
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
    const canvas = game.canvas;
    this.cols = Math.floor(canvas.width / this.cellSize);
    this.rows = Math.floor(canvas.height / this.cellSize);
    this.startRound();
    this.setupControls(canvas);
    this.goldenTimer = setInterval(() => { if (game.running && !this.goldenFood) this.goldenFood = this.randomEmpty(); }, 15000);
  },

  startRound() {
    this.direction = 'right'; this.nextDirection = 'right';
    const midX = Math.floor(this.cols / 2), midY = Math.floor(this.rows / 2);
    this.snake = [{ x: midX, y: midY }, { x: midX-1, y: midY }, { x: midX-2, y: midY }];
    this.spawnFood();
    if (this.moveTimer) clearTimeout(this.moveTimer);
    this.startMoving();
  },

  setupControls(canvas) {
    this._touchStart = e => { this.touchStartX = e.touches[0].clientX; this.touchStartY = e.touches[0].clientY; };
    this._touchEnd = e => {
      const dx = e.changedTouches[0].clientX - this.touchStartX, dy = e.changedTouches[0].clientY - this.touchStartY;
      if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
      if (Math.abs(dx) > Math.abs(dy)) { if (dx > 0 && this.direction !== 'left') this.nextDirection = 'right'; else if (dx < 0 && this.direction !== 'right') this.nextDirection = 'left'; }
      else { if (dy > 0 && this.direction !== 'up') this.nextDirection = 'down'; else if (dy < 0 && this.direction !== 'down') this.nextDirection = 'up'; }
    };
    canvas.addEventListener('touchstart', this._touchStart, { passive: true });
    canvas.addEventListener('touchend', this._touchEnd, { passive: true });
  },

  startMoving() {
    const move = () => {
      if (!this.game.running) return;
      this.direction = this.nextDirection;
      const head = { ...this.snake[0] };
      if (this.direction === 'up') head.y--; else if (this.direction === 'down') head.y++;
      else if (this.direction === 'left') head.x--; else if (this.direction === 'right') head.x++;
      if (head.x < 0 || head.x >= this.cols || head.y < 0 || head.y >= this.rows) { this.game.running = false; return; }
      if (this.snake.some(s => s.x === head.x && s.y === head.y)) { this.game.running = false; return; }
      this.snake.unshift(head);
      let ate = false;
      if (this.food && head.x === this.food.x && head.y === this.food.y) {
        this.score += 10 * Math.ceil(this.snake.length / 5); this.spawnFood(); ate = true; AudioEngine.snakeEat();
      } else if (this.goldenFood && head.x === this.goldenFood.x && head.y === this.goldenFood.y) {
        this.score += 50; this.goldenFood = null; ate = true; AudioEngine.scoreUp();
      }
      if (!ate) this.snake.pop();
      this.game.score = this.score; this.game.updateHUD();
      // Round clear check
      if (this.snake.length >= this.roundTarget + 3) {
        this.score += 200 * this.round; this.game.score = this.score; this.game.updateHUD();
        AudioEngine.roundClear(); this.round++;
        this.speed = Math.max(70, 150 - (this.round - 1) * 30);
        this.roundTarget += 5;
        this.startRound(); return;
      }
      this.moveTimer = setTimeout(move, this.speed);
    };
    this.moveTimer = setTimeout(move, this.speed);
  },

  spawnFood() { this.food = this.randomEmpty(); this.food.emoji = this.FOOD_EMOJIS[Math.floor(Math.random() * this.FOOD_EMOJIS.length)]; },
  randomEmpty() { let p; do { p = { x: Math.floor(Math.random()*this.cols), y: Math.floor(Math.random()*this.rows) }; } while (this.snake.some(s => s.x===p.x && s.y===p.y)); return p; },
  update() {},
  render() {
    const ctx = this.game.ctx, cs = this.cellSize, canvas = this.game.canvas;
    ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    for (let x = 0; x < this.cols; x++) for (let y = 0; y < this.rows; y++) ctx.strokeRect(x*cs, y*cs, cs, cs);
    this.snake.forEach((s, i) => { ctx.fillStyle = i === 0 ? '#4CAF50' : `rgba(76,175,80,${1-i/this.snake.length*0.5})`; ctx.fillRect(s.x*cs+1, s.y*cs+1, cs-2, cs-2); });
    if (this.food) { ctx.font = (cs-4)+'px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(this.food.emoji, this.food.x*cs+cs/2, this.food.y*cs+cs/2); }
    if (this.goldenFood) { ctx.font = (cs-2)+'px serif'; ctx.fillText('⭐', this.goldenFood.x*cs+cs/2, this.goldenFood.y*cs+cs/2); }
    ctx.fillStyle = '#fff'; ctx.font = '12px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(`Round ${this.round} | 目標長度: ${this.roundTarget + 3}`, 4, 14);
  },
  cleanup() { if (this.moveTimer) clearTimeout(this.moveTimer); if (this.goldenTimer) clearInterval(this.goldenTimer); const c = this.game.canvas; if (c) { c.removeEventListener('touchstart', this._touchStart); c.removeEventListener('touchend', this._touchEnd); } }
};
