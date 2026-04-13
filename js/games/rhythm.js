window.RhythmGame = {
  lanes: 3, notes: [], score: 0, round: 1, hits: 0,
  combo: 0, maxCombo: 0, noteSpeed: 2, spawnRate: 800,
  hitZoneY: 0, spawnTimer: null,
  canvasW: 0, canvasH: 0, laneWidth: 0,

  init(game) {
    this.game = game; this.score = 0; this.round = 1; this.hits = 0;
    this.combo = 0; this.maxCombo = 0; this.noteSpeed = 2; this.spawnRate = 800;
    this.notes = [];
    this.canvasW = game.canvas.width; this.canvasH = game.canvas.height;
    this.laneWidth = Math.floor(this.canvasW / this.lanes);
    this.hitZoneY = this.canvasH - 60;
    this._lastTap = 0;
    this._tap = e => {
      if (Date.now() - this._lastTap < 100) return;
      this._lastTap = Date.now();
      const rect = game.canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const x = clientX - rect.left;
      const lane = Math.floor(x / this.laneWidth);
      this.hitNote(lane);
    };
    game.canvas.addEventListener('touchstart', this._tap, { passive: true });
    game.canvas.addEventListener('click', this._tap);
    this.startSpawning();
  },

  startSpawning() {
    if (this.spawnTimer) clearInterval(this.spawnTimer);
    this.spawnTimer = setInterval(() => {
      if (!this.game.running) return;
      const lane = Math.floor(Math.random() * this.lanes);
      this.notes.push({ lane, y: -20, hit: false });
      // Multi-note in later rounds
      if (this.round >= 3 && Math.random() < 0.3) {
        const lane2 = (lane + 1 + Math.floor(Math.random() * 2)) % this.lanes;
        this.notes.push({ lane: lane2, y: -20, hit: false });
      }
    }, this.spawnRate);
  },

  hitNote(lane) {
    let bestNote = null, bestDist = Infinity;
    this.notes.forEach(n => {
      if (n.lane === lane && !n.hit) {
        const dist = Math.abs(n.y - this.hitZoneY);
        if (dist < 40 && dist < bestDist) { bestNote = n; bestDist = dist; }
      }
    });
    if (bestNote) {
      bestNote.hit = true;
      this.hits++; this.combo++;
      if (this.combo > this.maxCombo) this.maxCombo = this.combo;
      const accuracy = bestDist < 15 ? 'perfect' : 'good';
      this.score += accuracy === 'perfect' ? 25 : 15;
      this.score += Math.min(this.combo * 3, 20);
      AudioEngine.comboHit(this.combo);
      this.game.score = this.score; this.game.combo = this.combo; this.game.maxCombo = this.maxCombo; this.game.updateHUD();
      if (this.hits >= 20) {
        this.score += 200 * this.round; this.game.score = this.score; this.game.updateHUD();
        AudioEngine.roundClear(); this.round++; this.hits = 0;
        this.noteSpeed = Math.min(6, 2 + (this.round - 1) * 0.8);
        this.spawnRate = Math.max(300, 800 - (this.round - 1) * 150);
        this.notes = [];
        if (this.spawnTimer) clearInterval(this.spawnTimer);
        setTimeout(() => this.startSpawning(), 500);
      }
    } else {
      this.combo = 0; this.game.combo = 0; this.game.updateHUD();
      AudioEngine.penalty();
    }
  },

  update() {
    if (!this.game.running) return;
    for (let i = this.notes.length - 1; i >= 0; i--) {
      this.notes[i].y += this.noteSpeed;
      if (this.notes[i].y > this.canvasH + 20) {
        if (!this.notes[i].hit) { this.combo = 0; this.game.combo = 0; this.game.updateHUD(); }
        this.notes.splice(i, 1);
      }
    }
  },

  render() {
    const ctx = this.game.ctx, canvas = this.game.canvas;
    ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Lane dividers
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1;
    for (let i = 1; i < this.lanes; i++) { ctx.beginPath(); ctx.moveTo(i * this.laneWidth, 0); ctx.lineTo(i * this.laneWidth, canvas.height); ctx.stroke(); }
    // Hit zone
    ctx.fillStyle = 'rgba(233,30,99,0.2)';
    ctx.fillRect(0, this.hitZoneY - 20, canvas.width, 40);
    ctx.strokeStyle = 'rgba(233,30,99,0.6)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, this.hitZoneY); ctx.lineTo(canvas.width, this.hitZoneY); ctx.stroke();
    // Notes
    const colors = ['#E91E63', '#9C27B0', '#2196F3'];
    this.notes.forEach(n => {
      if (n.hit) return;
      const x = n.lane * this.laneWidth + this.laneWidth / 2;
      ctx.fillStyle = colors[n.lane % colors.length];
      ctx.beginPath(); ctx.arc(x, n.y, 18, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'white'; ctx.font = '14px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('\u266A', x, n.y);
    });
    // Lane labels at bottom
    ctx.font = '12px sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.textAlign = 'center';
    for (let i = 0; i < this.lanes; i++) ctx.fillText('TAP', i * this.laneWidth + this.laneWidth / 2, canvas.height - 10);
    // Round info
    ctx.fillStyle = '#fff'; ctx.font = '12px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(`Round ${this.round} | Hits: ${this.hits}/20`, 8, 16);
  },

  cleanup() {
    if (this.spawnTimer) clearInterval(this.spawnTimer);
    if (this.game.canvas) { this.game.canvas.removeEventListener('touchstart', this._tap); this.game.canvas.removeEventListener('click', this._tap); }
  }
};
