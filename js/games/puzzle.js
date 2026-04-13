const PuzzleGame = {
  grid: [], size: 3, emptyPos: { x: 0, y: 0 },
  score: 0, round: 1, moves: 0,
  solved: false,

  init(game) {
    this.game = game; this.score = 0; this.round = 1; this.startRound();
  },

  startRound() {
    this.size = this.round <= 1 ? 3 : 4;
    this.moves = 0; this.solved = false;
    this.grid = [];
    const total = this.size * this.size;
    const nums = [];
    for (let i = 1; i < total; i++) nums.push(i);
    nums.push(0);
    // Shuffle by making random valid moves
    let empty = { x: this.size - 1, y: this.size - 1 };
    const flat = [...nums];
    for (let i = 0; i < 200; i++) {
      const dirs = [{dx:0,dy:-1},{dx:0,dy:1},{dx:-1,dy:0},{dx:1,dy:0}];
      const d = dirs[Math.floor(Math.random() * 4)];
      const nx = empty.x + d.dx, ny = empty.y + d.dy;
      if (nx >= 0 && nx < this.size && ny >= 0 && ny < this.size) {
        const ei = empty.y * this.size + empty.x;
        const ni = ny * this.size + nx;
        [flat[ei], flat[ni]] = [flat[ni], flat[ei]];
        empty = { x: nx, y: ny };
      }
    }
    this.grid = [];
    for (let y = 0; y < this.size; y++) {
      this.grid[y] = [];
      for (let x = 0; x < this.size; x++) {
        const val = flat[y * this.size + x];
        this.grid[y][x] = val;
        if (val === 0) this.emptyPos = { x, y };
      }
    }
    this.renderGrid();
  },

  renderGrid() {
    const canvas = this.game.canvas; canvas.style.display = 'none';
    let c = document.getElementById('puzzle-container');
    if (!c) { c = document.createElement('div'); c.id = 'puzzle-container'; c.style.cssText = 'width:100%;max-width:320px;margin:0 auto;padding:16px;'; canvas.parentElement.appendChild(c); }
    const cellSize = Math.floor(280 / this.size);
    let ri = document.getElementById('puzzle-round');
    if (!ri) { ri = document.createElement('div'); ri.id = 'puzzle-round'; ri.style.cssText = 'text-align:center;color:white;font-size:13px;margin-bottom:12px;'; c.parentElement.insertBefore(ri, c); }
    ri.textContent = `Round ${this.round} (${this.size}x${this.size}) | \u6B65\u6578: ${this.moves}`;
    c.innerHTML = `<div style="display:grid;grid-template-columns:repeat(${this.size},${cellSize}px);gap:4px;justify-content:center;">` +
      this.grid.flat().map((val, idx) => {
        const x = idx % this.size, y = Math.floor(idx / this.size);
        if (val === 0) return `<div style="width:${cellSize}px;height:${cellSize}px;"></div>`;
        const isCorrect = val === y * this.size + x + 1;
        return `<div onclick="PuzzleGame.tapTile(${x},${y})" style="width:${cellSize}px;height:${cellSize}px;background:${isCorrect?'#4caf50':'var(--primary)'};border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:${this.size<=3?'24':'18'}px;font-weight:900;color:white;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,0.2);user-select:none;">${val}</div>`;
      }).join('') + '</div>';
  },

  tapTile(x, y) {
    if (this.solved) return;
    const ex = this.emptyPos.x, ey = this.emptyPos.y;
    if ((Math.abs(x-ex) === 1 && y === ey) || (Math.abs(y-ey) === 1 && x === ex)) {
      this.grid[ey][ex] = this.grid[y][x];
      this.grid[y][x] = 0;
      this.emptyPos = { x, y };
      this.moves++;
      AudioEngine.tapButton();
      this.renderGrid();
      if (this.checkSolved()) {
        this.solved = true;
        const moveBonus = Math.max(0, 200 - this.moves * 3);
        const timeBonus = Math.floor(this.game.timeLeft * 3);
        this.score += 100 * this.round + moveBonus + timeBonus;
        this.game.score = this.score; this.game.updateHUD();
        AudioEngine.roundClear(); this.round++;
        setTimeout(() => this.startRound(), 1000);
      }
    }
  },

  checkSolved() {
    let expected = 1;
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        if (y === this.size - 1 && x === this.size - 1) return this.grid[y][x] === 0;
        if (this.grid[y][x] !== expected) return false;
        expected++;
      }
    }
    return true;
  },

  update() {}, render() {},
  cleanup() {
    const c = document.getElementById('puzzle-container'); if (c) c.remove();
    const r = document.getElementById('puzzle-round'); if (r) r.remove();
    if (this.game.canvas) this.game.canvas.style.display = 'block';
  }
};
