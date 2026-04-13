window.PacmanGame = {
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

  // D-Pad input from game.html
  setDirection(dir) {
    this.nextDirection = dir;
  },

  setupCanvas() {
    var canvas = this.game.canvas;
    canvas.style.display = 'block';
    this.cellSize = Math.floor(Math.min(canvas.width, canvas.height) / this.cols);
    // Touch swipe
    var self = this;
    this._touchStart = function(e) { var t = e.touches[0]; self.touchStartX = t.clientX; self.touchStartY = t.clientY; };
    this._touchEnd = function(e) {
      var t = e.changedTouches[0], dx = t.clientX - self.touchStartX, dy = t.clientY - self.touchStartY;
      if (Math.abs(dx) < 15 && Math.abs(dy) < 15) return;
      if (Math.abs(dx) > Math.abs(dy)) self.nextDirection = dx > 0 ? 'right' : 'left';
      else self.nextDirection = dy > 0 ? 'down' : 'up';
    };
    canvas.addEventListener('touchstart', this._touchStart, { passive: true });
    canvas.addEventListener('touchend', this._touchEnd, { passive: true });
    // Keyboard (backup, D-pad is primary)
    this._keyDown = function(e) {
      var map = { ArrowUp:'up', ArrowDown:'down', ArrowLeft:'left', ArrowRight:'right' };
      if (map[e.key]) { self.nextDirection = map[e.key]; e.preventDefault(); }
    };
    document.addEventListener('keydown', this._keyDown);
  },

  startRound() {
    this.direction = 'right'; this.nextDirection = 'right';
    this.powered = false;
    if (this.powerTimer) clearTimeout(this.powerTimer);
    this.generateMaze();
    this.player = { x: 1, y: 1 };
    var ghostCount = Math.min(2 + this.round - 1, 5);
    var speed = Math.max(140, 200 - (this.round - 1) * 30);
    this.ghosts = [];
    for (var i = 0; i < ghostCount; i++) {
      this.ghosts.push({ x: this.cols - 2, y: this.rows - 2 - i % 3, color: ['#FF0000','#FF69B4','#00BFFF','#FFD700','#00FF00'][i % 5] });
    }
    if (this.moveTimer) clearInterval(this.moveTimer);
    if (this.ghostTimer) clearInterval(this.ghostTimer);
    var self = this;
    this.moveTimer = setInterval(function() { self.movePlayer(); }, speed);
    this.ghostTimer = setInterval(function() { self.moveGhosts(); }, speed + 50);
  },

  generateMaze() {
    this.grid = [];
    for (var y = 0; y < this.rows; y++) {
      this.grid[y] = [];
      for (var x = 0; x < this.cols; x++) {
        if (x === 0 || x === this.cols-1 || y === 0 || y === this.rows-1) this.grid[y][x] = 1;
        else if (x % 3 === 0 && y % 3 === 0) this.grid[y][x] = 1;
        else this.grid[y][x] = 0;
      }
    }
    this.dots = []; this.powerPellets = [];
    for (var y = 0; y < this.rows; y++) {
      for (var x = 0; x < this.cols; x++) {
        if (this.grid[y][x] === 0) this.dots.push({ x: x, y: y });
      }
    }
    var corners = [{x:1,y:1},{x:this.cols-2,y:1},{x:1,y:this.rows-2},{x:this.cols-2,y:this.rows-2}];
    var self = this;
    corners.forEach(function(c) { if (self.grid[c.y][c.x] === 0) self.powerPellets.push(c); });
    this.dots = this.dots.filter(function(d) { return !(d.x === 1 && d.y === 1); });
  },

  movePlayer() {
    if (!this.game.running || this.game.paused) return;
    var dir = this.nextDirection;
    var nx = this.player.x, ny = this.player.y;
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
    var self = this;
    var di = this.dots.findIndex(function(d) { return d.x === self.player.x && d.y === self.player.y; });
    if (di >= 0) { this.dots.splice(di, 1); this.score += 10; this.game.score = this.score; this.game.updateHUD(); AudioEngine.snakeEat(); }
    // Power pellet
    var pi = this.powerPellets.findIndex(function(p) { return p.x === self.player.x && p.y === self.player.y; });
    if (pi >= 0) { this.powerPellets.splice(pi, 1); this.powered = true; AudioEngine.scoreUp(); if (this.powerTimer) clearTimeout(this.powerTimer); this.powerTimer = setTimeout(function() { self.powered = false; }, 5000); }
    // Ghost collision
    this.ghosts.forEach(function(g) {
      if (g.x === self.player.x && g.y === self.player.y) {
        if (self.powered) {
          self.score += 50; self.game.score = self.score; self.game.updateHUD();
          AudioEngine.whackHit(); g.x = self.cols - 2; g.y = 1;
        } else {
          // Lose life instead of game over
          var livesLeft = self.game.loseLife();
          if (livesLeft > 0) {
            self.player.x = 1; self.player.y = 1;
            self.direction = 'right'; self.nextDirection = 'right';
          }
        }
      }
    });
    // Round clear
    if (this.dots.length === 0 && this.powerPellets.length === 0) {
      this.score += 100 * this.round; this.game.score = this.score; this.game.updateHUD();
      this.round++; this.game.showRoundBanner(this.round);
      this.startRound();
    }
  },

  moveGhosts() {
    if (!this.game.running || this.game.paused) return;
    var self = this;
    this.ghosts.forEach(function(g) {
      var dirs = [{dx:0,dy:-1},{dx:0,dy:1},{dx:-1,dy:0},{dx:1,dy:0}];
      if (Math.random() < 0.6) {
        dirs.sort(function(a, b) {
          var da = Math.abs(g.x+a.dx-self.player.x) + Math.abs(g.y+a.dy-self.player.y);
          var db = Math.abs(g.x+b.dx-self.player.x) + Math.abs(g.y+b.dy-self.player.y);
          return self.powered ? db - da : da - db;
        });
      } else { dirs.sort(function() { return Math.random() - 0.5; }); }
      for (var i = 0; i < dirs.length; i++) {
        var d = dirs[i];
        var nx = g.x + d.dx, ny = g.y + d.dy;
        if (nx >= 0 && nx < self.cols && ny >= 0 && ny < self.rows && self.grid[ny][nx] === 0) {
          g.x = nx; g.y = ny; break;
        }
      }
      if (g.x === self.player.x && g.y === self.player.y) {
        if (self.powered) {
          self.score += 50; self.game.score = self.score; self.game.updateHUD();
          g.x = self.cols - 2; g.y = 1;
        } else {
          var livesLeft = self.game.loseLife();
          if (livesLeft > 0) {
            self.player.x = 1; self.player.y = 1;
            self.direction = 'right'; self.nextDirection = 'right';
          }
        }
      }
    });
  },

  update() {},
  render() {
    var ctx = this.game.ctx, cs = this.cellSize, canvas = this.game.canvas;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    var ox = Math.floor((canvas.width - this.cols * cs) / 2), oy = Math.floor((canvas.height - this.rows * cs) / 2);
    // Walls
    for (var y = 0; y < this.rows; y++) for (var x = 0; x < this.cols; x++) {
      if (this.grid[y] && this.grid[y][x] === 1) { ctx.fillStyle = '#1a237e'; ctx.fillRect(ox + x*cs, oy + y*cs, cs, cs); }
    }
    // Dots
    ctx.fillStyle = '#fff';
    this.dots.forEach(function(d) { ctx.beginPath(); ctx.arc(ox + d.x*cs + cs/2, oy + d.y*cs + cs/2, 2, 0, Math.PI*2); ctx.fill(); });
    // Power pellets
    ctx.fillStyle = '#FFD700';
    this.powerPellets.forEach(function(p) { ctx.beginPath(); ctx.arc(ox + p.x*cs + cs/2, oy + p.y*cs + cs/2, cs/3, 0, Math.PI*2); ctx.fill(); });
    // Player
    ctx.fillStyle = this.powered ? '#FFD700' : '#FFEB3B';
    ctx.beginPath(); ctx.arc(ox + this.player.x*cs + cs/2, oy + this.player.y*cs + cs/2, cs/2 - 1, 0, Math.PI*2); ctx.fill();
    // Ghosts
    var self = this;
    this.ghosts.forEach(function(g) {
      ctx.fillStyle = self.powered ? '#4444FF' : g.color;
      ctx.beginPath(); ctx.arc(ox + g.x*cs + cs/2, oy + g.y*cs + cs/2, cs/2 - 1, 0, Math.PI*2); ctx.fill();
      ctx.fillRect(ox + g.x*cs + 1, oy + g.y*cs + cs/2, cs - 2, cs/2 - 1);
    });
    // Round
    ctx.fillStyle = '#fff'; ctx.font = '12px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('Round ' + this.round + ' | 豆子: ' + this.dots.length, ox + 4, oy - 4);
  },

  cleanup() {
    if (this.moveTimer) clearInterval(this.moveTimer);
    if (this.ghostTimer) clearInterval(this.ghostTimer);
    if (this.powerTimer) clearTimeout(this.powerTimer);
    var c = this.game.canvas;
    if (c) { c.removeEventListener('touchstart', this._touchStart); c.removeEventListener('touchend', this._touchEnd); }
    document.removeEventListener('keydown', this._keyDown);
  }
};
