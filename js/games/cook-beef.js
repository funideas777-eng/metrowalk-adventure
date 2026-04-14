window.CookBeefGame = {
  step: 0, score: 0, tapCount: 0, gauge: 0, timers: [], container: null,
  stepDone: false, pressing: false, boilLevel: 0, boilTimer: null,

  STEPS: [
    { name: '切牛肉', emoji: '🥩', desc: '跟著節奏點擊切肉！', goal: 20 },
    { name: '炒豆瓣醬', emoji: '🫕', desc: '拖動攪拌炒香', goal: 25 },
    { name: '燉湯', emoji: '🍲', desc: '看好火候！快沸騰時點擊降溫', goal: 3 },
    { name: '煮麵', emoji: '🍜', desc: '麵條變色時立刻點擊！', goal: 1 },
    { name: '擺盤加蔥花', emoji: '🥣', desc: '把配料拖到碗裡', goal: 3 }
  ],

  init: function(game) {
    var self = this;
    self.game = game; self.step = 0; self.score = 0;
    self.tapCount = 0; self.gauge = 0; self.timers = [];
    self.stepDone = false; self.boilLevel = 0;
    game.canvas.style.display = 'none';
    var c = document.getElementById('cook-beef-container');
    if (!c) { c = document.createElement('div'); c.id = 'cook-beef-container'; game.canvas.parentElement.appendChild(c); }
    self.container = c;
    self.container.style.cssText = 'width:100%;background:#1a1a2e;min-height:300px;';
    self.renderStep();
  },

  renderStep: function() {
    var self = this;
    var s = self.STEPS[self.step];
    self.tapCount = 0; self.gauge = 0; self.stepDone = false; self.pressing = false; self.boilLevel = 0;
    if (self.boilTimer) { clearInterval(self.boilTimer); self.boilTimer = null; }
    var progPct = ((self.step) / 5 * 100);
    var html = '<div style="text-align:center;color:white;padding:12px;font-size:14px;">' +
      '<div style="background:#333;border-radius:8px;height:8px;margin:0 20px 10px;"><div style="background:linear-gradient(90deg,#e65100,#ff8f00);height:100%;border-radius:8px;width:' + progPct + '%;transition:width 0.3s;"></div></div>' +
      '<div style="font-size:13px;color:#aaa;">步驟 ' + (self.step+1) + ' / 5</div>' +
      '<div style="font-size:60px;margin:10px 0;">' + s.emoji + '</div>' +
      '<div style="font-size:20px;font-weight:bold;margin:6px 0;">' + s.name + '</div>' +
      '<div style="font-size:15px;color:#ccc;margin-bottom:14px;">' + s.desc + '</div>' +
      '<div id="beef-area" style="background:#2a2a3e;border-radius:16px;min-height:160px;margin:0 16px;display:flex;align-items:center;justify-content:center;flex-direction:column;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;touch-action:none;position:relative;overflow:hidden;">' +
      self.getStepContent() + '</div>' +
      '<div id="beef-feedback" style="font-size:18px;margin-top:10px;min-height:30px;"></div></div>';
    self.container.innerHTML = html;
    self.bindStep();
  },

  getStepContent: function() {
    var step = this.step;
    if (step === 0) return '<div style="font-size:40px;" id="beef-chop">🔪🥩</div><div id="beef-count" style="color:#ffd700;font-size:22px;margin-top:8px;">0 / 20</div>';
    if (step === 1) return '<div style="font-size:40px;">🥄🫕</div><div id="beef-count" style="color:#ffd700;font-size:22px;margin-top:8px;">0 / 25</div>';
    if (step === 2) return '<div style="width:30px;height:140px;background:#444;border-radius:8px;position:relative;border:2px solid #666;"><div id="beef-boil" style="position:absolute;bottom:0;width:100%;border-radius:0 0 6px 6px;height:0%;background:#ff5722;transition:height 0.2s;"></div><div style="position:absolute;bottom:85%;width:100%;border-top:3px solid #f44336;"></div></div><div style="color:#ff5722;margin-top:8px;font-size:13px;" id="beef-boil-text">火候上升中...</div><div id="beef-count" style="color:#ffd700;font-size:18px;margin-top:4px;">降溫 0 / 3</div>';
    if (step === 3) return '<div style="font-size:50px;" id="beef-noodle">🍝</div><div style="color:#aaa;font-size:13px;margin-top:8px;" id="beef-noodle-text">等待麵條煮熟...</div>';
    if (step === 4) return '<div style="position:relative;width:200px;height:160px;"><div style="font-size:70px;position:absolute;bottom:0;left:50%;transform:translateX(-50%);">🥣</div>' +
      '<div class="beef-topping" onclick="CookBeefGame.dropTopping(0)" style="position:absolute;top:0;left:10px;font-size:35px;cursor:pointer;">🧅</div>' +
      '<div class="beef-topping" onclick="CookBeefGame.dropTopping(1)" style="position:absolute;top:0;left:80px;font-size:35px;cursor:pointer;">🌶️</div>' +
      '<div class="beef-topping" onclick="CookBeefGame.dropTopping(2)" style="position:absolute;top:0;right:10px;font-size:35px;cursor:pointer;">🥬</div></div>' +
      '<div id="beef-count" style="color:#ffd700;font-size:18px;margin-top:8px;">0 / 3</div>';
    return '';
  },

  bindStep: function() {
    var self = this;
    var area = document.getElementById('beef-area');
    if (!area) return;
    var step = self.step;

    if (step === 0) {
      area.addEventListener('click', function() { self.handleChop(); });
    } else if (step === 1) {
      var lastX = 0;
      area.addEventListener('touchmove', function(e) {
        e.preventDefault();
        var dx = Math.abs(e.touches[0].clientX - lastX);
        if (dx > 8) { self.handleStir(); lastX = e.touches[0].clientX; }
      });
      area.addEventListener('mousemove', function(e) {
        if (!self.pressing) return;
        var dx = Math.abs(e.clientX - lastX);
        if (dx > 8) { self.handleStir(); lastX = e.clientX; }
      });
      area.addEventListener('mousedown', function(e) { self.pressing = true; lastX = e.clientX; });
      area.addEventListener('mouseup', function() { self.pressing = false; });
    } else if (step === 2) {
      self.startBoil();
      area.addEventListener('click', function() { self.handleReduceHeat(); });
    } else if (step === 3) {
      self.startNoodleTimer();
      area.addEventListener('click', function() { self.handleNoodleClick(); });
    }
    // step 4 uses inline onclick
  },

  handleChop: function() {
    var self = this;
    if (self.stepDone) return;
    self.tapCount++;
    if (typeof AudioEngine !== 'undefined') AudioEngine.tapButton();
    var el = document.getElementById('beef-count');
    if (el) el.textContent = Math.min(self.tapCount, 20) + ' / 20';
    var chop = document.getElementById('beef-chop');
    if (chop) { chop.style.transform = 'scale(1.2)'; setTimeout(function() { if (chop) chop.style.transform = 'scale(1)'; }, 100); }
    if (self.tapCount >= 20) self.completeStep(85 + Math.floor(Math.random() * 16));
  },

  handleStir: function() {
    var self = this;
    if (self.stepDone) return;
    self.tapCount++;
    var el = document.getElementById('beef-count');
    if (el) el.textContent = Math.min(self.tapCount, 25) + ' / 25';
    if (self.tapCount >= 25) self.completeStep(80 + Math.floor(Math.random() * 21));
  },

  startBoil: function() {
    var self = this;
    self.boilTimer = setInterval(function() {
      if (self.stepDone || (self.game && self.game.paused)) return;
      self.boilLevel = Math.min(100, self.boilLevel + 2);
      var el = document.getElementById('beef-boil');
      if (el) el.style.height = self.boilLevel + '%';
      if (self.boilLevel >= 85) {
        var txt = document.getElementById('beef-boil-text');
        if (txt) { txt.textContent = '⚠️ 快沸騰了！點擊降溫！'; txt.style.color = '#f44336'; }
      }
      if (self.boilLevel >= 100) {
        self.boilLevel = 60;
        // penalty for boiling over
      }
    }, 100);
  },

  handleReduceHeat: function() {
    var self = this;
    if (self.stepDone) return;
    if (self.boilLevel >= 70) {
      self.tapCount++;
      var acc = self.boilLevel >= 80 && self.boilLevel <= 92 ? 100 : 60;
      self.boilLevel = Math.max(0, self.boilLevel - 40);
      var el = document.getElementById('beef-boil');
      if (el) el.style.height = self.boilLevel + '%';
      var cnt = document.getElementById('beef-count');
      if (cnt) cnt.textContent = '降溫 ' + self.tapCount + ' / 3';
      if (typeof AudioEngine !== 'undefined') AudioEngine.tapButton();
      if (self.tapCount >= 3) self.completeStep(acc);
    }
  },

  startNoodleTimer: function() {
    var self = this;
    self.noodleReady = false;
    self.noodleStart = Date.now();
    var target = 2000 + Math.floor(Math.random() * 1500);
    var window_ms = 800;
    var t = setTimeout(function() {
      self.noodleReady = true;
      var noodle = document.getElementById('beef-noodle');
      var txt = document.getElementById('beef-noodle-text');
      if (noodle) noodle.style.filter = 'hue-rotate(40deg)';
      if (txt) { txt.textContent = '🟢 現在！點擊撈麵！'; txt.style.color = '#4caf50'; }
      var t2 = setTimeout(function() {
        if (!self.stepDone) { self.noodleReady = false; if (txt) { txt.textContent = '❌ 太慢了...煮過頭'; txt.style.color = '#f44336'; } self.completeStep(30); }
      }, window_ms);
      self.timers.push(t2);
    }, target);
    self.timers.push(t);
  },

  handleNoodleClick: function() {
    var self = this;
    if (self.stepDone) return;
    if (self.noodleReady) {
      self.completeStep(95 + Math.floor(Math.random() * 6));
    } else {
      var txt = document.getElementById('beef-noodle-text');
      if (txt) { txt.textContent = '還沒熟！再等等...'; txt.style.color = '#ff9800'; }
    }
  },

  dropTopping: function(idx) {
    var self = this;
    if (self.stepDone) return;
    var toppings = document.querySelectorAll('.beef-topping');
    if (toppings[idx]) { toppings[idx].style.opacity = '0.3'; toppings[idx].style.pointerEvents = 'none'; }
    self.tapCount++;
    if (typeof AudioEngine !== 'undefined') AudioEngine.tapButton();
    var el = document.getElementById('beef-count');
    if (el) el.textContent = self.tapCount + ' / 3';
    if (self.tapCount >= 3) self.completeStep(90 + Math.floor(Math.random() * 11));
  },

  completeStep: function(accuracy) {
    var self = this;
    if (self.stepDone) return;
    self.stepDone = true;
    if (self.boilTimer) { clearInterval(self.boilTimer); self.boilTimer = null; }
    var pts = Math.round(accuracy);
    self.score += pts;
    self.game.score = self.score;
    self.game.addScore(pts);
    if (typeof AudioEngine !== 'undefined') AudioEngine.scoreUp();
    var fb = document.getElementById('beef-feedback');
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
    if (typeof AudioEngine !== 'undefined') AudioEngine.roundClear();
    self.container.innerHTML = '<div style="text-align:center;color:white;padding:40px 16px;">' +
      '<div style="font-size:80px;margin-bottom:16px;">🍜</div>' +
      '<div style="font-size:24px;font-weight:bold;color:#ffd700;">牛肉麵完成！</div>' +
      '<div style="font-size:18px;margin-top:10px;">總分: ' + self.score + '</div>' +
      '<div style="font-size:14px;color:#4caf50;margin-top:6px;">完成獎勵 +' + bonus + '</div></div>';
  },

  update: function() {},
  render: function() {},

  cleanup: function() {
    var self = this;
    if (self.boilTimer) clearInterval(self.boilTimer);
    self.timers.forEach(function(t) { clearTimeout(t); });
    self.timers = [];
    var c = document.getElementById('cook-beef-container');
    if (c) c.remove();
    if (self.game && self.game.canvas) self.game.canvas.style.display = 'block';
  }
};
