window.QuizGame = {
  questions: [], currentIdx: 0, score: 0, streak: 0, maxStreak: 0,
  questionTimer: null, timePerQ: 8, timeLeft: 0, answered: false,
  round: 1, questionsPerRound: 5, roundQCount: 0,

  init(game) {
    this.game = game; this.score = 0; this.streak = 0; this.maxStreak = 0;
    this.round = 1; this.currentIdx = 0; this.roundQCount = 0; this.timePerQ = 8;
    this.questions = this.shuffle([].concat(CONFIG.QUIZ_QUESTIONS));
    var canvas = game.canvas; canvas.style.display = 'none';
    var c = document.getElementById('quiz-container');
    if (!c) { c = document.createElement('div'); c.id = 'quiz-container'; c.style.cssText = 'padding:16px;width:100%;max-width:400px;margin:0 auto;'; canvas.parentElement.appendChild(c); }
    this.showQuestion();
  },

  showQuestion() {
    if (this.currentIdx >= this.questions.length) { this.currentIdx = 0; this.questions = this.shuffle([].concat(CONFIG.QUIZ_QUESTIONS)); }
    this.answered = false; this.timeLeft = this.timePerQ;
    var q = this.questions[this.currentIdx];
    var c = document.getElementById('quiz-container'); if (!c) return;
    c.innerHTML = '<div style="text-align:center;margin-bottom:16px;"><div style="font-size:12px;color:rgba(255,255,255,0.5)">Round ' + this.round + ' | 第 ' + (this.roundQCount+1) + '/' + this.questionsPerRound + ' 題</div><div id="quiz-timer" style="font-size:24px;font-weight:900;color:var(--primary);margin:8px 0;">' + this.timeLeft + '</div><div style="height:4px;background:#333;border-radius:2px;overflow:hidden;margin-bottom:16px;"><div id="quiz-bar" style="height:100%;background:var(--primary);width:100%;transition:width 1s linear;"></div></div></div><div style="font-size:16px;font-weight:700;margin-bottom:20px;line-height:1.6;text-align:center;color:white;">' + q.q + '</div><div style="display:flex;flex-direction:column;gap:10px;">' + q.options.map(function(opt,i) { return '<button class="quiz-opt" onclick="QuizGame.answer(' + i + ')" style="padding:14px 16px;border-radius:12px;border:2px solid #444;background:#222;color:white;font-size:14px;text-align:left;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:all 0.2s;">' + ['A','B','C','D'][i] + '. ' + opt + '</button>'; }).join('') + '</div>' + (this.streak>=3 ? '<div style="text-align:center;margin-top:12px;font-size:13px;color:var(--primary);font-weight:600;">🔥 連對 ' + this.streak + ' 題！</div>' : '');
    this.startTimer();
  },

  startTimer() {
    if (this.questionTimer) clearInterval(this.questionTimer);
    var self = this;
    this.questionTimer = setInterval(function() {
      if (self.game.paused) return;
      self.timeLeft--;
      var t = document.getElementById('quiz-timer'), b = document.getElementById('quiz-bar');
      if (t) t.textContent = self.timeLeft; if (b) b.style.width = (self.timeLeft/self.timePerQ*100)+'%';
      if (self.timeLeft <= 3 && t) t.style.color = '#f44336';
      if (self.timeLeft <= 0) { clearInterval(self.questionTimer); if (!self.answered) self.answer(-1); }
    }, 1000);
  },

  answer(idx) {
    if (this.answered || this.game.paused) return; this.answered = true; clearInterval(this.questionTimer);
    var q = this.questions[this.currentIdx], correct = idx === q.answer;
    document.querySelectorAll('.quiz-opt').forEach(function(btn, i) {
      btn.disabled = true;
      if (i === q.answer) { btn.style.background = '#1b5e20'; btn.style.borderColor = '#4caf50'; }
      if (i === idx && !correct) { btn.style.background = '#b71c1c'; btn.style.borderColor = '#f44336'; }
    });
    if (correct) {
      this.streak++; if (this.streak > this.maxStreak) this.maxStreak = this.streak;
      this.score += 20 + Math.ceil(this.timeLeft*5) + Math.min(this.streak*10,50);
      AudioEngine.quizCorrect();
      this.game.addCombo();
    } else {
      this.streak = 0;
      this.game.resetCombo();
      // Wrong answer = lose life
      this.game.loseLife();
      AudioEngine.quizWrong();
    }
    this.game.score = this.score; this.game.combo = this.streak; this.game.maxCombo = this.maxStreak; this.game.updateHUD();
    this.currentIdx++; this.roundQCount++;
    if (this.roundQCount >= this.questionsPerRound) {
      this.score += 100 * this.round; this.game.score = this.score; this.game.updateHUD();
      this.round++; this.roundQCount = 0;
      this.game.showRoundBanner(this.round);
      this.timePerQ = Math.max(4, 8 - (this.round-1)*2);
    }
    var self = this;
    setTimeout(function() { if (self.game.running) self.showQuestion(); }, 1200);
  },

  update() {}, render() {},
  cleanup() { if (this.questionTimer) clearInterval(this.questionTimer); var c = document.getElementById('quiz-container'); if (c) c.remove(); if (this.game.canvas) this.game.canvas.style.display = 'block'; },
  shuffle(arr) { for (var i=arr.length-1;i>0;i--) { var j=Math.floor(Math.random()*(i+1)); var t=arr[i]; arr[i]=arr[j]; arr[j]=t; } return arr; }
};
