window.MemoryGame = {
  cards: [], flipped: [], matched: 0, totalPairs: 0,
  score: 0, round: 1, flips: 0, locked: false, cols: 4, rows: 3,
  wrongCount: 0,
  EMOJIS: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🦁','🐯','🐮','🐷','🐸','🐵','🦄','🐙','🦋'],

  init(game) { this.game = game; this.score = 0; this.round = 1; this.wrongCount = 0; this.startRound(); },

  startRound() {
    this.flipped = []; this.matched = 0; this.flips = 0; this.locked = false;
    if (this.round === 1) { this.cols = 4; this.rows = 3; }
    else if (this.round === 2) { this.cols = 4; this.rows = 4; }
    else { this.cols = 5; this.rows = 4; }
    this.totalPairs = (this.cols * this.rows) / 2;
    var emojis = this.shuffle([].concat(this.EMOJIS)).slice(0, this.totalPairs);
    var deck = this.shuffle([].concat(emojis, emojis));
    this.cards = deck.map(function(emoji, i) { return { id: i, emoji: emoji, flipped: false, matched: false }; });
    this.renderCards();
  },

  renderCards() {
    var canvas = this.game.canvas; canvas.style.display = 'none';
    var c = document.getElementById('memory-container');
    if (!c) { c = document.createElement('div'); c.id = 'memory-container'; canvas.parentElement.appendChild(c); }
    // Info text on top
    var ri = document.getElementById('memory-round');
    if (!ri) { ri = document.createElement('div'); ri.id = 'memory-round'; c.parentElement.insertBefore(ri, c); }
    ri.style.cssText = 'text-align:center;color:white;font-size:13px;padding:8px 0 4px;';
    ri.textContent = 'Round ' + this.round + ' | 配對: ' + this.matched + '/' + this.totalPairs;
    // Full width grid with bigger cards
    var fontSize = this.cols >= 5 ? '28' : '34';
    c.style.cssText = 'display:grid;grid-template-columns:repeat(' + this.cols + ',1fr);gap:6px;padding:6px;width:100%;max-width:100%;margin:0 auto;';
    c.innerHTML = this.cards.map(function(card) {
      var bg = card.matched ? '#e8f5e9' : card.flipped ? 'white' : 'linear-gradient(135deg,#6366f1,#ec4899)';
      return '<div data-id="' + card.id + '" onclick="MemoryGame.flipCard(' + card.id + ')" style="aspect-ratio:1;border-radius:12px;font-size:' + fontSize + 'px;display:flex;align-items:center;justify-content:center;background:' + bg + ';box-shadow:0 2px 8px rgba(0,0,0,0.15);cursor:pointer;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;transition:transform 0.2s;min-height:50px;">' + (card.flipped || card.matched ? card.emoji : '❓') + '</div>';
    }).join('');
  },

  flipCard(id) {
    if (this.locked || this.game.paused) return;
    var card = this.cards[id]; if (card.flipped || card.matched) return;
    card.flipped = true; this.flipped.push(card); this.flips++; this.renderCards(); AudioEngine.cardFlip();
    if (this.flipped.length === 2) {
      this.locked = true;
      var a = this.flipped[0], b = this.flipped[1];
      var self = this;
      if (a.emoji === b.emoji) {
        a.matched = true; b.matched = true; this.matched++;
        this.score += 20 + Math.max(10 - Math.floor(this.flips/2), 2);
        this.game.score = this.score; this.game.addCombo(); this.game.updateHUD();
        AudioEngine.cardMatch();
        this.flipped = []; this.locked = false; this.renderCards();
        if (this.matched === this.totalPairs) {
          this.score += 100 * this.round + Math.floor(this.game.timeLeft * 2);
          this.game.score = this.score; this.game.updateHUD();
          this.round++;
          this.game.showRoundBanner(this.round);
          setTimeout(function() { self.startRound(); }, 800);
        }
      } else {
        AudioEngine.cardMiss();
        this.game.resetCombo();
        this.wrongCount++;
        // Every 5 wrong matches = lose life
        if (this.wrongCount % 5 === 0) {
          this.game.loseLife();
        }
        setTimeout(function() { a.flipped = false; b.flipped = false; self.flipped = []; self.locked = false; self.renderCards(); }, 800);
      }
    }
  },

  update() {}, render() {},
  cleanup() {
    var c = document.getElementById('memory-container'); if (c) c.remove();
    var r = document.getElementById('memory-round'); if (r) r.remove();
    if (this.game.canvas) this.game.canvas.style.display = 'block';
  },
  shuffle(arr) { for (var i = arr.length-1; i > 0; i--) { var j = Math.floor(Math.random()*(i+1)); var t = arr[i]; arr[i] = arr[j]; arr[j] = t; } return arr; }
};
