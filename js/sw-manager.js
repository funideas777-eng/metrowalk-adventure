// ============================================================
// Service Worker 管理：自動檢查新版本 + 強制更新
// 在所有頁面 <head> 引入即可取代舊的 navigator.serviceWorker.register
// ============================================================
(function() {
  if (!('serviceWorker' in navigator)) return;

  let reloadedOnce = false;

  navigator.serviceWorker.register('sw.js').then(reg => {
    // 每 10 分鐘主動檢查新版本（活動中發布修正用）
    setInterval(() => reg.update().catch(() => {}), 10 * 60 * 1000);

    // 頁面重新可見時檢查（從背景切回來時）
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) reg.update().catch(() => {});
    });

    // 偵測到新 SW 安裝中
    reg.addEventListener('updatefound', () => {
      const newSW = reg.installing;
      if (!newSW) return;
      newSW.addEventListener('statechange', () => {
        if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
          // 有新版本等待中：顯示提示並自動啟用
          showUpdateBanner(newSW);
        }
      });
    });
  }).catch(err => console.warn('SW register failed:', err));

  // SW 通知：已更新版本 → 重新載入頁面取得最新資源
  navigator.serviceWorker.addEventListener('message', e => {
    if (e.data && e.data.type === 'SW_UPDATED' && !reloadedOnce) {
      reloadedOnce = true;
      // 避免無限 reload：先清 session 標記
      setTimeout(() => location.reload(), 500);
    }
  });

  function showUpdateBanner(newSW) {
    const bar = document.createElement('div');
    bar.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:#2c7;color:#fff;padding:12px;text-align:center;z-index:99999;box-shadow:0 -2px 8px rgba(0,0,0,.2);font-size:14px;';
    bar.innerHTML = '🔄 有新版本可用 <button id="sw_reload" style="margin-left:8px;background:#fff;color:#2c7;border:none;padding:4px 12px;border-radius:4px;font-weight:bold;cursor:pointer;">立即更新</button>';
    document.body.appendChild(bar);
    document.getElementById('sw_reload').onclick = () => {
      newSW.postMessage({ type: 'SKIP_WAITING' });
    };
    // 10 秒後自動觸發
    setTimeout(() => newSW.postMessage({ type: 'SKIP_WAITING' }), 10000);
  }
})();
