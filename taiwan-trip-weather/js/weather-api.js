/**
 * 中央氣象署 (CWA) O-A0003-001 氣象觀測資料模組
 * 負責串接即時 API、測站距離配對 (Haversine Formula)、氣象要素解析與備援資料集
 */

class CWAWeatherService {
  constructor() {
    this.API_BASE_URL = "/api/trip-weather";
    this.cacheKey = "taiwan_trip_weather_cache_v2";
    this.cacheExpiry = 5 * 60 * 1000; // 5 分鐘快取
    this.stations = [];
    this.lastFetched = null;
    this.lastSource = "none";
    // 舊版曾將使用者金鑰存於瀏覽器；升級後立即移除，不再由前端管理密鑰。
    localStorage.removeItem("cwa_api_key");
  }

  /**
   * 計算兩經緯度點的距離 (公里) - Haversine Formula
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // 地球半徑 (km)
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * 取得天氣數據（優先呼叫同站 Python API，失敗時使用備援資料）
   */
  async fetchWeatherData(forceRefresh = false) {
    // 檢查瀏覽器快取
    if (!forceRefresh) {
      const cached = this.getCachedData();
      if (cached && cached.stations && cached.stations.length > 0) {
        this.stations = cached.stations;
        this.lastFetched = new Date(cached.timestamp);
        this.lastSource = cached.source || "cache";
        return {
          source: this.lastSource,
          timestamp: this.lastFetched,
          stations: this.stations
        };
      }
    }

    try {
      const response = await fetch(this.API_BASE_URL, {
        cache: forceRefresh ? "reload" : "default",
        headers: { Accept: "application/json" }
      });
      if (!response.ok) {
        throw new Error(`氣象服務回應錯誤: HTTP ${response.status}`);
      }

      const data = await response.json();
      if (!data || data.success !== true || !Array.isArray(data.stations) || data.stations.length === 0) {
        throw new Error("氣象服務沒有可用的測站資料");
      }

      const parsed = data.stations
        .map(station => this.normalizeProxyStation(station))
        .filter(Boolean);
      if (!parsed.length) {
        throw new Error("氣象服務測站格式無法使用");
      }

      this.stations = parsed;
      this.lastFetched = data.updatedAt ? new Date(data.updatedAt) : new Date();
      this.lastSource = data.source || "cwa-live";
      this.saveCache(parsed, this.lastSource);
      return {
        source: this.lastSource,
        timestamp: this.lastFetched,
        stations: this.stations
      };
    } catch (err) {
      console.warn("安全氣象 API 連線失敗，切換至備援測站資料:", err);
    }

    // GitHub Pages 或 API 暫時不可用時的展示備援資料
    const fallbackStations = this.generateFallbackStations();
    this.stations = fallbackStations;
    this.lastFetched = new Date();
    this.lastSource = "fallback-error";
    this.saveCache(fallbackStations, this.lastSource);

    return {
      source: this.lastSource,
      timestamp: this.lastFetched,
      stations: this.stations
    };
  }

  saveCache(stations, source) {
    try {
      const cacheObj = {
        timestamp: Date.now(),
        source: source,
        stations: stations
      };
      localStorage.setItem(this.cacheKey, JSON.stringify(cacheObj));
    } catch (e) {
      console.warn("無法寫入氣象快取", e);
    }
  }

