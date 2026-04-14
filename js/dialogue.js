/* dialogue.js — Visual Novel Dialogue System */

var DialogueScripts = window.DialogueScripts || {};

var Dialogue = (function () {
  var state = {
    script: [],
    index: 0,
    typing: false,
    typingTimer: null,
    charIndex: 0,
    onComplete: null,
    overlay: null,
    active: false,
    typingSound: false
  };

  var MOOD_COLORS = {
    normal: '#8888cc',
    happy: '#ffcc44',
    angry: '#ff4444',
    thinking: '#44aaff',
    excited: '#ff66cc'
  };

  var NAME_COLORS = {};
  var COLOR_POOL = ['#ffcc66', '#66ddff', '#ff8866', '#88ee88', '#dd88ff', '#ff88aa', '#88ccff'];
  var colorIdx = 0;

  function getNameColor(name) {
    if (!NAME_COLORS[name]) {
      NAME_COLORS[name] = COLOR_POOL[colorIdx % COLOR_POOL.length];
      colorIdx++;
    }
    return NAME_COLORS[name];
  }

  function injectCSS() {
    if (document.getElementById('dialogue-css')) return;
    var style = document.createElement('style');
    style.id = 'dialogue-css';
    style.textContent = [
      '@keyframes dlgFadeIn{from{opacity:0}to{opacity:1}}',
      '@keyframes dlgSlideUp{from{transform:translateY(40px);opacity:0}to{transform:translateY(0);opacity:1}}',
      '@keyframes dlgBlink{0%,100%{opacity:1}50%{opacity:0}}',
      '@keyframes dlgGlow{0%,100%{box-shadow:0 0 8px var(--glow)}50%{box-shadow:0 0 18px var(--glow)}}',
      '.dlg-overlay{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.6);animation:dlgFadeIn .3s ease}',
      '.dlg-box{position:absolute;bottom:0;left:0;right:0;height:220px;background:linear-gradient(180deg,#1a1a2e,#2a2a4e);',
      '  border-top:2px solid rgba(255,255,255,0.15);padding:18px 20px 14px;display:flex;gap:16px;',
      '  animation:dlgSlideUp .35s ease;box-sizing:border-box}',
      '.dlg-avatar{width:64px;height:64px;border-radius:50%;display:flex;align-items:center;justify-content:center;',
      '  font-size:36px;flex-shrink:0;animation:dlgGlow 2s ease-in-out infinite;border:2px solid rgba(255,255,255,0.2)}',
      '.dlg-content{flex:1;min-width:0;display:flex;flex-direction:column}',
      '.dlg-name{font-weight:bold;font-size:14px;margin-bottom:6px;text-shadow:0 1px 4px rgba(0,0,0,0.5)}',
      '.dlg-text{font-size:15px;color:#fff;line-height:1.6;flex:1;overflow-y:auto;word-break:break-word}',
      '.dlg-indicator{position:absolute;bottom:12px;right:20px;color:rgba(255,255,255,0.7);font-size:18px;',
      '  animation:dlgBlink 1s step-end infinite;display:none}',
      '.dlg-skip{position:absolute;top:12px;right:16px;background:rgba(255,255,255,0.15);color:#fff;border:none;',
      '  border-radius:20px;padding:8px 18px;font-size:13px;cursor:pointer;z-index:10001;backdrop-filter:blur(4px)}',
      '.dlg-skip:active{background:rgba(255,255,255,0.3)}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function buildDOM() {
    injectCSS();
    var overlay = document.createElement('div');
    overlay.className = 'dlg-overlay';

    var skip = document.createElement('button');
    skip.className = 'dlg-skip';
    skip.textContent = 'Skip ▶▶';
    skip.addEventListener('click', function (e) { e.stopPropagation(); Dialogue.skip(); });

    var box = document.createElement('div');
    box.className = 'dlg-box';

    var avatar = document.createElement('div');
    avatar.className = 'dlg-avatar';

    var content = document.createElement('div');
    content.className = 'dlg-content';

    var name = document.createElement('div');
    name.className = 'dlg-name';

    var text = document.createElement('div');
    text.className = 'dlg-text';

    var indicator = document.createElement('div');
    indicator.className = 'dlg-indicator';
    indicator.textContent = '▼';

    content.appendChild(name);
    content.appendChild(text);
    box.appendChild(avatar);
    box.appendChild(content);
    box.appendChild(indicator);
    overlay.appendChild(skip);
    overlay.appendChild(box);

    overlay._avatar = avatar;
    overlay._name = name;
    overlay._text = text;
    overlay._indicator = indicator;

    overlay.addEventListener('click', function () { Dialogue.next(); });
    document.body.appendChild(overlay);
    return overlay;
  }

  function playTapSound() {
    if (typeof AudioEngine !== 'undefined' && AudioEngine.tapButton) {
      try { AudioEngine.tapButton(); } catch (e) { /* silent */ }
    }
  }

  function renderEntry(entry) {
    var o = state.overlay;
    var mood = entry.mood || 'normal';
    var glowColor = MOOD_COLORS[mood] || MOOD_COLORS.normal;

    o._avatar.textContent = entry.avatar || '💬';
    o._avatar.style.setProperty('--glow', glowColor);
    o._avatar.style.background = 'radial-gradient(circle,' + glowColor + '22,' + glowColor + '08)';
    o._name.textContent = entry.char || '';
    o._name.style.color = getNameColor(entry.char || 'unknown');
    o._text.textContent = '';
    o._indicator.style.display = 'none';

    startTyping(entry.text || '');
  }

  function startTyping(fullText) {
    state.typing = true;
    state.charIndex = 0;
    var soundCounter = 0;

    clearInterval(state.typingTimer);
    state.typingTimer = setInterval(function () {
      if (state.charIndex >= fullText.length) {
        finishTyping();
        return;
      }
      state.charIndex++;
      state.overlay._text.textContent = fullText.substring(0, state.charIndex);

      if (state.typingSound && soundCounter % 4 === 0) playTapSound();
      soundCounter++;
    }, 30);
  }

  function finishTyping() {
    clearInterval(state.typingTimer);
    state.typing = false;
    var entry = state.script[state.index];
    if (entry) state.overlay._text.textContent = entry.text || '';
    state.overlay._indicator.style.display = 'block';
  }

  function advance() {
    playTapSound();
    state.index++;
    if (state.index >= state.script.length) {
      close(true);
      return;
    }
    renderEntry(state.script[state.index]);
  }

  function close(completed) {
    clearInterval(state.typingTimer);
    if (state.overlay) {
      state.overlay.style.animation = 'dlgFadeIn .25s ease reverse forwards';
      var el = state.overlay;
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 260);
    }
    var cb = state.onComplete;
    state.overlay = null;
    state.active = false;
    state.script = [];
    state.index = 0;
    if (completed && typeof cb === 'function') cb();
  }

  return {
    show: function (script, onComplete) {
      if (state.active) close(false);
      state.script = script || [];
      state.index = 0;
      state.onComplete = onComplete || null;
      state.active = true;
      state.overlay = buildDOM();
      if (state.script.length > 0) renderEntry(state.script[0]);
    },

    next: function () {
      if (!state.active) return;
      if (state.typing) {
        finishTyping();
      } else {
        advance();
      }
    },

    skip: function () {
      if (!state.active) return;
      clearInterval(state.typingTimer);
      state.index = state.script.length;
      close(true);
    },

    close: function () {
      if (!state.active) return;
      close(false);
    },

    setTypingSound: function (enabled) {
      state.typingSound = !!enabled;
    }
  };
})();

window.Dialogue = Dialogue;
window.DialogueScripts = DialogueScripts;
