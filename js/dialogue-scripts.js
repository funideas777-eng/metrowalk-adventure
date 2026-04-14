/**
 * DialogueScripts - 大江購物冒險 所有遊戲對話腳本
 * 每個遊戲對應一組對話陣列，包含角色、頭像、台詞、情緒與名稱顏色
 */
var DialogueScripts = {

  // ========== 13 款主遊戲 ==========

  'pacman': [
    { char: '阿吉伯', avatar: '👴', text: '哎唷～你們這些年輕人知道小精靈嗎？就是那個黃色的、嘴巴一直開開合合的！', mood: 'excited', nameColor: '#FFD700' },
    { char: '阿吉伯', avatar: '👴', text: '想當年我在西門町的遊戲廳，一個銅板就可以玩一下午，旁邊還放著披頭四的歌...那才叫生活啊！', mood: 'happy', nameColor: '#FFD700' },
    { char: '阿吉伯', avatar: '👴', text: '現在的年輕人只會滑手機，跟他們講張學友他們還問我「那是哪個YouTuber」...唉！', mood: 'thinking', nameColor: '#FFD700' },
    { char: '阿吉伯', avatar: '👴', text: '不過沒關係！今天阿吉伯帶你們回到最經典的年代！', mood: 'excited', nameColor: '#FFD700' },
    { char: '阿吉伯', avatar: '👴', text: '嘿嘿，從我這個經典小精靈遊戲中破關，才可以得到分數喔！看看你們有沒有當年我的實力！', mood: 'happy', nameColor: '#FFD700' }
  ],

  'catch': [
    { char: '水果嬸', avatar: '👩‍🌾', text: '來來來！走過路過不要錯過！全大江最新鮮的水果都在這裡啦！', mood: 'excited', nameColor: '#FF6B35' },
    { char: '水果嬸', avatar: '👩‍🌾', text: '我跟你說，我這芒果是今天早上從玉井直送的，那個香味隔兩條街都聞得到！', mood: 'happy', nameColor: '#FF6B35' },
    { char: '水果嬸', avatar: '👩‍🌾', text: '規則很簡單——水果從天上掉下來，你用盤子接住就算你的！免費吃到飽！', mood: 'excited', nameColor: '#FF6B35' },
    { char: '水果嬸', avatar: '👩‍🌾', text: '但是啊...漏掉的話就不給你吃囉！我這水果可是很搶手的，掉地上也不能浪費！', mood: 'normal', nameColor: '#FF6B35' },
    { char: '水果嬸', avatar: '👩‍🌾', text: '還有那個炸彈別接到啊！那是隔壁賣臭豆腐的偷丟過來的，接到會扣分的！準備好了沒？', mood: 'happy', nameColor: '#FF6B35' }
  ],

  'snake': [
    { char: '科技宅小明', avatar: '🤓', text: '你...你有玩過 Nokia 3310 嗎？那支手機可以擋子彈欸，不是開玩笑的！', mood: 'excited', nameColor: '#4CAF50' },
    { char: '科技宅小明', avatar: '🤓', text: '以前上課的時候，我都把手機藏在抽屜裡偷玩貪食蛇，老師在上面講三角函數，我在下面破紀錄。', mood: 'happy', nameColor: '#4CAF50' },
    { char: '科技宅小明', avatar: '🤓', text: '我的最高紀錄是 387 分，全班沒人打得贏我！那時候我可是風雲人物...雖然數學被當了。', mood: 'thinking', nameColor: '#4CAF50' },
    { char: '科技宅小明', avatar: '🤓', text: '現在什麼原神、寶可夢的，畫面是很漂亮啦，但就是少了那種單純的快樂你懂嗎？', mood: 'normal', nameColor: '#4CAF50' },
    { char: '科技宅小明', avatar: '🤓', text: '來吧！我倒要看看你們這些用觸控螢幕長大的，能不能超越我當年的紀錄！', mood: 'excited', nameColor: '#4CAF50' }
  ],

  'whack': [
    { char: '王農夫', avatar: '👨‍🌾', text: '天啊天啊天啊！我的高麗菜又被挖光了！！！那些該死的地鼠！！', mood: 'angry', nameColor: '#FF5722' },
    { char: '王農夫', avatar: '👨‍🌾', text: '我種了三十年的菜，從來沒遇過這麼囂張的地鼠，牠們根本是有組織的犯罪集團！', mood: 'angry', nameColor: '#FF5722' },
    { char: '王農夫', avatar: '👨‍🌾', text: '我需要你們幫忙！看到地鼠冒出來就給我用力打下去！一隻都不能放過！', mood: 'excited', nameColor: '#FF5722' },
    { char: '王農夫', avatar: '👨‍🌾', text: '但是要小心那個戴骷髏面具的！那是我鄰居老陳裝的，他說要嚇地鼠結果都嚇到我...打到他會扣分的！', mood: 'thinking', nameColor: '#FF5722' },
    { char: '王農夫', avatar: '👨‍🌾', text: '拜託你們了！要是再讓地鼠吃掉我的菜，我今年就要去大江打工了！', mood: 'happy', nameColor: '#FF5722' }
  ],

  'memory': [
    { char: '乃哥', avatar: '🎩', text: '歡迎歡迎！我是大江最厲害的街頭魔術師——人稱「記憶之王」的乃哥！', mood: 'excited', nameColor: '#9C27B0' },
    { char: '乃哥', avatar: '🎩', text: '你知道魔術的精髓是什麼嗎？不是手快，是記憶力！我可以記住一整副撲克牌的順序！', mood: 'happy', nameColor: '#9C27B0' },
    { char: '乃哥', avatar: '🎩', text: '這個翻牌遊戲嘛...對我來說根本是幼稚園等級的，閉著眼睛都能配對完成。', mood: 'normal', nameColor: '#9C27B0' },
    { char: '乃哥', avatar: '🎩', text: '你們年輕人...腦袋都被手機搞壞了吧？整天滑短影音，注意力比金魚還短！', mood: 'thinking', nameColor: '#9C27B0' },
    { char: '乃哥', avatar: '🎩', text: '來吧！讓乃哥看看你的記憶力有沒有超過三秒鐘！翻到一樣的就配對成功，很簡單的！', mood: 'excited', nameColor: '#9C27B0' }
  ],

  'breaker': [
    { char: '陳工頭', avatar: '👷', text: '注意注意！工地重地，閒人勿進！...啊你們是來玩遊戲的啊？那沒事，進來吧！', mood: 'normal', nameColor: '#795548' },
    { char: '陳工頭', avatar: '👷', text: '我是陳工頭，在工地打滾二十年了！拆牆是我的專長，一天可以拆三面牆不喘氣！', mood: 'happy', nameColor: '#795548' },
    { char: '陳工頭', avatar: '👷', text: '拆牆的訣竅就是——要一層一層打，從下面開始，就像蓋房子反過來一樣！', mood: 'thinking', nameColor: '#795548' },
    { char: '陳工頭', avatar: '👷', text: '用那顆球去撞磚塊，把它們一塊塊敲掉！這比在工地輕鬆多了，連怪手都不用開！', mood: 'excited', nameColor: '#795548' },
    { char: '陳工頭', avatar: '👷', text: '安全帽戴好！球來了不要閃！讓我看看你們拆牆的功力！', mood: 'excited', nameColor: '#795548' }
  ],

  'quiz': [
    { char: '林教授', avatar: '👨‍🏫', text: '同學們好，我是林教授。退休之前在大學教了四十年的歷史，沒有我不知道的事。', mood: 'normal', nameColor: '#2196F3' },
    { char: '林教授', avatar: '👨‍🏫', text: '現在的年輕人啊，問他台灣第一條鐵路誰蓋的，居然跟我說是「捷運局」...我差點昏倒！', mood: 'angry', nameColor: '#2196F3' },
    { char: '林教授', avatar: '👨‍🏫', text: '知識就是力量！今天我出幾題來考考你們，看看你們是不是真的有在讀書。', mood: 'thinking', nameColor: '#2196F3' },
    { char: '林教授', avatar: '👨‍🏫', text: '題目涵蓋歷史、地理、文化、美食...都是身為台灣人應該知道的常識！', mood: 'excited', nameColor: '#2196F3' },
    { char: '林教授', avatar: '👨‍🏫', text: '答錯要扣命的喔，跟我當年當老師一樣嚴格！準備好就開始吧，別讓林教授失望！', mood: 'happy', nameColor: '#2196F3' }
  ],

  'shooter': [
    { char: '瓦歷斯', avatar: '🏹', text: 'Lokah su ga？朋友你好！我是瓦歷斯，來自山上的獵人。', mood: 'normal', nameColor: '#F44336' },
    { char: '瓦歷斯', avatar: '🏹', text: '弓箭是祖先傳下來的技藝，我從五歲就開始練習，到現在閉著眼睛都能射中獵物。', mood: 'happy', nameColor: '#F44336' },
    { char: '瓦歷斯', avatar: '🏹', text: '要領就是——瞄準...深呼吸...放！要像山上的老鷹一樣準，一擊必中！', mood: 'excited', nameColor: '#F44336' },
    { char: '瓦歷斯', avatar: '🏹', text: '山上的獵人不浪費任何一支箭。每一箭都要有意義，亂射是對獵物的不尊重。', mood: 'thinking', nameColor: '#F44336' },
    { char: '瓦歷斯', avatar: '🏹', text: '來吧，讓我看看平地的朋友射箭準不準！打中目標就能得分，加油！', mood: 'excited', nameColor: '#F44336' }
  ],

  'dodge': [
    { char: '張博士', avatar: '👨‍🔬', text: '嗯哼，歡迎來到晶圓製造的世界。我是張博士，在台積電工作了整整三十年。', mood: 'normal', nameColor: '#00BCD4' },
    { char: '張博士', avatar: '👨‍🔬', text: '你知道嗎？一片12吋晶圓要經過上千道製程，每一步都不能出錯，差一奈米就是廢片！', mood: 'thinking', nameColor: '#00BCD4' },
    { char: '張博士', avatar: '👨‍🔬', text: '台灣的半導體是全世界的驕傲！你們手上的手機晶片，搞不好就是我做的喔！', mood: 'happy', nameColor: '#00BCD4' },
    { char: '張博士', avatar: '👨‍🔬', text: '這個遊戲就像晶圓製程一樣，障礙物會從各方向飛來，你要靈活閃避，按順序通關！', mood: 'excited', nameColor: '#00BCD4' },
    { char: '張博士', avatar: '👨‍🔬', text: '一片晶圓值幾萬美金，弄壞了你賠不起的！小心閃好，開始囉！', mood: 'excited', nameColor: '#00BCD4' }
  ],

  'reaction': [
    { char: '小畢', avatar: '🎨', text: '嘿！你看到的顏色...真的是你以為的顏色嗎？', mood: 'thinking', nameColor: '#E91E63' },
    { char: '小畢', avatar: '🎨', text: '我是小畢，一個被色彩折磨了二十年的瘋狂藝術家。我跟你說，人的大腦超容易被騙的！', mood: 'excited', nameColor: '#E91E63' },
    { char: '小畢', avatar: '🎨', text: '紅的不一定是紅的，藍的也不一定是藍的...這叫做「史楚普效應」，是我大學最愛的實驗！', mood: 'happy', nameColor: '#E91E63' },
    { char: '小畢', avatar: '🎨', text: '畢卡索說過「藝術是揭露真相的謊言」，而這個遊戲就是要揭露你大腦的Bug！', mood: 'thinking', nameColor: '#E91E63' },
    { char: '小畢', avatar: '🎨', text: '看清楚再點！不要被文字騙了，要看顏色！來吧，考驗你的反應力和判斷力！', mood: 'excited', nameColor: '#E91E63' }
  ],

  'rhythm': [
    { char: 'DJ阿凱', avatar: '🎧', text: 'Yo Yo Yo！What\'s up 大江的朋友們！我是DJ阿凱！', mood: 'excited', nameColor: '#673AB7' },
    { char: 'DJ阿凱', avatar: '🎧', text: '我在大江的派對上放了五年的歌，從電音到嘻哈，從K-pop到台語歌，什麼都來！', mood: 'happy', nameColor: '#673AB7' },
    { char: 'DJ阿凱', avatar: '🎧', text: '但我發現一件很可怕的事...現在很多人根本沒有節奏感！拍手都拍不到點上！', mood: 'thinking', nameColor: '#673AB7' },
    { char: 'DJ阿凱', avatar: '🎧', text: '節奏感是天生的？不不不，是練出來的！這個遊戲就是你的訓練場！', mood: 'normal', nameColor: '#673AB7' },
    { char: 'DJ阿凱', avatar: '🎧', text: '跟著節拍走，讓我看看你們是不是「節奏白痴」！Drop the beat！', mood: 'excited', nameColor: '#673AB7' }
  ],

  'puzzle': [
    { char: '考古學家老陳', avatar: '🧓', text: '年輕人，你有沒有試過把一個兩千年前的陶罐從碎片拼回去？', mood: 'normal', nameColor: '#009688' },
    { char: '考古學家老陳', avatar: '🧓', text: '我是老陳，退休考古學家。一輩子都在跟碎片打交道，從秦朝的瓦片到清朝的瓷器，全拼過。', mood: 'happy', nameColor: '#009688' },
    { char: '考古學家老陳', avatar: '🧓', text: '拼圖的祕訣就是——先找邊角，再看紋路，最後靠直覺。跟考古一模一樣！', mood: 'thinking', nameColor: '#009688' },
    { char: '考古學家老陳', avatar: '🧓', text: '急什麼！慢慢來，跟挖化石一樣要有耐心！我挖一塊恐龍骨頭花了三個月呢！', mood: 'normal', nameColor: '#009688' },
    { char: '考古學家老陳', avatar: '🧓', text: '好了，這些碎片就交給你了！把圖片拼回原狀，讓老陳看看你的功力！', mood: 'excited', nameColor: '#009688' }
  ],

  'photo': [
    { char: '攝影師小美', avatar: '📷', text: '等等等等！你那個角度不對！光線也不行！表情太僵了！', mood: 'angry', nameColor: '#FF9800' },
    { char: '攝影師小美', avatar: '📷', text: '呼...抱歉，職業病。我是小美，一個相機不離身的文青攝影師。', mood: 'normal', nameColor: '#FF9800' },
    { char: '攝影師小美', avatar: '📷', text: '好的照片需要三個元素——角度、光線、還有最重要的...情感！要拍出靈魂！', mood: 'thinking', nameColor: '#FF9800' },
    { char: '攝影師小美', avatar: '📷', text: '現在大家都用手機亂拍，濾鏡開到最大，原圖根本不能看...唉，攝影的尊嚴在哪裡？', mood: 'thinking', nameColor: '#FF9800' },
    { char: '攝影師小美', avatar: '📷', text: '好啦！跟著我的指示拍照打卡，讓我教你們什麼叫真正的攝影藝術！笑一個！', mood: 'excited', nameColor: '#FF9800' }
  ],

  // ========== 5 款料理冒險 ==========

  'cook-boba': [
    { char: '茶飲店長小珍', avatar: '🧋', text: '歡迎光臨！想喝杯正宗的珍珠奶茶嗎？重點是珍珠要Q彈、茶要回甘、奶要香醇！', mood: 'happy', nameColor: '#8D6E63' },
    { char: '茶飲店長小珍', avatar: '🧋', text: '跟著我的步驟來，你也能煮出一杯讓外國人排隊的台灣之光！材料都準備好囉！', mood: 'excited', nameColor: '#8D6E63' }
  ],

  'cook-beef': [
    { char: '麵攤老張', avatar: '🍜', text: '我這碗牛肉麵的湯頭，可是熬了整整十二個小時的祖傳祕方！聞到沒？香吧！', mood: 'happy', nameColor: '#D84315' },
    { char: '麵攤老張', avatar: '🍜', text: '牛肉要帶筋、湯要夠濃、麵條要彈牙！順序不能錯，跟著老張做就對了！', mood: 'excited', nameColor: '#D84315' },
    { char: '麵攤老張', avatar: '🍜', text: '做好了我請你吃一碗！做壞了...你就自己吃掉吧，哈哈！', mood: 'happy', nameColor: '#D84315' }
  ],

  'cook-dumpling': [
    { char: '包子師傅老李', avatar: '🥟', text: '小籠包的靈魂在哪裡？在那十八摺！少一摺不行，多一摺也不行！', mood: 'thinking', nameColor: '#FFA726' },
    { char: '包子師傅老李', avatar: '🥟', text: '皮要薄、餡要鮮、湯汁要燙嘴！來，跟著老李的手法，摺出完美的小籠包！', mood: 'excited', nameColor: '#FFA726' },
    { char: '包子師傅老李', avatar: '🥟', text: '小心別戳破皮啊，湯汁流出來就不及格了！我師父以前打我手心就是因為這個！', mood: 'happy', nameColor: '#FFA726' }
  ],

  'cook-shaved': [
    { char: '冰店小妹阿雪', avatar: '🍧', text: '天氣這麼熱，不來碗芒果冰怎麼行？我們家的芒果可是愛文品種，甜到會流淚！', mood: 'happy', nameColor: '#FFB300' },
    { char: '冰店小妹阿雪', avatar: '🍧', text: '冰要刨得細、芒果要切大塊、最後淋上煉乳和芒果醬...光想就流口水了！快動手吧！', mood: 'excited', nameColor: '#FFB300' }
  ],

  'cook-cake': [
    { char: '烘焙師小鳳', avatar: '🍪', text: '鳳梨酥可是台灣伴手禮之王！外國朋友來台灣，沒帶鳳梨酥回去等於沒來過！', mood: 'happy', nameColor: '#A1887F' },
    { char: '烘焙師小鳳', avatar: '🍪', text: '酥皮要鬆、內餡要甜而不膩，烤的時間更是關鍵！跟著小鳳一起做出完美的鳳梨酥！', mood: 'excited', nameColor: '#A1887F' },
    { char: '烘焙師小鳳', avatar: '🍪', text: '記住，烘焙是科學也是藝術，差一克都不行的喔！', mood: 'thinking', nameColor: '#A1887F' }
  ],

  // ========== 3 款團體拍照 ==========

  'photo-heart': [
    { char: '活動主持人阿明', avatar: '🎤', text: '好～各位朋友注意囉！我們要來排一個超大的愛心！', mood: 'excited', nameColor: '#E91E63' },
    { char: '活動主持人阿明', avatar: '🎤', text: '大家手牽手，高的站後面、矮的站前面，把愛心排出來！這張照片要放在大江的官網上喔！', mood: 'happy', nameColor: '#E91E63' },
    { char: '活動主持人阿明', avatar: '🎤', text: '笑開一點！我數到三就拍囉——一、二、三，大江我愛你！', mood: 'excited', nameColor: '#E91E63' }
  ],

  'photo-jump': [
    { char: '活動主持人阿明', avatar: '🎤', text: '接下來是我最愛的環節——全體跳躍照！考驗團隊默契的時候到了！', mood: 'excited', nameColor: '#2196F3' },
    { char: '活動主持人阿明', avatar: '🎤', text: '我喊跳的時候，所有人一起往上跳！要同時喔！上次有人慢了一拍，結果照片裡只有他蹲著超好笑！', mood: 'happy', nameColor: '#2196F3' },
    { char: '活動主持人阿明', avatar: '🎤', text: '準備好了嗎？三、二、一——跳！！！', mood: 'excited', nameColor: '#2196F3' }
  ],

  'photo-pyramid': [
    { char: '活動主持人阿明', avatar: '🎤', text: '最後一關！我們要來挑戰最有創意的團體造型——人體金字塔！', mood: 'excited', nameColor: '#4CAF50' },
    { char: '活動主持人阿明', avatar: '🎤', text: '壯的當地基、輕的上去上面，大家互相扶好！安全第一啊，不要真的疊太高！', mood: 'thinking', nameColor: '#4CAF50' },
    { char: '活動主持人阿明', avatar: '🎤', text: '其實不用真的疊啦，擺個創意Pose就好！來，展現你們團隊的創造力吧！', mood: 'happy', nameColor: '#4CAF50' }
  ]

};

window.DialogueScripts = DialogueScripts;
