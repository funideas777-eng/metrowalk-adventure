window.DodgeGame = {
  // --- State ---
  game: null,
  canvasW: 0,
  canvasH: 0,
  wafers: [],        // all wafers in play
  stations: [],      // 4 processing stations
  queue: [],         // incoming raw wafers at top
  selectedWafer: null,
  dragging: false,
  dragX: 0,
  dragY: 0,
  round: 1,
  completedCount: 0,
  completionsNeeded: 3,
  spawnInterval: 6000,
  spawnTimer: null,
  idleCheckTimer: null,
  nextWaferId: 0,
  animFrame: 0,
  flashStations: {},  // stationIndex -> flash end timestamp

  // --- Station definitions ---
  STEPS: [
    { name: '清洗', nameEn: 'Clean', duration: 2000, color: '#4a9eff', icon: '💧' },
    { name: '光刻', nameEn: 'Litho', duration: 3000, color: '#9b59b6', icon: '🔬' },
    { name: '蝕刻', nameEn: 'Etch',  duration: 2500, color: '#e67e22', icon: '⚡' },
    { name: '封測', nameEn: 'Pack',  duration: 2000, color: '#2ecc71', icon: '📦' }
  ],

  IDLE_SPOIL_TIME: 5000,
  WAFER_RADIUS: 22,
  QUEUE_Y: 60,

  // =========================================================
  // INIT
  // =========================================================
  init(game) {
    this.game = game;
    this.canvasW = game.canvas.width;
    this.canvasH = game.canvas.height;
    this.wafers = [];
    this.queue = [];
    this.selectedWafer = null;
    this.dragging = false;
    this.round = 1;
    this.completedCount = 0;
    this.completionsNeeded = 3;
    this.spawnInterval = 6000;
    this.nextWaferId = 0;
    this.animFrame = 0;
    this.flashStations = {};

    // Build station layout
    this._buildStations();

    // Event listeners
    this._onTouchStart = this._handlePointerDown.bind(this);
    this._onTouchMove  = this._handlePointerMove.bind(this);
    this._onTouchEnd   = this._handlePointerUp.bind(this);
    this._onMouseDown   = this._handlePointerDown.bind(this);
    this._onMouseMove   = this._handlePointerMove.bind(this);
    this._onMouseUp     = this._handlePointerUp.bind(this);

    const c = game.canvas;
    c.addEventListener('touchstart', this._onTouchStart, { passive: false });
    c.addEventListener('touchmove',  this._onTouchMove,  { passive: false });
    c.addEventListener('touchend',   this._onTouchEnd,   { passive: false });
    c.addEventListener('mousedown',  this._onMouseDown);
    c.addEventListener('mousemove',  this._onMouseMove);
    c.addEventListener('mouseup',    this._onMouseUp);

    // Spawn first wafer immediately, then on interval
    this._spawnWafer();
    this._startSpawning();

    // Idle spoil checker every 500ms
    this.idleCheckTimer = setInterval(() => this._checkIdleWafers(), 500);

    // Show round banner
    game.showRoundBanner(this.round);
  },

  // =========================================================
  // BUILD STATIONS
  // =========================================================
  _buildStations() {
    this.stations = [];
    const slotsPerStation = this.round >= 3 ? 3 : 2;
    const margin = 10;
    const stationH = 30 + slotsPerStation * 40;
    const totalH = this.STEPS.length * (stationH + margin);
    const startY = Math.floor((this.canvasH - totalH) / 2) + 20;
    const stationW = this.canvasW - margin * 2;

    for (let i = 0; i < this.STEPS.length; i++) {
      const slots = [];
      for (let s = 0; s < slotsPerStation; s++) {
        slots.push({ wafer: null });
      }
      this.stations.push({
        index: i,
        x: margin,
        y: startY + i * (stationH + margin),
        w: stationW,
        h: stationH,
        step: this.STEPS[i],
        slots: slots
      });
    }
  },

  // =========================================================
  // SPAWNING
  // =========================================================
  _startSpawning() {
    if (this.spawnTimer) clearInterval(this.spawnTimer);
    this.spawnTimer = setInterval(() => {
      if (!this.game.running || this.game.paused) return;
      this._spawnWafer();
    }, this.spawnInterval);
  },

  _spawnWafer() {
    const id = this.nextWaferId++;
    const spacing = (this.WAFER_RADIUS * 2 + 8);
    const startX = 30 + this.queue.length * spacing;
    const wafer = {
      id: id,
      x: Math.min(startX, this.canvasW - 30),
      y: this.QUEUE_Y,
      currentStep: 0,       // next step index (0-3), 4 = completed
      state: 'queue',       // queue | processing | ready | completed | spoiled
      processStart: 0,
      readySince: 0,
      stationIndex: -1,
      slotIndex: -1,
      glow: 0
    };
    this.queue.push(wafer);
    this.wafers.push(wafer);
  },

  // =========================================================
  // IDLE CHECK (spoil wafers that sit too long after processing)
  // =========================================================
  _checkIdleWafers() {
    if (!this.game.running || this.game.paused) return;
    const now = Date.now();
    for (const w of this.wafers) {
      if (w.state === 'ready' && (now - w.readySince) > this.IDLE_SPOIL_TIME) {
        w.state = 'spoiled';
        // Free the station slot
        if (w.stationIndex >= 0 && this.stations[w.stationIndex]) {
          const station = this.stations[w.stationIndex];
          if (w.slotIndex >= 0 && station.slots[w.slotIndex]) {
            station.slots[w.slotIndex].wafer = null;
          }
        }
        if (typeof AudioEngine !== 'undefined') AudioEngine.penalty();
        this.game.loseLife();
        // Remove from queue if somehow still there
        this._removeFromQueue(w);
        // Remove after brief visual
        setTimeout(() => { this._removeWafer(w); }, 800);
      }
    }
  },

  // =========================================================
  // POINTER / TOUCH HANDLING
  // =========================================================
  _getPointerPos(e) {
    const rect = this.game.canvas.getBoundingClientRect();
    let cx, cy;
    if (e.touches && e.touches.length > 0) {
      cx = e.touches[0].clientX - rect.left;
      cy = e.touches[0].clientY - rect.top;
    } else if (e.changedTouches && e.changedTouches.length > 0) {
      cx = e.changedTouches[0].clientX - rect.left;
      cy = e.changedTouches[0].clientY - rect.top;
    } else {
      cx = e.clientX - rect.left;
      cy = e.clientY - rect.top;
    }
    // Scale for CSS-scaled canvas
    const scaleX = this.game.canvas.width / rect.width;
    const scaleY = this.game.canvas.height / rect.height;
    return { x: cx * scaleX, y: cy * scaleY };
  },

  _handlePointerDown(e) {
    if (!this.game.running || this.game.paused) return;
    e.preventDefault();
    const pos = this._getPointerPos(e);
    this.dragX = pos.x;
    this.dragY = pos.y;

    // Check if tapping a wafer (in queue or ready at station)
    const wafer = this._hitWafer(pos.x, pos.y);
    if (wafer) {
      this.selectedWafer = wafer;
      this.dragging = true;
      return;
    }

    // Check if tapping a station while a wafer is selected
    if (this.selectedWafer) {
      const station = this._hitStation(pos.x, pos.y);
      if (station !== null) {
        this._sendWaferToStation(this.selectedWafer, station);
        this.selectedWafer = null;
        this.dragging = false;
        return;
      }
    }

    // Tap empty area = deselect
    this.selectedWafer = null;
    this.dragging = false;
  },

  _handlePointerMove(e) {
    if (!this.dragging || !this.selectedWafer) return;
    e.preventDefault();
    const pos = this._getPointerPos(e);
    this.dragX = pos.x;
    this.dragY = pos.y;
  },

  _handlePointerUp(e) {
    if (!this.game.running || this.game.paused) return;
    if (this.dragging && this.selectedWafer) {
      const pos = this._getPointerPos(e);
      const station = this._hitStation(pos.x, pos.y);
      if (station !== null) {
        this._sendWaferToStation(this.selectedWafer, station);
        this.selectedWafer = null;
      }
      // If not dropped on station, keep selected but stop dragging
    }
    this.dragging = false;
  },

  _hitWafer(x, y) {
    const r = this.WAFER_RADIUS + 10; // generous hit area
    // Check queue wafers
    for (const w of this.queue) {
      if (w.state === 'queue') {
        const dx = x - w.x, dy = y - w.y;
        if (dx * dx + dy * dy < r * r) return w;
      }
    }
    // Check wafers at stations that are ready to move
    for (const w of this.wafers) {
      if (w.state === 'ready') {
        const pos = this._getSlotWaferPos(w);
        if (!pos) continue;
        const dx = x - pos.x, dy = y - pos.y;
        if (dx * dx + dy * dy < r * r) return w;
      }
    }
    return null;
  },

  _hitStation(x, y) {
    for (let i = 0; i < this.stations.length; i++) {
      const s = this.stations[i];
      if (x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) return i;
    }
    return null;
  },

  // =========================================================
  // SLOT POSITION HELPERS
  // =========================================================
  _getSlotPos(station, slotIndex) {
    // Each slot is rendered as a horizontal sub-area within the station
    const slotH = 36;
    const slotY = station.y + 30 + slotIndex * (slotH + 4);
    return { x: station.x, y: slotY, w: station.w, h: slotH };
  },

  _getSlotWaferPos(wafer) {
    if (wafer.stationIndex < 0 || wafer.slotIndex < 0) return null;
    const station = this.stations[wafer.stationIndex];
    if (!station) return null;
    const slotPos = this._getSlotPos(station, wafer.slotIndex);
    return { x: slotPos.x + slotPos.w - 35, y: slotPos.y + slotPos.h / 2 };
  },

  // =========================================================
  // SEND WAFER TO STATION
  // =========================================================
  _sendWaferToStation(wafer, stationIndex) {
    // Wafer must be in queue or ready state
    if (wafer.state !== 'queue' && wafer.state !== 'ready') return;

    // Check correct step order
    if (wafer.currentStep !== stationIndex) {
      // Wrong station!
      if (typeof AudioEngine !== 'undefined') AudioEngine.penalty();
      this.game.loseLife();
      this.game.resetCombo();
      return;
    }

    // Find first available slot
    const station = this.stations[stationIndex];
    let freeSlotIndex = -1;
    for (let i = 0; i < station.slots.length; i++) {
      if (!station.slots[i].wafer) {
        freeSlotIndex = i;
        break;
      }
    }

    if (freeSlotIndex === -1) {
      // All slots occupied - flash red feedback, no penalty
      this.flashStations[stationIndex] = Date.now() + 400;
      return;
    }

    // Free previous station slot if wafer was ready there
    if (wafer.stationIndex >= 0 && this.stations[wafer.stationIndex]) {
      const prevStation = this.stations[wafer.stationIndex];
      if (wafer.slotIndex >= 0 && prevStation.slots[wafer.slotIndex]) {
        prevStation.slots[wafer.slotIndex].wafer = null;
      }
    }

    // Remove from queue if it was there
    this._removeFromQueue(wafer);

    // Assign to station slot
    wafer.state = 'processing';
    wafer.stationIndex = stationIndex;
    wafer.slotIndex = freeSlotIndex;
    wafer.processStart = Date.now();
    station.slots[freeSlotIndex].wafer = wafer;
  },

  _removeFromQueue(wafer) {
    const qi = this.queue.indexOf(wafer);
    if (qi >= 0) {
      this.queue.splice(qi, 1);
      // Reposition remaining queue wafers
      this._repositionQueue();
    }
  },

  _repositionQueue() {
    const spacing = this.WAFER_RADIUS * 2 + 8;
    for (let i = 0; i < this.queue.length; i++) {
      this.queue[i].x = 30 + i * spacing;
      this.queue[i].y = this.QUEUE_Y;
    }
  },

  _removeWafer(wafer) {
    const idx = this.wafers.indexOf(wafer);
    if (idx >= 0) this.wafers.splice(idx, 1);
    this._removeFromQueue(wafer);
  },

  // =========================================================
  // UPDATE (called every frame)
  // =========================================================
  update() {
    if (!this.game.running || this.game.paused) return;
    this.animFrame++;

    const now = Date.now();

    for (const w of this.wafers) {
      if (w.state === 'processing') {
        const station = this.stations[w.stationIndex];
        const elapsed = now - w.processStart;
        if (elapsed >= station.step.duration) {
          // Processing done
          w.state = 'ready';
          w.readySince = now;
          w.currentStep += 1;
          if (typeof AudioEngine !== 'undefined') AudioEngine.scoreUp();

          // Check if wafer is fully completed (all 4 steps)
          if (w.currentStep >= 4) {
            w.state = 'completed';
            // Free the slot
            if (w.slotIndex >= 0 && station.slots[w.slotIndex]) {
              station.slots[w.slotIndex].wafer = null;
            }
            this.game.addScore(100);
            this.game.addCombo();
            this.completedCount++;
            if (typeof AudioEngine !== 'undefined') AudioEngine.roundClear();
            // Remove after brief glow
            setTimeout(() => { this._removeWafer(w); }, 600);
            // Check round progression
            this._checkRound();
          }
        }
      }

      // Glow animation for ready wafers
      if (w.state === 'ready') {
        w.glow = (Math.sin(this.animFrame * 0.1) + 1) / 2;
      }
    }
  },

  // =========================================================
  // ROUND PROGRESSION
  // =========================================================
  _checkRound() {
    if (this.completedCount >= this.completionsNeeded) {
      this.round++;
      this.completedCount = 0;
      this.completionsNeeded = Math.min(3 + this.round, 10);
      this.spawnInterval = Math.max(2000, 6000 - (this.round - 1) * 1000);
      this._startSpawning();
      this.game.showRoundBanner(this.round);

      // Rebuild stations with more slots at round 3+
      if (this.round === 3) {
        // Migrate existing wafers: collect wafers currently in stations
        const activeWafers = this.wafers.filter(
          (w) => w.state === 'processing' || w.state === 'ready'
        );
        this._buildStations();
        // Re-assign active wafers to their stations/slots
        for (const w of activeWafers) {
          if (w.stationIndex >= 0 && w.stationIndex < this.stations.length) {
            const station = this.stations[w.stationIndex];
            // Find a free slot
            for (let i = 0; i < station.slots.length; i++) {
              if (!station.slots[i].wafer) {
                station.slots[i].wafer = w;
                w.slotIndex = i;
                break;
              }
            }
          }
        }
      }
    }
  },

  // =========================================================
  // RENDER (called every frame)
  // =========================================================
  render() {
    const ctx = this.game.ctx;
    const W = this.canvasW;
    const H = this.canvasH;

    // Background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, W, H);

    // --- Header ---
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`晶圓大師 R${this.round}`, 8, 6);

    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`完成: ${this.completedCount}/${this.completionsNeeded}`, W - 8, 6);

    // --- Queue area label ---
    ctx.fillStyle = '#8899aa';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('▼ 原料晶圓', 8, 36);

    // --- Draw queue wafers ---
    for (const w of this.queue) {
      if (w.state === 'queue') {
        this._drawWafer(ctx, w.x, w.y, w, false);
      }
    }

    // --- Draw stations ---
    for (let i = 0; i < this.stations.length; i++) {
      this._drawStation(ctx, this.stations[i]);
    }

    // --- Draw shipping zone ---
    const lastStation = this.stations[this.stations.length - 1];
    const shippingY = lastStation.y + lastStation.h + 12;
    ctx.fillStyle = '#2a2a4e';
    ctx.strokeStyle = '#4a4a6e';
    ctx.lineWidth = 1;
    this._roundRect(ctx, 12, shippingY, W - 24, 30, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#aabbcc';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`📦 出貨區 — 已出貨 ${this.completedCount + (this.round - 1) * 3} 片`, W / 2, shippingY + 15);

    // --- Draw dragged wafer on top ---
    if (this.dragging && this.selectedWafer) {
      this._drawWafer(ctx, this.dragX, this.dragY, this.selectedWafer, true);
    }

    // --- Selection highlight ---
    if (this.selectedWafer && !this.dragging) {
      const pos = this._getWaferRenderPos(this.selectedWafer);
      if (pos) {
        ctx.strokeStyle = '#ffdd00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, this.WAFER_RADIUS + 5, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  },

  // =========================================================
  // STATION BACKGROUND PATTERNS
  // =========================================================
  _drawStationPattern(ctx, station) {
    const s = station;
    const step = s.step;
    ctx.save();

    // Clip to station rounded rect
    this._roundRect(ctx, s.x, s.y, s.w, s.h, 10);
    ctx.clip();

    const t = this.animFrame * 0.03;

    if (step.nameEn === 'Clean') {
      // Blue water-wave background
      ctx.fillStyle = '#0d1f3c';
      ctx.fillRect(s.x, s.y, s.w, s.h);
      ctx.strokeStyle = 'rgba(74, 158, 255, 0.15)';
      ctx.lineWidth = 2;
      for (let row = 0; row < 6; row++) {
        ctx.beginPath();
        const baseY = s.y + row * 18 + 5;
        for (let px = s.x; px <= s.x + s.w; px += 2) {
          const wy = baseY + Math.sin((px - s.x) * 0.04 + t + row * 0.8) * 5;
          if (px === s.x) ctx.moveTo(px, wy);
          else ctx.lineTo(px, wy);
        }
        ctx.stroke();
      }
    } else if (step.nameEn === 'Litho') {
      // Purple with circuit pattern
      ctx.fillStyle = '#1a0f2e';
      ctx.fillRect(s.x, s.y, s.w, s.h);
      ctx.strokeStyle = 'rgba(155, 89, 182, 0.12)';
      ctx.lineWidth = 1;
      const grid = 16;
      for (let gx = s.x; gx < s.x + s.w; gx += grid) {
        for (let gy = s.y; gy < s.y + s.h; gy += grid) {
          const hash = ((gx * 7 + gy * 13) & 0xff);
          ctx.beginPath();
          if (hash % 3 === 0) {
            ctx.moveTo(gx, gy);
            ctx.lineTo(gx + grid, gy);
            ctx.lineTo(gx + grid, gy + grid / 2);
          } else if (hash % 3 === 1) {
            ctx.moveTo(gx, gy + grid / 2);
            ctx.lineTo(gx + grid / 2, gy + grid / 2);
            ctx.lineTo(gx + grid / 2, gy + grid);
          } else {
            ctx.rect(gx + 4, gy + 4, grid - 8, grid - 8);
          }
          ctx.stroke();
        }
      }
    } else if (step.nameEn === 'Etch') {
      // Orange with spark/fire effect
      ctx.fillStyle = '#1f1208';
      ctx.fillRect(s.x, s.y, s.w, s.h);
      for (let i = 0; i < 12; i++) {
        const sx = s.x + ((i * 37 + this.animFrame * 0.7) % s.w);
        const sy = s.y + ((i * 53 + Math.sin(t + i) * 10) % s.h);
        const sparkR = 2 + Math.sin(t * 2 + i) * 1.5;
        const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, sparkR * 4);
        grad.addColorStop(0, 'rgba(230, 126, 34, 0.25)');
        grad.addColorStop(0.5, 'rgba(230, 126, 34, 0.08)');
        grad.addColorStop(1, 'rgba(230, 126, 34, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(sx - sparkR * 4, sy - sparkR * 4, sparkR * 8, sparkR * 8);
      }
    } else if (step.nameEn === 'Pack') {
      // Green with checkmark pattern
      ctx.fillStyle = '#0a1f12';
      ctx.fillRect(s.x, s.y, s.w, s.h);
      ctx.strokeStyle = 'rgba(46, 204, 113, 0.1)';
      ctx.lineWidth = 1.5;
      const sp = 28;
      for (let gx = s.x + 8; gx < s.x + s.w; gx += sp) {
        for (let gy = s.y + 8; gy < s.y + s.h; gy += sp) {
          ctx.beginPath();
          ctx.moveTo(gx, gy + 5);
          ctx.lineTo(gx + 4, gy + 9);
          ctx.lineTo(gx + 10, gy);
          ctx.stroke();
        }
      }
    }

    ctx.restore();
  },

  _drawStation(ctx, station) {
    const s = station;
    const step = s.step;
    const now = Date.now();

    // Check if station is flashing red (all slots full feedback)
    const isFlashing = this.flashStations[s.index] && now < this.flashStations[s.index];

    // Station background pattern
    this._drawStationPattern(ctx, station);

    // Station border
    if (isFlashing) {
      ctx.strokeStyle = '#ff3333';
      ctx.lineWidth = 3;
    } else {
      ctx.strokeStyle = step.color + 'aa';
      ctx.lineWidth = 2;
    }
    this._roundRect(ctx, s.x, s.y, s.w, s.h, 10);
    ctx.stroke();

    // Station label (top area)
    ctx.fillStyle = step.color;
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${step.icon} ${step.name}`, s.x + 8, s.y + 14);

    ctx.fillStyle = '#667788';
    ctx.font = '10px sans-serif';
    ctx.fillText(`(${step.nameEn} ${step.duration / 1000}s)`, s.x + 60, s.y + 14);

    // Step number indicator
    ctx.fillStyle = step.color + '44';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${s.index + 1}`, s.x + s.w - 6, s.y + 16);

    // Slot count indicator
    ctx.fillStyle = '#556677';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'right';
    const usedSlots = s.slots.filter((sl) => sl.wafer !== null).length;
    ctx.fillText(`${usedSlots}/${s.slots.length}`, s.x + s.w - 6, s.y + s.h - 6);

    // Draw each slot
    for (let si = 0; si < s.slots.length; si++) {
      this._drawSlot(ctx, s, si);
    }
  },

  _drawSlot(ctx, station, slotIndex) {
    const slot = station.slots[slotIndex];
    const step = station.step;
    const sp = this._getSlotPos(station, slotIndex);

    // Slot background
    ctx.fillStyle = slot.wafer ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)';
    ctx.strokeStyle = slot.wafer ? step.color + '55' : '#333344';
    ctx.lineWidth = 1;
    this._roundRect(ctx, sp.x + 6, sp.y, sp.w - 12, sp.h, 6);
    ctx.fill();
    ctx.stroke();

    // Slot label
    ctx.fillStyle = '#445566';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`slot ${slotIndex + 1}`, sp.x + 10, sp.y + sp.h / 2);

    if (slot.wafer && slot.wafer.state === 'processing') {
      const w = slot.wafer;
      const elapsed = Date.now() - w.processStart;
      const progress = Math.min(1, elapsed / step.duration);

      // Progress bar
      const barX = sp.x + 56;
      const barY = sp.y + sp.h / 2 - 5;
      const barW = sp.w - 110;
      const barH = 10;

      // Bar background
      ctx.fillStyle = '#0a0a1a';
      this._roundRect(ctx, barX, barY, barW, barH, 4);
      ctx.fill();

      // Bar fill
      ctx.fillStyle = step.color;
      if (progress > 0.02) {
        this._roundRect(ctx, barX, barY, barW * progress, barH, 4);
        ctx.fill();
      }

      // Percentage text
      ctx.fillStyle = '#ffffff';
      ctx.font = '8px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.floor(progress * 100)}%`, barX + barW / 2, barY + barH / 2 + 1);

      // Draw wafer in slot
      const waferX = sp.x + sp.w - 35;
      const waferY = sp.y + sp.h / 2;
      this._drawWafer(ctx, waferX, waferY, w, false);
    }

    // Wafer ready at slot (pulsing)
    if (slot.wafer && slot.wafer.state === 'ready') {
      const waferX = sp.x + sp.w - 35;
      const waferY = sp.y + sp.h / 2;
      this._drawWafer(ctx, waferX, waferY, slot.wafer, false);
    }
  },

  _drawWafer(ctx, x, y, wafer, isDragging) {
    const r = this.WAFER_RADIUS;
    ctx.save();

    // Glow for ready wafers
    if (wafer.state === 'ready') {
      const glowAlpha = 0.3 + wafer.glow * 0.5;
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 12 + wafer.glow * 8;
      ctx.strokeStyle = `rgba(255, 215, 0, ${glowAlpha})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, r + 3, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Spoiled wafers glow red
    if (wafer.state === 'spoiled') {
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 15;
    }

    // Completed wafers glow gold
    if (wafer.state === 'completed') {
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 20;
    }

    // Wafer body (silicon disc)
    const gradient = ctx.createRadialGradient(x - 4, y - 4, 2, x, y, r);
    if (wafer.state === 'spoiled') {
      gradient.addColorStop(0, '#ff6666');
      gradient.addColorStop(1, '#882222');
    } else if (wafer.state === 'completed') {
      gradient.addColorStop(0, '#ffeedd');
      gradient.addColorStop(1, '#ccaa44');
    } else {
      gradient.addColorStop(0, '#c0c8d8');
      gradient.addColorStop(1, '#667888');
    }
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    // Chip pattern lines on wafer
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 0.5;
    for (let i = -r + 6; i < r; i += 8) {
      // Horizontal lines clipped to circle
      const dx = Math.sqrt(r * r - i * i);
      ctx.beginPath();
      ctx.moveTo(x - dx, y + i);
      ctx.lineTo(x + dx, y + i);
      ctx.stroke();
    }
    for (let i = -r + 6; i < r; i += 8) {
      const dy = Math.sqrt(r * r - i * i);
      ctx.beginPath();
      ctx.moveTo(x + i, y - dy);
      ctx.lineTo(x + i, y + dy);
      ctx.stroke();
    }

    // Wafer notch (flat edge at bottom)
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.rect(x - 5, y + r - 3, 10, 4);
    ctx.fill();

    // Step indicator dots (which steps completed)
    const dotY = y + r + 10;
    if (!isDragging) {
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(x - 12 + i * 8, dotY, 3, 0, Math.PI * 2);
        ctx.fillStyle = i < wafer.currentStep ? this.STEPS[i].color : '#333344';
        ctx.fill();
      }
    }

    // Drag transparency
    if (isDragging) {
      ctx.globalAlpha = 0.7;
    }

    ctx.restore();
  },

  _getWaferRenderPos(wafer) {
    if (wafer.state === 'queue') {
      return { x: wafer.x, y: wafer.y };
    }
    if ((wafer.state === 'ready' || wafer.state === 'processing') && wafer.stationIndex >= 0) {
      return this._getSlotWaferPos(wafer);
    }
    return null;
  },

  // =========================================================
  // UTILITY
  // =========================================================
  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  },

  // =========================================================
  // CLEANUP
  // =========================================================
  cleanup() {
    if (this.spawnTimer) clearInterval(this.spawnTimer);
    if (this.idleCheckTimer) clearInterval(this.idleCheckTimer);
    this.spawnTimer = null;
    this.idleCheckTimer = null;

    const c = this.game && this.game.canvas;
    if (c) {
      c.removeEventListener('touchstart', this._onTouchStart);
      c.removeEventListener('touchmove',  this._onTouchMove);
      c.removeEventListener('touchend',   this._onTouchEnd);
      c.removeEventListener('mousedown',  this._onMouseDown);
      c.removeEventListener('mousemove',  this._onMouseMove);
      c.removeEventListener('mouseup',    this._onMouseUp);
    }

    this.wafers = [];
    this.queue = [];
    this.stations = [];
    this.selectedWafer = null;
  }
};
