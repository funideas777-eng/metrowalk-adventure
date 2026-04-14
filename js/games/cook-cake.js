window.CookCakeGame = {
  step: 0, score: 0, tapCount: 0, gauge: 0, timers: [], container: null,
  stepDone: false, pressing: false, ovenTemp: 0,

  STEPS: [
    { name: '揉麵團', emoji: '🫳', desc: '快速點擊揉麵團！', goal: 30 },
    { name: '包餡', emoji: '🍍', desc: '按住把鳳梨餡放入麵團', goal: 1 },
    { name: '壓模', emoji: '🔲', desc: '在正確時機點擊壓模！', goal: 3 },
    { name: '烤箱', emoji: '🔥', desc: '控制溫度在金黃區域', goal: 1 },
    { name: '裝飾', emoji: '✨', desc: '搖晃撒上糖粉！快速點擊', goal: 20 }
  ],

  init: function(game) {
    var self = this;
    self.game = game; self.step = 0; self.score = 0;
    self.tapCount = 0; self.gauge = 0; self.timers = [];
    self.stepDone = false; self.ovenTemp = 0;
    game.canvas.style.display = 'none';
    var c = document.getElementById('cook-cake-container');
    if (!c) { c = document.createElement('div'); c.id = 'cook-cake-container'; game.canvas.parentElement.appendChild(c); }
    self.container = c;
    self.container.style.cssText = 'width:100%;background:#1a1a2e;min-height:300px;';
    self.renderStep();
  },

  renderStep: function() {
    var self = this;
    var s = self.STEPS[self.step];
    self.tapCount = 0; self.gauge = 0; self.stepDone = false; self.pressing = false; self.ovenTemp = 50;
    var progPct = ((self.step) / 5 * 100);
    var html = '<div style="text-align:center;color:white;padding:12px;font-size:14px;">' +
      '<div style="background:#333;border-radius:8px;height:8px;margin:0 20px 10px;"><div style="background:linear-gradient(90deg,#ffc107,#ff8f00);height:100%;border-radius:8px;width:' + progPct + '%;transition:width 0.3s;"></div></div>' +
      '<div style="font-size:13px;color:#aaa;">步驟 ' + (self.step+1) + ' / 5</div>' +
      '<div style="font-size:60px;margin:10px 0;">' + s.emoji + '</div>' +
      '<div style="font-size:20px;font-weight:bold;margin:6px 0;">' + s.name + '</div>' +
      '<div style="font-size:15px;color:#ccc;margin-bottom:14px;">' + s.desc + '</div>' +
      '<div id="cake-area" style="background:#2a2a3e;border-radius:16px;min-height:160px;margin:0 16px;display:flex;align-items:center;justify-content:center;flex-direction:column;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;touch-action:none;position:relative;overflow:hidden;">' +
      self.getStepContent() + '</div>' +
      '<div id="cake-feedback" style="font-size:18px;margin-top:10px;min-height:30px;"></div></div>';
    self.container.innerHTML = html;
    self.bindStep();
  },

  getStepContent: function() {
    var step = this.step;
    if (step === 0) return '<div style="font-size:50px;" id="cake-dough">🫳🥖</div><div id="cake-count" style="color:#ffd700;font-size:22px;margin-top:8px;">0 / 30</div>';
    if (step === 1) return '<div style="font-size:40px;">🍍➡️🫓</div><div style="width:80%;height:24px;background:#444;border-radius:12px;margin-top:10px;position:relative;"><div id="cake-fill" style="height:100%;border-radius:12px;width:0%;background:#ffc107;transition:width 0.1s;"></div><div style="position:absolute;left:55%;width:20%;height:100%;border:2px solid #4caf50;border-radius:4px;top:0;box-sizing:border-box;pointer-events:none;"></div></div><div style="color:#aaa;margin-top:8px;font-size:13px;">按住放入餡料</div>';
    if (step === 2) return '<div style="font-size:50px;" id="cake-mold">🔲</div><div id="cake-mold-ring" style="width:80px;height:80px;border:4px solid #666;border-radius:8px;display:flex;align-items:center;justify-content:center;margin-top:8px;transition:border-color 0.3s;"><div style="font-size:30px;">🫓</div></div><div id="cake-count" style="color:#aaa;font-size:14px;margin-top:8px;">等待時機...</div>';
    if (step === 3) return '<div style="display:flex;align-items:center;gap:16px;"><div style="width:30px;height:140px;background:#444;border-radius:8px;position:relative;border:2px solid #666;"><div id="cake-temp" style="position:absolute;bottom:0;width:100%;border-radius:0 0 6px 6px;height:50%;background:#ff9800;transition:height 0.2s;"></div><div style="position:absolute;bottom:60%;width:100%;border-top:2px solid #4caf50;"></div><div style="position:absolute;bottom:75%;width:100%;border-top:2px solid #4caf50;"></div><div style="position:absolute;bottom:85%;width:100%;border-top:2px dashed #f44336;"></div></div><div><div style="font-size:50px;" id="cake-oven">🍪</div><div id="cake-color" style="color:#aaa;font-size:14px;margin-top:6px;">溫度: 50°</div></div></div><div style="color:#aaa;margin-top:8px;font-size:13px;">點擊調整溫度，金黃時按確定</div><div onclick="CookCakeGame.confirmOven()" style="margin-top:8px;padding:8px 24px;background:#4caf50;color:white;border-radius:8px;cursor:pointer;font-size:16px;">確定！</div>';
    if (step === 4) return '<div style="font-size:50px;" id="cake-sugar">✨🧁</div><div id="cake-count" style="color:#ffd700;font-size:22px;margin-top:8px;">0 / 20</div>';
    return '';
  },

  bindStep: function() {
    var self = this;
    var area = document.getElementById('cake-area');
    if (!area) return;
    var step = self.step;

    if (step === 0 || step === 4) {
      area.addEventListener('click', function() { self.handleTap(); });
    } else if (step === 1) {
      var interval = null;
      area.addEventListener('touchstart', function(e) { e.preventDefault(); self.pressing = true; interval = setInterval(function() { self.handleFill(); }, 50); });
      area.addEventListener('touchend', function() { self.pressing = false; clearInterval(interval); self.handleFillRelease(); });
      area.addEventListener('mousedown', function() { self.pressing = true; interval = setInterval(function() { self.handleFill(); }, 50); });
      area.addEventListener('mouseup', function() { self.pressing = false; clearInterval(interval); self.handleFillRelease(); });
    } else if (step === 2) {
      self.startMoldTimer();
      area.addEventListener('click', function() { self.handleMoldPress(); });
    } else if (step === 3) {
      self.startOvenSim();
      area.addEventListener('click', function(e) {
        if (e.target.tagName !== 'DIV' || e.target.textContent === '確定！') return;
        self.adjustTemp();
      });
    }
  },

  handleTap: function() {
    var self = this;
    if (self.stepDone) return;
    self.tapCount++;
    if (typeof AudioEngine !== 'undefined') AudioEngine.tapButton();
    var goal = self.STEPS[self.step].goal;
    var el = document.getElementById('cake-count');
    if (el) el.textContent = Math.min(self.tapCount, goal) + ' / ' + goal;
    if (self.step === 0) {
      var dough = document.getElementById('cake-dough');
      if (dough) { dough.style.transform = 'scale(' + (1 + Math.sin(self.tapCount * 0.3) * 0.15) + ')'; }
    }
    if (self.step === 4) {
      var sugar = document.getElementById('cake-sugar');
      if (sugar) { sugar.style.transform = 'rotate(' + (self.tapCount * 8) + 'deg)'; }
    }
    if (self.tapCount >= goal) self.completeStep(85 + Math.floor(Math.random() * 16));
  },

  handleFill: function() {
    var self = this;
    if (self.stepDone) return;
    self.gauge = Math.min(100, self.gauge + 1.5);
    var el = document.getElementById('cake-fill');
    if (el) {
      var color = (self.gauge >= 55 && self.gauge <= 75) ? '#4caf50' : (self.gauge > 75 ? '#f44336' : '#ffc107');
      el.style.width = self.gauge + '%'; el.style.background = color;
    }
  },

  handleFillRelease: function() {
    var self = this;
    if (self.stepDone) return;
    var acc = (self.gauge >= 55 && self.gauge <= 75) ? 100 : (self.gauge >= 40 && self.gauge <= 85) ? 70 : 40;
    self.completeStep(acc);
  },

  startMoldTimer: function() {
    var self = this;
    self.moldReady = false;
    self.moldCount = 0;

    var cycle = function() {
      if (self.stepDone) return;
      self.moldReady = false;
      var ring = document.getElementById('cake-mold-ring');
      var txt = document.getElementById('cake-count');
      if (ring) ring.style.borderColor = '#666';
      if (txt) txt.textContent = '等待時機... (' + self.moldCount + '/3)';

      var delay = 800 + Math.floor(Math.random() * 1200);
      var t1 = setTimeout(function() {
        if (self.stepDone) return;
        self.moldReady = true;
        if (ring) ring.style.borderColor = '#4caf50';
        if (txt) { txt.textContent = '🟢 現在！壓下去！'; txt.style.color = '#4caf50'; }
        var t2 = setTimeout(function() {
          if (!self.stepDone && self.moldReady) {
            self.moldReady = false;
            if (ring) ring.style.borderColor = '#f44336';
            if (txt) { txt.textContent = '太慢了...'; txt.style.color = '#f44336'; }
            var t3 = setTimeout(cycle, 600);
            self.timers.push(t3);
          }
        }, 700);
        self.timers.push(t2);
      }, delay);
      self.timers.push(t1);
    };
    cycle();
  },

  handleMoldPress: function() {
    var self = this;
    if (self.stepDone) return;
    if (self.moldReady) {
      self.moldReady = false;
      self.moldCount++;
      if (typeof AudioEngine !== 'undefined') AudioEngine.tapButton();
      var ring = document.getElementById('cake-mold-ring');
      if (ring) { ring.style.borderColor = '#ffd700'; ring.style.transform = 'scale(0.9)'; setTimeout(function() { if (ring) ring.style.transform = 'scale(1)'; }, 150); }
      if (self.moldCount >= 3) self.completeStep(95 + Math.floor(Math.random() * 6));
      else {
        var txt = document.getElementById('cake-count');
        if (txt) txt.textContent = '好！(' + self.moldCount + '/3)';
        var t = setTimeout(function() { self.startMoldTimer(); }, 500);
        self.timers.push(t);
      }
    }
  },

  startOvenSim: function() {
    var self = this;
    self.ovenTemp = 50;
    self.ovenDir = 1;
    self.ovenInterval = setInterval(function() {
      if (self.stepDone || (self.game && self.game.paused)) return;
      self.ovenTemp += self.ovenDir * (0.5 + Math.random() * 0.5);
      if (self.ovenTemp > 95) self.ovenDir = -1;
      if (self.ovenTemp < 30) self.ovenDir = 1;
      var el = document.getElementById('cake-temp');
      if (el) el.style.height = self.ovenTemp + '%';
      var txt = document.getElementById('cake-color');
      var emoji = document.getElementById('cake-oven');
      if (self.ovenTemp >= 60 && self.ovenTemp <= 75) {
        if (txt) txt.textContent = '🟢 金黃色！(' + Math.round(self.ovenTemp * 2.5) + '°)';
        if (emoji) emoji.textContent = '🟡';
      } else if (self.ovenTemp > 75) {
        if (txt) txt.textContent = '🔴 太焦了！(' + Math.round(self.ovenTemp * 2.5) + '°)';
        if (emoji) emoji.textContent = '🟤';
      } else {
        if (txt) txt.textContent = '溫度: ' + Math.round(self.ovenTemp * 2.5) + '°';
        if (emoji) emoji.textContent = '🍪';
      }
    }, 100);
    self.timers.push(self.ovenInterval);
  },

  adjustTemp: function() {
    var self = this;
    if (self.stepDone) return;
    self.ovenDir *= -1;
    self.ovenTemp = Math.max(30, Math.min(95, self.ovenTemp - 10));
  },

  confirmOven: function() {
    var self = this;
    if (self.stepDone) return;
    if (self.ovenInterval) clearInterval(self.ovenInterval);
    var acc = (self.ovenTemp >= 60 && self.ovenTemp <= 75) ? 100 : (self.ovenTemp >= 50 && self.ovenTemp <= 80) ? 70 : 35;
    if (self.ovenTemp >= 60 && self.ovenTemp <= 75) acc += 0; // golden bonus already at 100
    self.completeStep(acc);
  },

  completeStep: function(accuracy) {
    var self = this;
    if (self.stepDone) return;
    self.stepDone = true;
    if (self.ovenInterval && self.step === 3) clearInterval(self.ovenInterval);
    var pts = Math.round(accuracy);
    self.score += pts;
    self.game.score = self.score;
    self.game.addScore(pts);
    if (typeof AudioEngine !== 'undefined') AudioEngine.scoreUp();
    var fb = document.getElementById('cake-feedback');
    var color = accuracy >= 90 ? '#4caf50' : accuracy >= 60 ? '#ffd700' : '#f44336';
    var label = accuracy >= 90 ? '完美！' : accuracy >= 60 ? '不錯！' : '加油！';
    if (self.step === 4 && accuracy >= 90) label = '金黃酥脆！';
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
      '<div style="font-size:80px;margin-bottom:16px;">🧁</div>' +
      '<div style="font-size:24px;font-weight:bold;color:#ffd700;">鳳梨酥完成！</div>' +
      '<div style="font-size:18px;margin-top:10px;">總分: ' + self.score + '</div>' +
      '<div style="font-size:14px;color:#4caf50;margin-top:6px;">完成獎勵 +' + bonus + '</div></div>';
  },

  update: function() {},
  render: function() {},

  cleanup: function() {
    var self = this;
    if (self.ovenInterval) clearInterval(self.ovenInterval);
    self.timers.forEach(function(t) { clearTimeout(t); clearInterval(t); });
    self.timers = [];
    var c = document.getElementById('cook-cake-container');
    if (c) c.remove();
    if (self.game && self.game.canvas) self.game.canvas.style.display = 'block';
  }
};
