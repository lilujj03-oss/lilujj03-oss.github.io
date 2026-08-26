/**
 * 應用程式主邏輯控制器 (App Controller)
 * 整合台灣好行路線清單、CWA 氣象查詢、即時穿著建議、地圖聯動與 UI 互動
 */

class TaiwanTripWeatherApp {
  constructor() {
    this.routes = TAIWAN_TRIP_ROUTES;
    this.currentRoute = null;
    this.currentRegion = "all";
    this.currentCounty = "all";
    this.currentCategory = "all";
    this.searchQuery = "";
    this.favorites = this.loadFavorites();
    this.onlyFavorites = false;
    this.isDarkMode = localStorage.getItem("theme_mode") === "dark";

    this.initElements();
    this.initTheme();
    this.initEventListeners();
    this.initApp();
  }

  initElements() {
    // 篩選與搜尋
    this.regionTabs = document.querySelectorAll(".region-tab");
    this.countySelect = document.getElementById("county-select");
    this.categoryPills = document.querySelectorAll(".category-pill");
    this.searchInput = document.getElementById("route-search-input");
    this.clearSearchBtn = document.getElementById("clear-search-btn");
    this.favoriteFilterBtn = document.getElementById("filter-favorite-btn");
    this.routesCountEl = document.getElementById("routes-count");
    this.routesGrid = document.getElementById("routes-grid");

    // 詳情面板
    this.detailPanel = document.getElementById("route-detail-panel");
    this.routeTitle = document.getElementById("detail-route-title");
    this.routeCode = document.getElementById("detail-route-code");
    this.routeCounty = document.getElementById("detail-route-county");
    this.routeTag = document.getElementById("detail-route-tag");
    this.routeSummary = document.getElementById("detail-route-summary");
    this.routeOperator = document.getElementById("detail-route-operator");
    this.routeFare = document.getElementById("detail-route-fare");
    this.routeOfficialLink = document.getElementById("detail-route-official-link");
    this.btnFavoriteDetail = document.getElementById("detail-favorite-btn");

    // 氣象概況指標
    this.wOverallIcon = document.getElementById("w-overall-icon");
    this.wOverallTemp = document.getElementById("w-overall-temp");
    this.wOverallStatus = document.getElementById("w-overall-status");
    this.wFeelsLike = document.getElementById("w-feels-like");
    this.wRain = document.getElementById("w-rain");
    this.wHumidity = document.getElementById("w-humidity");
    this.wWind = document.getElementById("w-wind");
    this.wUv = document.getElementById("w-uv");
    this.wDailyExtremes = document.getElementById("w-daily-extremes");
    this.wStationInfo = document.getElementById("w-station-info");
    this.wDataSourceBadge = document.getElementById("w-data-source-badge");

    // 旅遊建議與站點時間軸
    this.travelAdviceCard = document.querySelector(".travel-advice-card");
    this.adviceOutfits = document.getElementById("advice-outfits");
    this.adviceItems = document.getElementById("advice-items");
    this.adviceTips = document.getElementById("advice-tips");
    this.stopsTimeline = document.getElementById("stops-timeline");

    // 按鈕與對話框
    this.btnRefreshWeather = document.getElementById("btn-refresh-weather");
    this.btnApiKeyModal = document.getElementById("btn-api-key-modal");
    this.apiKeyModal = document.getElementById("api-key-modal");
    this.apiKeyInput = document.getElementById("cwa-api-key-input");
    this.btnSaveApiKey = document.getElementById("btn-save-api-key");
    this.btnClearApiKey = document.getElementById("btn-clear-api-key");
    this.btnTestApiKey = document.getElementById("btn-test-api-key");
    this.apiKeyStatus = document.getElementById("api-key-status-msg");
    this.closeModalBtns = document.querySelectorAll(".close-modal-btn");
    this.themeToggleBtn = document.getElementById("btn-theme-toggle");
  }

  initTheme() {
    if (this.isDarkMode) {
      document.body.classList.add("dark-theme");
      this.themeToggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i> <span>淺色模式</span>';
    } else {
      document.body.classList.remove("dark-theme");
      this.themeToggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i> <span>深色模式</span>';
    }
  }

  async initApp() {
    // 預設載入氣象數據
    this.showGlobalLoading(true);
    await weatherService.fetchWeatherData();
    this.showGlobalLoading(false);

    // 填充縣市下拉選單
    this.populateCountySelect();

    // 渲染卡片列表並自動選中第一條
    this.renderRouteCards(true);
  }

