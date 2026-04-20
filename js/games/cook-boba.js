window.CookBobaGame = {
  step: 0, score: 0, stepScore: 0, tapCount: 0, gauge: 0, swipeAngle: 0,
  timers: [], animFrame: null, container: null,

  STEPS: [
    { name: '煮珍珠', emoji: '🫧', desc: '快速點擊攪拌珍珠！', goal: 30 },
    { name: '沖紅茶', emoji: '🍵', desc: '按住倒茶，溫度到綠色區域放開', goal: 1 },
    { name: '加鮮奶', emoji: '🥛', desc: '按住倒奶到正確刻度', goal: 1 },
    { name: '加冰塊', emoji: '🧊', desc: '點擊加入冰塊（加3塊）', goal: 3 },
    { name: '攪拌', emoji: '🥤', desc: '畫圓攪拌！快速滑動', goal: 20 }
  ],

  init: function(game) {
    var self = this;
    self.game = game; self.step = 0; self.score = 0;
    self.tapCount = 0; self.gauge = 0; self.swipeAngle = 0;
    self.timers = []; self.pressing = false; self.stepDone = false;
    game.canvas.style.display = 'none';
    var c = document.getElementById('cook-boba-container');
    if (!c) { c = document.createElement('div'); c.id = 'cook-boba-container'; game.canvas.parentElement.appendChild(c); }
    self.container = c;
    self.renderStep();
  },

  renderStep: function() {
    var self = this;
    var s = self.STEPS[self.step];
    self.tapCount = 0; self.gauge = 0; self.stepDone = false; self.pressing = false; self.stepScore = 0;
    // 修正 off-by-one：以「正在進行第 N 步 / 共 5 步」的進度顯示
    var progPct = Math.min(100, ((self.step + 1) / 5) * 100);
    var html = '<div style="text-align:center;color:white;padding:12px;font-size:14px;">' +
      '<div style="background:#333;border-radius:8px;height:8px;margin:0 20px 10px;"><div style="background:linear-gradient(90deg,#ff6b35,#ffd700);height:100%;border-radius:8px;width:' + progPct + '%;transition:width 0.3s;"></div></div>' +
      '<div style="font-size:13px;color:#aaa;">步驟 ' + (self.step+1) + ' / 5</div>' +
      '<div style="font-size:60px;margin:10px 0;" id="boba-emoji">' + s.emoji + '</div>' +
      '<div style="font-size:20px;font-weight:bold;margin:6px 0;">' + s.name + '</div>' +
      '<div style="font-size:15px;color:#ccc;margin-bottom:14px;">' + s.desc + '</div>' +
      '<div id="boba-area" style="background:#2a2a3e;border-radius:16px;min-height:160px;margin:0 16px;display:flex;align-items:center;justify-content:center;flex-direction:column;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;touch-action:none;position:relative;overflow:hidden;">' +
      self.getStepContent() + '</div>' +
      '<div id="boba-feedback" style="font-size:18px;margin-top:10px;min-height:30px;"></div></div>';
    self.container.innerHTML = html;
    self.container.style.cssText = 'width:100%;background:#1a1a2e;min-height:300px;';
    self.bindStep();
  },

  getStepContent: function() {
    var step = this.step;
    if (step === 0) return '<div style="font-size:50px;">🫧</div><div id="boba-count" style="color:#ffd700;font-size:24px;margin-top:8px;">0 / 30</div>';
    if (step === 1) return '<div style="width:80%;height:30px;background:#444;border-radius:15px;position:relative;"><div id="boba-gauge" style="height:100%;border-radius:15px;width:0%;transition:width 0.1s;"></div><div style="position:absolute;left:55%;width:20%;height:100%;border:2px solid #4caf50;border-radius:4px;top:0;box-sizing:border-box;pointer-events:none;"></div></div><div style="color:#aaa;margin-top:8px;font-size:13px;">按住倒茶</div>';
    if (step === 2) return '<div style="width:40px;height:150px;background:#444;border-radius:8px;position:relative;border:2px solid #666;"><div id="boba-level" style="position:absolute;bottom:0;width:100%;background:#fff;border-radius:0 0 6px 6px;height:0%;transition:height 0.1s;"></div><div style="position:absolute;bottom:60%;width:100%;border-top:2px dashed #4caf50;"></div><div style="position:absolute;bottom:70%;width:100%;border-top:2px dashed #4caf50;"></div></div><div style="color:#aaa;margin-top:8px;font-size:13px;">按住倒奶到綠線之間</div>';
    if (step === 3) return '<div id="boba-ice" style="font-size:40px;">🥤</div><div id="boba-count" style="color:#ffd700;font-size:24px;margin-top:8px;">0 / 3</div>';
    if (step === 4) return '<div style="font-size:50px;">🥤</div><div id="boba-count" style="color:#ffd700;font-size:24px;margin-top:8px;">0 / 20</div>';
    return '';
  },

  bindStep: function() {
    var self = this;
    var area = document.getElementById('boba-area');
    if (!area) return;
    var step = self.step;

    if (step === 0 || step === 3) {
      area.addEventListener('click', function() { self.handleTap(); });
    } else if (step === 1 || step === 2) {
      var interval = null;
      area.addEventListener('touchstart', function(e) { e.preventDefault(); self.pressing = true; interval = setInterval(function() { self.handleHold(); }, 50); });
      area.addEventListener('touchend', function() { self.pressing = false; clearInterval(interval); self.handleRelease(); });
      area.addEventListener('mousedown', function() { self.pressing = true; interval = setInterval(function() { self.handleHold(); }, 50); });
      area.addEventListener('mouseup', function() { self.pressing = false; clearInterval(interval); self.handleRelease(); });
    } else if (step === 4) {
      var lastX = 0, lastY = 0;
      area.addEventListener('touchmove', function(e) {
        e.preventDefault();
        var t = e.touches[0];
        var dx = t.clientX - lastX, dy = t.clientY - lastY;
        if (Math.abs(dx) + Math.abs(dy) > 10) { self.handleSwipe(); lastX = t.clientX; lastY = t.clientY; }
      });
      area.addEventListener('mousemove', function(e) {
        if (!self.pressing) return;
        var dx = e.clientX - lastX, dy = e.clientY - lastY;
        if (Math.abs(dx) + Math.abs(dy) > 10) { self.handleSwipe(); lastX = e.clientX; lastY = e.clientY; }
      });
      area.addEventListener('mousedown', function(e) { self.pressing = true; lastX = e.clientX; lastY = e.clientY; });
      area.addEventListener('mouseup', function() { self.pressing = false; });
    }
  },

  handleTap: function() {
    var self = this;
    if (self.stepDone) return;
    self.tapCount++;
    if (typeof AudioEngine !== 'undefined') AudioEngine.tapButton();
    var goal = self.STEPS[self.step].goal;
    var el = document.getElementById('boba-count');
    if (el) el.textContent = Math.min(self.tapCount, goal) + ' / ' + goal;
    if (self.step === 3) {
      var ice = document.getElementById('boba-ice');
      if (ice) ice.textContent = '🥤' + '🧊'.repeat(Math.min(self.tapCount, 3));
    }
    // 確定性準度：達標即 95（tap 類步驟，技巧已由「完成 goal 次」驗證）
    if (self.tapCount >= goal) self.completeStep(95);
  },

  handleHold: function() {
    var self = this;
    if (self.stepDone) return;
    self.gauge = Math.min(100, self.gauge + 2);
    if (self.step === 1) {
      var el = document.getElementById('boba-gauge');
      if (el) {
        var color = (self.gauge >= 55 && self.gauge <= 75) ? '#4caf50' : (self.gauge > 75 ? '#f44336' : '#ff9800');
        el.style.width = self.gauge + '%'; el.style.background = color;
      }
    } else if (self.step === 2) {
      var el = document.getElementById('boba-level');
      if (el) el.style.height = self.gauge + '%';
    }
  },

  handleRelease: function() {
    var self = this;
    if (self.stepDone) return;
    var acc;
    if (self.step === 1) {
      acc = (self.gauge >= 55 && self.gauge <= 75) ? 100 : (self.gauge >= 45 && self.gauge <= 85) ? 70 : 40;
    } else {
      acc = (self.gauge >= 60 && self.gauge <= 70) ? 100 : (self.gauge >= 50 && self.gauge <= 80) ? 70 : 40;
    }
    self.completeStep(acc);
  },

  handleSwipe: function() {
    var self = this;
    if (self.stepDone) return;
    self.tapCount++;
    var el = document.getElementById('boba-count');
    var goal = self.STEPS[self.step].goal;
    if (el) el.textContent = Math.min(self.tapCount, goal) + ' / ' + goal;
    // 滑動攪拌：達標固定 90（已由滑動次數驗證技巧）
    if (self.tapCount >= goal) self.completeStep(90);
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
    var fb = document.getElementById('boba-feedback');
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
    self.score += bonus;
    self.game.score = self.score;
    self.game.addScore(bonus);
    self.game.running = false;
    if (typeof AudioEngine !== 'undefined') AudioEngine.roundClear();
    self.container.innerHTML = '<div style="text-align:center;color:white;padding:40px 16px;">' +
      '<div style="font-size:80px;margin-bottom:16px;">🧋</div>' +
      '<div style="font-size:24px;font-weight:bold;color:#ffd700;">珍珠奶茶完成！</div>' +
      '<div style="font-size:18px;margin-top:10px;">總分: ' + self.score + '</div>' +
      '<div style="font-size:14px;color:#4caf50;margin-top:6px;">完成獎勵 +' + bonus + '</div></div>';
  },

  update: function() {},
  render: function() {},

  cleanup: function() {
    var self = this;
    self.timers.forEach(function(t) { clearTimeout(t); clearInterval(t); });
    self.timers = [];
    self.pressing = false;
    var c = document.getElementById('cook-boba-container');
    if (c) { c.innerHTML = ''; c.remove(); } // 先清 DOM 樹，確保 listener 被回收
    if (self.game && self.game.canvas) self.game.canvas.style.display = 'block';
  }
};
