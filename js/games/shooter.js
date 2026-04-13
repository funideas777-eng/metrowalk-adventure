window.ShooterGame = {
  // State
  game: null,
  canvasW: 0,
  canvasH: 0,
  round: 1,
  hits: 0,
  hitsToAdvance: 10,

  // Bow
  bowX: 0,
  bowY: 0,
  BOW_AREA_H: 80,

  // Aiming
  aiming: false,
  aimX: 0,
  aimY: 0,

  // Projectiles & targets
  arrows: [],
  targets: [],
  particles: [],

  // Miss tracking (3 consecutive arrows missing all targets => loseLife)
  consecutiveMisses: 0,

  // Spawn
  spawnTimer: null,

  // Round config
  targetSize: 40,
  moveSpeed: 1.2,
  maxTargets: 4,

  // Listeners
  _onDown: null,
  _onMove: null,
  _onUp: null,

  init(game) {
    this.game = game;
    this.canvasW = game.canvas.width;
    this.canvasH = game.canvas.height;
    this.round = 1;
    this.hits = 0;
    this.hitsToAdvance = 10;
    this.consecutiveMisses = 0;
    this.arrows = [];
    this.targets = [];
    this.particles = [];
    this.targetSize = 40;
    this.moveSpeed = 1.2;
    this.maxTargets = 4;

    // Bow position: bottom center
    this.bowX = this.canvasW / 2;
    this.bowY = this.canvasH - this.BOW_AREA_H / 2;
    this.aiming = false;

    // Input handlers
    const canvas = game.canvas;
    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      if (e.touches && e.touches.length > 0) {
        return {
          x: (e.touches[0].clientX - rect.left) * scaleX,
          y: (e.touches[0].clientY - rect.top) * scaleY
        };
      }
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    };

    this._onDown = (e) => {
      if (game.paused) return;
      const pos = getPos(e);
      this.aiming = true;
      this.aimX = pos.x;
      this.aimY = pos.y;
    };

    this._onMove = (e) => {
      if (!this.aiming || game.paused) return;
      const pos = getPos(e);
      this.aimX = pos.x;
      this.aimY = pos.y;
    };

    this._onUp = (e) => {
      if (!this.aiming || game.paused) return;
      this.aiming = false;
      this.shootArrow(this.aimX, this.aimY);
    };

    canvas.addEventListener('mousedown', this._onDown);
    canvas.addEventListener('mousemove', this._onMove);
    canvas.addEventListener('mouseup', this._onUp);
    canvas.addEventListener('touchstart', this._onDown, { passive: true });
    canvas.addEventListener('touchmove', this._onMove, { passive: true });
    canvas.addEventListener('touchend', this._onUp, { passive: true });

    this.startSpawning();
    game.showRoundBanner(this.round);
  },

  shootArrow(targetX, targetY) {
    const dx = targetX - this.bowX;
    const dy = targetY - this.bowY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 10) return; // too close, ignore

    const speed = 12;
    const vx = (dx / dist) * speed;
    const vy = (dy / dist) * speed;

    this.arrows.push({
      x: this.bowX,
      y: this.bowY,
      vx: vx,
      vy: vy,
      trail: [],
      alive: true,
      hitSomething: false
    });
  },

  startSpawning() {
    if (this.spawnTimer) clearInterval(this.spawnTimer);
    const rate = Math.max(400, 1000 - (this.round - 1) * 100);
    this.spawnTimer = setInterval(() => {
      if (!this.game.running || this.game.paused) return;
      if (this.targets.length >= this.maxTargets) return;
      this.spawnTarget();
    }, rate);
    // Spawn initial batch
    const initial = Math.min(this.maxTargets, 2 + this.round);
    for (let i = 0; i < initial; i++) {
      this.spawnTarget();
    }
  },

  spawnTarget() {
    const size = this.targetSize;
    const playH = this.canvasH - this.BOW_AREA_H - 40; // upper play area
    const hue = Math.random() * 360;
    const speedMult = this.moveSpeed;

    this.targets.push({
      x: size + Math.random() * (this.canvasW - size * 2),
      y: 40 + size + Math.random() * (playH - size * 2),
      size: size,
      dx: (0.5 + Math.random() * 1.5) * speedMult * (Math.random() < 0.5 ? 1 : -1),
      dy: (0.3 + Math.random() * 0.8) * speedMult * (Math.random() < 0.5 ? 1 : -1),
      hue: hue,
      pulse: Math.random() * Math.PI * 2 // for glow animation
    });
  },

  spawnParticles(x, y, hue, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 4;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        decay: 0.02 + Math.random() * 0.03,
        size: 2 + Math.random() * 4,
        hue: hue
      });
    }
  },

  advanceRound() {
    this.round++;
    this.hits = 0;
    this.targetSize = Math.max(20, 40 - (this.round - 1) * 5);
    this.moveSpeed = Math.min(5, 1.2 + (this.round - 1) * 0.5);
    this.maxTargets = Math.min(8, 4 + Math.floor((this.round - 1) * 0.5));
    this.hitsToAdvance = 10;
    this.targets = [];

    if (this.spawnTimer) clearInterval(this.spawnTimer);
    this.game.addScore(200 * this.round);
    this.game.showRoundBanner(this.round);

    setTimeout(() => {
      if (this.game.running) this.startSpawning();
    }, 1200);
  },

  update() {
    if (!this.game.running || this.game.paused) return;

    const cw = this.canvasW;
    const ch = this.canvasH;
    const playBottom = ch - this.BOW_AREA_H;

    // Update targets
    for (let i = this.targets.length - 1; i >= 0; i--) {
      const t = this.targets[i];
      t.x += t.dx;
      t.y += t.dy;
      t.pulse += 0.05;

      // Bounce off walls
      if (t.x - t.size <= 0) { t.x = t.size; t.dx = Math.abs(t.dx); }
      if (t.x + t.size >= cw) { t.x = cw - t.size; t.dx = -Math.abs(t.dx); }
      if (t.y - t.size <= 30) { t.y = 30 + t.size; t.dy = Math.abs(t.dy); }
      if (t.y + t.size >= playBottom) { t.y = playBottom - t.size; t.dy = -Math.abs(t.dy); }
    }

    // Update arrows
    for (let i = this.arrows.length - 1; i >= 0; i--) {
      const a = this.arrows[i];
      if (!a.alive) {
        this.arrows.splice(i, 1);
        continue;
      }

      // Store trail
      a.trail.push({ x: a.x, y: a.y });
      if (a.trail.length > 8) a.trail.shift();

      a.x += a.vx;
      a.y += a.vy;

      // Check bounds
      if (a.x < -20 || a.x > cw + 20 || a.y < -20 || a.y > ch + 20) {
        a.alive = false;
        if (!a.hitSomething) {
          this.consecutiveMisses++;
          this.game.resetCombo();
          if (this.consecutiveMisses >= 3) {
            this.consecutiveMisses = 0;
            this.game.loseLife();
          }
        }
        continue;
      }

      // Check collision with targets
      for (let j = this.targets.length - 1; j >= 0; j--) {
        const t = this.targets[j];
        const dx = a.x - t.x;
        const dy = a.y - t.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= t.size) {
          // Hit!
          a.alive = false;
          a.hitSomething = true;
          this.targets.splice(j, 1);
          this.hits++;
          this.consecutiveMisses = 0;

          // Score & combo
          this.game.addCombo();
          const comboBonus = Math.min(this.game.combo * 5, 50);
          this.game.addScore(15 + comboBonus);
          AudioEngine.shooterHit();

          // Particles
          this.spawnParticles(t.x, t.y, t.hue, 15);

          // Round advance
          if (this.hits >= this.hitsToAdvance) {
            this.advanceRound();
          }
          break;
        }
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
      p.vx *= 0.97;
      p.vy *= 0.97;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  },

  render() {
    const ctx = this.game.ctx;
    const cw = this.canvasW;
    const ch = this.canvasH;

    // Background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, cw, ch);

    // Subtle grid
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < cw; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, ch);
      ctx.stroke();
    }
    for (let y = 0; y < ch; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(cw, y);
      ctx.stroke();
    }

    // Bow area divider
    const bowAreaTop = ch - this.BOW_AREA_H;
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, bowAreaTop);
    ctx.lineTo(cw, bowAreaTop);
    ctx.stroke();
    ctx.setLineDash([]);

    // Render targets
    for (const t of this.targets) {
      const glowIntensity = 0.3 + 0.2 * Math.sin(t.pulse);
      const baseColor = `hsl(${t.hue}, 70%, 55%)`;
      const ringColor = `hsl(${t.hue}, 80%, 70%)`;
      const centerColor = `hsl(${t.hue}, 90%, 85%)`;

      // Glow
      ctx.save();
      ctx.shadowColor = `hsla(${t.hue}, 80%, 60%, ${glowIntensity})`;
      ctx.shadowBlur = 15;

      // Outer circle
      ctx.fillStyle = baseColor;
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Middle ring
      ctx.strokeStyle = ringColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.size * 0.65, 0, Math.PI * 2);
      ctx.stroke();

      // Inner ring
      ctx.strokeStyle = centerColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.size * 0.35, 0, Math.PI * 2);
      ctx.stroke();

      // Bullseye center dot
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(t.x, t.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Render arrow trails and arrows
    for (const a of this.arrows) {
      if (!a.alive) continue;

      // Trail
      if (a.trail.length > 1) {
        for (let i = 1; i < a.trail.length; i++) {
          const alpha = i / a.trail.length * 0.4;
          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.trail[i - 1].x, a.trail[i - 1].y);
          ctx.lineTo(a.trail[i].x, a.trail[i].y);
          ctx.stroke();
        }
      }

      // Arrow body (line from trail end to current pos)
      const len = 16;
      const angle = Math.atan2(a.vy, a.vx);
      const tailX = a.x - Math.cos(angle) * len;
      const tailY = a.y - Math.sin(angle) * len;

      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(a.x, a.y);
      ctx.stroke();

      // Arrowhead
      const headLen = 6;
      const headAngle = 0.5;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(
        a.x - Math.cos(angle - headAngle) * headLen,
        a.y - Math.sin(angle - headAngle) * headLen
      );
      ctx.lineTo(
        a.x - Math.cos(angle + headAngle) * headLen,
        a.y - Math.sin(angle + headAngle) * headLen
      );
      ctx.closePath();
      ctx.fill();
    }

    // Render particles
    for (const p of this.particles) {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = `hsl(${p.hue}, 80%, 65%)`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Aim line (dashed line from bow to finger while aiming)
    if (this.aiming) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 100, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(this.bowX, this.bowY);
      ctx.lineTo(this.aimX, this.aimY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Small aiming dot at finger
      ctx.fillStyle = 'rgba(255, 255, 100, 0.6)';
      ctx.beginPath();
      ctx.arc(this.aimX, this.aimY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Bow emoji at bottom center
    ctx.font = '36px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('\u{1F3F9}', this.bowX, this.bowY);

    // HUD: round info and hit count
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`Round ${this.round}`, 8, 6);

    ctx.font = '12px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText(`\u547D\u4E2D: ${this.hits} / ${this.hitsToAdvance}`, 8, 22);

    // Hit progress bar
    const barW = 80;
    const barH = 4;
    const barX = 8;
    const barY = 38;
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(barX, barY, barW, barH);
    const pct = Math.min(1, this.hits / this.hitsToAdvance);
    ctx.fillStyle = `hsl(${120 * pct}, 70%, 55%)`;
    ctx.fillRect(barX, barY, barW * pct, barH);

    // Miss warning indicator
    if (this.consecutiveMisses > 0) {
      ctx.fillStyle = 'rgba(255,80,80,0.8)';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`\u2718`.repeat(this.consecutiveMisses) + ` (${3 - this.consecutiveMisses} miss left)`, cw - 8, 6);
    }
  },

  cleanup() {
    if (this.spawnTimer) clearInterval(this.spawnTimer);
    const canvas = this.game && this.game.canvas;
    if (canvas) {
      canvas.removeEventListener('mousedown', this._onDown);
      canvas.removeEventListener('mousemove', this._onMove);
      canvas.removeEventListener('mouseup', this._onUp);
      canvas.removeEventListener('touchstart', this._onDown);
      canvas.removeEventListener('touchmove', this._onMove);
      canvas.removeEventListener('touchend', this._onUp);
    }
    this.arrows = [];
    this.targets = [];
    this.particles = [];
  }
};
