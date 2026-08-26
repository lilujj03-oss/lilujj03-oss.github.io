/**
 * 台灣好行 (Taiwan Trip) 路線資料庫
 * 包含全台各區路線名稱、代碼、所屬縣市、特色標籤、停靠站與經緯度資訊
 */

const TAIWAN_TRIP_ROUTES = [
  // ================= 北部地區 =================
  {
    id: "route-9839-beitou",
    code: "小9",
    name: "北投竹子湖線",
    nameEn: "Beitou - Zhuzihu Route",
    region: "north",
    regionName: "北部",
    county: "臺北市",
    color: "#10b981",
    tag: "花季溫泉",
    category: "nature",
    summary: "串聯北投溫泉博物館、陽明山國家公園與竹子湖海芋繡球花田的經典山林路線。",
    officialUrl: "https://www.taiwantrip.com.tw/Frontend/Route/Select_p?RouteId=R0028",
    fare: "一段票收費 / 支援悠遊卡與一卡通",
    operator: "大南汽車",
    stops: [
      { name: "捷運北投站", lat: 25.1318, lng: 121.4986, desc: "捷運淡水信義線轉乘起點" },
      { name: "北投溫泉博物館", lat: 25.1365, lng: 121.5072, desc: "百年日式溫泉文化浴場" },
      { name: "地熱谷", lat: 25.1384, lng: 121.5113, desc: "硫磺煙霧繚繞之仙境" },
      { name: "陽明山第二停車場", lat: 25.1568, lng: 121.5471, desc: "花鐘廣場與遊客服務中心" },
      { name: "竹子湖(海芋大道)", lat: 25.1724, lng: 121.5358, desc: "海芋與繡球花田觀光區" },
      { name: "竹子湖(頂湖)", lat: 25.1782, lng: 121.5415, desc: "小油坑環抱的壯麗梯田" }
    ]
  },
  {
    id: "route-856-gold",
    code: "856",
    name: "黃金福隆線",
    nameEn: "Gold Fulong Route",
    region: "north",
    regionName: "北部",
    county: "新北市",
    color: "#f59e0b",
    tag: "山海古蹟",
    category: "coast",
    summary: "穿梭瑞芳九份山城、黃金博物館、水湳洞陰陽海與福隆金色沙灘。",
    officialUrl: "https://www.taiwantrip.com.tw/Frontend/Route/Select_p?RouteId=R0005",
    fare: "二段票收費",
    operator: "基隆客運",
    stops: [
      { name: "瑞芳火車站", lat: 25.1089, lng: 121.8062, desc: "台鐵轉乘接駁樞紐" },
      { name: "九份老街", lat: 25.1098, lng: 121.8452, desc: "山城茶樓與芋圓石階老街" },
      { name: "黃金博物館", lat: 25.1073, lng: 121.8596, desc: "金瓜石採金歷史與神社步道" },
      { name: "水湳洞", lat: 25.1223, lng: 121.8624, desc: "陰陽海與十三層遺址" },
      { name: "鼻頭角", lat: 25.1265, lng: 121.9168, desc: "台版萬里長城海崖步道" },
      { name: "龍門露營區", lat: 25.0215, lng: 121.9362, desc: "雙溪河畔水上泛舟活動" },
      { name: "福隆遊客中心", lat: 25.0163, lng: 121.9442, desc: "沙雕季、舊草嶺隧道自行車道" }
    ]
  },
  {
    id: "route-716-crown",
    code: "716",
    name: "皇冠北海岸線",
    nameEn: "Crown Northern Coast Route",
    region: "north",
    regionName: "北部",
    county: "新北市",
    color: "#06b6d4",
    tag: "海景地質",
    category: "coast",
    summary: "暢遊北海岸野柳女王頭、朱銘美術館、白沙灣、石門洞與淡水漁人碼頭。",
    officialUrl: "https://www.taiwantrip.com.tw/Frontend/Route/Select_p?RouteId=R0018",
    fare: "段次計費 / 支援多卡通",
    operator: "淡水客運",
    stops: [
      { name: "淡水捷運站", lat: 25.1678, lng: 121.4452, desc: "淡水河畔紅樹林起點" },
      { name: "淺水灣", lat: 25.2514, lng: 121.4729, desc: "異國海景咖啡街與沙灘" },
      { name: "白沙灣", lat: 25.2831, lng: 121.5204, desc: "半月型白色天然貝殼沙灘" },
      { name: "富貴角燈塔", lat: 25.2982, lng: 121.5369, desc: "台灣本島最北端燈塔" },
      { name: "石門洞", lat: 25.2923, lng: 121.5694, desc: "天然海蝕拱門景觀" },
      { name: "金山老街", lat: 25.2215, lng: 121.6368, desc: "金山鴨肉與溫泉老街" },
      { name: "野柳地質公園", lat: 25.2062, lng: 121.6905, desc: "世界級野柳女王頭海蝕蕈狀岩" }
    ]
  },
  {
    id: "route-502-daxi",
    code: "502",
    name: "大溪快線",
    nameEn: "Daxi Express Route",
    region: "north",
    regionName: "北部",
    county: "桃園市",
    color: "#ec4899",
    tag: "老街文化",
    category: "culture",
    summary: "從高鐵桃園站直達大溪老街、慈湖花海與客家文化園區。",
    officialUrl: "https://www.taiwantrip.com.tw/Frontend/Route/Select_p?RouteId=R0055",
    fare: "里程計費",
    operator: "桃園客運",
    stops: [
      { name: "高鐵桃園站", lat: 25.0125, lng: 121.2147, desc: "高鐵與機捷共構站" },
      { name: "原住民族文化會館", lat: 24.9142, lng: 121.2825, desc: "原民藝術與文化展演" },
      { name: "大溪老茶廠", lat: 24.8315, lng: 121.3289, desc: "日治製茶歷史風華古建築" },
      { name: "大溪老街", lat: 24.8841, lng: 121.2872, desc: "巴洛克立面牌樓與大溪豆干" },
      { name: "慈湖陵寢", lat: 24.8415, lng: 121.2952, desc: "衛兵交接與雕塑紀念公園" }
    ]
  },
  {
    id: "route-5614-lion",
    code: "5614",
    name: "獅山線",
    nameEn: "Lion Mountain Route",
    region: "north",
    regionName: "北部",
    county: "新竹縣",
    color: "#8b5cf6",
    tag: "客庄茶香",
    category: "culture",
    summary: "走訪竹東客家聚落、綠世界生態農場、北埔老街與獅頭山古剎。",
    officialUrl: "https://www.taiwantrip.com.tw/Frontend/Route/Select_p?RouteId=R0004",
    fare: "里程計費",
    operator: "新竹客運",
    stops: [
      { name: "高鐵新竹站", lat: 24.8082, lng: 121.0402, desc: "竹北高鐵特區出發" },
      { name: "竹東遊客中心", lat: 24.7392, lng: 121.0924, desc: "竹東火車站旁藝文園區" },
      { name: "綠世界生態農場", lat: 24.6989, lng: 121.0652, desc: "羊駝散步與熱帶鳥園生態園" },
      { name: "北埔老街", lat: 24.6998, lng: 121.0578, desc: "擂茶體驗、金廣福公館" },
      { name: "獅山遊客中心", lat: 24.6465, lng: 121.0253, desc: "水濂洞步道與獅頭山寺廟群" }
    ]
  },
  {
    id: "route-yilan-jiaoxi",
    code: "綠11",
    name: "礁溪線",
    nameEn: "Jiaoxi Route",
    region: "north",
    regionName: "北部",
    county: "宜蘭縣",
    color: "#3b82f6",
    tag: "美人湯泉",
    category: "hotspring",
    summary: "享受礁溪溫泉公園泡腳、五峰旗瀑布健行與佛光大學夜景。",
    officialUrl: "https://www.taiwantrip.com.tw/Frontend/Route/Select_p?RouteId=R0001",
    fare: "一段票",
    operator: "葛瑪蘭客運",
    stops: [
      { name: "礁溪轉運站", lat: 24.8291, lng: 121.7765, desc: "客運鐵路主要轉乘點" },
      { name: "礁溪溫泉公園", lat: 24.8312, lng: 121.7748, desc: "免費森林風呂足湯" },
      { name: "湯圍溝溫泉公園", lat: 24.8276, lng: 121.7709, desc: "溫泉魚咬腳與溫泉街" },
      { name: "五峰旗風景區", lat: 24.8345, lng: 121.7482, desc: "三層壯觀飛瀑與聖母登山步道" },
      { name: "佛光大學曼陀羅滴水坊", lat: 24.8198, lng: 121.7225, desc: "俯瞰蘭陽平原與龜山島" }
    ]
  },

  // ================= 中部地區 =================
  {
    id: "route-6669-sunmoon",
    code: "6669",
    name: "日月潭線",
    nameEn: "Sun Moon Lake Route",
    region: "central",
    regionName: "中部",
    county: "南投縣",
    color: "#0284c7",
    tag: "高山湖泊",
    category: "nature",
    summary: "從高鐵台中站暢通國際知名景點日月潭、水社碼頭、向山遊客中心與九族文化村。",
    officialUrl: "https://www.taiwantrip.com.tw/Frontend/Route/Select_p?RouteId=R0013",
    fare: "里程計費 / 可搭配日月潭套票",
    operator: "南投客運",
    stops: [
      { name: "台中高鐵站", lat: 24.1118, lng: 120.6158, desc: "高鐵轉乘客運總站" },
      { name: "埔里遊客中心", lat: 23.9745, lng: 120.9321, desc: "山城埔里休息站" },
      { name: "九族文化村", lat: 23.8702, lng: 120.9438, desc: "原民主題樂園與纜車站" },
      { name: "日月潭水社遊客中心", lat: 23.8665, lng: 120.9158, desc: "水社碼頭、環湖步道核心" },
      { name: "向山行政暨遊客中心", lat: 23.8524, lng: 120.9023, desc: "清水模建築與向山天空步道" },
      { name: "伊達邵碼頭", lat: 23.8502, lng: 120.9312, desc: "邵族美食老街與纜車終點" }
    ]
  },
  {
    id: "route-6658-qingjing",
    code: "6658",
    name: "清境線",
    nameEn: "Qingjing Route",
    region: "central",
    regionName: "中部",
    county: "南投縣",
    color: "#16a34a",
    tag: "高山農場",
    category: "nature",
    summary: "漫步青青草原綿羊秀、清境高空觀景步道與小瑞士花園歐式風情。",
    officialUrl: "https://www.taiwantrip.com.tw/Frontend/Route/Select_p?RouteId=R0036",
    fare: "里程計費",
    operator: "南投客運",
    stops: [
      { name: "埔里轉運站", lat: 23.9668, lng: 120.9682, desc: "南投客運埔里總站" },
      { name: "霧社", lat: 24.0195, lng: 121.1408, desc: "莫那魯道紀念公園" },
      { name: "小瑞士花園", lat: 24.0435, lng: 121.1578, desc: "歐風花園與水舞秀" },
      { name: "清境農場服務中心", lat: 24.0532, lng: 121.1612, desc: "高空景觀步道售票口" },
      { name: "青青草原", lat: 24.0588, lng: 121.1635, desc: "綿羊脫毛秀與馬術特技秀" },
      { name: "松崗", lat: 24.0682, lng: 121.1691, desc: "清境農場最高民宿區" }
    ]
  },
  {
    id: "route-6883-xitou",
    code: "6883",
    name: "溪頭線",
    nameEn: "Xitou Route",
    region: "central",
    regionName: "中部",
    county: "南投縣",
    color: "#059669",
    tag: "杉林芬多精",
    category: "nature",
    summary: "吸取溪頭自然教育園區森林芬多精，探訪妖怪村日式枯麻街景。",
    officialUrl: "https://www.taiwantrip.com.tw/Frontend/Route/Select_p?RouteId=R0012",
    fare: "里程計費",
    operator: "員林/南投/彰化客運",
    stops: [
      { name: "台中干城站", lat: 24.1402, lng: 120.6865, desc: "台中火車站商圈出發點" },
      { name: "台中高鐵站", lat: 24.1118, lng: 120.6158, desc: "高鐵快速接駁" },
      { name: "竹山交流道", lat: 23.8012, lng: 120.7185, desc: "竹山茶筍轉乘" },
      { name: "內湖國小", lat: 23.7082, lng: 120.7712, desc: "全台最美森林日式小學" },
      { name: "妖怪森林渡假村", lat: 23.6745, lng: 120.7962, desc: "妖怪村日式商圈" },
      { name: "溪頭自然教育園區", lat: 23.6712, lng: 120.7975, desc: "大學池、空中走廊與神木" }
    ]
  },
  {
    id: "route-6936-lukang",
    code: "6936",
    name: "鹿港祈福線",
    nameEn: "Lukang Route",
    region: "central",
    regionName: "中部",
    county: "彰化縣",
    color: "#ea580c",
    tag: "鹿港古蹟",
    category: "culture",
    summary: "漫步鹿港天后宮、龍山寺、摸乳巷、桂花巷藝術村，品嚐牛舌餅古早味。",
    officialUrl: "https://www.taiwantrip.com.tw/Frontend/Route/Select_p?RouteId=R0015",
    fare: "里程計費",
    operator: "彰化客運",
    stops: [
      { name: "台中高鐵站", lat: 24.1118, lng: 120.6158, desc: "高鐵出發直達彰化" },
      { name: "彰化火車站", lat: 24.0818, lng: 120.5385, desc: "扇形車庫周邊" },
      { name: "彰濱秀傳健康園區", lat: 24.0628, lng: 120.4285, desc: "彰濱醫學健康園區" },
      { name: "台灣玻璃館", lat: 24.0685, lng: 120.3952, desc: "玻璃媽祖廟與黃金隧道" },
      { name: "鹿港天后宮", lat: 24.0592, lng: 120.4308, desc: "國定古蹟媽祖廟" },
      { name: "鹿港乘車處(老街)", lat: 24.0535, lng: 120.4325, desc: "鹿港老街、丁家大宅、九曲巷" }
    ]
  },
  {
    id: "route-888-taichung",
    code: "888",
    name: "豐原后里線",
    nameEn: "Fengyuan Houli Route",
    region: "central",
    regionName: "中部",
    county: "臺中市",
    color: "#f43f5e",
    tag: "鐵馬花博",
    category: "nature",
    summary: "后豐鐵馬道自行車騎行、麗寶樂園渡假區、月眉糖廠深度體驗。",
    officialUrl: "https://www.taiwantrip.com.tw/Frontend/Route/Select_p?RouteId=R0088",
    fare: "台中市公車優惠制",
    operator: "中台灣客運",
    stops: [
      { name: "豐原轉運中心", lat: 24.2541, lng: 120.7235, desc: "豐原火車站共構" },
      { name: "后豐鐵馬道起點", lat: 24.2715, lng: 120.7302, desc: "花樑鋼橋與九號隧道" },
      { name: "后里馬場", lat: 24.3012, lng: 120.7285, desc: "百年歷史馬場休閒園區" },
      { name: "月眉糖廠", lat: 24.3168, lng: 120.6975, desc: "百年囪底隧道與冰棒" },
      { name: "麗寶樂園", lat: 24.3235, lng: 120.6958, desc: "探索世界、馬拉灣與天空之夢摩天輪" }
    ]
  },
  {
    id: "route-yunlin-beigang",
    code: "Y02",
    name: "北港虎尾線",
    nameEn: "Beigang Huwei Route",
    region: "central",
    regionName: "中部",
    county: "雲林縣",
    color: "#d97706",
    tag: "布袋戲香火",
    category: "culture",
    summary: "雲林布袋戲館、虎尾鐵橋、北港朝天宮進香與千巧谷牛樂園牧場。",
    officialUrl: "https://www.taiwantrip.com.tw/Frontend/Route/Select_p?RouteId=R0030",
    fare: "一日券 / 里程計費",
    operator: "台西客運",
    stops: [
      { name: "斗六火車站", lat: 23.7118, lng: 120.5435, desc: "斗六市區樞紐" },
      { name: "雲林布袋戲館", lat: 23.7085, lng: 120.4332, desc: "虎尾郡役所歷史建築" },
      { name: "興隆毛巾觀光工廠", lat: 23.7212, lng: 120.4485, desc: "造型毛巾DIY體驗" },
      { name: "北港朝天宮", lat: 23.5682, lng: 120.3045, desc: "全台媽祖信仰中心與北港老街" },
      { name: "北港武德宮", lat: 23.5785, lng: 120.3112, desc: "五路武財神祖廟" }
    ]
  },

  // ================= 南部地區 =================
  {
    id: "route-7322-alishan",
    code: "7322",
    name: "阿里山線-A線(高鐵出發)",
    nameEn: "Alishan Route A",
    region: "south",
    regionName: "南部",
    county: "嘉義縣",
    color: "#047857",
    tag: "日出雲海",
    category: "nature",
    summary: "高鐵嘉義站直通阿里山森林遊樂區、巨木群棧道、奮起湖老街與祝山日出。",
    officialUrl: "https://www.taiwantrip.com.tw/Frontend/Route/Select_p?RouteId=R0010",
    fare: "里程計費",
    operator: "嘉義縣公車處",
    stops: [
      { name: "高鐵嘉義站", lat: 23.4592, lng: 120.3241, desc: "嘉義高鐵站2號月台" },
      { name: "頂六國小", lat: 23.4475, lng: 120.5012, desc: "中埔交流道轉乘" },
      { name: "觸口遊客中心", lat: 23.4402, lng: 120.6015, desc: "阿里山國家風景區管理處、牛埔仔愛情草原" },
      { name: "隙頂(二延平步道)", lat: 23.4285, lng: 120.6558, desc: "雲海、夕陽與茶園步道" },
      { name: "石棹", lat: 23.4735, lng: 120.6978, desc: "奮起湖老街轉乘中繼站" },
      { name: "阿里山森林遊樂區", lat: 23.5108, lng: 120.8035, desc: "神木、祝山日出、小火車" }
    ]
  },
  {
    id: "route-9189-kenting",
    code: "9189",
    name: "墾丁快線",
    nameEn: "Kenting Express",
    region: "south",
    regionName: "南部",
    county: "屏東縣",
    color: "#0284c7",
    tag: "南國碧海",
    category: "coast",
    summary: "高鐵左營站2小時極速抵達恆春古城、南灣沙灘、墾丁大街與小灣。",
    officialUrl: "https://www.taiwantrip.com.tw/Frontend/Route/Select_p?RouteId=R0017",
    fare: "單程352元 / 刷電子票證享半價優惠",
    operator: "屏東/高雄/國光客運",
    stops: [
      { name: "高鐵左營站", lat: 22.6872, lng: 120.3075, desc: "高鐵2樓公車候車區" },
      { name: "枋寮轉運站", lat: 22.3685, lng: 120.5962, desc: "南迴鐵路銜接起點" },
      { name: "車城農會(海口)", lat: 22.0735, lng: 120.7125, desc: "車城福安宮轉乘" },
      { name: "恆春轉運站", lat: 22.0035, lng: 120.7442, desc: "恆春古城南門與海角七號阿嘉的家" },
      { name: "南灣", lat: 21.9582, lng: 120.7635, desc: "水上活動熱門金色沙灘" },
      { name: "墾丁大街(小灣)", lat: 21.9425, lng: 120.7985, desc: "墾丁大街夜市、凱撒小灣沙灘" }
    ]
  },
  {
    id: "route-88-tainan-99",
    code: "99",
    name: "安平台江線",
    nameEn: "Anping Taijiang Route",
    region: "south",
    regionName: "南部",
    county: "臺南市",
    color: "#c026d3",
    tag: "台江紅樹林",
    category: "culture",
    summary: "安平古堡、安平樹屋、四草綠色隧道(台版亞馬遜)與七股鹽山。",
    officialUrl: "https://www.taiwantrip.com.tw/Frontend/Route/Select_p?RouteId=R0011",
    fare: "二段票收費",
    operator: "府城客運",
    stops: [
      { name: "台南轉運站", lat: 23.0035, lng: 120.2125, desc: "台南火車站北側" },
      { name: "赤崁樓", lat: 22.9975, lng: 120.2025, desc: "荷治普羅民遮城古蹟" },
      { name: "安平古堡", lat: 23.0015, lng: 120.1605, desc: "熱蘭遮城古城牆" },
      { name: "安平樹屋", lat: 23.0038, lng: 120.1582, desc: "老榕樹與德記洋行共生奇景" },
      { name: "四草生態文化園區(大眾廟)", lat: 23.0195, lng: 120.1362, desc: "四草綠色隧道紅樹林竹筏" },
      { name: "七股鹽山", lat: 23.1545, lng: 120.1012, desc: "雪白鹽山與鹽雕博物館" }
    ]
  },
  {
    id: "route-kaohsiung-dashe",
    code: "E02",
    name: "哈佛快線",
    nameEn: "Harvard Express Route",
    region: "south",
    regionName: "南部",
    county: "高雄市",
    color: "#d97706",
    tag: "佛陀聖境",
    category: "culture",
    summary: "高鐵左營站直達佛光山與佛陀紀念館，感受壯麗大佛與宗教文化之美。",
    officialUrl: "https://www.taiwantrip.com.tw/Frontend/Route/Select_p?RouteId=R0049",
    fare: "里程計費",
    operator: "高雄客運",
    stops: [
      { name: "高鐵左營站", lat: 22.6872, lng: 120.3075, desc: "高鐵快速乘車月台" },
      { name: "義大世界", lat: 22.7295, lng: 120.4062, desc: "希臘風主題樂園與購物廣場" },
      { name: "佛陀紀念館", lat: 22.7562, lng: 120.4435, desc: "高達108公尺佛光大佛與八塔" },
      { name: "佛光山", lat: 22.7485, lng: 120.4452, desc: "南台灣佛教聖地開山祖庭" }
    ]
  },

  // ================= 東部地區 =================
  {
    id: "route-302-taroko",
    code: "302",
    name: "太魯閣線",
    nameEn: "Taroko Route",
    region: "east",
    regionName: "東部",
    county: "花蓮縣",
    color: "#0891b2",
    tag: "峽谷奇觀",
    category: "nature",
    summary: "探訪立霧溪鬼斧神工大理石峽谷、砂卡礑步道、燕子口與天祥。",
    officialUrl: "https://www.taiwantrip.com.tw/Frontend/Route/Select_p?RouteId=R0002",
    fare: "里程計費 / 太魯閣一日券",
    operator: "太魯閣客運",
    stops: [
      { name: "新城火車站", lat: 24.1278, lng: 121.6412, desc: "太魯閣門戶台鐵車站" },
      { name: "太魯閣遊客中心", lat: 24.1575, lng: 121.6225, desc: "國家公園入口牌樓" },
      { name: "砂卡礑", lat: 24.1605, lng: 121.6152, desc: "碧藍溪水與百步蛇岩壁步道" },
      { name: "布洛灣", lat: 24.1725, lng: 121.5795, desc: "山月吊橋俯瞰壯闊峽谷" },
      { name: "燕子口", lat: 24.1742, lng: 121.5645, desc: "壺穴地形與印地安酋長岩" },
      { name: "天祥", lat: 24.1822, lng: 121.4942, desc: "祥德寺、天峰塔與峽谷河階" }
    ]
  },
  {
    id: "route-8101-eastcoast",
    code: "8101",
    name: "東部海岸線",
    nameEn: "East Coast Route",
    region: "east",
    regionName: "東部",
    county: "臺東縣",
    color: "#0ea5e9",
    tag: "太平洋浪花",
    category: "coast",
    summary: "沿台11線海岸公路遊賞小野柳地質奇景、加路蘭裝置藝術、金樽衝浪與三仙台跨海拱橋。",
    officialUrl: "https://www.taiwantrip.com.tw/Frontend/Route/Select_p?RouteId=R0016",
    fare: "里程計費",
    operator: "興東客運",
    stops: [
      { name: "台東轉運站", lat: 22.7535, lng: 121.1462, desc: "台東舊站商圈中心" },
      { name: "小野柳", lat: 22.7952, lng: 121.1965, desc: "豆腐岩、蕈狀岩等海蝕奇觀" },
      { name: "加路蘭", lat: 22.8085, lng: 121.1985, desc: "原民漂流木裝置藝術與海景公園" },
      { name: "杉原灣(富山漁業保護區)", lat: 22.8272, lng: 121.1895, desc: "潮間帶餵魚生態體驗" },
      { name: "都蘭糖廠", lat: 22.8752, lng: 121.2265, desc: "文創咖啡館與手作市集" },
      { name: "金樽", lat: 22.9555, lng: 121.2912, desc: "國際衝浪基地與陸連島咖啡" },
      { name: "三仙台遊憩區", lat: 23.1235, lng: 121.4162, desc: "八拱跨海大橋與仙人傳奇" }
    ]
  },
  {
    id: "route-8168-eastrift",
    code: "8168",
    name: "縱谷鹿野線",
    nameEn: "East Rift Valley Luye Route",
    region: "east",
    regionName: "東部",
    county: "臺東縣",
    color: "#84cc16",
    tag: "熱氣球茶鄉",
    category: "nature",
    summary: "初鹿牧場鮮乳、鹿野高台熱氣球嘉年華、崑慈堂與龍田綠色隧道。",
    officialUrl: "https://www.taiwantrip.com.tw/Frontend/Route/Select_p?RouteId=R0014",
    fare: "里程計費",
    operator: "東台灣客運",
    stops: [
      { name: "台東火車站", lat: 22.7935, lng: 121.1225, desc: "台東新站大廳出發" },
      { name: "卑南遺址公園", lat: 22.7925, lng: 121.1142, desc: "新石器時代石板棺史前遺址" },
      { name: "初鹿牧場", lat: 22.8615, lng: 121.1092, desc: "純淨牧場鮮奶與滑草場" },
      { name: "原生應用植物園", lat: 22.8652, lng: 121.1125, desc: "台東藥草植物汆燙鍋" },
      { name: "龍田昆慈堂", lat: 22.9052, lng: 121.1238, desc: "日本移民村與龍田自行車道" },
      { name: "鹿野高台", lat: 22.9152, lng: 121.1185, desc: "台灣國際熱氣球嘉年華主場地" }
    ]
  },
  {
    id: "route-303-hualien-valley",
    code: "303",
    name: "縱谷花蓮線",
    nameEn: "Hualien Valley Route",
    region: "east",
    regionName: "東部",
    county: "花蓮縣",
    color: "#10b981",
    tag: "花東縱谷",
    category: "nature",
    summary: "鯉魚潭踩天鵝船、立川漁場摸蜆、新光兆豐休閒農場與光復糖廠吃冰。",
    officialUrl: "https://www.taiwantrip.com.tw/Frontend/Route/Select_p?RouteId=R0019",
    fare: "里程計費",
    operator: "太魯閣客運",
    stops: [
      { name: "花蓮火車站", lat: 23.9935, lng: 121.6015, desc: "花蓮後站出發" },
      { name: "慶修院", lat: 23.9742, lng: 121.5645, desc: "花蓮吉安三級古蹟日式真言宗神社" },
      { name: "鯉魚潭潭北遊客中心", lat: 23.9312, lng: 121.5125, desc: "環潭自行車道與湖面泛舟" },
      { name: "立川漁場", lat: 23.8652, lng: 121.5085, desc: "黃金蜆養殖場摸蜆體驗" },
      { name: "兆豐休閒農場", lat: 23.8052, lng: 121.4585, desc: "小浣熊、乳牛與溫泉度假村" },
      { name: "花蓮觀光糖廠(光復糖廠)", lat: 23.6645, lng: 121.4215, desc: "日式木造宿舍群與古早味冰棒" }
    ]
  },

  // ================= 離島地區 =================
  {
    id: "route-kinmen-a-shuitou",
    code: "金門A線",
    name: "金門水頭翟山線",
    nameEn: "Kinmen Shuitou Zhaishan Route",
    region: "islands",
    regionName: "離島",
    county: "金門縣",
    color: "#b45309",
    tag: "戰地洋樓",
    category: "culture",
    summary: "金城車站出發，導覽莒光樓、水頭聚落得月樓、古崗湖與鬼斧神工翟山坑道。",
    officialUrl: "https://www.taiwantrip.com.tw/Frontend/Route/Select_p?RouteId=R0020",
    fare: "半日券 / 一日券 (含隨車導覽)",
    operator: "金門縣公共車船管理處",
    stops: [
      { name: "金城車站", lat: 24.4328, lng: 118.3182, desc: "金門交通核心總站" },
      { name: "莒光樓", lat: 24.4245, lng: 118.3152, desc: "金門戰地精神地標" },
      { name: "水頭聚落(得月樓)", lat: 24.4105, lng: 118.2975, desc: "番仔樓防禦銃樓與閩南古厝" },
      { name: "文台寶塔", lat: 24.3985, lng: 118.3045, desc: "明代航海石塔古蹟" },
      { name: "翟山坑道", lat: 24.3895, lng: 118.3195, desc: "A字型地下水上補給坑道" }
    ]
  },
  {
    id: "route-penghu-magong",
    code: "媽宮北環",
    name: "澎湖媽宮北環線",
    nameEn: "Penghu North Ring Route",
    region: "islands",
    regionName: "離島",
    county: "澎湖縣",
    color: "#0369a1",
    tag: "跨海大橋玄武岩",
    category: "coast",
    summary: "遊覽澎湖跨海大橋、通樑古榕、大菓葉柱狀玄武岩、二崁傳統聚落與二崁傳香。",
    officialUrl: "https://www.taiwantrip.com.tw/Frontend/Route/Select_p?RouteId=R0039",
    fare: "郵輪式公車一日券(預約制)",
    operator: "澎湖縣公共車船管理處",
    stops: [
      { name: "馬公公車總站", lat: 23.5658, lng: 119.5662, desc: "馬公市區出發點" },
      { name: "通樑古榕", lat: 23.6575, lng: 119.5562, desc: "三百餘年氣根成蔭老榕樹" },
      { name: "澎湖跨海大橋", lat: 23.6538, lng: 119.5445, desc: "橫跨白沙與西嶼之海洋地標" },
      { name: "大菓葉柱狀玄武岩", lat: 23.6035, lng: 119.5132, desc: "火山熔岩冷卻節理六角玄武岩" },
      { name: "二崁傳統聚落", lat: 23.6052, lng: 119.5185, desc: "咾咕石與紅磚閩南傳統建築群" },
      { name: "小門鯨魚洞", lat: 23.6525, lng: 119.5195, desc: "海蝕巨洞與小門地質館" }
    ]
  },
  {
    id: "route-matsu-nangan",
    code: "馬祖南竿",
    name: "馬祖南竿巨神像線",
    nameEn: "Matsu Nangan Route",
    region: "islands",
    regionName: "離島",
    county: "連江縣",
    color: "#4f46e5",
    tag: "藍眼淚媽祖",
    category: "culture",
    summary: "探訪媽祖巨神像、天后宮、八八坑道、北海坑道搖櫓體驗與津沙聚落。",
    officialUrl: "https://www.taiwantrip.com.tw/Frontend/Route/Select_p?RouteId=R0060",
    fare: "觀光公車票券",
    operator: "連江縣公共車船管理處",
    stops: [
      { name: "福澳港", lat: 26.1552, lng: 119.9395, desc: "馬祖海運樞紐轉運站" },
      { name: "八八坑道", lat: 26.1585, lng: 119.9542, desc: "馬祖高粱酒陳年酒窖" },
      { name: "馬祖天后宮", lat: 26.1565, lng: 119.9185, desc: "媽祖靈穴所在地" },
      { name: "媽祖巨神像", lat: 26.1595, lng: 119.9142, desc: "高達28.8公尺守護神像" },
      { name: "北海坑道", lat: 26.1435, lng: 119.9285, desc: "花崗岩開鑿水上坑道與夜賞藍眼淚" },
      { name: "津沙聚落", lat: 26.1425, lng: 119.9172, desc: "百年石頭屋古聚落與海灣" }
    ]
  }
];

// 預設區域與縣市對應表
const REGIONS_MAP = {
  north: { name: "北部地區", counties: ["臺北市", "新北市", "桃園市", "新竹縣", "宜蘭縣", "基隆市"] },
  central: { name: "中部地區", counties: ["臺中市", "南投縣", "彰化縣", "雲林縣", "苗栗縣"] },
  south: { name: "南部地區", counties: ["嘉義縣", "嘉義市", "臺南市", "高雄市", "屏東縣"] },
  east: { name: "東部地區", counties: ["花蓮縣", "臺東縣"] },
  islands: { name: "離島地區", counties: ["金門縣", "澎湖縣", "連江縣"] }
};
