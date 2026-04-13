const AudioEngine = {
  ctx: null, initialized: false,
  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.initialized = true;
      // iOS 需要使用者互動才能啟動
      const resume = () => { if (this.ctx.state === 'suspended') this.ctx.resume(); document.removeEventListener('touchstart', resume); document.removeEventListener('click', resume); };
      document.addEventListener('touchstart', resume, { once: true });
      document.addEventListener('click', resume, { once: true });
    } catch(e) { console.warn('AudioContext failed:', e); }
  },
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },

  playTone(freq, dur, type, vol) {
    if (!this.ctx) return;
    this.resume();
    type = type || 'sine'; vol = vol || 0.3;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    o.connect(g); g.connect(this.ctx.destination);
    o.start(); o.stop(this.ctx.currentTime + dur);
  },

  playSweep(sf, ef, dur, type, vol) {
    if (!this.ctx) return;
    this.resume();
    type = type || 'sine'; vol = vol || 0.3;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(sf, this.ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(ef, this.ctx.currentTime + dur);
    g.gain.setValueAtTime(vol, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    o.connect(g); g.connect(this.ctx.destination);
    o.start(); o.stop(this.ctx.currentTime + dur);
  },

  playNoise(dur, vol) {
    if (!this.ctx) return;
    this.resume();
    vol = vol || 0.1;
    const bs = this.ctx.sampleRate * dur;
    const b = this.ctx.createBuffer(1, bs, this.ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < bs; i++) d[i] = Math.random() * 2 - 1;
    const s = this.ctx.createBufferSource();
    const g = this.ctx.createGain();
    s.buffer = b;
    g.gain.setValueAtTime(vol, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    s.connect(g); g.connect(this.ctx.destination);
    s.start();
  },

  playSequence(notes, tempo) {
    tempo = tempo || 150;
    notes.forEach(function(n, i) {
      setTimeout(function() { AudioEngine.playTone(n[0], n[1] / 1000, 'sine', 0.25); }, i * tempo);
    });
  },

  // === UI 音效 ===
  tapButton() {
    this.playTone(800, 0.06, 'sine', 0.12);
    if (navigator.vibrate) navigator.vibrate(15);
  },
  pageTransition() { this.playSweep(400, 800, 0.15, 'sine', 0.1); },
  error() { this.playSequence([[200, 200], [150, 300]], 200); if (navigator.vibrate) navigator.vibrate([50, 30, 50]); },

  // === 進場/解鎖 ===
  enterZone() {
    this.playSequence([[523, 150], [659, 150], [784, 200]], 120);
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
  },
  unlockGame() {
    this.playSequence([[523, 100], [659, 100], [784, 100], [1047, 300]], 100);
    if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]);
  },

  // === 遊戲進行 ===
  countdown() {
    this.playTone(440, 0.15, 'square', 0.2);
    if (navigator.vibrate) navigator.vibrate(40);
  },
  gameStart() {
    this.playSequence([[523, 100], [659, 100], [784, 100], [1047, 200]], 80);
    if (navigator.vibrate) navigator.vibrate(200);
  },
  gameEnd() {
    this.playSequence([[784, 200], [659, 200], [523, 300]], 180);
    if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 300]);
  },

  // === 得分/連擊 ===
  comboHit(c) {
    // 連擊越高音調越高
    const freq = 500 + Math.min(c, 15) * 60;
    this.playTone(freq, 0.08, 'triangle', 0.2);
    if (c >= 10) {
      setTimeout(function() { AudioEngine.playTone(freq * 1.5, 0.06, 'sine', 0.15); }, 50);
    }
    if (navigator.vibrate) navigator.vibrate(Math.min(20 + c * 3, 60));
  },
  scoreUp() {
    this.playSweep(400, 900, 0.12, 'triangle', 0.2);
    if (navigator.vibrate) navigator.vibrate(25);
  },
  bigScoreUp() {
    this.playSweep(300, 1200, 0.2, 'triangle', 0.25);
    setTimeout(function() { AudioEngine.playTone(1200, 0.15, 'sine', 0.15); }, 100);
    if (navigator.vibrate) navigator.vibrate([50, 30, 80]);
  },
  penalty() {
    this.playTone(150, 0.3, 'sawtooth', 0.15);
    if (navigator.vibrate) navigator.vibrate(100);
  },

  // === 回合制 ===
  roundClear() {
    this.playSequence([[523, 80], [659, 80], [784, 80], [1047, 80], [1319, 200]], 70);
    if (navigator.vibrate) navigator.vibrate([80, 40, 80, 40, 200]);
  },

  // === 個別遊戲 ===
  snakeEat() {
    this.playTone(600, 0.05, 'square', 0.12);
    if (navigator.vibrate) navigator.vibrate(15);
  },
  snakeDie() {
    this.playSweep(400, 100, 0.4, 'sawtooth', 0.2);
    if (navigator.vibrate) navigator.vibrate([100, 50, 150]);
  },
  cardFlip() {
    this.playTone(700, 0.06, 'sine', 0.12);
    if (navigator.vibrate) navigator.vibrate(10);
  },
  cardMatch() {
    this.playSequence([[800, 80], [1000, 120]], 80);
    if (navigator.vibrate) navigator.vibrate([30, 20, 50]);
  },
  cardMiss() {
    this.playTone(300, 0.15, 'triangle', 0.1);
    if (navigator.vibrate) navigator.vibrate(40);
  },
  whackHit() {
    this.playTone(500, 0.08, 'square', 0.2);
    this.playNoise(0.05, 0.08);
    if (navigator.vibrate) navigator.vibrate(40);
  },
  quizCorrect() {
    this.playSequence([[523, 80], [784, 150]], 80);
    if (navigator.vibrate) navigator.vibrate([30, 20, 50]);
  },
  quizWrong() {
    this.playTone(200, 0.3, 'sawtooth', 0.15);
    if (navigator.vibrate) navigator.vibrate([60, 30, 60]);
  },
  brickBreak() {
    this.playTone(800, 0.04, 'square', 0.15);
    if (navigator.vibrate) navigator.vibrate(20);
  },
  paddleBounce() {
    this.playTone(400, 0.05, 'triangle', 0.1);
    if (navigator.vibrate) navigator.vibrate(15);
  },
  rhythmPerfect() {
    this.playTone(1047, 0.08, 'sine', 0.2);
    if (navigator.vibrate) navigator.vibrate(20);
  },
  rhythmGood() {
    this.playTone(784, 0.06, 'sine', 0.15);
    if (navigator.vibrate) navigator.vibrate(15);
  },
  rhythmMiss() {
    this.playTone(200, 0.1, 'sawtooth', 0.08);
  },
  dodgeCoin() {
    this.playSweep(600, 1000, 0.1, 'sine', 0.12);
    if (navigator.vibrate) navigator.vibrate(15);
  },
  dodgeCrash() {
    this.playNoise(0.3, 0.2);
    this.playTone(100, 0.4, 'sawtooth', 0.15);
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);
  },
  reactionTap() {
    this.playTone(900, 0.05, 'sine', 0.15);
    if (navigator.vibrate) navigator.vibrate(20);
  },
  shooterHit() {
    this.playNoise(0.06, 0.12);
    this.playTone(700, 0.06, 'square', 0.15);
    if (navigator.vibrate) navigator.vibrate(30);
  },

  // === 系統 ===
  shutter() {
    this.playNoise(0.15, 0.2);
    if (navigator.vibrate) navigator.vibrate(50);
  },
  uploadSuccess() {
    this.playSequence([[523, 100], [784, 100], [1047, 200]], 100);
    if (navigator.vibrate) navigator.vibrate([80, 40, 80, 40, 150]);
  },
  notification() {
    this.playSequence([[880, 100], [1100, 150]], 120);
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  }
};
