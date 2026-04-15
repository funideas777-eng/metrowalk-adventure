-- ============================================================
-- MetroWalk Adventure - D1 Database Schema
-- 對應 Google Sheets 10 張分頁 → 10 張 SQL 表
-- ============================================================

-- 60 組隊伍
CREATE TABLE IF NOT EXISTS Teams (
  teamId INTEGER PRIMARY KEY,
  teamName TEXT NOT NULL,
  teamEmoji TEXT NOT NULL,
  totalPoints INTEGER DEFAULT 0
);

-- 玩家註冊
CREATE TABLE IF NOT EXISTS Players (
  playerId TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  teamId INTEGER NOT NULL,
  registeredAt TEXT NOT NULL,
  FOREIGN KEY (teamId) REFERENCES Teams(teamId)
);
CREATE INDEX IF NOT EXISTS idx_players_team ON Players(teamId);

-- 遊戲分數
CREATE TABLE IF NOT EXISTS GameScores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  playerId TEXT NOT NULL,
  playerName TEXT NOT NULL,
  teamId INTEGER NOT NULL,
  gameId TEXT NOT NULL,
  score INTEGER NOT NULL,
  timestamp TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_scores_game ON GameScores(gameId, score DESC);
CREATE INDEX IF NOT EXISTS idx_scores_player ON GameScores(playerId, gameId);
CREATE INDEX IF NOT EXISTS idx_scores_team ON GameScores(teamId, gameId);

-- GPS 遊戲解鎖
CREATE TABLE IF NOT EXISTS GameUnlocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  playerId TEXT NOT NULL,
  gameId TEXT NOT NULL,
  unlockedAt TEXT NOT NULL,
  lat REAL,
  lng REAL
);
CREATE INDEX IF NOT EXISTS idx_unlocks_player ON GameUnlocks(playerId);

-- 團隊加分紀錄
CREATE TABLE IF NOT EXISTS TeamPoints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  teamId INTEGER NOT NULL,
  source TEXT NOT NULL,
  points INTEGER NOT NULL,
  detail TEXT,
  timestamp TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_teampoints_team ON TeamPoints(teamId);
CREATE INDEX IF NOT EXISTS idx_teampoints_source ON TeamPoints(source);

-- 廣播訊息
CREATE TABLE IF NOT EXISTS Broadcasts (
  broadcastId INTEGER PRIMARY KEY,
  type TEXT DEFAULT 'text',
  content TEXT NOT NULL,
  timestamp TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_broadcasts_time ON Broadcasts(timestamp);

-- 系統設定
CREATE TABLE IF NOT EXISTS Config (
  key TEXT PRIMARY KEY,
  value TEXT
);

-- 聊天訊息
CREATE TABLE IF NOT EXISTS Chat (
  msgId INTEGER PRIMARY KEY,
  channel TEXT NOT NULL,
  teamId INTEGER NOT NULL,
  playerId TEXT NOT NULL,
  playerName TEXT NOT NULL,
  teamName TEXT,
  teamEmoji TEXT,
  content TEXT NOT NULL,
  timestamp TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_chat_channel ON Chat(channel, timestamp);
CREATE INDEX IF NOT EXISTS idx_chat_team ON Chat(channel, teamId, timestamp);

-- 玩家位置
CREATE TABLE IF NOT EXISTS PlayerLocations (
  playerId TEXT PRIMARY KEY,
  playerName TEXT NOT NULL,
  teamId INTEGER NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  timestamp TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_locations_team ON PlayerLocations(teamId);

-- 照片任務
CREATE TABLE IF NOT EXISTS PhotoTasks (
  submissionId TEXT PRIMARY KEY,
  playerId TEXT NOT NULL,
  playerName TEXT NOT NULL,
  teamId INTEGER NOT NULL,
  gameId TEXT DEFAULT 'photo',
  photoUrl TEXT,
  status TEXT DEFAULT 'pending',
  submittedAt TEXT NOT NULL,
  verifiedAt TEXT
);
CREATE INDEX IF NOT EXISTS idx_photos_status ON PhotoTasks(status);
CREATE INDEX IF NOT EXISTS idx_photos_player ON PhotoTasks(playerId, gameId);

-- 審計日誌
CREATE TABLE IF NOT EXISTS AuditLog (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  ip TEXT
);
CREATE INDEX IF NOT EXISTS idx_audit_time ON AuditLog(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_action ON AuditLog(action);

-- ============================================================
-- 初始化 60 隊（對應 GAS initSpreadsheet）
-- ============================================================
INSERT OR IGNORE INTO Teams (teamId, teamName, teamEmoji, totalPoints) VALUES
(1,'火焰隊','🔥',0),(2,'雷霆隊','⚡',0),(3,'海浪隊','🌊',0),(4,'星辰隊','⭐',0),(5,'旋風隊','🌪️',0),
(6,'鑽石隊','💎',0),(7,'火箭隊','🚀',0),(8,'極光隊','✨',0),(9,'彩虹隊','🌈',0),(10,'閃電隊','🌩️',0),
(11,'獅王隊','🦁',0),(12,'飛鷹隊','🦅',0),(13,'猛虎隊','🐯',0),(14,'黑豹隊','🐆',0),(15,'巨熊隊','🐻',0),
(16,'銀狼隊','🐺',0),(17,'金龍隊','🐲',0),(18,'鳳凰隊','🔮',0),(19,'麒麟隊','🦄',0),(20,'飛魚隊','🐟',0),
(21,'戰神隊','⚔️',0),(22,'守護隊','🛡️',0),(23,'征服隊','🏴',0),(24,'榮耀隊','🏆',0),(25,'傳說隊','📜',0),
(26,'霸王隊','👑',0),(27,'勇者隊','🗡️',0),(28,'先鋒隊','🚩',0),(29,'突擊隊','💥',0),(30,'無敵隊','🔱',0),
(31,'烈日隊','☀️',0),(32,'寒冰隊','❄️',0),(33,'暴風隊','💨',0),(34,'雷電隊','🔋',0),(35,'岩石隊','🪨',0),
(36,'流星隊','☄️',0),(37,'月光隊','🌙',0),(38,'朝陽隊','🌅',0),(39,'夜影隊','🌑',0),(40,'曙光隊','🌤️',0),
(41,'幻影隊','👻',0),(42,'疾風隊','🍃',0),(43,'烈焰隊','🌋',0),(44,'冰晶隊','💠',0),(45,'雷鳴隊','🎯',0),
(46,'颶風隊','🌀',0),(47,'隕石隊','💫',0),(48,'極速隊','⏱️',0),(49,'巔峰隊','🏔️',0),(50,'王牌隊','🃏',0),
(51,'勝利隊','🎖️',0),(52,'榮光隊','🌟',0),(53,'無畏隊','💪',0),(54,'絕影隊','🦇',0),(55,'蒼穹隊','🌌',0),
(56,'狂潮隊','🌊',0),(57,'赤焰隊','🧨',0),(58,'紫電隊','💜',0),(59,'翠風隊','🍀',0),(60,'金剛隊','💛',0);
