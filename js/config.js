// ============================================================
// 大江購物冒險 - 全域設定
// ============================================================

const CONFIG = {
  EVENT_NAME: '大江購物冒險',
  EVENT_DATE: '2026-05-01',
  EVENT_TIME: '10:00-14:00',
  EVENT_START_HOUR: 10,
  EVENT_END_HOUR: 14,
  VENUE: '大江購物中心（桃園市中壢區中園路二段501號）',

  // === 10 GAS 分流節點 ===
  // 部署方式：複製同一份 GAS 專案 10 次，全部綁同一份 Google Sheets
  // 每個節點獨立部署為 Web App → 取得不同 URL
  // READ_NODES: 10 個讀取端點，前端隨機分配 + 故障轉移
  // WRITE/PHOTO/ADMIN: 各 1 個專用端點（寫入量少，不需分流）
  API_URL: {
    READ_NODES: [
      'https://script.google.com/macros/s/AKfycbyRK_01YMMdSEQJ3B2MdEn0eKCjyxhu8KICba7SBTzbjQwXqHEulMm7BHs9awSsA2hrSg/exec',  // Node 1
      'https://script.google.com/macros/s/AKfycbxRFVUMNUvaayFZw1qfU8ETG15fWWUaDYN1DpLifZ0rDW0wExz5c470GE3jF9wng7l3Zw/exec',   // Node 2
      'https://script.google.com/macros/s/AKfycbz9YYNDWxb0RZ64tqO1nhHU4ZOkXPCAWmZwk3-w2RqaUY9y1lyzLU4kAEWugevBJkrj/exec',     // Node 3
      'https://script.google.com/macros/s/AKfycbxJeNiz63hLpE5PkMKjqLV0Wr3CWekq-U6iJ6ylXiTawOv9scABcRvF8_C5aPOwr43stw/exec',   // Node 4
      'https://script.google.com/macros/s/AKfycbz3sOlA5aep0Sk1_KCFynNGdgmtfwaULU6dUakuN-iXiH7zJLg3B0OwDabQPW2TZhVY/exec',     // Node 5
      'https://script.google.com/macros/s/AKfycbxDp-eys7phj3_LXibeoxDlAfUqLKSaiYYZSvWzA9nOcDdyJV9wwxJI82gJBSKDLYWQ/exec',      // Node 6
      'https://script.google.com/macros/s/AKfycbxNgta4tKPZnPYX0Mo3_27-_0R0U3gP7I2bt5aHu0UMoFbi82Wl7pQoO_GNHDzmJ1XT8Q/exec',   // Node 7
      'https://script.google.com/macros/s/AKfycbz8tTxS-1nWhrMqNiyLSHgbNOLpCHOxcUqeNOO_fk90pZ4zQJRf0ZSePo5lwGVXBcWX/exec',      // Node 8
      'https://script.google.com/macros/s/AKfycbzej0dxqT_bh8GFCoCHfdjAV9M--Woq_bi_zAGgEgKyOnPrBg2m2GXK6Mgj3yFBKleOUQ/exec',   // Node 9
      'https://script.google.com/macros/s/AKfycbw9OSvv43DJ30xsLyFnm2G7rI0ol0IMpgLHrESpZZcLSyxKV53W00cjNCilzfq234aZ/exec'        // Node 10
    ],
    WRITE: 'https://script.google.com/macros/s/AKfycbyRK_01YMMdSEQJ3B2MdEn0eKCjyxhu8KICba7SBTzbjQwXqHEulMm7BHs9awSsA2hrSg/exec',
    PHOTO: 'https://script.google.com/macros/s/AKfycbyRK_01YMMdSEQJ3B2MdEn0eKCjyxhu8KICba7SBTzbjQwXqHEulMm7BHs9awSsA2hrSg/exec',
    ADMIN: 'https://script.google.com/macros/s/AKfycbyRK_01YMMdSEQJ3B2MdEn0eKCjyxhu8KICba7SBTzbjQwXqHEulMm7BHs9awSsA2hrSg/exec',
    // 向下相容：READ 指向主節點（供舊程式碼使用）
    READ: 'https://script.google.com/macros/s/AKfycbyRK_01YMMdSEQJ3B2MdEn0eKCjyxhu8KICba7SBTzbjQwXqHEulMm7BHs9awSsA2hrSg/exec'
  },

  // === 分流策略設定 ===
  LOAD_BALANCE: {
    enabled: true,               // 啟用分流（false 則全走主節點）
    strategy: 'random-sticky',   // random-sticky: 每個玩家隨機綁定節點，故障時切換
    healthCheckInterval: 60000,  // 節點健康檢查間隔 60s
    failoverTimeout: 5000,       // 請求逾時後切換節點 5s
    maxRetries: 2,               // 最多重試 2 個備用節點
    activeNodes: 10              // 10 個節點全部啟用
  },

  // === 600人優化輪詢頻率 ===
  POLL_INTERVAL: {
    chat: { base: 15000, jitter: 5000 },        // 聊天 15-20秒（原 3-5秒）
    chatWindow: 180000,                          // 只讀取最近 3 分鐘內的訊息
    broadcast: { base: 20000, jitter: 10000 },   // 廣播 20-30秒（原 5-8秒）
    scoreboard: { base: 300000, jitter: 30000 },  // 排行榜 5-5.5 分鐘自動刷新
    scoreboardCooldown: 60000,                    // 手動刷新冷卻 1 分鐘
    emergency: { base: 45000, jitter: 15000 },   // 緊急任務 45-60秒（原 30秒）
    adminDashboard: { base: 8000, jitter: 2000 }, // 管理後台 8-10秒
    photoStatus: { base: 8000, jitter: 2000 }     // 照片審核 8-10秒
  },

  CACHE_TTL: {
    teams: 120000,      // 隊伍列表 2 分鐘（原 1 分鐘）
    scores: 60000,      // 分數 1 分鐘
    rankings: 60000,    // 排行榜 1 分鐘（配合手動刷新冷卻）
    broadcasts: 10000,  // 廣播 10 秒（原 0）
    config: 300000,     // 系統設定 5 分鐘
    chat: 5000          // 聊天 5 秒（原 0）
  },

  GPS: {
    highAccuracy: true, maxAge: 5000, timeout: 15000,
    accuracyThreshold: 80,  // 室內放寬
    unlockRadius: 100,      // 100m（同棟建築即可）
    verifyRadius: 150
  },

  PHOTO: { maxWidth: 1024, quality: 0.7, maxSize: 800000 },

  // 大江購物中心座標
  MAP_CENTER: { lat: 24.9575, lng: 121.2258 },

  // ========== 60 隊 (600 人 / 10 人一隊) ==========
  TEAMS: (() => {
    const names = [
      ['火焰','🔥'],['雷霆','⚡'],['海浪','🌊'],['星辰','⭐'],['旋風','🌪️'],
      ['鑽石','💎'],['火箭','🚀'],['極光','✨'],['彩虹','🌈'],['閃電','🌩️'],
      ['獅王','🦁'],['飛鷹','🦅'],['猛虎','🐯'],['黑豹','🐆'],['巨熊','🐻'],
      ['銀狼','🐺'],['金龍','🐲'],['鳳凰','🔮'],['麒麟','🦄'],['飛魚','🐟'],
      ['戰神','⚔️'],['守護','🛡️'],['征服','🏴'],['榮耀','🏆'],['傳說','📜'],
      ['霸王','👑'],['勇者','🗡️'],['先鋒','🚩'],['突擊','💥'],['無敵','🔱'],
      ['烈日','☀️'],['寒冰','❄️'],['暴風','💨'],['雷電','🔋'],['岩石','🪨'],
      ['流星','☄️'],['月光','🌙'],['朝陽','🌅'],['夜影','🌑'],['曙光','🌤️'],
      ['幻影','👻'],['疾風','🍃'],['烈焰','🌋'],['冰晶','💠'],['雷鳴','🎯'],
      ['颶風','🌀'],['隕石','💫'],['極速','⏱️'],['巔峰','🏔️'],['王牌','🃏'],
      ['勝利','🎖️'],['榮光','🌟'],['無畏','💪'],['絕影','🦇'],['蒼穹','🌌'],
      ['狂潮','🌊'],['赤焰','🧨'],['紫電','💜'],['翠風','🍀'],['金剛','💛']
    ];
    return names.map((n, i) => ({ id: i + 1, name: n[0] + '隊', emoji: n[1] }));
  })(),

  // ========== 樓層定義 ==========
  FLOORS: [
    { id: 'GBF', name: 'GBF 地下美食街', icon: '🍔' },
    { id: '1F',  name: '1F 時尚大廳', icon: '👗' },
    { id: '2F',  name: '2F 生活家居', icon: '🏠' },
    { id: '3F',  name: '3F 娛樂天地', icon: '🎮' },
    { id: '4F',  name: '4F 美食餐廳', icon: '🍽️' },
    { id: '5F',  name: '5F 影城樂園', icon: '🎬' }
  ],

  // ========== 12 款遊戲 (每層 2 個) ==========
  GAMES: [
    // GBF
    { id: 'pacman', name: '小精靈', icon: '👾', floor: 'GBF',
      description: '吃掉所有豆子，躲避幽靈！破關後幽靈加速進入下一關',
      duration: 60, threshold: 200, color: '#FFD700', hasRounds: true,
      location: { lat: 24.95740, lng: 121.22560 } },
    { id: 'catch', name: '接水果', icon: '🧺', floor: 'GBF',
      description: '左右移動盤子接住水果！小心炸彈，每回合速度加快',
      duration: 60, threshold: 150, color: '#FF6B35', hasRounds: true,
      location: { lat: 24.95760, lng: 121.22600 } },
    // 1F
    { id: 'snake', name: '貪食蛇', icon: '🐍', floor: '1F',
      description: '控制蛇吃食物越長越好！破關後速度提高',
      duration: 60, threshold: 200, color: '#4CAF50', hasRounds: true,
      location: { lat: 24.95730, lng: 121.22570 } },
    { id: 'whack', name: '打地鼠', icon: '🔨', floor: '1F',
      description: '快速點擊冒出的目標！每回合出現更快更多',
      duration: 45, threshold: 150, color: '#FF5722', hasRounds: true,
      location: { lat: 24.95750, lng: 121.22590 } },
    // 2F
    { id: 'memory', name: '記憶翻牌', icon: '🃏', floor: '2F',
      description: '翻開配對相同圖案！每回合卡片增加',
      duration: 90, threshold: 150, color: '#9C27B0', hasRounds: true,
      location: { lat: 24.95740, lng: 121.22580 } },
    { id: 'breaker', name: '打磚塊', icon: '🧱', floor: '2F',
      description: '操控彈板反彈球消除磚塊！每關磚塊增加',
      duration: 90, threshold: 150, color: '#795548', hasRounds: true,
      location: { lat: 24.95760, lng: 121.22560 } },
    // 3F
    { id: 'quiz', name: '知識問答', icon: '🧠', floor: '3F',
      description: '限時回答台灣科技與觀光問題！答錯扣命',
      duration: 60, threshold: 100, color: '#2196F3', hasRounds: true,
      location: { lat: 24.95750, lng: 121.22570 } },
    { id: 'shooter', name: '弓箭挑戰', icon: '🏹', floor: '3F',
      description: '拉弓瞄準射擊移動靶心！按住瞄準放開射出，連續3箭落空扣命',
      duration: 45, threshold: 150, color: '#F44336', hasRounds: true,
      location: { lat: 24.95730, lng: 121.22590 } },
    // 4F
    { id: 'dodge', name: '晶圓大師', icon: '💎', floor: '4F',
      description: '模擬台積電晶圓製程！將晶圓依序送入清洗→光刻→蝕刻→封測',
      duration: 60, threshold: 100, color: '#00BCD4', hasRounds: true,
      location: { lat: 24.95740, lng: 121.22600 } },
    { id: 'reaction', name: '色彩達人', icon: '🎨', floor: '4F',
      description: '史特魯普測試！點擊字色不符的卡片，別碰字色相符的',
      duration: 45, threshold: 100, color: '#E91E63', hasRounds: true,
      location: { lat: 24.95760, lng: 121.22580 } },
    // 5F
    { id: 'rhythm', name: '節奏大師', icon: '🎵', floor: '5F',
      description: '跟著節拍點擊音符！2條軌道起步，破關後增為3條',
      duration: 60, threshold: 100, color: '#673AB7', hasRounds: true,
      location: { lat: 24.95750, lng: 121.22560 } },
    { id: 'puzzle', name: '拼圖挑戰', icon: '🧩', floor: '5F',
      description: '滑動拼塊還原圖案！每回合格數增加難度提升',
      duration: 120, threshold: 100, color: '#009688', hasRounds: true,
      location: { lat: 24.95740, lng: 121.22570 } },
    { id: 'photo', name: '拍照打卡', icon: '📸', floor: '5F',
      type: 'photo',
      description: '在指定地點拍攝現場照片上傳，管理員驗證通過得分',
      points: 300, color: '#FF9800', hasRounds: false,
      location: { lat: 24.95730, lng: 121.22600 } }
  ],

  // ========== 冒險任務 ==========
  ADVENTURE_TASKS: [
    // --- 5 款美食小遊戲 (完成遊戲 + 消費拍照 = 250分) ---
    { id: 'cook-boba', name: '珍珠奶茶', icon: '🧋', type: 'cooking',
      description: '煮珍珠、沖茶、加奶、加冰、攪拌，完成一杯珍珠奶茶！',
      ingredients: ['黑糖珍珠', '鮮奶', '紅茶', '冰塊'],
      dish: '珍珠奶茶', dishEmoji: '🧋',
      photoTask: '前往 GBF 美食街購買飲料，與飲料合照打卡',
      teamPoints: 250, duration: 60, threshold: 200, color: '#8D6E63',
      location: { lat: 24.95740, lng: 121.22560 } },
    { id: 'cook-beef', name: '牛肉麵', icon: '🍜', type: 'cooking',
      description: '切肉、炒醬、燉湯、煮麵、擺盤，完成一碗牛肉麵！',
      ingredients: ['牛腱肉', '麵條', '蔥花', '辣豆瓣醬', '高湯'],
      dish: '牛肉麵', dishEmoji: '🍜',
      photoTask: '前往餐廳享用一碗麵食，與美食合照打卡',
      teamPoints: 250, duration: 60, threshold: 200, color: '#D84315',
      location: { lat: 24.95750, lng: 121.22580 } },
    { id: 'cook-dumpling', name: '小籠包', icon: '🥟', type: 'cooking',
      description: '和餡、擀皮、包餡、蒸籠、沾醬，完成小籠包！',
      ingredients: ['豬肉餡', '薄皮', '蔥薑水', '醬油'],
      dish: '小籠包', dishEmoji: '🥟',
      photoTask: '前往餐廳品嚐點心，與美食合照打卡',
      teamPoints: 250, duration: 60, threshold: 200, color: '#FFA726',
      location: { lat: 24.95730, lng: 121.22570 } },
    { id: 'cook-shaved', name: '芒果冰', icon: '🍧', type: 'cooking',
      description: '刨冰、堆山、切芒果、淋醬、擺盤，完成芒果冰！',
      ingredients: ['芒果', '煉乳', '刨冰', '芒果醬', '小湯圓'],
      dish: '芒果冰', dishEmoji: '🍧',
      photoTask: '前往甜品店購買冰品或飲料，與甜品合照打卡',
      teamPoints: 250, duration: 60, threshold: 200, color: '#FFB300',
      location: { lat: 24.95760, lng: 121.22590 } },
    { id: 'cook-cake', name: '鳳梨酥', icon: '🍪', type: 'cooking',
      description: '揉麵、包餡、壓模、烘烤、裝飾，完成鳳梨酥！',
      ingredients: ['鳳梨餡', '奶油', '麵粉', '蛋黃', '糖粉'],
      dish: '鳳梨酥', dishEmoji: '🍪',
      photoTask: '前往烘焙坊或甜品店購買糕點，與點心合照打卡',
      teamPoints: 250, duration: 60, threshold: 200, color: '#A1887F',
      location: { lat: 24.95740, lng: 121.22600 } },
    // --- 3 景點打卡任務 ---
    { id: 'photo-heart', name: '大愛心合照', icon: '💕', type: 'group-photo',
      description: '全隊至少 20 人在大江中庭，一起比出大愛心拍照！',
      condition: '至少 20 人一起比出大愛心',
      teamPoints: 250, color: '#E91E63',
      location: { lat: 24.95750, lng: 121.22580 } },
    { id: 'photo-jump', name: '飛躍大江', icon: '🦸', type: 'group-photo',
      description: '全隊在大江入口處，一起跳躍拍出飛躍照！',
      condition: '全隊成員一起跳躍，拍出騰空效果',
      teamPoints: 250, color: '#2196F3',
      location: { lat: 24.95730, lng: 121.22560 } },
    { id: 'photo-pyramid', name: '人體金字塔', icon: '🏛️', type: 'group-photo',
      description: '全隊合作疊出人體金字塔或創意隊形，展現團隊默契！',
      condition: '全隊排出創意隊形（金字塔、字母等）',
      teamPoints: 250, color: '#4CAF50',
      location: { lat: 24.95760, lng: 121.22600 } }
  ],

  // 團隊加分規則（前5名）
  TEAM_BONUS: [500, 400, 300, 200, 100],

  // ========== 緊急任務（後台預設3組） ==========
  EMERGENCY_TASKS: [
    { id: 'emergency-1', name: '閃電集合令', icon: '⚡', description: '全隊到 1F 大廳集合，拍一張全員合照上傳！', points: 500, triggerTime: '11:00', active: false },
    { id: 'emergency-2', name: '限時搶答', icon: '🧠', description: '前往 3F 服務台，回答工作人員的問題即可過關！', points: 300, triggerTime: '12:00', active: false },
    { id: 'emergency-3', name: '神秘寶箱', icon: '🎁', description: '在 GBF 美食街找到隱藏的寶箱貼紙，拍照上傳即可獲得獎勵！', points: 400, triggerTime: '13:00', active: false }
  ],

  // ========== 問答題庫 ==========
  QUIZ_QUESTIONS: [
    // 台灣基本
    { q: '大江購物中心位於哪個城市？', options: ['桃園', '台北', '新竹', '台中'], answer: 0 },
    { q: '台灣最高的建築物是？', options: ['台北101', '高雄85大樓', '新光三越', '圓山大飯店'], answer: 0 },
    { q: '台灣的國花是什麼？', options: ['櫻花', '梅花', '蓮花', '菊花'], answer: 1 },
    { q: '台灣有幾個直轄市？', options: ['4個', '5個', '6個', '7個'], answer: 2 },
    { q: '日月潭位於哪個縣市？', options: ['嘉義縣', '南投縣', '花蓮縣', '台中市'], answer: 1 },
    { q: '台灣最長的河流是？', options: ['大甲溪', '濁水溪', '淡水河', '高屏溪'], answer: 1 },
    { q: '阿里山位於哪個縣市？', options: ['嘉義縣', '南投縣', '雲林縣', '台南市'], answer: 0 },
    { q: '台灣的貨幣單位是？', options: ['日圓', '美元', '新台幣', '人民幣'], answer: 2 },
    { q: '墾丁國家公園位於哪裡？', options: ['台東', '屏東', '花蓮', '高雄'], answer: 1 },
    { q: '台灣哪個城市被稱為港都？', options: ['基隆', '高雄', '台中', '台南'], answer: 1 },
    { q: '太魯閣國家公園以什麼地形聞名？', options: ['火山', '峽谷', '沙漠', '草原'], answer: 1 },
    { q: '珍珠奶茶起源於台灣的哪個城市？', options: ['台北', '台中', '台南', '高雄'], answer: 1 },
    { q: '九份老街位於哪個城市？', options: ['基隆市', '新北市', '台北市', '宜蘭縣'], answer: 1 },
    { q: '玉山的海拔約為幾公尺？', options: ['2952', '3492', '3952', '4952'], answer: 2 },
    { q: '桃園國際機場的代碼是？', options: ['TSA', 'TPE', 'KHH', 'RMQ'], answer: 1 },
    { q: '台灣面積最大的縣市是？', options: ['花蓮縣', '南投縣', '台東縣', '屏東縣'], answer: 0 },
    { q: '台灣第一條高速公路是？', options: ['國道一號', '國道三號', '國道五號', '台61線'], answer: 0 },
    { q: '台灣最南端的地標是？', options: ['鵝鑾鼻燈塔', '墾丁大街', '貓鼻頭', '龍磐公園'], answer: 0 },
    { q: '中壢區屬於哪個縣市？', options: ['台北市', '新北市', '桃園市', '新竹市'], answer: 2 },
    { q: '大江購物中心英文名是？', options: ['Metro Walk', 'Global Mall', 'Mega City', 'Far Eastern'], answer: 0 },
    { q: '桃園的特產是什麼？', options: ['鳳梨酥', '花生糖', '大溪豆干', '太陽餅'], answer: 2 },
    { q: '台灣高鐵最南站是？', options: ['台南站', '高雄站', '左營站', '屏東站'], answer: 2 },
    { q: '台灣四面環海，不與哪個海域相鄰？', options: ['太平洋', '台灣海峽', '南海', '日本海'], answer: 3 },
    // 台積電 & 半導體
    { q: '台積電的英文縮寫是？', options: ['TSMC', 'TMSC', 'TSPC', 'TCMS'], answer: 0 },
    { q: '台積電總部位於哪個城市？', options: ['台北', '桃園', '新竹', '台中'], answer: 2 },
    { q: '台積電的創辦人是誰？', options: ['郭台銘', '張忠謀', '林百里', '施振榮'], answer: 1 },
    { q: '台積電成立於哪一年？', options: ['1980', '1987', '1991', '1995'], answer: 1 },
    { q: '晶圓製造的第一步通常是？', options: ['蝕刻', '氧化', '晶圓清洗', '封裝'], answer: 2 },
    { q: '半導體製程中「光刻」的英文是？', options: ['Etching', 'Lithography', 'Doping', 'Deposition'], answer: 1 },
    { q: '台積電目前最先進的製程節點是？', options: ['7nm', '5nm', '3nm', '2nm'], answer: 3 },
    { q: '半導體的基本材料是什麼？', options: ['銅', '鋁', '矽', '鐵'], answer: 2 },
    { q: '晶圓的標準尺寸為幾吋？', options: ['6吋', '8吋', '12吋', '16吋'], answer: 2 },
    { q: '「摩爾定律」預測電晶體密度幾年翻一倍？', options: ['1年', '18個月', '3年', '5年'], answer: 1 },
    { q: 'IC設計公司不擁有工廠，稱為？', options: ['IDM', 'Fabless', 'Foundry', 'OSAT'], answer: 1 },
    { q: '台積電的商業模式屬於？', options: ['IDM', 'Fabless', '晶圓代工', 'IC設計'], answer: 2 },
    { q: 'EUV光刻技術中EUV是什麼意思？', options: ['超紫外光', '極紫外光', '遠紫外光', '近紫外光'], answer: 1 },
    { q: '半導體製程中nm代表？', options: ['毫米', '微米', '奈米', '皮米'], answer: 2 },
    { q: '全球最大的晶圓代工廠是？', options: ['三星', '英特爾', '台積電', '格芯'], answer: 2 },
    { q: 'Apple的A系列晶片主要由誰代工？', options: ['三星', '台積電', '英特爾', '高通'], answer: 1 },
    { q: '半導體產業中「封裝」的英文是？', options: ['Testing', 'Packaging', 'Bonding', 'Assembly'], answer: 1 },
    { q: '台積電在美國亞利桑那州建的廠生產什麼製程？', options: ['7nm', '5nm', '4nm', '3nm'], answer: 2 },
    // 台灣科技
    { q: '台灣科技業重鎮「竹科」位於？', options: ['新北市', '新竹市', '桃園市', '台中市'], answer: 1 },
    { q: '聯發科(MediaTek)的總部位於？', options: ['台北', '新竹', '台中', '桃園'], answer: 1 },
    { q: 'NVIDIA的GPU晶片主要由誰代工？', options: ['三星', '台積電', '英特爾', '中芯'], answer: 1 },
    { q: '鴻海集團的創辦人是？', options: ['張忠謀', '林百里', '郭台銘', '施崇棠'], answer: 2 },
    { q: '台灣哪家公司是全球最大的筆電代工廠？', options: ['鴻海', '廣達', '仁寶', '緯創'], answer: 1 },
    { q: '華碩(ASUS)的英文全名源自？', options: ['Asia', 'Pegasus', 'Assure', 'Ace'], answer: 1 },
    // 台灣觀光
    { q: '台灣最大的夜市是？', options: ['士林夜市', '逢甲夜市', '饒河夜市', '六合夜市'], answer: 1 },
    { q: '故宮博物院位於台灣的哪個城市？', options: ['台北', '台中', '台南', '高雄'], answer: 0 },
    { q: '台灣的綠島位於哪個縣市外海？', options: ['屏東縣', '台東縣', '花蓮縣', '宜蘭縣'], answer: 1 },
    { q: '台灣第一座國家公園是？', options: ['太魯閣', '墾丁', '玉山', '陽明山'], answer: 1 },
    { q: '台灣的「小琉球」屬於哪個縣市？', options: ['高雄市', '屏東縣', '台東縣', '澎湖縣'], answer: 1 },
    { q: '台北地標「中正紀念堂」是紀念誰？', options: ['孫中山', '蔣中正', '蔣經國', '李登輝'], answer: 1 }
  ]
};

// TEST MODE
const TEST_MODE = new URLSearchParams(window.location.search).has('test');

// 工具函式
function getTeamById(id) { return CONFIG.TEAMS.find(t => t.id === parseInt(id)); }
function getGameById(id) {
  var g = CONFIG.GAMES.find(function(g) { return g.id === id; });
  if (g) return g;
  // Also check adventure cooking tasks
  var a = CONFIG.ADVENTURE_TASKS.find(function(t) { return t.id === id; });
  if (a) return a;
  return null;
}
function getFloorGames(floorId) { return CONFIG.GAMES.filter(g => g.floor === floorId); }
function getAdventureTask(id) { return CONFIG.ADVENTURE_TASKS.find(function(t) { return t.id === id; }); }
