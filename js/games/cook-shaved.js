window.CookShavedGame = {
  step: 0, score: 0, tapCount: 0, gauge: 0, timers: [], container: null,
  stepDone: false, pressing: false,

  STEPS: [
    { name: '刨冰', emoji: '🧊', desc: '快速滑動刨冰！', goal: 25 },
    { name: '堆冰山', emoji: '⛰️', desc: '點擊堆疊冰層', goal: 5 },
    { name: '切芒果', emoji: '🥭', desc: '芒果亮起時點擊切片！', goal: 4 },
    { name: '淋醬', emoji: '🍯', desc: '按住淋上煉乳到正確量', goal: 1 },
    { name: '擺盤', emoji: '🍨', desc: '把配料放到正確位置', goal: 4 }
  ],

  init: function(game) {
    var self = this;
    self.game = game; self.step = 0; self.score = 0;
    self.tapCount = 0; self.gauge = 0; self.timers = [];
    self.stepDone = false;
    game.canvas.style.display = 'none';
    var c = document.getElementById('cook-shaved-container');
    if (!c) { c = document.createElement('div'); c.id = 'cook-shaved-container'; game.canvas.parentElement.appendChild(c); }
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
      '<div style="background:#333;border-radius:8px;height:8px;margin:0 20px 10px;"><div style="background:linear-gradient(90deg,#ffcc02,#ff6b35);height:100%;border-radius:8px;width:' + progPct + '%;transition:width 0.3s;"></div></div>' +
      '<div style="font-size:13px;color:#aaa;">步驟 ' + (self.step+1) + ' / 5</div>' +
      '<div style="font-size:60px;margin:10px 0;">' + s.emoji + '</div>' +
      '<div style="font-size:20px;font-weight:bold;margin:6px 0;">' + s.name + '</div>' +
      '<div style="font-size:15px;color:#ccc;margin-bottom:14px;">' + s.desc + '</div>' +
      '<div id="shaved-area" style="background:#2a2a3e;border-radius:16px;min-height:160px;margin:0 16px;display:flex;align-items:center;justify-content:center;flex-direction:column;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;touch-action:none;position:relative;overflow:hidden;">' +
      self.getStepContent() + '</div>' +
      '<div id="shaved-feedback" style="font-size:18px;margin-top:10px;min-height:30px;"></div></div>';
    self.container.innerHTML = html;
    self.bindStep();
  },

  getStepContent: function() {
    var step = this.step;
    if (step === 0) return '<div style="font-size:45px;">🧊🔪</div><div style="width:80%;height:16px;background:#444;border-radius:8px;margin-top:10px;"><div id="shaved-bar" style="height:100%;border-radius:8px;width:0%;background:#81d4fa;transition:width 0.1s;"></div></div><div id="shaved-count" style="color:#ffd700;font-size:18px;margin-top:8px;">0 / 25</div>';
    if (step === 1) {
      var layers = '';
      for (var i = 0; i < 5; i++) {
        layers += '<div id="ice-layer-' + i + '" style="width:' + (120 - i * 15) + 'px;height:18px;background:#444;border-radius:6px;margin:2px auto;transition:background 0.3s;"></div>';
      }
      return '<div style="width:140px;">' + layers + '</div><div id="shaved-count" style="color:#ffd700;font-size:18px;margin-top:8px;">0 / 5</div>';
    }
    if (step === 2) return '<div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;" id="mango-slices"></div><div id="shaved-count" style="color:#ffd700;font-size:18px;margin-top:10px;">等待芒果...</div>';
    if (step === 3) return '<div style="font-size:40px;">🍯</div><div style="width:80%;height:24px;background:#444;border-radius:12px;margin-top:10px;position:relative;"><div id="shaved-pour" style="height:100%;border-radius:12px;width:0%;background:#ffcc02;transition:width 0.1s;"></div><div style="position:absolute;left:55%;width:20%;height:100%;border:2px solid #4caf50;border-radius:4px;top:0;box-sizing:border-box;pointer-events:none;"></div></div><div style="color:#aaa;margin-top:8px;font-size:13px;">按住倒醬</div>';
    if (step === 4) return '<div style="position:relative;width:240px;height:160px;">' +
      '<div style="font-size:70px;position:absolute;bottom:0;left:50%;transform:translateX(-50%);">🍧</div>' +
      '<div class="shaved-top" onclick="CookShavedGame.placeTopping(0)" style="position:absolute;top:0;left:5px;font-size:30px;cursor:pointer;padding:4px;">🥭</div>' +
      '<div class="shaved-top" onclick="CookShavedGame.placeTopping(1)" style="position:absolute;top:0;left:65px;font-size:30px;cursor:pointer;padding:4px;">🍡</div>' +
      '<div class="shaved-top" onclick="CookShavedGame.placeTopping(2)" style="position:absolute;top:0;right:65px;font-size:30px;cursor:pointer;padding:4px;">🫘</div>' +
      '<div class="shaved-top" onclick="CookShavedGame.placeTopping(3)" style="position:absolute;top:0;right:5px;font-size:30px;cursor:pointer;padding:4px;">🍃</div></div>' +
      '<div id="shaved-count" style="color:#ffd700;font-size:18px;margin-top:8px;">0 / 4</div>';
    return '';
  },

  bindStep: function() {
    var self = this;
    var area = document.getElementById('shaved-area');
    if (!area) return;
    var step = self.step;

    if (step === 0) {
      var lastX = 0;
      area.addEventListener('touchmove', function(e) {
        e.preventDefault();
        if (Math.abs(e.touches[0].clientX - lastX) > 8) { self.handleShave(); lastX = e.touches[0].clientX; }
      });
      area.addEventListener('mousemove', function(e) {
        if (!self.pressing) return;
        if (Math.abs(e.clientX - lastX) > 8) { self.handleShave(); lastX = e.clientX; }
      });
      area.addEventListener('mousedown', function(e) { self.pressing = true; lastX = e.clientX; });
      area.addEventListener('mouseup', function() { self.pressing = false; });
    } else if (step === 1) {
      area.addEventListener('click', function() { self.handleStack(); });
    } else if (step === 2) {
      self.startMangoSlicing();
    } else if (step === 3) {
      var interval = null;
      area.addEventListener('touchstart', function(e) { e.preventDefault(); self.pressing = true; interval = setInterval(function() { self.handlePour(); }, 50); });
      area.addEventListener('touchend', function() { self.pressing = false; clearInterval(interval); self.handlePourRelease(); });
      area.addEventListener('mousedown', function() { self.pressing = true; interval = setInterval(function() { self.handlePour(); }, 50); });
      area.addEventListener('mouseup', function() { self.pressing = false; clearInterval(interval); self.handlePourRelease(); });
    }
  },

  handleShave: function() {
    var self = this;
    if (self.stepDone) return;
    self.tapCount++;
    var bar = document.getElementById('shaved-bar');
    var pct = Math.min(100, (self.tapCount / 25) * 100);
    if (bar) bar.style.width = pct + '%';
    var el = document.getElementById('shaved-count');
    if (el) el.textContent = Math.min(self.tapCount, 25) + ' / 25';
    if (self.tapCount >= 25) self.completeStep(85 + Math.floor(Math.random() * 16));
  },

  handleStack: function() {
    var self = this;
    if (self.stepDone) return;
    self.tapCount++;
    if (typeof AudioEngine !== 'undefined') AudioEngine.tapButton();
    var layer = document.getElementById('ice-layer-' + (self.tapCount - 1));
    if (layer) layer.style.background = 'linear-gradient(180deg,#e3f2fd,#bbdefb)';
    var el = document.getElementById('shaved-count');
    if (el) el.textContent = Math.min(self.tapCount, 5) + ' / 5';
    if (self.tapCount >= 5) self.completeStep(90 + Math.floor(Math.random() * 11));
  },

  startMangoSlicing: function() {
    var self = this;
    self.mangoHit = 0;
    var sliceArea = document.getElementById('mango-slices');
    var cnt = document.getElementById('shaved-count');
    var round = 0;

    var spawnMango = function() {
      if (self.stepDone || round >= 4) return;
      round++;
      if (cnt) cnt.textContent = '切！(' + self.mangoHit + ' / 4)';
      if (!sliceArea) return;
      sliceArea.innerHTML = '';
      var count = 2 + Math.floor(Math.random() * 2);
      var correctIdx = Math.floor(Math.random() * count);
      for (var i = 0; i < count; i++) {
        var btn = document.createElement('div');
        btn.style.cssText = 'font-size:40px;padding:10px;cursor:pointer;border-radius:12px;transition:background 0.2s;';
        btn.textContent = '🥭';
        if (i === correctIdx) {
          btn.style.background = '#fff9c4';
          btn.dataset.correct = '1';
        }
        btn.addEventListener('click', (function(isCorrect) {
          return function() {
            if (self.stepDone) return;
            if (isCorrect) {
              self.mangoHit++;
              if (typeof AudioEngine !== 'undefined') AudioEngine.tapButton();
              if (self.mangoHit >= 4) { self.completeStep(90 + Math.floor(Math.random() * 11)); }
              else { var t = setTimeout(spawnMango, 500); self.timers.push(t); }
            } else {
              if (cnt) cnt.textContent = '切錯了！';
              var t = setTimeout(spawnMango, 800); self.timers.push(t);
            }
          };
        })(i === correctIdx));
        sliceArea.appendChild(btn);
      }
      var t = setTimeout(function() { if (!self.stepDone && sliceArea) { sliceArea.innerHTML = '<div style="color:#f44336;">太慢了！</div>'; var t2 = setTimeout(spawnMango, 500); self.timers.push(t2); } }, 2000);
      self.timers.push(t);
    };
    var t = setTimeout(spawnMango, 500);
    self.timers.push(t);
  },

  handlePour: function() {
    var self = this;
    if (self.stepDone) return;
    self.gauge = Math.min(100, self.gauge + 1.5);
    var el = document.getElementById('shaved-pour');
    if (el) {
      var color = (self.gauge >= 55 && self.gauge <= 75) ? '#4caf50' : (self.gauge > 75 ? '#f44336' : '#ffcc02');
      el.style.width = self.gauge + '%'; el.style.background = color;
    }
  },

  handlePourRelease: function() {
    var self = this;
    if (self.stepDone) return;
    var acc = (self.gauge >= 55 && self.gauge <= 75) ? 100 : (self.gauge >= 45 && self.gauge <= 85) ? 70 : 40;
    self.completeStep(acc);
  },

  placeTopping: function(idx) {
    var self = this;
    if (self.stepDone) return;
    var tops = document.querySelectorAll('.shaved-top');
    if (tops[idx]) { tops[idx].style.opacity = '0.3'; tops[idx].style.pointerEvents = 'none'; }
    self.tapCount++;
    if (typeof AudioEngine !== 'undefined') AudioEngine.tapButton();
    var el = document.getElementById('shaved-count');
    if (el) el.textContent = self.tapCount + ' / 4';
    if (self.tapCount >= 4) self.completeStep(90 + Math.floor(Math.random() * 11));
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
    var fb = document.getElementById('shaved-feedback');
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
      '<div style="font-size:80px;margin-bottom:16px;">🍧</div>' +
      '<div style="font-size:24px;font-weight:bold;color:#ffd700;">芒果冰完成！</div>' +
      '<div style="font-size:18px;margin-top:10px;">總分: ' + self.score + '</div>' +
      '<div style="font-size:14px;color:#4caf50;margin-top:6px;">完成獎勵 +' + bonus + '</div></div>';
  },

  update: function() {},
  render: function() {},

  cleanup: function() {
    var self = this;
    self.timers.forEach(function(t) { clearTimeout(t); clearInterval(t); });
    self.timers = [];
    var c = document.getElementById('cook-shaved-container');
    if (c) c.remove();
    if (self.game && self.game.canvas) self.game.canvas.style.display = 'block';
  }
};