  initEventListeners() {
    // 地區切換
    this.regionTabs.forEach(tab => {
      tab.addEventListener("click", () => {
        this.regionTabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        this.currentRegion = tab.dataset.region;
        this.currentCounty = "all";
        this.populateCountySelect();
        // 點選不同地區時，立即更新左側卡片並自動切換至該地區第一條路線
        this.renderRouteCards(true);
      });
    });

    // 縣市切換
    this.countySelect.addEventListener("change", (e) => {
      this.currentCounty = e.target.value;
      this.renderRouteCards(true);
    });

    // 主題標籤切換
    this.categoryPills.forEach(pill => {
      pill.addEventListener("click", () => {
        this.categoryPills.forEach(p => p.classList.remove("active"));
        pill.classList.add("active");
        this.currentCategory = pill.dataset.category;
        this.renderRouteCards(true);
      });
    });

    // 關鍵字搜尋
    this.searchInput.addEventListener("input", (e) => {
      this.searchQuery = e.target.value.trim().toLowerCase();
      this.clearSearchBtn.style.display = this.searchQuery ? "flex" : "none";
      this.renderRouteCards(true);
    });

    this.clearSearchBtn.addEventListener("click", () => {
      this.searchInput.value = "";
      this.searchQuery = "";
      this.clearSearchBtn.style.display = "none";
      this.renderRouteCards(true);
    });

    // 僅看收藏切換
    this.favoriteFilterBtn.addEventListener("click", () => {
      this.onlyFavorites = !this.onlyFavorites;
      this.favoriteFilterBtn.classList.toggle("active", this.onlyFavorites);
      this.renderRouteCards(true);
    });

    // 重新整理氣象
    this.btnRefreshWeather.addEventListener("click", async () => {
      this.btnRefreshWeather.classList.add("spinning");
      await weatherService.fetchWeatherData(true);
      if (this.currentRoute) {
        this.updateRouteWeatherView(this.currentRoute);
      }
      this.renderRouteCards(false);
      setTimeout(() => {
        this.btnRefreshWeather.classList.remove("spinning");
      }, 600);
    });

    // API Key Modal
    this.btnApiKeyModal.addEventListener("click", () => {
      this.apiKeyInput.value = weatherService.getApiKey();
      this.apiKeyStatus.innerHTML = "";
      this.apiKeyModal.classList.add("active");
    });

    this.closeModalBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        this.apiKeyModal.classList.remove("active");
      });
    });

    this.apiKeyModal.addEventListener("click", (e) => {
      if (e.target === this.apiKeyModal) {
        this.apiKeyModal.classList.remove("active");
      }
    });

    // 儲存 API Key
    this.btnSaveApiKey.addEventListener("click", async () => {
      const key = this.apiKeyInput.value.trim();
      weatherService.setApiKey(key);
      this.apiKeyStatus.innerHTML = `<span class="text-success"><i class="fa-solid fa-circle-check"></i> API Key 已儲存！正在同步中央氣象署最新觀測資料...</span>`;
      this.showGlobalLoading(true);
      await weatherService.fetchWeatherData(true);
      this.showGlobalLoading(false);
      if (this.currentRoute) {
        this.updateRouteWeatherView(this.currentRoute);
      }
      this.renderRouteCards(false);
      setTimeout(() => {
        this.apiKeyModal.classList.remove("active");
      }, 800);
    });

    // 清除 API Key (還原示範模式)
    this.btnClearApiKey.addEventListener("click", async () => {
      weatherService.setApiKey("");
      this.apiKeyInput.value = "";
      this.apiKeyStatus.innerHTML = `<span class="text-info"><i class="fa-solid fa-circle-info"></i> 已清除金鑰，已切換至示範備援觀測站資料集。</span>`;
      await weatherService.fetchWeatherData(true);
      if (this.currentRoute) {
        this.updateRouteWeatherView(this.currentRoute);
      }
      this.renderRouteCards(false);
    });

    // 測試 API Key 連線
    this.btnTestApiKey.addEventListener("click", async () => {
      const key = this.apiKeyInput.value.trim();
      if (!key) {
        this.apiKeyStatus.innerHTML = `<span class="text-danger"><i class="fa-solid fa-triangle-exclamation"></i> 請先輸入 API 授權碼</span>`;
        return;
      }
      this.btnTestApiKey.disabled = true;
      this.apiKeyStatus.innerHTML = `<span class="text-muted"><i class="fa-solid fa-spinner fa-spin"></i> 正在連線 CWA API 驗證...</span>`;
      try {
        const testUrl = `https://opendata.cwa.gov.tw/api/v1/rest/datastore/O-A0003-001?Authorization=${encodeURIComponent(key)}&limit=2&format=JSON`;
        const res = await fetch(testUrl);
        if (res.ok) {
          const json = await res.json();
          if (json.success === "true" || (json.records && json.records.Station)) {
            this.apiKeyStatus.innerHTML = `<span class="text-success"><i class="fa-solid fa-check"></i> 連線成功！授權碼有效 (O-A0003-001 正常)</span>`;
          } else {
            this.apiKeyStatus.innerHTML = `<span class="text-warning"><i class="fa-solid fa-triangle-exclamation"></i> API 回傳異常: ${json.message || '格式錯誤'}</span>`;
          }
        } else {
          this.apiKeyStatus.innerHTML = `<span class="text-danger"><i class="fa-solid fa-circle-xmark"></i> 驗證失敗: HTTP ${res.status} (請確認授權碼是否正確)</span>`;
        }
      } catch (e) {
        this.apiKeyStatus.innerHTML = `<span class="text-danger"><i class="fa-solid fa-circle-xmark"></i> 連線失敗: ${e.message}</span>`;
      } finally {
        this.btnTestApiKey.disabled = false;
      }
    });

    // 收藏當前詳情路線
    this.btnFavoriteDetail.addEventListener("click", () => {
      if (this.currentRoute) {
        this.toggleFavorite(this.currentRoute.id);
        this.updateFavoriteDetailBtn();
        this.renderRouteCards(false);
      }
    });

    // 主題切換
    this.themeToggleBtn.addEventListener("click", () => {
      this.isDarkMode = !this.isDarkMode;
      localStorage.setItem("theme_mode", this.isDarkMode ? "dark" : "light");
      this.initTheme();
    });
  }

  populateCountySelect() {
    this.countySelect.innerHTML = `<option value="all">全部縣市</option>`;
    let availableCounties = [];

    if (this.currentRegion === "all") {
      const set = new Set();
      this.routes.forEach(r => set.add(r.county));
      availableCounties = Array.from(set);
    } else if (REGIONS_MAP[this.currentRegion]) {
      availableCounties = REGIONS_MAP[this.currentRegion].counties;
    }

    availableCounties.forEach(county => {
      const opt = document.createElement("option");
      opt.value = county;
      opt.textContent = county;
      if (county === this.currentCounty) {
        opt.selected = true;
      }
      this.countySelect.appendChild(opt);
    });
  }

  getFilteredRoutes() {
    return this.routes.filter(route => {
      // 地區過濾
      if (this.currentRegion !== "all" && route.region !== this.currentRegion) {
        return false;
      }
      // 縣市過濾
      if (this.currentCounty !== "all" && route.county !== this.currentCounty) {
        return false;
      }
      // 主題標籤過濾
      if (this.currentCategory !== "all" && route.category !== this.currentCategory) {
        return false;
      }
      // 收藏過濾
      if (this.onlyFavorites && !this.favorites.includes(route.id)) {
        return false;
      }
      // 搜尋關鍵字
      if (this.searchQuery) {
        const text = `${route.name} ${route.code} ${route.county} ${route.tag} ${route.summary} ${route.stops.map(s => s.name).join(' ')}`.toLowerCase();
        if (!text.includes(this.searchQuery)) {
          return false;
        }
      }
      return true;
    });
  }

  renderRouteCards(autoSelectFirst = false) {
    const filtered = this.getFilteredRoutes();
    this.routesCountEl.textContent = `${filtered.length} 條`;

    if (filtered.length === 0) {
      this.routesGrid.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-magnifying-glass-location"></i>
          <h4>查無符合的台灣好行路線</h4>
          <p>請嘗試更換篩選條件、清除搜尋關鍵字或切換地區檢視。</p>
        </div>
      `;
      return;
    }

    this.routesGrid.innerHTML = "";

    // 檢查當前選中路線是否在篩選結果中，若不在或指定 autoSelectFirst，則自動選中第一條
    const isCurrentInFiltered = this.currentRoute && filtered.some(r => r.id === this.currentRoute.id);
    if ((autoSelectFirst || !isCurrentInFiltered) && filtered.length > 0) {
      this.selectRoute(filtered[0]);
    }

    filtered.forEach(route => {
      const isFav = this.favorites.includes(route.id);
      const isSelected = this.currentRoute && this.currentRoute.id === route.id;

      // 取得起點代表氣候
      const firstStop = route.stops[0];
      const weather = firstStop ? weatherService.findNearestStation(firstStop.lat, firstStop.lng) : null;
      const tempDisplay = weather ? `${weather.temp}°C` : "--°C";
      const weatherIcon = weather ? weather.icon.icon : "fa-sun";

      const card = document.createElement("div");
      card.className = `route-card ${isSelected ? 'selected' : ''}`;
      card.dataset.routeId = route.id;
      card.style.setProperty("--theme-accent", route.color);

      card.innerHTML = `
        <div class="card-header">
          <div class="card-badges">
            <span class="badge-code">${route.code}</span>
            <span class="badge-county">${route.county}</span>
            <span class="badge-tag">${route.tag}</span>
          </div>
          <button class="btn-card-fav ${isFav ? 'active' : ''}" title="${isFav ? '取消收藏' : '加入收藏'}">
            <i class="fa-${isFav ? 'solid' : 'regular'} fa-heart"></i>
          </button>
        </div>
        <div class="card-body">
          <h3 class="card-title">${route.name}</h3>
          <p class="card-summary">${route.summary}</p>
        </div>
        <div class="card-footer">
          <div class="card-stops-count">
            <i class="fa-solid fa-location-dot"></i> 共 ${route.stops.length} 處停靠站
          </div>
          <div class="card-weather-peek">
            <i class="fa-solid ${weatherIcon}"></i>
            <span>${tempDisplay}</span>
          </div>
        </div>
      `;

      // 點擊卡片選擇路線
      card.addEventListener("click", (e) => {
        if (e.target.closest(".btn-card-fav")) {
          e.stopPropagation();
          this.toggleFavorite(route.id);
          this.renderRouteCards(false);
          if (this.currentRoute && this.currentRoute.id === route.id) {
            this.updateFavoriteDetailBtn();
          }
          return;
        }
        this.selectRoute(route);
      });

      this.routesGrid.appendChild(card);
    });
  }

  selectRoute(route) {
    if (!route) return;
    this.currentRoute = route;

    // 更新卡片選中狀態
    document.querySelectorAll(".route-card").forEach(c => {
      c.classList.toggle("selected", c.dataset.routeId === route.id);
    });

    // 更新詳情視圖
    this.updateRouteDetailHero(route);
    this.updateRouteWeatherView(route);
    this.updateFavoriteDetailBtn();

    // 渲染地圖
    mapManager.renderRoute(route, weatherService.stations);
  }

  updateRouteDetailHero(route) {
    this.routeTitle.textContent = route.name;
    this.routeCode.textContent = route.code;
    this.routeCounty.textContent = route.county;
    this.routeTag.textContent = route.tag;
    this.routeSummary.textContent = route.summary;
    this.routeOperator.textContent = route.operator || "交通客運";
    this.routeFare.textContent = route.fare || "里程計費";
    this.routeOfficialLink.href = route.officialUrl || "https://www.taiwantrip.com.tw/";
    this.routeOfficialLink.target = "_blank";
  }

  updateRouteWeatherView(route) {
    if (!route || !route.stops || route.stops.length === 0) return;

    // 計算沿線站點氣象
    const stopsWeather = route.stops.map(stop => {
      const st = weatherService.findNearestStation(stop.lat, stop.lng);
      return {
        stop: stop,
        weather: st
      };
    });

    // 取主要站點代表
    const primeStation = stopsWeather[0].weather || (stopsWeather.find(s => s.weather) ? stopsWeather.find(s => s.weather).weather : null);

    if (primeStation) {
      this.wOverallIcon.className = `fa-solid ${primeStation.icon.icon} weather-hero-icon`;
      this.wOverallTemp.innerHTML = `${primeStation.temp}<span class="unit">°C</span>`;
      this.wOverallStatus.textContent = primeStation.weatherText;
      this.wFeelsLike.textContent = `${primeStation.feelsLike}°C`;
      this.wRain.textContent = `${primeStation.precipitation} mm`;
      this.wHumidity.textContent = `${primeStation.humidity}%`;
      this.wWind.textContent = `${primeStation.windSpeed} m/s`;
      
      const uv = primeStation.uvIndex;
      this.wUv.innerHTML = `<span style="color: ${uv.color}">${uv.index} (${uv.level})</span>`;
      
      if (this.wDailyExtremes) {
        this.wDailyExtremes.innerHTML = `<span style="color: #ef4444">${primeStation.dailyHigh}</span> / <span style="color: #0284c7">${primeStation.dailyLow}</span>`;
      }

      this.wStationInfo.textContent = `觀測來源：${primeStation.stationName} 測站 (${primeStation.stationId}) · 觀測時間 ${primeStation.obsTime}`;
      
      const isLive = weatherService.lastSource === "cwa-live";
      this.wDataSourceBadge.innerHTML = isLive
        ? `<i class="fa-solid fa-tower-broadcast" style="color: #10b981;"></i> CWA 氣象署即時同步中`
        : `<i class="fa-solid fa-database"></i> 氣象署觀測集`;

      // 產生專屬智慧旅遊穿著與備品建議 (傳入 route 與 primeStation)
      const advice = weatherService.generateTravelAdvice(primeStation, route);
      this.renderTravelAdvice(advice);
    }

    // 渲染站點時間軸
    this.renderStopsTimeline(stopsWeather, route.color);
  }

  renderTravelAdvice(advice) {
    if (this.travelAdviceCard) {
      this.travelAdviceCard.classList.remove("fade-in-glow");
      void this.travelAdviceCard.offsetWidth; // 強制重繪以觸發動畫
      this.travelAdviceCard.classList.add("fade-in-glow");
    }

    this.adviceOutfits.innerHTML = advice.outfits
      .map(item => `<span class="advice-chip outfit-chip"><i class="fa-solid fa-shirt"></i> ${item}</span>`)
      .join("");

    this.adviceItems.innerHTML = advice.items
      .map(item => `<span class="advice-chip item-chip"><i class="fa-solid fa-umbrella"></i> ${item}</span>`)
      .join("");

    this.adviceTips.innerHTML = advice.tips
      .map(tip => `<li><i class="fa-solid fa-compass"></i> ${tip}</li>`)
      .join("");
  }

  renderStopsTimeline(stopsWeather, routeColor) {
    this.stopsTimeline.innerHTML = "";

    stopsWeather.forEach((item, index) => {
      const stop = item.stop;
      const w = item.weather;
      const isStart = index === 0;
      const isEnd = index === stopsWeather.length - 1;

      const timelineItem = document.createElement("div");
      timelineItem.className = `timeline-item ${isStart ? 'is-start' : ''} ${isEnd ? 'is-end' : ''}`;
      
      let weatherPillHtml = "";
      if (w) {
        weatherPillHtml = `
          <div class="stop-weather-badge" title="${w.weatherText}">
            <i class="fa-solid ${w.icon.icon}"></i>
            <span class="stop-temp">${w.temp}°C</span>
            <span class="stop-rain"><i class="fa-solid fa-droplet"></i> ${w.precipitation}mm</span>
          </div>
        `;
      } else {
        weatherPillHtml = `<span class="stop-no-w">觀測中</span>`;
      }

      timelineItem.innerHTML = `
        <div class="timeline-dot" style="background: ${routeColor}">
          <span>${index + 1}</span>
        </div>
        <div class="timeline-content">
          <div class="timeline-stop-info">
            <div class="stop-name-row">
              <h4 class="stop-name">${stop.name}</h4>
              ${isStart ? '<span class="terminal-tag">起點站</span>' : ''}
              ${isEnd ? '<span class="terminal-tag">終點站</span>' : ''}
            </div>
            <p class="stop-desc">${stop.desc || ''}</p>
            ${w ? `<div class="stop-station-ref"><i class="fa-solid fa-satellite-dish"></i> 近 ${w.stationName} 測站 (${w.distanceKm} km)</div>` : ''}
          </div>
          <div class="timeline-stop-weather">
            ${weatherPillHtml}
          </div>
        </div>
      `;

      this.stopsTimeline.appendChild(timelineItem);
    });
  }

  updateFavoriteDetailBtn() {
    if (!this.currentRoute) return;
    const isFav = this.favorites.includes(this.currentRoute.id);
    this.btnFavoriteDetail.className = `btn-detail-fav ${isFav ? 'active' : ''}`;
    this.btnFavoriteDetail.innerHTML = `
      <i class="fa-${isFav ? 'solid' : 'regular'} fa-heart"></i>
      <span>${isFav ? '已收藏此路線' : '收藏此路線'}</span>
    `;
  }

  toggleFavorite(routeId) {
    if (this.favorites.includes(routeId)) {
      this.favorites = this.favorites.filter(id => id !== routeId);
    } else {
      this.favorites.push(routeId);
    }
    this.saveFavorites();
  }

  loadFavorites() {
    try {
      const data = localStorage.getItem("taiwan_trip_favorites");
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  saveFavorites() {
    try {
      localStorage.setItem("taiwan_trip_favorites", JSON.stringify(this.favorites));
    } catch (e) {
      console.warn("無法儲存收藏清單", e);
    }
  }

  showGlobalLoading(show) {
    let loader = document.getElementById("global-loader");
    if (loader) {
      loader.style.display = show ? "flex" : "none";
    }
  }
}

// 頁面載入完成後啟動
document.addEventListener("DOMContentLoaded", () => {
  window.app = new TaiwanTripWeatherApp();
});
