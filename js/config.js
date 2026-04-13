// ============================================================
// 大江購物冒險 - 全域設定
// ============================================================

const CONFIG = {
  EVENT_NAME: '大江購物冒險',
  EVENT_DATE: '2026-05-01',
  EVENT_TIME: '10:00-17:00',
  VENUE: '大江購物中心（桃園市中壢區中園路二段501號）',

  API_URL: {
    READ:  'https://script.google.com/macros/s/AKfycbyRK_01YMMdSEQJ3B2MdEn0eKCjyxhu8KICba7SBTzbjQwXqHEulMm7BHs9awSsA2hrSg/exec',
    WRITE: 'https://script.google.com/macros/s/AKfycbyRK_01YMMdSEQJ3B2MdEn0eKCjyxhu8KICba7SBTzbjQwXqHEulMm7BHs9awSsA2hrSg/exec',
    PHOTO: 'https://script.google.com/macros/s/AKfycbyRK_01YMMdSEQJ3B2MdEn0eKCjyxhu8KICba7SBTzbjQwXqHEulMm7BHs9awSsA2hrSg/exec',
    ADMIN: 'https://script.google.com/macros/s/AKfycbyRK_01YMMdSEQJ3B2MdEn0eKCjyxhu8KICba7SBTzbjQwXqHEulMm7BHs9awSsA2hrSg/exec'
  },

  CACHE_TTL: {
    teams: 60000, scores: 3000, rankings: 3000,
    broadcasts: 0, config: 300000, chat: 0
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
      duration: 60, color: '#FFD700', hasRounds: true,
      location: { lat: 24.95740, lng: 121.22560 } },
    { id: 'catch', name: '接水果', icon: '🧺', floor: 'GBF',
      description: '左右移動接住掉落的水果！每回合速度加快',
      duration: 60, color: '#FF6B35', hasRounds: true,
      location: { lat: 24.95760, lng: 121.22600 } },
    // 1F
    { id: 'snake', name: '貪食蛇', icon: '🐍', floor: '1F',
      description: '控制蛇吃食物越長越好！破關後速度提高',
      duration: 60, color: '#4CAF50', hasRounds: true,
      location: { lat: 24.95730, lng: 121.22570 } },
    { id: 'whack', name: '打地鼠', icon: '🔨', floor: '1F',
      description: '快速點擊冒出的目標！每回合出現更快更多',
      duration: 45, color: '#FF5722', hasRounds: true,
      location: { lat: 24.95750, lng: 121.22590 } },
    // 2F
    { id: 'memory', name: '記憶翻牌', icon: '🃏', floor: '2F',
      description: '翻開配對相同圖案！每回合卡片增加',
      duration: 90, color: '#9C27B0', hasRounds: true,
      location: { lat: 24.95740, lng: 121.22580 } },
    { id: 'breaker', name: '打磚塊', icon: '🧱', floor: '2F',
      description: '操控彈板反彈球消除磚塊！每關磚塊增加',
      duration: 90, color: '#795548', hasRounds: true,
      location: { lat: 24.95760, lng: 121.22560 } },
    // 3F
    { id: 'quiz', name: '知識問答', icon: '🧠', floor: '3F',
      description: '限時回答問題！每回合時間更短',
      duration: 120, color: '#2196F3', hasRounds: true,
      location: { lat: 24.95750, lng: 121.22570 } },
    { id: 'shooter', name: '射擊挑戰', icon: '🎯', floor: '3F',
      description: '點擊移動中的靶心！每回合目標更小更快',
      duration: 45, color: '#F44336', hasRounds: true,
      location: { lat: 24.95730, lng: 121.22590 } },
    // 4F
    { id: 'dodge', name: '閃避達人', icon: '🏃', floor: '4F',
      description: '左右閃避掉落障礙物！每回合障礙更多更快',
      duration: 60, color: '#00BCD4', hasRounds: true,
      location: { lat: 24.95740, lng: 121.22600 } },
    { id: 'reaction', name: '反應測試', icon: '⚡', floor: '4F',
      description: '看到指定顏色立刻點擊！每回合反應時間更短',
      duration: 45, color: '#E91E63', hasRounds: true,
      location: { lat: 24.95760, lng: 121.22580 } },
    // 5F
    { id: 'rhythm', name: '節奏大師', icon: '🎵', floor: '5F',
      description: '跟著節拍點擊音符！每回合節奏加快',
      duration: 60, color: '#673AB7', hasRounds: true,
      location: { lat: 24.95750, lng: 121.22560 } },
    { id: 'photo', name: '拍照打卡', icon: '📸', floor: '5F',
      type: 'photo',
      description: '在指定地點拍攝現場照片上傳，管理員驗證通過得分',
      points: 300, color: '#FF9800', hasRounds: false,
      location: { lat: 24.95730, lng: 121.22600 } }
  ],

  // 團隊加分規則（前5名）
  TEAM_BONUS: [500, 400, 300, 200, 100],

  // ========== 問答題庫 ==========
  QUIZ_QUESTIONS: [
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
    { q: '台灣最大的湖泊是？', options: ['日月潭', '澄清湖', '曾文水庫', '翡翠水庫'], answer: 0 },
    { q: '太魯閣國家公園以什麼地形聞名？', options: ['火山', '峽谷', '沙漠', '草原'], answer: 1 },
    { q: '珍珠奶茶起源於台灣的哪個城市？', options: ['台北', '台中', '台南', '高雄'], answer: 1 },
    { q: '九份老街位於哪個城市？', options: ['基隆市', '新北市', '台北市', '宜蘭縣'], answer: 1 },
    { q: '台灣的國寶魚是？', options: ['鯉魚', '櫻花鉤吻鮭', '虱目魚', '吳郭魚'], answer: 1 },
    { q: '玉山的海拔約為幾公尺？', options: ['2952', '3492', '3952', '4952'], answer: 2 },
    { q: '桃園國際機場的代碼是？', options: ['TSA', 'TPE', 'KHH', 'RMQ'], answer: 1 },
    { q: '台灣面積最大的縣市是？', options: ['花蓮縣', '南投縣', '台東縣', '屏東縣'], answer: 0 },
    { q: '台灣第一條高速公路是？', options: ['國道一號', '國道三號', '國道五號', '台61線'], answer: 0 },
    { q: '台灣最南端的地標是？', options: ['鵝鑾鼻燈塔', '墾丁大街', '貓鼻頭', '龍磐公園'], answer: 0 },
    { q: '中壢區屬於哪個縣市？', options: ['台北市', '新北市', '桃園市', '新竹市'], answer: 2 },
    { q: '大江購物中心英文名是？', options: ['Metro Walk', 'Global Mall', 'Mega City', 'Far Eastern'], answer: 0 },
    { q: '桃園的特產是什麼？', options: ['鳳梨酥', '花生糖', '大溪豆干', '太陽餅'], answer: 2 },
    { q: '台灣高鐵最南站是？', options: ['台南站', '高雄站', '左營站', '屏東站'], answer: 2 },
    { q: '台灣四面環海，不與哪個海域相鄰？', options: ['太平洋', '台灣海峽', '南海', '日本海'], answer: 3 }
  ]
};

// TEST MODE
const TEST_MODE = new URLSearchParams(window.location.search).has('test');

// 工具函式
function getTeamById(id) { return CONFIG.TEAMS.find(t => t.id === parseInt(id)); }
function getGameById(id) { return CONFIG.GAMES.find(g => g.id === id); }
function getFloorGames(floorId) { return CONFIG.GAMES.filter(g => g.floor === floorId); }
