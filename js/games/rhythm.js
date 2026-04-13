window.RhythmGame = {
  lanes: 3, notes: [], score: 0, round: 1, hits: 0,
  combo: 0, maxCombo: 0, noteSpeed: 3, spawnRate: 500,
  hitZoneY: 0, spawnTimer: null,
  canvasW: 0, canvasH: 0, laneWidth: 0,
  holdNotes: {}, // lane -> { start, target, active }
  effects: [], // visual effects

  init(game) {
    this.game = game; this.score = 0; this.round = 1; this.hits = 0;
    this.combo = 0; this.maxCombo = 0;
    this.noteSpeed = 3; this.spawnRate = 500; // Faster first stage
    this.notes = []; this.effects = []; this.holdNotes = {};
    this.canvasW = game.canvas.width; this.canvasH = game.canvas.height;
    this.laneWidth = Math.floor(this.canvasW / this.lanes);
    this.hitZoneY = this.canvasH - 80;
    this._lastTap = {};
    var self = this;

    // Touch handling - support multi-touch for rapid tap
    this._touchStart = function(e) {
      for (var i = 0; i < e.touches.length; i++) {
        var touch = e.touches[i];
        var rect = game.canvas.getBoundingClientRect();
        var x = touch.clientX - rect.left;
        var lane = Math.floor(x / self.laneWidth);
        if (lane < 0) lane = 0; if (lane >= self.lanes) lane = self.lanes - 1;
        // Debounce per lane
        var now = Date.now();
        if (self._lastTap[lane] && now - self._lastTap[lane] < 80) continue;
        self._lastTap[lane] = now;
        self.hitNote(lane);
      }
    };
    this._touchEnd = function(e) {
      // Release hold notes
      for (var lane = 0; lane < self.lanes; lane++) {
        if (self.holdNotes[lane] && self.holdNotes[lane].active) {
          self.releaseHold(lane);
        }
      }
    };
    this._click = function(e) {
      var rect = game.canvas.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var lane = Math.floor(x / self.laneWidth);
      if (lane < 0) lane = 0; if (lane >= self.lanes) lane = self.lanes - 1;
      self.hitNote(lane);
    };
    game.canvas.addEventListener('touchstart', this._touchStart, { passive: true });
    game.canvas.addEventListener('touchend', this._touchEnd, { passive: true });
    game.canvas.addEventListener('click', this._click);
    this.startSpawning();
  },

  startSpawning() {
    if (this.spawnTimer) clearInterval(this.spawnTimer);
    var self = this;
    this.spawnTimer = setInterval(function() {
      if (!self.game.running || self.game.paused) return;
      var lane = Math.floor(Math.random() * self.lanes);
      var isHold = self.round >= 2 && Math.random() < 0.2; // Hold notes from round 2
      var isRapid = self.round >= 2 && !isHold && Math.random() < 0.15; // Rapid tap notes

      if (isHold) {
        // Hold note - longer note that needs to be held
        self.notes.push({ lane: lane, y: -60, hit: false, type: 'hold', length: 60, held: false, holdScore: 0 });
      } else if (isRapid) {
        // Rapid: 3 quick notes in same lane
        for (var r = 0; r < 3; r++) {
          self.notes.push({ lane: lane, y: -20 - r * 30, hit: false, type: 'rapid' });
        }
      } else {
        self.notes.push({ lane: lane, y: -20, hit: false, type: 'normal' });
      }
      // Multi-note in later rounds
      if (self.round >= 3 && Math.random() < 0.3) {
        var lane2 = (lane + 1 + Math.floor(Math.random() * 2)) % self.lanes;
        self.notes.push({ lane: lane2, y: -20, hit: false, type: 'normal' });
      }
    }, this.spawnRate);
  },

  hitNote(lane) {
    var bestNote = null, bestDist = Infinity;
    for (var i = 0; i < this.notes.length; i++) {
      var n = this.notes[i];
      if (n.lane === lane && !n.hit) {
        var dist = Math.abs(n.y - this.hitZoneY);
        if (dist < 45 && dist < bestDist) { bestNote = n; bestDist = dist; }
      }
    }
    if (bestNote) {
      var accuracy = bestDist < 15 ? 'perfect' : 'good';
      var pts = accuracy === 'perfect' ? 25 : 15;
      // Combo bonus (enhanced)
      var comboBonus = Math.min(this.combo * 5, 50);
      pts += comboBonus;

      if (bestNote.type === 'hold') {
        // Start holding
        bestNote.hit = true; bestNote.held = true;
        this.holdNotes[lane] = { note: bestNote, start: Date.now(), active: true };
        pts = 10; // Initial hold points
        AudioEngine.rhythmPerfect();
      } else if (bestNote.type === 'rapid') {
        bestNote.hit = true;
        AudioEngine.rhythmPerfect();
        // Rapid tap bonus
        pts += 5;
      } else {
        bestNote.hit = true;
        if (accuracy === 'perfect') AudioEngine.rhythmPerfect();
        else AudioEngine.rhythmGood();
      }

      this.hits++; this.combo++;
      if (this.combo > this.maxCombo) this.maxCombo = this.combo;
      this.score += pts;
      AudioEngine.comboHit(this.combo);

      // Visual effect
      this.effects.push({ x: lane * this.laneWidth + this.laneWidth/2, y: this.hitZoneY, text: accuracy === 'perfect' ? 'PERFECT!' : 'GOOD', color: accuracy === 'perfect' ? '#FFD700' : '#4CAF50', life: 30 });

      // Combo milestone effects
      if (this.combo > 0 && this.combo % 10 === 0) {
        this.score += 50; // Combo milestone bonus
        this.effects.push({ x: this.canvasW/2, y: this.canvasH/2, text: '🔥 ' + this.combo + ' COMBO!', color: '#FF5722', life: 45 });
        if (navigator.vibrate) navigator.vibrate([50, 30, 50, 30, 100]);
      }

      this.game.score = this.score; this.game.combo = this.combo; this.game.maxCombo = this.maxCombo; this.game.updateHUD();

      if (this.hits >= 20) {
        this.score += 200 * this.round; this.game.score = this.score; this.game.updateHUD();
        this.round++; this.hits = 0;
        this.game.showRoundBanner(this.round);
        this.noteSpeed = Math.min(7, 3 + (this.round - 1) * 0.8);
        this.spawnRate = Math.max(250, 500 - (this.round - 1) * 80);
        this.notes = [];
        if (this.spawnTimer) clearInterval(this.spawnTimer);
        var self = this;
        setTimeout(function() { self.startSpawning(); }, 500);
      }
    } else {
      this.combo = 0; this.game.combo = 0; this.game.updateHUD();
      AudioEngine.rhythmMiss();
    }
  },

  releaseHold(lane) {
    var hold = this.holdNotes[lane];
    if (!hold || !hold.active) return;
    hold.active = false;
    var duration = Date.now() - hold.start;
    var bonus = Math.floor(duration / 100) * 5; // 5 pts per 100ms held
    this.score += bonus;
    this.game.score = this.score; this.game.updateHUD();
    this.effects.push({ x: lane * this.laneWidth + this.laneWidth/2, y: this.hitZoneY - 30, text: '+' + bonus, color: '#E91E63', life: 25 });
    delete this.holdNotes[lane];
  },

  update() {
    if (!this.game.running || this.game.paused) return;
    // Move notes
    for (var i = this.notes.length - 1; i >= 0; i--) {
      this.notes[i].y += this.noteSpeed;
      if (this.notes[i].y > this.canvasH + 30) {
        if (!this.notes[i].hit) {
          this.combo = 0; this.game.combo = 0; this.game.updateHUD();
        }
        this.notes.splice(i, 1);
      }
    }
    // Update hold notes
    for (var lane in this.holdNotes) {
      if (this.holdNotes[lane] && this.holdNotes[lane].active) {
        // Accumulate hold score over time
        this.holdNotes[lane].note.holdScore = (this.holdNotes[lane].note.holdScore || 0) + 0.1;
      }
    }
    // Update effects
    for (var i = this.effects.length - 1; i >= 0; i--) {
      this.effects[i].life--;
      this.effects[i].y -= 1;
      if (this.effects[i].life <= 0) this.effects.splice(i, 1);
    }
  },

  render() {
    var ctx = this.game.ctx, canvas = this.game.canvas;
    ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    var self = this;
    // Lane dividers
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1;
    for (var i = 1; i < this.lanes; i++) { ctx.beginPath(); ctx.moveTo(i * this.laneWidth, 0); ctx.lineTo(i * this.laneWidth, canvas.height); ctx.stroke(); }
    // Hit zone
    ctx.fillStyle = 'rgba(233,30,99,0.15)';
    ctx.fillRect(0, this.hitZoneY - 25, canvas.width, 50);
    ctx.strokeStyle = 'rgba(233,30,99,0.6)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, this.hitZoneY); ctx.lineTo(canvas.width, this.hitZoneY); ctx.stroke();
    // Notes
    var colors = ['#E91E63', '#9C27B0', '#2196F3'];
    this.notes.forEach(function(n) {
      if (n.hit) return;
      var x = n.lane * self.laneWidth + self.laneWidth / 2;
      if (n.type === 'hold') {
        // Draw hold note as elongated bar
        ctx.fillStyle = colors[n.lane % colors.length];
        ctx.globalAlpha = 0.6;
        ctx.fillRect(x - 16, n.y - n.length, 32, n.length);
        ctx.globalAlpha = 1;
        ctx.beginPath(); ctx.arc(x, n.y, 18, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'white'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('HOLD', x, n.y);
      } else if (n.type === 'rapid') {
        // Draw rapid note as smaller, brighter
        ctx.fillStyle = '#FFD700';
        ctx.beginPath(); ctx.arc(x, n.y, 14, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#000'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('⚡', x, n.y);
      } else {
        ctx.fillStyle = colors[n.lane % colors.length];
        ctx.beginPath(); ctx.arc(x, n.y, 18, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'white'; ctx.font = '14px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('\u266A', x, n.y);
      }
    });
    // Lane labels
    ctx.font = '12px sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.textAlign = 'center';
    for (var i = 0; i < this.lanes; i++) ctx.fillText('TAP', i * this.laneWidth + this.laneWidth / 2, canvas.height - 10);
    // Effects
    this.effects.forEach(function(e) {
      ctx.globalAlpha = e.life / 45;
      ctx.fillStyle = e.color;
      ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(e.text, e.x, e.y);
      ctx.globalAlpha = 1;
    });
    // Round info + combo
    ctx.fillStyle = '#fff'; ctx.font = '12px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('Round ' + this.round + ' | Hits: ' + this.hits + '/20', 8, 16);
    if (this.combo >= 5) {
      ctx.fillStyle = '#FFD700'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'right';
      ctx.fillText('🔥' + this.combo + 'x', canvas.width - 8, 16);
    }
  },

  cleanup() {
    if (this.spawnTimer) clearInterval(this.spawnTimer);
    if (this.game.canvas) {
      this.game.canvas.removeEventListener('touchstart', this._touchStart);
      this.game.canvas.removeEventListener('touchend', this._touchEnd);
      this.game.canvas.removeEventListener('click', this._click);
    }
  }
};
