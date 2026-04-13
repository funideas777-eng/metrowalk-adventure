window.ReactionGame = {
  score: 0, round: 1, combo: 0, maxCombo: 0, lives: 3,
  smashCount: 0, cards: [], spawnTimer: null, expireTimers: [],
  COLORS: [
    { word: '\u7D05', hex: '#f44336' },
    { word: '\u85CD', hex: '#2196F3' },
    { word: '\u9EC3', hex: '#FFEB3B' },
    { word: '\u7DA0', hex: '#4CAF50' },
    { word: '\u7D2B', hex: '#9C27B0' },
    { word: '\u6A59', hex: '#FF9800' }
  ],

  roundConfig(r) {
    return {
      maxCards: Math.min(3, r),
      duration: Math.max(1000, 2200 - (r - 1) * 350),
      spawnDelay: Math.max(500, 1200 - (r - 1) * 200),
      smashesNeeded: Math.min(20, 10 + (r - 1) * 2)
    };
  },

  init(game) {
    this.game = game;
    this.score = 0; this.round = 1; this.combo = 0; this.maxCombo = 0;
    this.lives = 3; this.smashCount = 0;
    this.cards = Array(9).fill(null);
    this.expireTimers = [];

    const canvas = game.canvas; canvas.style.display = 'none';
    let c = document.getElementById('reaction-container');
    if (c) c.remove();
    c = document.createElement('div'); c.id = 'reaction-container';
    c.style.cssText = 'width:100%;max-width:380px;margin:0 auto;padding:8px;';
    canvas.parentElement.appendChild(c);

    // Inject CSS for animations
    let style = document.getElementById('reaction-styles');
    if (!style) {
      style = document.createElement('style');
      style.id = 'reaction-styles';
      style.textContent = `
        @keyframes rc-smash {
          0% { transform: scale(1) rotate(0deg); opacity: 1; }
          50% { transform: scale(1.1) rotate(5deg); opacity: 0.8; }
          100% { transform: scale(0) rotate(25deg); opacity: 0; }
        }
        @keyframes rc-wrong {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
        @keyframes rc-correct-flash {
          0% { box-shadow: 0 0 0 3px #4CAF50; }
          100% { box-shadow: 0 0 0 0 transparent; }
        }
        @keyframes rc-bonus-fade {
          0% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-20px); }
        }
        .rc-card {
          aspect-ratio: 1;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 38px;
          font-weight: 900;
          background: #2a2a3e;
          cursor: pointer;
          user-select: none;
          position: relative;
          transition: background 0.15s;
          -webkit-tap-highlight-color: transparent;
        }
        .rc-card:active { background: #3a3a52; }
        .rc-card-empty {
          aspect-ratio: 1;
          border-radius: 16px;
          background: #1a1a2a;
          opacity: 0.4;
        }
        .rc-smash-anim { animation: rc-smash 0.35s ease-out forwards; pointer-events: none; }
        .rc-wrong-anim { animation: rc-wrong 0.4s ease-out; }
        .rc-correct-anim { animation: rc-correct-flash 0.4s ease-out; }
      `;
      document.head.appendChild(style);
    }

    this.renderBoard();
    this.startSpawning();
  },

  renderBoard() {
    const c = document.getElementById('reaction-container');
    if (!c) return;
    const cfg = this.roundConfig(this.round);
    const hearts = '\u2764\uFE0F'.repeat(this.lives) + '\uD83D\uDDA4'.repeat(Math.max(0, 3 - this.lives));

    let html = `<div style="text-align:center;margin-bottom:8px;">
      <div style="color:white;font-size:14px;font-weight:700;">Round ${this.round} \u2502 \u7C89\u78A8: ${this.smashCount}/${cfg.smashesNeeded}</div>
      <div style="font-size:16px;margin:4px 0;">${hearts}</div>
      <div style="color:rgba(255,255,255,0.5);font-size:12px;">\u9EDE\u64CA\u300C\u5B57\u8272\u4E0D\u7B26\u300D\u7684\u5361\u7247 \u2502 \u4E0D\u8981\u9EDE\u300C\u5B57\u8272\u76F8\u7B26\u300D\u7684\uFF01</div>
      ${this.combo >= 3 ? `<div style="color:#FF9800;font-weight:700;font-size:13px;">\uD83D\uDD25 \u9023\u64CA ${this.combo}</div>` : ''}
    </div>`;

    html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">';
    for (let i = 0; i < 9; i++) {
      const card = this.cards[i];
      if (card && !card.cleared) {
        html += `<div class="rc-card ${card.animClass || ''}" onclick="ReactionGame.tapCard(${i})" style="color:${card.fontColor};${card.extraStyle || ''}">${card.word}<span class="rc-emoji-overlay" style="position:absolute;font-size:28px;pointer-events:none;opacity:0;">${card.overlayEmoji || ''}</span></div>`;
      } else {
        html += '<div class="rc-card-empty"></div>';
      }
    }
    html += '</div>';

    c.innerHTML = html;
  },

  makeCard() {
    const colors = this.COLORS;
    const isMismatch = Math.random() < 0.6;
    const wordIdx = Math.floor(Math.random() * colors.length);
    let colorIdx;
    if (isMismatch) {
      do { colorIdx = Math.floor(Math.random() * colors.length); } while (colorIdx === wordIdx);
    } else {
      colorIdx = wordIdx;
    }
    return {
      word: colors[wordIdx].word,
      fontColor: colors[colorIdx].hex,
      isMismatch: isMismatch,
      cleared: false,
      animClass: '',
      extraStyle: '',
      overlayEmoji: ''
    };
  },

  startSpawning() {
    if (this.spawnTimer) clearTimeout(this.spawnTimer);
    const tick = () => {
      if (!this.game.running) return;
      const cfg = this.roundConfig(this.round);

      // Count active cards
      const activeCount = this.cards.filter(c => c && !c.cleared).length;
      if (activeCount < cfg.maxCards) {
        // Find empty slots
        const empty = [];
        for (let i = 0; i < 9; i++) { if (!this.cards[i] || this.cards[i].cleared) empty.push(i); }
        if (empty.length > 0) {
          const slot = empty[Math.floor(Math.random() * empty.length)];
          const card = this.makeCard();
          this.cards[slot] = card;
          this.renderBoard();

          // Set expiry timer
          const timer = setTimeout(() => {
            if (!this.cards[slot] || this.cards[slot] !== card) return;
            if (!card.cleared) {
              if (card.isMismatch) {
                // Missed a mismatch target
                this.combo = 0;
              } else {
                // Matched card expired without tap = bonus
                this.score += 5;
                this.game.score = this.score;
                this.game.updateHUD();
              }
              card.cleared = true;
              this.cards[slot] = null;
              this.renderBoard();
            }
          }, cfg.duration);
          this.expireTimers.push(timer);
        }
      }
      this.spawnTimer = setTimeout(tick, this.roundConfig(this.round).spawnDelay);
    };
    this.spawnTimer = setTimeout(tick, 400);
  },

  tapCard(idx) {
    const card = this.cards[idx];
    if (!card || card.cleared || !this.game.running) return;
    card.cleared = true;

    if (card.isMismatch) {
      // Correct smash
      this.smashCount++;
      this.combo++;
      if (this.combo > this.maxCombo) this.maxCombo = this.combo;
      const pts = 20 + Math.min(this.combo * 5, 30);
      this.score += pts;

      AudioEngine.whackHit();
      AudioEngine.comboHit(this.combo);

      // Smash animation
      card.animClass = 'rc-smash-anim rc-correct-anim';
      card.overlayEmoji = '\uD83D\uDCA5';
      this.renderBoard();
      // Show emoji overlay
      const c = document.getElementById('reaction-container');
      if (c) {
        const cells = c.querySelectorAll('.rc-card, .rc-card-empty');
        if (cells[idx]) {
          const overlay = cells[idx].querySelector('.rc-emoji-overlay');
          if (overlay) { overlay.style.opacity = '1'; }
        }
      }

      setTimeout(() => { this.cards[idx] = null; this.renderBoard(); }, 350);

      // Check round advancement
      const cfg = this.roundConfig(this.round);
      if (this.smashCount >= cfg.smashesNeeded) {
        this.score += 150 * this.round;
        AudioEngine.roundClear();
        this.round++;
        this.smashCount = 0;
        // Clear all cards
        this.clearAllCards();
        if (this.spawnTimer) clearTimeout(this.spawnTimer);
        setTimeout(() => {
          if (this.game.running) {
            this.renderBoard();
            this.startSpawning();
          }
        }, 600);
      }
    } else {
      // Wrong tap on matched card - penalty
      this.lives--;
      this.combo = 0;
      AudioEngine.penalty();

      card.animClass = 'rc-wrong-anim';
      card.extraStyle = 'background:#5a1a1a;border:2px solid #f44336;';
      this.renderBoard();

      setTimeout(() => { this.cards[idx] = null; this.renderBoard(); }, 400);

      if (this.lives <= 0) {
        this.game.running = false;
        if (this.spawnTimer) clearTimeout(this.spawnTimer);
        return;
      }
    }

    this.game.score = this.score;
    this.game.combo = this.combo;
    this.game.maxCombo = this.maxCombo;
    this.game.updateHUD();
  },

  clearAllCards() {
    for (let i = 0; i < 9; i++) {
      if (this.cards[i]) this.cards[i].cleared = true;
      this.cards[i] = null;
    }
    this.expireTimers.forEach(t => clearTimeout(t));
    this.expireTimers = [];
  },

  update() {},
  render() {},

  cleanup() {
    if (this.spawnTimer) clearTimeout(this.spawnTimer);
    this.expireTimers.forEach(t => clearTimeout(t));
    this.expireTimers = [];
    const c = document.getElementById('reaction-container');
    if (c) c.remove();
    const s = document.getElementById('reaction-styles');
    if (s) s.remove();
    if (this.game && this.game.canvas) this.game.canvas.style.display = 'block';
  }
};