  getCachedData() {
    try {
      const raw = localStorage.getItem(this.cacheKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (Date.now() - parsed.timestamp < this.cacheExpiry) {
        return parsed;
      }
    } catch (e) {
      return null;
    }
    return null;
  }

  /**
   * 將 Python API 的正規化資料補上前端顯示欄位
   */
  normalizeProxyStation(station) {
    const toOptionalNumber = value => {
      if (value === null || value === undefined || value === "") return null;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    };
    const lat = toOptionalNumber(station.latitude);
    const lng = toOptionalNumber(station.longitude);
    const temp = toOptionalNumber(station.temperature);
    if (!station.stationId || !station.stationName || lat === null || lng === null || temp === null) {
      return null;
    }

    const humidity = toOptionalNumber(station.humidity) ?? 75;
    const precipitation = toOptionalNumber(station.precipitation) ?? 0;
    const windSpeed = toOptionalNumber(station.windSpeed) ?? 0;
    const windDirection = toOptionalNumber(station.windDirection) ?? 0;
    const pressure = toOptionalNumber(station.pressure) ?? 0;
    const weatherText = station.weatherText || this.inferWeatherDescription(temp, precipitation, humidity);
    const uvValue = toOptionalNumber(station.uvIndex);
    const uvIndex = uvValue !== null
      ? this.formatUV(uvValue)
      : this.estimateUV(temp, precipitation);
    const dailyHigh = toOptionalNumber(station.dailyHigh);
    const dailyLow = toOptionalNumber(station.dailyLow);
    const observedAt = station.observedAt ? new Date(station.observedAt) : new Date();

    return {
      stationId: station.stationId,
      stationName: station.stationName,
      lat,
      lng,
      county: station.county || "",
      town: station.town || "",
      temp,
      feelsLike: this.calculateFeelsLike(temp, humidity, windSpeed),
      humidity,
      precipitation,
      windSpeed,
      windDirection,
      pressure,
      weatherText,
      icon: this.getWeatherIcon(weatherText, precipitation, temp),
      uvIndex,
      dailyHigh: dailyHigh !== null ? `${dailyHigh}°C` : "--",
      dailyLow: dailyLow !== null ? `${dailyLow}°C` : "--",
      obsTime: observedAt.toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" })
    };
  }

  /**
   * 為指定經緯度配對最近的氣象站
   */
  findNearestStation(lat, lng) {
    if (!this.stations || this.stations.length === 0) {
      return null;
    }

    let nearest = null;
    let minDistance = Infinity;

    for (const station of this.stations) {
      if (!station.lat || !station.lng || (station.lat === 0 && station.lng === 0)) continue;
      const dist = this.calculateDistance(lat, lng, station.lat, station.lng);
      if (dist < minDistance) {
        minDistance = dist;
        nearest = { ...station, distanceKm: Math.round(dist * 10) / 10 };
      }
    }

    return nearest;
  }

  /**
   * 計算體感溫度
   */
  calculateFeelsLike(temp, humidity, windSpeed) {
    const e = (humidity / 100) * 6.105 * Math.exp((17.27 * temp) / (237.7 + temp));
    const fl = temp + 0.33 * e - 0.7 * windSpeed - 4.0;
    return Math.round(fl * 10) / 10;
  }

  /**
   * 天氣圖示對應
   */
  getWeatherIcon(desc, rain, temp) {
    if (rain > 5) return { icon: "fa-cloud-showers-heavy", type: "heavy-rain", label: "大雨" };
    if (rain > 0.5) return { icon: "fa-cloud-rain", type: "rain", label: "陣雨" };
    if (desc.includes("雷")) return { icon: "fa-bolt-lightning", type: "storm", label: "雷雨" };
    if (desc.includes("雨")) return { icon: "fa-cloud-sun-rain", type: "light-rain", label: "短暫雨" };
    if (desc.includes("陰")) return { icon: "fa-cloud", type: "cloudy", label: "陰天" };
    if (desc.includes("多雲")) return { icon: "fa-cloud-sun", type: "partly-cloudy", label: "多雲時晴" };
    if (desc.includes("霧")) return { icon: "fa-smog", type: "fog", label: "有霧" };
    return { icon: "fa-sun", type: "clear", label: "晴朗" };
  }

  inferWeatherDescription(temp, rain, humidity) {
    if (rain > 5) return "大雨特報";
    if (rain > 0.5) return "陰有陣雨";
    if (rain > 0) return "短暫微雨";
    if (humidity > 85) return "陰天微霧";
    if (humidity > 70) return "多雲時陰";
    return "晴時多雲";
  }

  formatUV(uv) {
    if (uv >= 11) return { index: uv, level: "危險級", color: "#9333ea" };
    if (uv >= 8) return { index: uv, level: "過量級", color: "#ef4444" };
    if (uv >= 6) return { index: uv, level: "高量級", color: "#f59e0b" };
    if (uv >= 3) return { index: uv, level: "中量級", color: "#eab308" };
    return { index: uv, level: "低量級", color: "#10b981" };
  }

  estimateUV(temp, rain) {
    const hour = new Date().getHours();
    const isNight = hour >= 18 || hour <= 6;
    if (isNight) return { index: 0, level: "無紫外線", color: "#64748b" };
    if (rain > 0) return { index: 2, level: "低量級", color: "#10b981" };
    if (temp > 30) return { index: 8, level: "過量級", color: "#ef4444" };
    if (temp > 26) return { index: 6, level: "高量級", color: "#f59e0b" };
    return { index: 4, level: "中量級", color: "#eab308" };
  }

  /**
   * 智慧旅遊穿搭與裝備建議 (結合路線地理特色與實時氣候)
   */
  generateTravelAdvice(weather, route = null) {
    const tips = [];
    const outfits = [];
    const items = [];

    const isRaining = weather.precipitation > 0;
    const isHeavyRain = weather.precipitation > 2;
    const routeCategory = route ? route.category : "nature";
    const routeName = route ? route.name : "";
    const routeCounty = route ? route.county : "";
    const isIsland = route && route.region === "islands";
    const isMountain = routeName.includes("阿里山") || routeName.includes("清境") || routeName.includes("溪頭") || routeName.includes("竹子湖") || routeName.includes("太魯閣") || routeName.includes("獅山");
    const isCoast = routeCategory === "coast" || routeName.includes("墾丁") || routeName.includes("海岸") || routeName.includes("福隆") || isIsland;
    const isHotspring = routeCategory === "hotspring" || routeName.includes("礁溪") || routeName.includes("溫泉");
    const isCulture = routeCategory === "culture" || routeName.includes("老街") || routeName.includes("鹿港") || routeName.includes("安平") || routeName.includes("北港");

    // 1. 氣溫與體感穿搭
    if (weather.temp >= 30) {
      outfits.push("超輕量排汗短袖", "涼感透氣短褲/休閒裙", "寬簷透氣遮陽帽");
      if (isCoast) outfits.push("防曬防海風薄罩衫");
    } else if (weather.temp >= 24) {
      outfits.push("舒適棉質短袖/薄長袖", "輕便休閒褲", "好走健行球鞋");
      if (isMountain) outfits.push("隨身薄防風外套");
    } else if (weather.temp >= 18) {
      outfits.push("長袖保暖上衣", "防風透氣機能外套", "長褲/休閒運動褲");
      if (isMountain) outfits.push("洋蔥式內搭層");
    } else if (weather.temp >= 12) {
      outfits.push("發熱機能內著", "刷毛防風夾克/連帽衫", "防風保暖長褲");
      outfits.push("輕暖圍脖或毛帽");
    } else {
      outfits.push("厚羽絨防寒外套", "防風防水重磅長褲", "發熱衣與保暖毛帽");
      outfits.push("防寒手套");
    }

    // 2. 隨身裝備與配件
    if (isHeavyRain) {
      items.push("自動防風大折疊傘 / 輕便雨衣", "防水防滑健行鞋 / 防水鞋套", "背包防水防雨罩", "隨身乾毛巾與夾鏈袋");
    } else if (isRaining) {
      items.push("晴雨兩用便攜折疊傘", "防潑水防滑鞋", "手機防潮夾鏈袋");
    } else {
      items.push("隨身水壺(保持補水)", "行動電源", "悠遊卡 / 一卡通 (好行乘車)");
    }

    // 紫外線防護
    if (weather.uvIndex.index >= 6) {
      items.push("SPF50+ 高係數防曬乳", "抗UV400太陽眼鏡", "抗紫外線遮陽傘");
    }

    // 依地理型態補充裝備
    if (isMountain) {
      items.push("輕便登山杖 / 護膝", "防蚊液 (山區蚊蟲防護)", "隨身熱水保溫瓶");
    } else if (isCoast) {
      items.push("防風繩帽子固定夾", "防海水防潮袋", "海灘止滑拖鞋");
    } else if (isHotspring) {
      items.push("吸水速乾毛巾", "更換用內著衣物", "防水提袋");
    } else if (isCulture) {
      items.push("零錢小包 (老街小吃)", "環保購物提袋", "隨身摺疊扇");
    }

    // 3. 專屬動態旅遊注意事項 (避免語氣衝突)
    if (isHeavyRain) {
      tips.push(`⚠️ 當前測站觀測雨量達 ${weather.precipitation}mm，山區步道與石階濕滑，請特別注意落石與行走安全。`);
    } else if (isRaining) {
      tips.push(`🌧️ 沿線目前有短暫降雨 (${weather.precipitation}mm)，建議攜帶雨具，戶外行程可穿插室內展館/老街茶樓。`);
    } else {
      if (weather.temp >= 30) {
        tips.push(`☀️ 當前氣溫炎熱 (${weather.temp}°C)，請注意防曬、定時補充水分，中午時段可多利用樹蔭或冷氣場館避暑。`);
      } else if (weather.temp >= 22) {
        tips.push(`🌿 當前氣溫 ${weather.temp}°C 舒適宜人，非常適合戶外步道健行、拍照打卡與搭乘台灣好行觀光。`);
      } else {
        tips.push(`🍃 當前氣溫偏涼 (${weather.temp}°C)，早晚溫差顯著，建議準備外套隨時增減衣物。`);
      }
    }

    // 依特定景點路線客製在地指引
    if (routeName.includes("阿里山")) {
      tips.push("🌲 阿里山高海拔地區氣溫約較平地低 10~12°C，若要觀賞祝山日出或二延平步道雲海，清晨務必穿妥保暖厚外套。");
    } else if (routeName.includes("日月潭")) {
      tips.push("⛴️ 日月潭湖畔清晨與午後水氣豐富易起微霧，向山天空步道與水社碼頭搭船時請留意腳下階梯防滑。");
    } else if (routeName.includes("墾丁")) {
      tips.push("🌊 恆春半島陽光與落山風強勁，南灣或小灣海邊踏浪請留意浪潮安全，並做好全身防曬。");
    } else if (routeName.includes("太魯閣")) {
      tips.push("⛰️ 太魯閣大理石峽谷鬼斧神工，走訪砂卡礑或燕子口步道時請配戴安全帽，天雨時留意邊坡路況。");
    } else if (routeName.includes("北投竹子湖")) {
      tips.push("🌸 陽明山竹子湖與地熱谷山區地形多變，午後偶有山嵐微雨，漫步海芋繡球花田建議穿著抓地防滑鞋。");
    } else if (routeName.includes("礁溪")) {
      tips.push("♨️ 礁溪溫泉公園足湯與五峰旗瀑布健行，建議隨身自備小毛巾，泡湯後適度補充水分。");
    } else if (routeName.includes("澎湖") || routeName.includes("金門") || routeName.includes("馬祖")) {
      tips.push("🏝️ 海島地區海風與紫外線直接反射，戶外拍照時請抓牢帽子與手機，並隨時防曬保濕。");
    } else if (isCulture) {
      tips.push(`🏮 探訪 ${routeCounty} ${routeName} 之傳統老街與古蹟建築，步行距離較長，穿著輕便鞋款更輕鬆。`);
    }

    if (weather.windSpeed >= 4.5) {
      tips.push(`💨 沿線目前測得風速 ${weather.windSpeed}m/s (風力明顯)，空曠處請留意隨身帽子防風飛失。`);
    }

    return {
      outfits: outfits,
      items: items,
      tips: tips
    };
  }

  /**
   * 建立全台各縣市與觀光勝地真實觀測站資料庫 (備援使用)
   */
  generateFallbackStations() {
    const baseStations = [
      // 台北/新北
      { id: "466920", name: "臺北", county: "臺北市", town: "中正區", lat: 25.0377, lng: 121.5149, temp: 28.5, hum: 68, rain: 0, wind: 2.1, dir: 80, text: "多雲時晴" },
      { id: "466930", name: "鞍部(陽明山)", county: "臺北市", town: "北投區", lat: 25.1826, lng: 121.5297, temp: 22.1, hum: 82, rain: 0.5, wind: 3.8, dir: 70, text: "陰天微雨" },
      { id: "C0A980", name: "北投", county: "臺北市", town: "北投區", lat: 25.1325, lng: 121.5015, temp: 27.8, hum: 70, rain: 0, wind: 1.8, dir: 90, text: "多雲" },
      { id: "466940", name: "基隆", county: "基隆市", town: "仁愛區", lat: 25.1333, lng: 121.7405, temp: 27.2, hum: 75, rain: 0, wind: 3.5, dir: 60, text: "多雲時晴" },
      { id: "C0A520", name: "野柳", county: "新北市", town: "萬里區", lat: 25.2058, lng: 121.6892, temp: 26.9, hum: 76, rain: 0, wind: 4.2, dir: 50, text: "晴時多雲" },
      { id: "C0A560", name: "九份(金瓜石)", county: "新北市", town: "瑞芳區", lat: 25.1112, lng: 121.8465, temp: 24.5, hum: 79, rain: 0.5, wind: 3.1, dir: 65, text: "多雲偶陣雨" },
      { id: "C0A940", name: "福隆", county: "新北市", town: "貢寮區", lat: 25.0185, lng: 121.9452, temp: 27.6, hum: 74, rain: 0, wind: 3.9, dir: 55, text: "晴朗" },
      { id: "C0C700", name: "大溪", county: "桃園市", town: "大溪區", lat: 24.8825, lng: 121.2865, temp: 28.2, hum: 67, rain: 0, wind: 2.0, dir: 100, text: "晴時多雲" },
      { id: "C0D570", name: "北埔", county: "新竹縣", town: "北埔鄉", lat: 24.7005, lng: 121.0562, temp: 27.5, hum: 70, rain: 0, wind: 1.5, dir: 110, text: "晴朗" },
      { id: "467080", name: "宜蘭(礁溪)", county: "宜蘭縣", town: "礁溪鄉", lat: 24.8285, lng: 121.7752, temp: 27.9, hum: 76, rain: 0, wind: 2.4, dir: 85, text: "多雲時晴" },

      // 中部
      { id: "467490", name: "臺中", county: "臺中市", town: "北區", lat: 24.1458, lng: 120.6841, temp: 29.8, hum: 62, rain: 0, wind: 2.2, dir: 180, text: "晴朗" },
      { id: "C0F970", name: "后里", county: "臺中市", town: "后里區", lat: 24.3052, lng: 120.7251, temp: 29.1, hum: 64, rain: 0, wind: 2.5, dir: 190, text: "晴朗" },
      { id: "467650", name: "日月潭", county: "南投縣", town: "魚池鄉", lat: 23.8814, lng: 120.9081, temp: 24.8, hum: 75, rain: 0, wind: 1.6, dir: 140, text: "多雲時晴" },
      { id: "C0H990", name: "清境農場", county: "南投縣", town: "仁愛鄉", lat: 24.0565, lng: 121.1625, temp: 19.5, hum: 78, rain: 0, wind: 2.0, dir: 120, text: "多雲涼爽" },
      { id: "C0I010", name: "溪頭", county: "南投縣", town: "鹿谷鄉", lat: 23.6725, lng: 120.7968, temp: 21.3, hum: 84, rain: 0.2, wind: 1.2, dir: 150, text: "陰天薄霧" },
      { id: "C0G650", name: "鹿港", county: "彰化縣", town: "鹿港鎮", lat: 24.0562, lng: 120.4315, temp: 29.5, hum: 66, rain: 0, wind: 3.4, dir: 200, text: "晴朗" },
      { id: "C0K430", name: "北港", county: "雲林縣", town: "北港鎮", lat: 23.5712, lng: 120.3052, temp: 30.2, hum: 63, rain: 0, wind: 2.3, dir: 195, text: "晴朗" },

      // 南部
      { id: "467530", name: "阿里山", county: "嘉義縣", town: "阿里山鄉", lat: 23.5085, lng: 120.8132, temp: 15.6, hum: 88, rain: 0.8, wind: 1.9, dir: 90, text: "陰天山嵐" },
      { id: "C0M710", name: "隙頂", county: "嘉義縣", town: "番路鄉", lat: 23.4305, lng: 120.6582, temp: 20.8, hum: 80, rain: 0, wind: 1.8, dir: 100, text: "多雲" },
      { id: "467410", name: "臺南", county: "臺南市", town: "中西區", lat: 22.9932, lng: 120.2035, temp: 30.8, hum: 65, rain: 0, wind: 2.6, dir: 210, text: "晴朗炎熱" },
      { id: "C0X180", name: "安平", county: "臺南市", town: "安平區", lat: 23.0012, lng: 120.1595, temp: 30.4, hum: 68, rain: 0, wind: 3.8, dir: 220, text: "晴朗" },
      { id: "467440", name: "高雄", county: "高雄市", town: "前鎮區", lat: 22.5660, lng: 120.3157, temp: 31.2, hum: 66, rain: 0, wind: 2.8, dir: 215, text: "晴朗陽光" },
      { id: "C0V680", name: "大樹(佛光山)", county: "高雄市", town: "大樹區", lat: 22.7512, lng: 120.4425, temp: 30.9, hum: 64, rain: 0, wind: 2.1, dir: 200, text: "晴朗" },
      { id: "467590", name: "恆春(墾丁)", county: "屏東縣", town: "恆春鎮", lat: 22.0041, lng: 120.7463, temp: 30.5, hum: 72, rain: 0, wind: 4.8, dir: 120, text: "晴朗微風" },
      { id: "C0R220", name: "南灣", county: "屏東縣", town: "恆春鎮", lat: 21.9592, lng: 120.7645, temp: 31.0, hum: 71, rain: 0, wind: 4.5, dir: 115, text: "碧海晴天" },

      // 東部
      { id: "466990", name: "花蓮", county: "花蓮縣", town: "花蓮市", lat: 23.9752, lng: 121.6132, temp: 28.7, hum: 73, rain: 0, wind: 2.9, dir: 110, text: "多雲時晴" },
      { id: "C0T820", name: "天祥(太魯閣)", county: "花蓮縣", town: "秀林鄉", lat: 24.1835, lng: 121.4952, temp: 24.2, hum: 81, rain: 0.3, wind: 2.1, dir: 80, text: "陰天峽谷微風" },
      { id: "C0T900", name: "光復(花蓮糖廠)", county: "花蓮縣", town: "光復鄉", lat: 23.6665, lng: 121.4235, temp: 28.3, hum: 72, rain: 0, wind: 2.0, dir: 130, text: "晴時多雲" },
      { id: "467660", name: "臺東", county: "臺東縣", town: "臺東市", lat: 22.7554, lng: 121.1546, temp: 29.4, hum: 70, rain: 0, wind: 3.1, dir: 120, text: "晴朗" },
      { id: "C0S690", name: "三仙台(成功)", county: "臺東縣", town: "成功鎮", lat: 23.1252, lng: 121.4175, temp: 28.6, hum: 75, rain: 0, wind: 4.0, dir: 100, text: "晴時多雲" },
      { id: "C0S730", name: "鹿野", county: "臺東縣", town: "鹿野鄉", lat: 22.9125, lng: 121.1195, temp: 28.8, hum: 69, rain: 0, wind: 2.4, dir: 125, text: "晴朗熱氣球好天氣" },

      // 離島
      { id: "467110", name: "金門", county: "金門縣", town: "金城鎮", lat: 24.4058, lng: 118.2889, temp: 28.1, hum: 68, rain: 0, wind: 3.6, dir: 75, text: "晴朗" },
      { id: "467350", name: "澎湖(馬公)", county: "澎湖縣", town: "馬公市", lat: 23.5655, lng: 119.5631, temp: 29.2, hum: 74, rain: 0, wind: 5.2, dir: 60, text: "晴朗海風" },
      { id: "467990", name: "馬祖(南竿)", county: "連江縣", town: "南竿鄉", lat: 26.1558, lng: 119.9235, temp: 26.5, hum: 76, rain: 0, wind: 4.6, dir: 70, text: "多雲微風" }
    ];

    return baseStations.map(st => ({
      stationId: st.id,
      stationName: st.name,
      lat: st.lat,
      lng: st.lng,
      county: st.county,
      town: st.town,
      temp: st.temp,
      feelsLike: this.calculateFeelsLike(st.temp, st.hum, st.wind),
      humidity: st.hum,
      precipitation: st.rain,
      windSpeed: st.wind,
      windDirection: st.dir,
      pressure: 1012,
      weatherText: st.text,
      icon: this.getWeatherIcon(st.text, st.rain, st.temp),
      uvIndex: this.estimateUV(st.temp, st.rain),
      dailyHigh: `${Math.round((st.temp + 2.5) * 10) / 10}°C`,
      dailyLow: `${Math.round((st.temp - 3.0) * 10) / 10}°C`,
      obsTime: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
    }));
  }
}

// 實例化全域天氣服務
const weatherService = new CWAWeatherService();
