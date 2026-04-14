window.PuzzleGame = {
  grid: [], size: 3, emptyPos: { x: 0, y: 0 },
  score: 0, round: 1, moves: 0, totalMoves: 0,
  solved: false, movesSinceCheck: 0,

  TILE_COLORS: [
    '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#1abc9c',
    '#3498db', '#9b59b6', '#e91e63', '#00bcd4', '#ff5722',
    '#8bc34a', '#cddc39', '#ff9800', '#795548', '#607d8b',
    '#673ab7', '#009688', '#4caf50', '#03a9f4', '#ff4081',
    '#7c4dff', '#00e676', '#ffea00', '#ff3d00', '#76ff03'
  ],

  init: function(game) {
    this.game = game;
    this.score = 0;
    this.round = 1;
    this.totalMoves = 0;
    this.startRound();
  },

  startRound: function() {
    if (this.round === 1) { this.size = 3; }
    else if (this.round === 2) { this.size = 4; }
    else { this.size = 5; }
    this.moves = 0;
    this.movesSinceCheck = 0;
    this.solved = false;
    this.generatePuzzle();
    this.renderGrid();
  },

  generatePuzzle: function() {
    var total = this.size * this.size;
    var flat = [];
    var i;
    for (i = 1; i < total; i++) flat.push(i);
    flat.push(0);

    // Shuffle by making random valid moves from solved state
    var empty = { x: this.size - 1, y: this.size - 1 };
    var dirs = [{dx:0,dy:-1},{dx:0,dy:1},{dx:-1,dy:0},{dx:1,dy:0}];
    var shuffleMoves = this.size <= 3 ? 200 : (this.size <= 4 ? 400 : 600);
    var lastDir = -1;

    for (i = 0; i < shuffleMoves; i++) {
      var d = Math.floor(Math.random() * 4);
      // Avoid immediately reversing the last move
      if (d === (lastDir ^ 1) && lastDir >= 0) { d = (d + 1) % 4; }
      var nx = empty.x + dirs[d].dx;
      var ny = empty.y + dirs[d].dy;
      if (nx >= 0 && nx < this.size && ny >= 0 && ny < this.size) {
        var ei = empty.y * this.size + empty.x;
        var ni = ny * this.size + nx;
        var tmp = flat[ei];
        flat[ei] = flat[ni];
        flat[ni] = tmp;
        empty = { x: nx, y: ny };
        lastDir = d;
      }
    }

    this.grid = [];
    for (var y = 0; y < this.size; y++) {
      this.grid[y] = [];
      for (var x = 0; x < this.size; x++) {
        var val = flat[y * this.size + x];
        this.grid[y][x] = val;
        if (val === 0) this.emptyPos = { x: x, y: y };
      }
    }
  },

  renderGrid: function() {
    var canvas = this.game.canvas;
    canvas.style.display = 'none';

    var c = document.getElementById('puzzle-container');
    if (!c) {
      c = document.createElement('div');
      c.id = 'puzzle-container';
      canvas.parentElement.appendChild(c);
    }

    // Info text on top
    var ri = document.getElementById('puzzle-round');
    if (!ri) {
      ri = document.createElement('div');
      ri.id = 'puzzle-round';
      c.parentElement.insertBefore(ri, c);
    }
    ri.style.cssText = 'text-align:center;color:white;font-size:13px;padding:8px 0 4px;';
    ri.textContent = 'Round ' + this.round + ' (' + this.size + 'x' + this.size + ') | \u6B65\u6578: ' + this.moves;

    // Full width grid
    var fontSize = this.size >= 5 ? '20' : (this.size >= 4 ? '24' : '30');
    c.style.cssText = 'display:grid;grid-template-columns:repeat(' + this.size + ',1fr);gap:6px;padding:6px;width:100%;max-width:100%;margin:0 auto;';

    var self = this;
    var html = '';
    for (var y = 0; y < this.size; y++) {
      for (var x = 0; x < this.size; x++) {
        var val = this.grid[y][x];
        if (val === 0) {
          html += '<div style="aspect-ratio:1;border-radius:10px;background:#1a1a2e;"></div>';
        } else {
          var colorIdx = (val - 1) % self.TILE_COLORS.length;
          var bg = self.TILE_COLORS[colorIdx];
          var isCorrect = val === y * self.size + x + 1;
          if (isCorrect) {
            bg = '#2ecc71';
          }
          html += '<div data-px="' + x + '" data-py="' + y + '" onclick="PuzzleGame.tapTile(' + x + ',' + y + ')" style="aspect-ratio:1;border-radius:10px;background:' + bg + ';display:flex;align-items:center;justify-content:center;font-size:' + fontSize + 'px;font-weight:900;color:white;cursor:pointer;box-shadow:0 3px 8px rgba(0,0,0,0.3);user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;transition:transform 0.1s;text-shadow:1px 1px 2px rgba(0,0,0,0.3);min-height:40px;">' + val + '</div>';
        }
      }
    }
    c.innerHTML = html;
  },

  tapTile: function(x, y) {
    if (this.solved || this.game.paused) return;

    var ex = this.emptyPos.x;
    var ey = this.emptyPos.y;
    var isAdjacent = (Math.abs(x - ex) === 1 && y === ey) || (Math.abs(y - ey) === 1 && x === ex);

    if (!isAdjacent) return;

    // Swap tile with empty
    this.grid[ey][ex] = this.grid[y][x];
    this.grid[y][x] = 0;
    this.emptyPos = { x: x, y: y };
    this.moves++;
    this.totalMoves++;
    this.movesSinceCheck++;

    AudioEngine.tapButton();
    this.game.addCombo();
    this.game.updateHUD();
    this.renderGrid();

    // Every 30 moves without solving = lose a life
    if (this.movesSinceCheck >= 30) {
      this.movesSinceCheck = 0;
      this.game.loseLife();
      this.game.resetCombo();
    }

    // Check if solved
    if (this.checkSolved()) {
      this.solved = true;
      var timeBonus = Math.floor(this.game.timeLeft * 3);
      var roundScore = 200 * this.round + timeBonus;
      this.score += roundScore;
      this.game.score = this.score;
      this.game.updateHUD();
      AudioEngine.roundClear();
      this.round++;
      this.game.showRoundBanner(this.round);
      var self = this;
      setTimeout(function() { self.startRound(); }, 1000);
    }
  },

  checkSolved: function() {
    var expected = 1;
    for (var y = 0; y < this.size; y++) {
      for (var x = 0; x < this.size; x++) {
        if (y === this.size - 1 && x === this.size - 1) return this.grid[y][x] === 0;
        if (this.grid[y][x] !== expected) return false;
        expected++;
      }
    }
    return true;
  },

  update: function() {},
  render: function() {},

  cleanup: function() {
    var c = document.getElementById('puzzle-container');
    if (c) c.remove();
    var r = document.getElementById('puzzle-round');
    if (r) r.remove();
    if (this.game && this.game.canvas) this.game.canvas.style.display = 'block';
  }
};
