# Cloudflare Workers 部署指南

## 前置需求

```bash
npm install -g wrangler
wrangler login
```

## 步驟 1：建立資源

```bash
cd cloudflare-worker

# 建立 D1 資料庫
wrangler d1 create metrowalk-db
# 記下輸出的 database_id，填入 wrangler.toml

# 建立 KV 命名空間
wrangler kv namespace create metrowalk-cache
# 記下輸出的 id，填入 wrangler.toml

# 建立 R2 儲存桶（照片用）
wrangler r2 bucket create metrowalk-photos
```

## 步驟 2：更新 wrangler.toml

將步驟 1 取得的 ID 填入：

```toml
[[d1_databases]]
database_id = "填入你的 D1 ID"

[[kv_namespaces]]
id = "填入你的 KV ID"
```

更新環境變數：

```toml
[vars]
ADMIN_PASSWORD = "你的管理員密碼"
SIGN_SECRET = "你的簽章密鑰（需與 game.html 一致）"
CORS_ORIGIN = "https://你的github-pages域名"
```

## 步驟 3：初始化資料庫

```bash
wrangler d1 execute metrowalk-db --file=schema.sql
```

驗證：
```bash
wrangler d1 execute metrowalk-db --command="SELECT COUNT(*) FROM Teams"
# 應顯示 60
```

## 步驟 4：部署 Worker

```bash
wrangler deploy
```

部署後取得 URL，類似：
```
https://metrowalk-api.你的帳號.workers.dev
```

## 步驟 5：測試

```bash
# 測試遊戲 Token
curl "https://metrowalk-api.xxx.workers.dev?action=startGame&playerId=test&gameId=snake"

# 測試排行榜
curl "https://metrowalk-api.xxx.workers.dev?action=getTeamRankings"

# 測試隊伍
curl "https://metrowalk-api.xxx.workers.dev?action=getTeams"
```

## 步驟 6：切換前端

編輯 `js/config.js`：

```javascript
// 改這兩行：
BACKEND: 'cf',  // 從 'gas' 改為 'cf'
CF_URL: 'https://metrowalk-api.xxx.workers.dev',  // 填入你的 Worker URL
```

推送到 GitHub Pages 即生效。

## 資料遷移（從 GAS 搬到 D1）

如果活動中途需要從 GAS 切換到 CF：

```bash
node migrate-gas-to-d1.js
```

此腳本會：
1. 從 GAS API 讀取所有分數、排名、照片
2. 寫入 D1 資料庫
3. 同步團隊積分

## 回退到 GAS

隨時可切回：

```javascript
BACKEND: 'gas',  // 改回 'gas' 即可
```

兩套後端完全獨立，互不影響。

## R2 照片公開存取

在 Cloudflare Dashboard：
1. R2 → metrowalk-photos → Settings
2. 開啟 Public Access 或設定 Custom Domain
3. 更新 worker.js 中的照片 URL 前綴

## 免費額度

| 資源 | 免費額度/天 | 600人活動預估 |
|------|-----------|-------------|
| Workers 請求 | 100,000 | ~50,000 (4hr) |
| D1 讀取 | 5,000,000 | ~200,000 |
| D1 寫入 | 100,000 | ~10,000 |
| KV 讀取 | 100,000 | ~50,000 |
| KV 寫入 | 1,000 | ~500 |
| R2 Class A | 1,000,000 | ~600 |
| R2 儲存 | 10 GB | <1 GB |

全部在免費額度內。
