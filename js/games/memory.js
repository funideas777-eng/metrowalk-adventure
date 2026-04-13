window.MemoryGame = {
  cards: [], flipped: [], matched: 0, totalPairs: 0,
  score: 0, round: 1, flips: 0, locked: false, cols: 4, rows: 3,
  EMOJIS: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🦁','🐯','🐮','🐷','🐸','🐵','🦄','🐙','🦋'],

  init(game) { this.game = game; this.score = 0; this.round = 1; this.startRound(); },

  startRound() {
    this.flipped = []; this.matched = 0; this.flips = 0; this.locked = false;
    if (this.round === 1) { this.cols = 4; this.rows = 3; }
    else if (this.round === 2) { this.cols = 4; this.rows = 4; }
    else { this.cols = 5; this.rows = 4; }
    this.totalPairs = (this.cols * this.rows) / 2;
    const emojis = this.shuffle([...this.EMOJIS]).slice(0, this.totalPairs);
    const deck = this.shuffle([...emojis, ...emojis]);
    this.cards = deck.map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }));
    this.renderCards();
  },

  renderCards() {
    const canvas = this.game.canvas; canvas.style.display = 'none';
    let c = document.getElementById('memory-container');
    if (!c) { c = document.createElement('div'); c.id = 'memory-container'; canvas.parentElement.appendChild(c); }
    c.style.cssText = `display:grid;grid-template-columns:repeat(${this.cols},1fr);gap:8px;padding:8px;width:100%;max-width:400px;margin:0 auto;`;
    let ri = document.getElementById('memory-round');
    if (!ri) { ri = document.createElement('div'); ri.id = 'memory-round'; ri.style.cssText = 'text-align:center;color:white;font-size:13px;margin-bottom:8px;'; c.parentElement.insertBefore(ri, c); }
    ri.textContent = `Round ${this.round} | 配對: ${this.matched}/${this.totalPairs}`;
    c.innerHTML = this.cards.map(card => `<div data-id="${card.id}" onclick="MemoryGame.flipCard(${card.id})" style="aspect-ratio:1;border-radius:10px;font-size:${this.cols>=5?'22':'26'}px;display:flex;align-items:center;justify-content:center;background:${card.matched?'#e8f5e9':card.flipped?'white':'linear-gradient(135deg,var(--primary),var(--accent))'};box-shadow:0 2px 8px rgba(0,0,0,0.1);cursor:pointer;user-select:none;">${card.flipped||card.matched?card.emoji:'❓'}</div>`).join('');
  },

  flipCard(id) {
    if (this.locked) return;
    const card = this.cards[id]; if (card.flipped || card.matched) return;
    card.flipped = true; this.flipped.push(card); this.flips++; this.renderCards(); AudioEngine.cardFlip();
    if (this.flipped.length === 2) {
      this.locked = true; const [a, b] = this.flipped;
      if (a.emoji === b.emoji) {
        a.matched = true; b.matched = true; this.matched++;
        this.score += 20 + Math.max(10 - Math.floor(this.flips/2), 2);
        this.game.score = this.score; this.game.updateHUD(); AudioEngine.cardMatch();
        this.flipped = []; this.locked = false; this.renderCards();
        if (this.matched === this.totalPairs) {
          this.score += 100 * this.round + Math.floor(this.game.timeLeft * 2);
          this.game.score = this.score; this.game.updateHUD();
          AudioEngine.roundClear(); this.round++;
          setTimeout(() => this.startRound(), 800);
        }
      } else {
        AudioEngine.cardMiss();
        setTimeout(() => { a.flipped = false; b.flipped = false; this.flipped = []; this.locked = false; this.renderCards(); }, 800);
      }
    }
  },

  update() {}, render() {},
  cleanup() { const c = document.getElementById('memory-container'); if (c) c.remove(); const r = document.getElementById('memory-round'); if (r) r.remove(); if (this.game.canvas) this.game.canvas.style.display = 'block'; },
  shuffle(arr) { for (let i = arr.length-1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [arr[i],arr[j]] = [arr[j],arr[i]]; } return arr; }
};
