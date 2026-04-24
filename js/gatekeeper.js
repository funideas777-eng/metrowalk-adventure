// ============================================================
// Gatekeeper 關主驗證模組
// 流程：
//   1. 點擊遊戲 → check(gameId)
//   2. 若後端回報 required=true 且 unlocked=false → 彈出關主對話 + 照片 + 輸入框
//   3. 成功 → 寫入 localStorage + 進入遊戲
//   4. 已解鎖 → 直接進入遊戲（僅顯示關主短引導）
// 安全：
//   - 答案明文只經 HTTPS POST，不落本地
//   - 輸入框 autocomplete=off、type=text（搭配 spellcheck=false）
//   - 解鎖狀態 localStorage + 後端 KV 雙存（KV 為真實來源）
// ============================================================
window.Gatekeeper = {
  _unlockKey: 'locationUnlocks',

  // 讀本地解鎖記錄
  _getLocal() {
    try { return JSON.parse(localStorage.getItem(this._unlockKey) || '{}'); }
    catch(e) { return {}; }
  },
  _setLocal(gameId) {
    var d = this._getLocal(); d[gameId] = 1;
    try { localStorage.setItem(this._unlockKey, JSON.stringify(d)); } catch(e) {}
  },

  // 對外主要入口：若未解鎖會顯示關主對話；成功或已解鎖時 callback
  async guard(gameId, onPass, onCancel) {
    var session = Auth.getSession();
    if (!session) { if (onCancel) onCancel(); return; }
    // 快速路徑：localStorage 已標記 → 直接通過
    if (this._getLocal()[gameId]) { if (onPass) onPass(); return; }
    // 向後端拿 hint + 解鎖狀態
    var data;
    try {
      data = await API.get('getLocationHint_' + gameId + '_' + session.playerId, {
        action: 'getLocationHint', gameId: gameId, playerId: session.playerId
      }, 0);
    } catch(e) {
      // 後端失敗：為避免玩家卡關，允許通過但不寫入 localStorage
      console.warn('Gatekeeper backend failed', e); if (onPass) onPass(); return;
    }
    if (!data || data.required === false) { if (onPass) onPass(); return; }
    if (data.unlocked) { this._setLocal(gameId); if (onPass) onPass(); return; }
    // 顯示關主對話
    this._showModal(gameId, data, onPass, onCancel);
  },

  _showModal(gameId, data, onPass, onCancel) {
    var self = this;
    // 移除舊 modal
    var old = document.getElementById('gk-modal'); if (old) old.remove();
    var m = document.createElement('div');
    m.id = 'gk-modal';
    m.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(6px);';
    var photo = data.photoUrl
      ? '<img src="' + data.photoUrl + '" alt="關主提示" style="width:100%;max-height:38vh;object-fit:contain;border-radius:12px;background:#111;margin-bottom:12px;" draggable="false" oncontextmenu="return false;">'
      : '<div style="background:#222;color:#888;padding:40px;border-radius:12px;text-align:center;margin-bottom:12px;">（尚未設定照片）</div>';
    m.innerHTML = '' +
      '<div style="background:#0f0f23;border:1px solid rgba(0,188,212,0.3);border-radius:20px;padding:20px;max-width:420px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.6);max-height:90vh;overflow-y:auto;">' +
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">' +
          '<div style="font-size:32px;">' + (data.keeperAvatar || '🧙') + '</div>' +
          '<div><div style="color:#00bcd4;font-weight:800;font-size:15px;">' + (data.keeperName || '關主') + '</div>' +
          '<div style="color:#aaa;font-size:11px;">找到照片中的答案即可挑戰</div></div>' +
        '</div>' +
        photo +
        '<div style="background:rgba(0,188,212,0.08);border-left:3px solid #00bcd4;padding:10px 12px;border-radius:6px;color:#eee;font-size:14px;line-height:1.6;margin-bottom:14px;">' + (data.hint || '').replace(/</g,'&lt;') + '</div>' +
        '<div style="margin-bottom:8px;color:#aaa;font-size:12px;">輸入照片中被馬賽克遮住的資訊：</div>' +
        '<input id="gk-input" type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" inputmode="text" class="input" placeholder="請輸入答案" style="width:100%;font-size:16px;" maxlength="50">' +
        '<div id="gk-msg" style="min-height:20px;margin:8px 0;font-size:13px;text-align:center;"></div>' +
        '<div style="display:flex;gap:8px;">' +
          '<button id="gk-cancel" class="btn btn-outline btn-sm" style="flex:1;">取消</button>' +
          '<button id="gk-submit" class="btn btn-primary btn-sm" style="flex:2;">✅ 驗證</button>' +
        '</div>' +
        '<div style="color:#666;font-size:10px;text-align:center;margin-top:10px;">🔒 答案經 HTTPS 加密傳輸，僅後端驗證</div>' +
      '</div>';
    document.body.appendChild(m);
    var input = document.getElementById('gk-input');
    var msg = document.getElementById('gk-msg');
    setTimeout(function() { if (input) input.focus(); }, 100);
    document.getElementById('gk-cancel').onclick = function() {
      m.remove(); if (onCancel) onCancel();
    };
    var submitting = false;
    var doSubmit = async function() {
      if (submitting) return;
      var val = (input.value || '').trim();
      if (!val) { msg.innerHTML = '<span style="color:#ff9800;">請輸入答案</span>'; return; }
      submitting = true;
      msg.innerHTML = '<span style="color:#aaa;">驗證中...</span>';
      document.getElementById('gk-submit').disabled = true;
      try {
        var session = Auth.getSession();
        var res = await API.post('WRITE', {
          action: 'verifyLocation',
          gameId: gameId,
          playerId: session.playerId,
          answer: val
        });
        if (res && res.ok) {
          msg.innerHTML = '<span style="color:#4caf50;font-weight:700;">✅ 驗證成功！進入遊戲...</span>';
          self._setLocal(gameId);
          // 立即清空輸入欄以防外流
          input.value = '';
          setTimeout(function() { m.remove(); if (onPass) onPass(); }, 700);
        } else if (res && res.locked) {
          msg.innerHTML = '<span style="color:#f44336;font-weight:700;">⛔ 嘗試次數過多，請 10 分鐘後再試</span>';
          document.getElementById('gk-submit').disabled = true;
          submitting = false;
        } else {
          var rem = (res && typeof res.remaining === 'number') ? res.remaining : '';
          msg.innerHTML = '<span style="color:#f44336;">❌ ' + ((res && res.error) || '答案不正確') +
            (rem !== '' ? '（剩 ' + rem + ' 次）' : '') + '</span>';
          document.getElementById('gk-submit').disabled = false;
          submitting = false;
          input.select();
        }
      } catch(e) {
        msg.innerHTML = '<span style="color:#f44336;">網路錯誤，請重試</span>';
        document.getElementById('gk-submit').disabled = false;
        submitting = false;
      }
    };
    document.getElementById('gk-submit').onclick = doSubmit;
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') { e.preventDefault(); doSubmit(); }
    });
  },

  // 清除單一遊戲解鎖（admin 除錯用）
  resetLocal(gameId) {
    var d = this._getLocal();
    if (gameId) delete d[gameId]; else d = {};
    try { localStorage.setItem(this._unlockKey, JSON.stringify(d)); } catch(e) {}
  }
};
