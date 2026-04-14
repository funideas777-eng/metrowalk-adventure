window.QuizGame = {
  questions: [], currentIdx: 0, score: 0, streak: 0, maxStreak: 0,
  questionTimer: null, timePerQ: 8, timeLeft: 0, answered: false,
  round: 1, questionsPerRound: 5, roundQCount: 0,
  // 後端出題模式
  currentQuestion: null, totalQuestions: 10, loading: false,

  init(game) {
    this.game = game; this.score = 0; this.streak = 0; this.maxStreak = 0;
    this.round = 1; this.currentIdx = 0; this.roundQCount = 0; this.timePerQ = 8;
    this.loading = false;
    var canvas = game.canvas; canvas.style.display = 'none';
    var c = document.getElementById('quiz-container');
    if (!c) { c = document.createElement('div'); c.id = 'quiz-container'; c.style.cssText = 'padding:16px;width:100%;max-width:400px;margin:0 auto;'; canvas.parentElement.appendChild(c); }
    this.fetchQuestion();
  },

  // 從後端取得題目（不包含答案）
  async fetchQuestion() {
    this.loading = true;
    var c = document.getElementById('quiz-container'); if (!c) return;
    c.innerHTML = '<div style="text-align:center;padding:40px;color:rgba(255,255,255,0.5);">載入題目中...</div>';
    try {
      var session = Auth.getSession();
      var data = await API.get('getQuizQuestion_' + this.currentIdx, {
        action: 'getQuizQuestion',
        playerId: session.playerId,
        index: this.currentIdx
      }, 0);
      if (data && data.done) {
        // 所有題目已答完，重新開始
        this.currentIdx = 0;
        data = await API.get('getQuizQuestion_restart_' + Date.now(), {
          action: 'getQuizQuestion',
          playerId: session.playerId,
          index: 0
        }, 0);
      }
      if (data && data.question) {
        this.currentQuestion = data;
        this.totalQuestions = data.total || 10;
        this.loading = false;
        this.showQuestion();
      } else {
        c.innerHTML = '<div style="text-align:center;padding:40px;color:#f44336;">題目載入失敗</div>';
      }
    } catch(e) {
      // 如果後端無法連線，回退到前端題庫（相容舊版）
      console.warn('Quiz backend failed, fallback to local', e);
      this.useFallback();
    }
  },

  // 前端回退模式（相容舊版 GAS）
  useFallback() {
    if (CONFIG.QUIZ_QUESTIONS && CONFIG.QUIZ_QUESTIONS.length > 0) {
      this.questions = this.shuffle([].concat(CONFIG.QUIZ_QUESTIONS));
      this.currentQuestion = null;
      this.showQuestionLocal();
    }
  },

  showQuestion() {
    if (this.currentQuestion) {
      this.showQuestionRemote();
    } else {
      this.showQuestionLocal();
    }
  },

  // 後端出題模式：題目不含答案
  showQuestionRemote() {
    this.answered = false; this.timeLeft = this.timePerQ;
    var q = this.currentQuestion;
    var c = document.getElementById('quiz-container'); if (!c) return;
    c.innerHTML = '<div style="text-align:center;margin-bottom:16px;"><div style="font-size:12px;color:rgba(255,255,255,0.5)">Round ' + this.round + ' | 第 ' + (this.currentIdx+1) + '/' + this.totalQuestions + ' 題</div><div id="quiz-timer" style="font-size:24px;font-weight:900;color:var(--primary);margin:8px 0;">' + this.timeLeft + '</div><div style="height:4px;background:#333;border-radius:2px;overflow:hidden;margin-bottom:16px;"><div id="quiz-bar" style="height:100%;background:var(--primary);width:100%;transition:width 1s linear;"></div></div></div><div style="font-size:16px;font-weight:700;margin-bottom:20px;line-height:1.6;text-align:center;color:white;">' + q.question + '</div><div style="display:flex;flex-direction:column;gap:10px;">' + q.options.map(function(opt,i) { return '<button class="quiz-opt" onclick="QuizGame.answerRemote(' + i + ')" style="padding:14px 16px;border-radius:12px;border:2px solid #444;background:#222;color:white;font-size:14px;text-align:left;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:all 0.2s;">' + ['A','B','C','D'][i] + '. ' + opt + '</button>'; }).join('') + '</div>' + (this.streak>=3 ? '<div style="text-align:center;margin-top:12px;font-size:13px;color:var(--primary);font-weight:600;">🔥 連對 ' + this.streak + ' 題！</div>' : '');
    this.startTimer();
  },

  // 後端驗證答案
  async answerRemote(idx) {
    if (this.answered || this.game.paused || this.loading) return;
    this.answered = true; clearInterval(this.questionTimer);

    // 先鎖定按鈕
    document.querySelectorAll('.quiz-opt').forEach(function(btn) { btn.disabled = true; });

    var session = Auth.getSession();
    var self = this;
    try {
      var result = await API.post('WRITE', {
        action: 'answerQuiz',
        playerId: session.playerId,
        index: this.currentIdx,
        selected: idx
      });
      var correct = result && result.correct;
      var correctIndex = result ? result.correctIndex : -1;

      // 顯示結果
      document.querySelectorAll('.quiz-opt').forEach(function(btn, i) {
        if (i === correctIndex) { btn.style.background = '#1b5e20'; btn.style.borderColor = '#4caf50'; }
        if (i === idx && !correct) { btn.style.background = '#b71c1c'; btn.style.borderColor = '#f44336'; }
      });

      if (correct) {
        self.streak++; if (self.streak > self.maxStreak) self.maxStreak = self.streak;
        self.score += 20 + Math.ceil(self.timeLeft*5) + Math.min(self.streak*10,50);
        AudioEngine.quizCorrect();
        self.game.addCombo();
      } else {
        self.streak = 0;
        self.game.resetCombo();
        AudioEngine.quizWrong();
        var livesLeft = self.game.loseLife();
        if (livesLeft <= 0) return;
      }
      self.game.score = self.score; self.game.combo = self.streak; self.game.maxCombo = self.maxStreak; self.game.updateHUD();
      self.currentIdx++; self.roundQCount++;
      if (self.roundQCount >= self.questionsPerRound) {
        self.score += 100 * self.round; self.game.score = self.score; self.game.updateHUD();
        self.round++; self.roundQCount = 0;
        self.game.showRoundBanner(self.round);
        self.timePerQ = Math.max(4, 8 - (self.round-1)*2);
      }
      setTimeout(function() {
        if (!self.game.running) return;
        self.fetchQuestion();
      }, 1200);
    } catch(e) {
      console.warn('Answer verify failed', e);
      // 網路失敗時允許繼續
      self.currentIdx++;
      setTimeout(function() { if (self.game.running) self.fetchQuestion(); }, 1200);
    }
  },

  // === 本地題目模式（舊版回退）===
  showQuestionLocal() {
    if (this.currentIdx >= this.questions.length) { this.currentIdx = 0; this.questions = this.shuffle([].concat(CONFIG.QUIZ_QUESTIONS)); }
    this.answered = false; this.timeLeft = this.timePerQ;
    var q = this.questions[this.currentIdx];
    var c = document.getElementById('quiz-container'); if (!c) return;
    c.innerHTML = '<div style="text-align:center;margin-bottom:16px;"><div style="font-size:12px;color:rgba(255,255,255,0.5)">Round ' + this.round + ' | 第 ' + (this.roundQCount+1) + '/' + this.questionsPerRound + ' 題</div><div id="quiz-timer" style="font-size:24px;font-weight:900;color:var(--primary);margin:8px 0;">' + this.timeLeft + '</div><div style="height:4px;background:#333;border-radius:2px;overflow:hidden;margin-bottom:16px;"><div id="quiz-bar" style="height:100%;background:var(--primary);width:100%;transition:width 1s linear;"></div></div></div><div style="font-size:16px;font-weight:700;margin-bottom:20px;line-height:1.6;text-align:center;color:white;">' + q.q + '</div><div style="display:flex;flex-direction:column;gap:10px;">' + q.options.map(function(opt,i) { return '<button class="quiz-opt" onclick="QuizGame.answerLocal(' + i + ')" style="padding:14px 16px;border-radius:12px;border:2px solid #444;background:#222;color:white;font-size:14px;text-align:left;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:all 0.2s;">' + ['A','B','C','D'][i] + '. ' + opt + '</button>'; }).join('') + '</div>' + (this.streak>=3 ? '<div style="text-align:center;margin-top:12px;font-size:13px;color:var(--primary);font-weight:600;">🔥 連對 ' + this.streak + ' 題！</div>' : '');
    this.startTimer();
  },

  answerLocal(idx) {
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
      AudioEngine.quizWrong();
      var livesLeft = this.game.loseLife();
      if (livesLeft <= 0) return;
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
    setTimeout(function() {
      if (!self.game.running) return;
      self.showQuestionLocal();
    }, 1200);
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
      if (self.timeLeft <= 0) {
        clearInterval(self.questionTimer);
        if (!self.answered) {
          if (self.currentQuestion) self.answerRemote(-1);
          else self.answerLocal(-1);
        }
      }
    }, 1000);
  },

  // Compatibility wrappers
  answer(idx) { if (this.currentQuestion) this.answerRemote(idx); else this.answerLocal(idx); },
  update() {}, render() {},
  cleanup() { if (this.questionTimer) clearInterval(this.questionTimer); var c = document.getElementById('quiz-container'); if (c) c.remove(); if (this.game.canvas) this.game.canvas.style.display = 'block'; },
  shuffle(arr) { for (var i=arr.length-1;i>0;i--) { var j=Math.floor(Math.random()*(i+1)); var t=arr[i]; arr[i]=arr[j]; arr[j]=t; } return arr; }
};
