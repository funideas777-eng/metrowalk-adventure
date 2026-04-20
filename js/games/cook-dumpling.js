window.CookDumplingGame = {
  step: 0, score: 0, tapCount: 0, gauge: 0, timers: [], container: null,
  stepDone: false, pressing: false, pleats: 0,

  STEPS: [
    { name: '和餡', emoji: '🥟', desc: '快速點擊攪拌肉餡！', goal: 25 },
    { name: '擀皮', emoji: '🫓', desc: '拖動擀麵杖擀薄皮', goal: 20 },
    { name: '包餡摺褶', emoji: '🥟', desc: '跟節奏點擊摺褶子！', goal: 18 },
    { name: '蒸籠', emoji: '♨️', desc: '在正確時間開蓋！', goal: 1 },
    { name: '沾醬', emoji: '🍶', desc: '把醬料拖到盤子上', goal: 3 }
  ],

  init: function(game) {
    var self = this;
    self.game = game; self.step = 0; self.score = 0;
    self.tapCount = 0; self.gauge = 0; self.timers = [];
    self.stepDone = false; self.pleats = 0;
    game.canvas.style.display = 'none';
    var c = document.getElementById('cook-dumpling-container');
    if (!c) { c = document.createElement('div'); c.id = 'cook-dumpling-container'; game.canvas.parentElement.appendChild(c); }
    self.container = c;
    self.container.style.cssText = 'width:100%;background:#1a1a2e;min-height:300px;';
    self.renderStep();
  },

  renderStep: function() {
    var self = this;
    var s = self.STEPS[self.step];
    self.tapCount = 0; self.gauge = 0; self.stepDone = false; self.pressing = false;
    var progPct = ((self.step) / 5 * 100);
    var html = '<div style="text-align:center;color:white;padding:12px;font-size:14px;">' +
      '<div style="background:#333;border-radius:8px;height:8px;margin:0 20px 10px;"><div style="background:linear-gradient(90deg,#ffab40,#fff176);height:100%;border-radius:8px;width:' + progPct + '%;transition:width 0.3s;"></div></div>' +
      '<div style="font-size:13px;color:#aaa;">步驟 ' + (self.step+1) + ' / 5</div>' +
      '<div style="font-size:60px;margin:10px 0;">' + s.emoji + '</div>' +
      '<div style="font-size:20px;font-weight:bold;margin:6px 0;">' + s.name + '</div>' +
      '<div style="font-size:15px;color:#ccc;margin-bottom:14px;">' + s.desc + '</div>' +
      '<div id="dumpling-area" style="background:#2a2a3e;border-radius:16px;min-height:160px;margin:0 16px;display:flex;align-items:center;justify-content:center;flex-direction:column;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;touch-action:none;position:relative;overflow:hidden;">' +
      self.getStepContent() + '</div>' +
      '<div id="dumpling-feedback" style="font-size:18px;margin-top:10px;min-height:30px;"></div></div>';
    self.container.innerHTML = html;
    self.bindStep();
  },

  getStepContent: function() {
    var step = this.step;
    if (step === 0) return '<div style="font-size:45px;" id="dumpling-mix">🥄🥩</div><div id="dumpling-count" style="color:#ffd700;font-size:22px;margin-top:8px;">0 / 25</div>';
    if (step === 1) return '<div style="font-size:45px;">🫓</div><div style="width:80%;height:20px;background:#444;border-radius:10px;margin-top:10px;"><div id="dumpling-roll" style="height:100%;border-radius:10px;width:0%;background:#ffab40;transition:width 0.1s;"></div></div><div id="dumpling-count" style="color:#ffd700;font-size:18px;margin-top:8px;">0 / 20</div>';
    if (step === 2) {
      var dots = '';
      for (var i = 0; i < 18; i++) {
        dots += '<span id="pleat-' + i + '" style="display:inline-block;width:14px;height:14px;border-radius:50%;background:#444;margin:2px;transition:background 0.2s;"></span>';
      }
      return '<div style="font-size:40px;margin-bottom:8px;">🥟</div><div style="max-width:280px;">' + dots + '</div><div id="dumpling-count" style="color:#ffd700;font-size:18px;margin-top:8px;">褶子: 0 / 18</div>';
    }
    if (step === 3) return '<div style="font-size:50px;" id="dumpling-steam">♨️🧊</div><div style="width:80%;height:24px;background:#444;border-radius:12px;margin-top:10px;position:relative;"><div id="dumpling-timer-bar" style="height:100%;border-radius:12px;width:0%;background:#4caf50;transition:width 0.05s;"></div><div style="position:absolute;left:70%;width:15%;height:100%;border:2px solid #ffd700;border-radius:4px;top:0;box-sizing:border-box;pointer-events:none;"></div></div><div id="dumpling-count" style="color:#aaa;font-size:14px;margin-top:8px;">等待蒸熟...點擊開蓋</div>';
    if (step === 4) return '<div style="position:relative;width:220px;height:150px;">' +
      '<div style="font-size:60px;position:absolute;bottom:0;left:50%;transform:translateX(-50%);">🍽️</div>' +
      '<div class="dump-sauce" onclick="CookDumplingGame.addSauce(0)" style="position:absolute;top:5px;left:10px;font-size:32px;cursor:pointer;">🍶</div>' +
      '<div class="dump-sauce" onclick="CookDumplingGame.addSauce(1)" style="position:absolute;top:5px;left:50%;transform:translateX(-50%);font-size:32px;cursor:pointer;">🫚</div>' +
      '<div class="dump-sauce" onclick="CookDumplingGame.addSauce(2)" style="position:absolute;top:5px;right:10px;font-size:32px;cursor:pointer;">🧄</div></div>' +
      '<div id="dumpling-count" style="color:#ffd700;font-size:18px;margin-top:8px;">0 / 3</div>';
    return '';
  },

  bindStep: function() {
    var self = this;
    var area = document.getElementById('dumpling-area');
    if (!area) return;
    var step = self.step;

    if (step === 0 || step === 2) {
      area.addEventListener('click', function() { self.handleTap(); });
    } else if (step === 1) {
      var lastX = 0;
      area.addEventListener('touchmove', function(e) {
        e.preventDefault();
        var dx = Math.abs(e.touches[0].clientX - lastX);
        if (dx > 8) { self.handleRoll(); lastX = e.touches[0].clientX; }
      });
      area.addEventListener('mousemove', function(e) {
        if (!self.pressing) return;
        if (Math.abs(e.clientX - lastX) > 8) { self.handleRoll(); lastX = e.clientX; }
      });
      area.addEventListener('mousedown', function(e) { self.pressing = true; lastX = e.clientX; });
      area.addEventListener('mouseup', function() { self.pressing = false; });
    } else if (step === 3) {
      self.startSteamTimer();
      area.addEventListener('click', function() { self.handleSteamClick(); });
    }
  },

  handleTap: function() {
    var self = this;
    if (self.stepDone) return;
    self.tapCount++;
    if (typeof AudioEngine !== 'undefined') AudioEngine.tapButton();
    var goal = self.STEPS[self.step].goal;
    var el = document.getElementById('dumpling-count');

    if (self.step === 0) {
      if (el) el.textContent = Math.min(self.tapCount, goal) + ' / ' + goal;
      var mix = document.getElementById('dumpling-mix');
      if (mix) { mix.style.transform = 'rotate(' + (self.tapCount * 15) + 'deg)'; }
      if (self.tapCount >= goal) self.completeStep(93);
    } else if (self.step === 2) {
      self.pleats = self.tapCount;
      if (el) el.textContent = '褶子: ' + Math.min(self.tapCount, goal) + ' / ' + goal;
      var dot = document.getElementById('pleat-' + (self.tapCount - 1));
      if (dot) dot.style.background = '#ffd700';
      if (self.tapCount >= goal) {
        var bonus = Math.min(self.pleats, 18);
        self.completeStep(70 + Math.floor(bonus * 30 / 18));
      }
    }
  },

  handleRoll: function() {
    var self = this;
    if (self.stepDone) return;
    self.tapCount++;
    var bar = document.getElementById('dumpling-roll');
    var pct = Math.min(100, (self.tapCount / 20) * 100);
    if (bar) bar.style.width = pct + '%';
    var el = document.getElementById('dumpling-count');
    if (el) el.textContent = Math.min(self.tapCount, 20) + ' / 20';
    if (self.tapCount >= 20) self.completeStep(90);
  },

  startSteamTimer: function() {
    var self = this;
    self.steamProgress = 0;
    self.steamGood = false;
    var interval = setInterval(function() {
      if (self.stepDone || (self.game && self.game.paused)) return;
      self.steamProgress = Math.min(100, self.steamProgress + 0.8);
      var bar = document.getElementById('dumpling-timer-bar');
      var color = (self.steamProgress >= 70 && self.steamProgress <= 85) ? '#4caf50' : self.steamProgress > 85 ? '#f44336' : '#2196f3';
      if (bar) { bar.style.width = self.steamProgress + '%'; bar.style.background = color; }
      self.steamGood = (self.steamProgress >= 70 && self.steamProgress <= 85);
      var txt = document.getElementById('dumpling-count');
      if (self.steamProgress >= 70 && txt) txt.textContent = '🟢 快開蓋！';
      if (self.steamProgress >= 100 && !self.stepDone) {
        clearInterval(interval);
        self.completeStep(25);
      }
    }, 50);
    self.timers.push(interval);
  },

  handleSteamClick: function() {
    var self = this;
    if (self.stepDone) return;
    if (self.steamGood) {
      self.completeStep(98);
    } else if (self.steamProgress < 70) {
      var txt = document.getElementById('dumpling-count');
      if (txt) { txt.textContent = '還沒蒸熟！再等等...'; txt.style.color = '#ff9800'; }
    }
  },

  addSauce: function(idx) {
    var self = this;
    if (self.stepDone) return;
    var sauces = document.querySelectorAll('.dump-sauce');
    if (sauces[idx]) { sauces[idx].style.opacity = '0.3'; sauces[idx].style.pointerEvents = 'none'; }
    self.tapCount++;
    if (typeof AudioEngine !== 'undefined') AudioEngine.tapButton();
    var el = document.getElementById('dumpling-count');
    if (el) el.textContent = self.tapCount + ' / 3';
    if (self.tapCount >= 3) self.completeStep(95);
  },

  completeStep: function(accuracy) {
    var self = this;
    if (self.stepDone) return;
    self.stepDone = true;
    var pts = Math.round(accuracy);
    self.score += pts;
    self.game.score = self.score;
    self.game.addScore(pts);
    if (typeof AudioEngine !== 'undefined') AudioEngine.scoreUp();
    var fb = document.getElementById('dumpling-feedback');
    var color = accuracy >= 90 ? '#4caf50' : accuracy >= 60 ? '#ffd700' : '#f44336';
    var label = accuracy >= 90 ? '完美！' : accuracy >= 60 ? '不錯！' : '加油！';
    if (fb) fb.innerHTML = '<span style="color:' + color + ';">+' + pts + ' ' + label + '</span>';
    self.step++;
    if (self.step >= 5) {
      var t = setTimeout(function() { self.showComplete(); }, 800);
      self.timers.push(t);
    } else {
      var t = setTimeout(function() { self.renderStep(); }, 800);
      self.timers.push(t);
    }
  },

  showComplete: function() {
    var self = this;
    var bonus = 50;
    self.score += bonus; self.game.score = self.score; self.game.addScore(bonus);
    self.game.running = false;
    if (typeof AudioEngine !== 'undefined') AudioEngine.roundClear();
    self.container.innerHTML = '<div style="text-align:center;color:white;padding:40px 16px;">' +
      '<div style="font-size:80px;margin-bottom:16px;">🥟</div>' +
      '<div style="font-size:24px;font-weight:bold;color:#ffd700;">小籠包完成！</div>' +
      '<div style="font-size:18px;margin-top:10px;">總分: ' + self.score + '</div>' +
      '<div style="font-size:14px;color:#4caf50;margin-top:6px;">完成獎勵 +' + bonus + '</div>' +
      '<div style="font-size:14px;color:#ffab40;margin-top:4px;">褶數: ' + self.pleats + '</div></div>';
  },

  update: function() {},
  render: function() {},

  cleanup: function() {
    var self = this;
    self.timers.forEach(function(t) { clearTimeout(t); clearInterval(t); });
    self.timers = [];
    var c = document.getElementById('cook-dumpling-container');
    if (c) c.remove();
    if (self.game && self.game.canvas) self.game.canvas.style.display = 'block';
  }
};
