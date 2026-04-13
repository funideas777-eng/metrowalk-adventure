const PacmanGame = {
  grid: [], player: null, ghosts: [], dots: [], powerPellets: [],
  direction: 'right', nextDirection: 'right',
  cellSize: 0, cols: 15, rows: 15,
  score: 0, round: 1, moveTimer: null, ghostTimer: null,
  powered: false, powerTimer: null,
  touchStartX: 0, touchStartY: 0,

  init(game) {
    this.game = game; this.score = 0; this.round = 1;
    this.setupCanvas();
    this.startRound();
  },

  setupCanvas() {
    const canvas = this.game.canvas;
    canvas.style.display = 'block';
    this.cellSize = Math.floor(Math.min(canvas.width, canvas.height) / this.cols);
    this._touchStart = e => { const t = e.touches[0]; this.touchStartX = t.clientX; this.touchStartY = t.clientY; };
    this._touchEnd = e => {
      const t = e.changedTouches[0], dx = t.clientX - this.touchStartX, dy = t.clientY - this.touchStartY;
      if (Math.abs(dx) < 15 && Math.abs(dy) < 15) return;
      if (Math.abs(dx) > Math.abs(dy)) { this.nextDirection = dx > 0 ? 'right' : 'left'; }
      else { this.nextDirection = dy > 0 ? 'down' : 'up'; }
    };
    canvas.addEventListener('touchstart', this._touchStart, { passive: true });
    canvas.addEventListener('touchend', this._touchEnd, { passive: true });
    // Keyboard support
    this._keyDown = e => {
      const map = { ArrowUp:'up', ArrowDown:'down', ArrowLeft:'left', ArrowRight:'right' };
      if (map[e.key]) { this.nextDirection = map[e.key]; e.preventDefault(); }
    };
    document.addEventListener('keydown', this._keyDown);
    // Mouse swipe support
    this._mouseDown = e => { this.touchStartX = e.clientX; this.touchStartY = e.clientY; };
    this._mouseUp = e => {
      const dx = e.clientX - this.touchStartX, dy = e.clientY - this.touchStartY;
      if (Math.abs(dx) < 15 && Math.abs(dy) < 15) return;
      if (Math.abs(dx) > Math.abs(dy)) this.nextDirection = dx > 0 ? 'right' : 'left';
      else this.nextDirection = dy > 0 ? 'down' : 'up';
    };
    canvas.addEventListener('mousedown', this._mouseDown);
    canvas.addEventListener('mouseup', this._mouseUp);
  },

  startRound() {
    this.direction = 'right'; this.nextDirection = 'right';
    this.powered = false;
    if (this.powerTimer) clearTimeout(this.powerTimer);
    this.generateMaze();
    this.player = { x: 1, y: 1 };
    const ghostCount = Math.min(2 + this.round - 1, 5);
    const speed = Math.max(140, 200 - (this.round - 1) * 30);
    this.ghosts = [];
    for (let i = 0; i < ghostCount; i++) {
      this.ghosts.push({ x: this.cols - 2, y: this.rows - 2 - i % 3, color: ['#FF0000','#FF69B4','#00BFFF','#FFD700','#00FF00'][i % 5] });
    }
    if (this.moveTimer) clearInterval(this.moveTimer);
    if (this.ghostTimer) clearInterval(this.ghostTimer);
    this.moveTimer = setInterval(() => this.movePlayer(), speed);
    this.ghostTimer = setInterval(() => this.moveGhosts(), speed + 50);
  },

  generateMaze() {
    this.grid = [];
    for (let y = 0; y < this.rows; y++) {
      this.grid[y] = [];
      for (let x = 0; x < this.cols; x++) {
        if (x === 0 || x === this.cols-1 || y === 0 || y === this.rows-1) this.grid[y][x] = 1;
        else if (x % 3 === 0 && y % 3 === 0) this.grid[y][x] = 1;
        else this.grid[y][x] = 0;
      }
    }
    this.dots = [];
    this.powerPellets = [];
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        if (this.grid[y][x] === 0) this.dots.push({ x, y });
      }
    }
    // 4 power pellets at corners
    const corners = [{x:1,y:1},{x:this.cols-2,y:1},{x:1,y:this.rows-2},{x:this.cols-2,y:this.rows-2}];
    corners.forEach(c => { if (this.grid[c.y][c.x] === 0) this.powerPellets.push(c); });
    // Remove player start dot
    this.dots = this.dots.filter(d => !(d.x === 1 && d.y === 1));
  },

  movePlayer() {
    if (!this.game.running) return;
    const dir = this.nextDirection;
    let nx = this.player.x, ny = this.player.y;
    if (dir === 'up') ny--; else if (dir === 'down') ny++;
    else if (dir === 'left') nx--; else if (dir === 'right') nx++;
    if (nx >= 0 && nx < this.cols && ny >= 0 && ny < this.rows && this.grid[ny][nx] === 0) {
      this.direction = dir; this.player.x = nx; this.player.y = ny;
    } else {
      nx = this.player.x; ny = this.player.y;
      if (this.direction === 'up') ny--; else if (this.direction === 'down') ny++;
      else if (this.direction === 'left') nx--; else if (this.direction === 'right') nx++;
      if (nx >= 0 && nx < this.cols && ny >= 0 && ny < this.rows && this.grid[ny][nx] === 0) {
        this.player.x = nx; this.player.y = ny;
      }
    }
    // Eat dots
    const di = this.dots.findIndex(d => d.x === this.player.x && d.y === this.player.y);
    if (di >= 0) { this.dots.splice(di, 1); this.score += 10; this.game.score = this.score; this.game.updateHUD(); AudioEngine.snakeEat(); }
    // Power pellet
    const pi = this.powerPellets.findIndex(p => p.x === this.player.x && p.y === this.player.y);
    if (pi >= 0) { this.powerPellets.splice(pi, 1); this.powered = true; AudioEngine.scoreUp(); if (this.powerTimer) clearTimeout(this.powerTimer); this.powerTimer = setTimeout(() => { this.powered = false; }, 5000); }
    // Check ghost collision
    this.ghosts.forEach((g, i) => {
      if (g.x === this.player.x && g.y === this.player.y) {
        if (this.powered) { this.score += 50; this.game.score = this.score; this.game.updateHUD(); AudioEngine.whackHit(); g.x = this.cols - 2; g.y = 1; }
        else { this.game.running = false; }
      }
    });
    // Round clear
    if (this.dots.length === 0 && this.powerPellets.length === 0) {
      this.score += 100 * this.round; this.game.score = this.score; this.game.updateHUD();
      AudioEngine.roundClear(); this.round++; this.startRound();
    }
  },

  moveGhosts() {
    if (!this.game.running) return;
    this.ghosts.forEach(g => {
      const dirs = [{dx:0,dy:-1},{dx:0,dy:1},{dx:-1,dy:0},{dx:1,dy:0}];
      // Chase player with some randomness
      if (Math.random() < 0.6) {
        dirs.sort((a, b) => {
          const da = Math.abs(g.x+a.dx-this.player.x) + Math.abs(g.y+a.dy-this.player.y);
          const db = Math.abs(g.x+b.dx-this.player.x) + Math.abs(g.y+b.dy-this.player.y);
          return this.powered ? db - da : da - db; // Run away when powered
        });
      } else { dirs.sort(() => Math.random() - 0.5); }
      for (const d of dirs) {
        const nx = g.x + d.dx, ny = g.y + d.dy;
        if (nx >= 0 && nx < this.cols && ny >= 0 && ny < this.rows && this.grid[ny][nx] === 0) {
          g.x = nx; g.y = ny; break;
        }
      }
      if (g.x === this.player.x && g.y === this.player.y) {
        if (this.powered) { this.score += 50; this.game.score = this.score; this.game.updateHUD(); g.x = this.cols - 2; g.y = 1; }
        else { this.game.running = false; }
      }
    });
  },

  update() {},
  render() {
    const ctx = this.game.ctx, cs = this.cellSize, canvas = this.game.canvas;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    const ox = Math.floor((canvas.width - this.cols * cs) / 2), oy = Math.floor((canvas.height - this.rows * cs) / 2);
    // Walls
    for (let y = 0; y < this.rows; y++) for (let x = 0; x < this.cols; x++) {
      if (this.grid[y] && this.grid[y][x] === 1) { ctx.fillStyle = '#1a237e'; ctx.fillRect(ox + x*cs, oy + y*cs, cs, cs); }
    }
    // Dots
    ctx.fillStyle = '#fff';
    this.dots.forEach(d => { ctx.beginPath(); ctx.arc(ox + d.x*cs + cs/2, oy + d.y*cs + cs/2, 2, 0, Math.PI*2); ctx.fill(); });
    // Power pellets
    ctx.fillStyle = '#FFD700';
    this.powerPellets.forEach(p => { ctx.beginPath(); ctx.arc(ox + p.x*cs + cs/2, oy + p.y*cs + cs/2, cs/3, 0, Math.PI*2); ctx.fill(); });
    // Player
    ctx.fillStyle = this.powered ? '#FFD700' : '#FFEB3B';
    ctx.beginPath(); ctx.arc(ox + this.player.x*cs + cs/2, oy + this.player.y*cs + cs/2, cs/2 - 1, 0, Math.PI*2); ctx.fill();
    // Ghosts
    this.ghosts.forEach(g => {
      ctx.fillStyle = this.powered ? '#4444FF' : g.color;
      ctx.beginPath(); ctx.arc(ox + g.x*cs + cs/2, oy + g.y*cs + cs/2, cs/2 - 1, 0, Math.PI*2); ctx.fill();
      ctx.fillRect(ox + g.x*cs + 1, oy + g.y*cs + cs/2, cs - 2, cs/2 - 1);
    });
    // Round indicator
    ctx.fillStyle = '#fff'; ctx.font = '12px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(`Round ${this.round}`, ox + 4, oy - 4);
  },

  cleanup() {
    if (this.moveTimer) clearInterval(this.moveTimer);
    if (this.ghostTimer) clearInterval(this.ghostTimer);
    if (this.powerTimer) clearTimeout(this.powerTimer);
    const c = this.game.canvas;
    if (c) { c.removeEventListener('touchstart', this._touchStart); c.removeEventListener('touchend', this._touchEnd); c.removeEventListener('mousedown', this._mouseDown); c.removeEventListener('mouseup', this._mouseUp); }
    document.removeEventListener('keydown', this._keyDown);
  }
};
