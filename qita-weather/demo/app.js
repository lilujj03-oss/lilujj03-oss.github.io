const API = "/qita-weather/api";
const FALLBACK_SNAPSHOT = "/qita-weather/assets/current-stations.json";
const FRONTEND_REFRESH_INTERVAL = 60 * 1000;
const TAIWAN_BOUNDS = [[21.65, 118.0], [26.45, 122.25]];

const state = {
  map: null,
  markerLayer: null,
  markers: new Map(),
  stations: [],
  selectedStationId: null,
  history: [],
  rainfall: [],
  rainfallStation: null,
  chartMetric: "precipitation",
  selectionToken: 0,
  dataMode: "live",
  forecastCount: 0,
  snapshotStations: null,
  snapshotForecast: [],
  snapshotGeneratedAt: null,
  liveLatestAt: null,
  latestObservationAt: null,
  lastSyncedAt: null,
  sourceStale: false,
};

const $ = (selector) => document.querySelector(selector);

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  let data;
  try {
    data = await response.json();
  } catch (_) {
    data = null;
  }
  if (!response.ok) {
    throw new Error(data?.detail || `伺服器回應 ${response.status}`);
  }
  return data;
}

function payloadRows(payload) {
  if (Array.isArray(payload)) return payload;
  return Array.isArray(payload?.data) ? payload.data : [];
}

function normalizeStation(row) {
  return {
    station_id: String(row.station_id ?? row.id ?? ""),
    station_name: row.station_name ?? row.name ?? "未命名測站",
    observed_at: row.observed_at ?? row.time ?? null,
    county: row.county ?? row.county_name ?? "",
    town: row.town ?? row.town_name ?? "",
    latitude: row.latitude,
    longitude: row.longitude,
    altitude: row.altitude,
    weather: row.weather ?? "中央氣象署即時觀測",
    temperature: row.temperature,
    humidity: row.humidity,
    pressure: row.pressure,
    wind_speed: row.wind_speed,
    wind_direction: row.wind_direction,
    precipitation: row.precipitation ?? row.rain_daily ?? row.rainfall,
    hourly_rainfall: row.hourly_rainfall ?? row.rain_1h,
    daily_high: row.daily_high,
    daily_low: row.daily_low,
  };
}

function normalizeHistory(row) {
  return {
    observed_at: row.observed_at ?? row.time ?? null,
    temperature: row.temperature,
    humidity: row.humidity,
    pressure: row.pressure,
    wind_speed: row.wind_speed,
    wind_direction: row.wind_direction,
    precipitation: row.precipitation ?? row.rain_daily ?? row.rainfall,
    hourly_rainfall: row.hourly_rainfall ?? row.rain_1h,
  };
}

function formatNumber(value, digits = 1) {
  return Number.isFinite(Number(value)) ? Number(value).toFixed(digits) : "--";
}

function formatInteger(value) {
  return Number.isFinite(Number(value)) ? Math.round(Number(value)).toLocaleString("zh-TW") : "--";
}

function formatDateTime(value, withSeconds = false) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    ...(withSeconds ? { second: "2-digit" } : {}),
    hour12: false,
  }).format(date);
}

function timeValue(value) {
  const milliseconds = value ? new Date(value).getTime() : Number.NaN;
  return Number.isNaN(milliseconds) ? Number.NEGATIVE_INFINITY : milliseconds;
}

function newestObservedAt(rows) {
  return rows.reduce(
    (latest, row) => timeValue(row.observed_at) > timeValue(latest) ? row.observed_at : latest,
    null,
  );
}

function shortForecastTime(value) {
  if (!value) return { date: "--/--", period: "--" };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: value.slice(5, 10), period: "--" };
  const hour = Number(new Intl.DateTimeFormat("en", { timeZone: "Asia/Taipei", hour: "2-digit", hour12: false }).format(date));
  return {
    date: new Intl.DateTimeFormat("zh-TW", { timeZone: "Asia/Taipei", month: "2-digit", day: "2-digit" }).format(date),
    period: hour >= 6 && hour < 18 ? "白天" : "夜間",
  };
}

function windDirection(degrees) {
  if (!Number.isFinite(Number(degrees))) return "--";
  if (Number(degrees) === 990) return "風向不定";
  const names = ["北", "東北", "東", "東南", "南", "西南", "西", "西北"];
  return `${names[Math.round(Number(degrees) / 45) % 8]}風 ${Math.round(Number(degrees))}°`;
}

function temperatureColor(value) {
  const temp = Number(value);
  if (!Number.isFinite(temp)) return "#71859a";
  if (temp >= 35) return "#e56271";
  if (temp >= 30) return "#ef8a5c";
  if (temp >= 25) return "#d9bd5c";
  if (temp >= 20) return "#50bf94";
  if (temp >= 15) return "#49aecb";
  return "#557dce";
}

function initMap() {
  if (!window.L) {
    $("#map-empty").classList.remove("hidden");
    $("#map-empty p").textContent = "Leaflet 地圖元件載入失敗";
    return;
  }
  state.map = L.map("station-map", {
    minZoom: 6,
    maxZoom: 15,
    zoomControl: false,
    scrollWheelZoom: true,
    touchZoom: true,
    doubleClickZoom: true,
    boxZoom: true,
    keyboard: true,
  });
  L.control.zoom({ position: "topright" }).addTo(state.map);
  L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
    maxZoom: 20,
    attribution: "© OpenStreetMap © CARTO",
  }).addTo(state.map);
  state.markerLayer = L.layerGroup().addTo(state.map);
  fitTaiwan(false);
  window.setTimeout(() => state.map?.invalidateSize(), 120);
}

function fitTaiwan(animate = true) {
  state.map?.fitBounds(TAIWAN_BOUNDS, { padding: [18, 18], animate });
}

function filteredStations() {
  const query = $("#station-search").value.trim().toLowerCase();
  const county = $("#county-select").value;
  return state.stations.filter((station) => {
    const countyMatch = !county || station.county === county;
    const searchText = `${station.station_name} ${station.station_id} ${station.county} ${station.town}`.toLowerCase();
    return countyMatch && (!query || searchText.includes(query));
  });
}

function renderMarkers({ fit = false } = {}) {
  if (!state.markerLayer) return;
  state.markerLayer.clearLayers();
  state.markers.clear();
  const visible = filteredStations().filter(
    (station) => Number.isFinite(Number(station.latitude)) && Number.isFinite(Number(station.longitude)),
  );

  visible.forEach((station) => {
    const selected = station.station_id === state.selectedStationId;
    const text = Number.isFinite(Number(station.temperature)) ? `${Math.round(Number(station.temperature))}°` : "--";
    const icon = L.divIcon({
      className: "station-marker-wrap",
      html: `<div class="station-marker ${selected ? "selected" : ""}" style="--marker-color:${temperatureColor(station.temperature)}"><span>${text}</span></div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 30],
    });
    const marker = L.marker([station.latitude, station.longitude], { icon, title: `${station.station_name} ${text}` });
    marker.bindTooltip(`${escapeHtml(station.station_name)}｜${text}`, { direction: "top", offset: [0, -18] });
    marker.on("click", () => selectStation(station.station_id));
    marker.addTo(state.markerLayer);
    state.markers.set(station.station_id, marker);
  });

  $("#visible-count").textContent = visible.length.toLocaleString("zh-TW");
  $("#map-empty").classList.toggle("hidden", state.stations.length > 0);

  if (fit && visible.length && state.map) {
    const bounds = L.latLngBounds(visible.map((station) => [station.latitude, station.longitude]));
    state.map.fitBounds(bounds, { padding: [35, 35], maxZoom: 10 });
  }
}

function populateCounties() {
  const select = $("#county-select");
  const current = select.value;
  const counties = [...new Set(state.stations.map((station) => station.county).filter(Boolean))].sort((a, b) => a.localeCompare(b, "zh-Hant"));
  select.innerHTML = `<option value="">全部縣市</option>${counties.map((county) => `<option value="${escapeHtml(county)}">${escapeHtml(county)}</option>`).join("")}`;
  if (counties.includes(current)) select.value = current;
}

function setConnection(label, level = "ok") {
  const normalizedLevel = level === true ? "error" : level;
  const button = $("#update-button");
  const dot = $("#sync-dot");
  button.title = label;
  button.setAttribute("aria-label", label);
  button.classList.toggle("error", normalizedLevel === "error");
  dot?.classList.toggle("error", normalizedLevel === "error");
  dot?.classList.toggle("stale", normalizedLevel === "stale");
  if ($("#data-status")) $("#data-status").textContent = label;
}

function renderSyncStatus() {
  const observed = state.latestObservationAt ? formatDateTime(state.latestObservationAt, true) : "--";
  const synced = state.lastSyncedAt ? formatDateTime(state.lastSyncedAt, true) : "--";
  const level = state.dataMode === "error" ? "error" : state.sourceStale ? "stale" : "ok";
  const source = state.sourceStale ? "官方快照" : state.dataMode === "live" ? "即時 API" : "官方快照";
  setConnection(`最新觀測 ${observed} · ${source}`, level);
  const syncTime = $("#sync-time");
  if (syncTime) {
    syncTime.textContent = `本次同步 ${synced}`;
    if (state.lastSyncedAt) syncTime.dateTime = state.lastSyncedAt;
  }
}

async function loadHealth() {
  $("#setup-alert").classList.add("hidden");
  renderSyncStatus();
  return { status: "ok", mode: state.dataMode };
}

async function loadStations({ keepSelection = true, force = false } = {}) {
  try {
    const response = await fetch(FALLBACK_SNAPSHOT, { cache: force ? "reload" : "no-cache" });
    if (response.ok) {
      const snapshotPayload = await response.json();
      state.snapshotStations = payloadRows(snapshotPayload).map(normalizeStation);
      state.snapshotForecast = Array.isArray(snapshotPayload.forecast) ? snapshotPayload.forecast : [];
      state.snapshotGeneratedAt = snapshotPayload.generated_at ?? null;
    }
  } catch (_) {
    if (!state.snapshotStations) state.snapshotStations = [];
  }

  let liveStations = [];
  try {
    liveStations = payloadRows(await request("/current")).map(normalizeStation);
  } catch (liveError) {
    if (!state.snapshotStations?.length) throw liveError;
  }

  const snapshotLatest = newestObservedAt(state.snapshotStations || []);
  const liveLatest = newestObservedAt(liveStations);
  state.liveLatestAt = liveLatest;
  state.sourceStale = Boolean(
    state.snapshotStations?.length
    && liveStations.length
    && timeValue(liveLatest) < timeValue(snapshotLatest),
  );

  if (state.snapshotStations?.length && liveStations.length) {
    const currentById = new Map(liveStations.map((station) => [station.station_id, station]));
    state.stations = state.snapshotStations.map((snapshot) => {
      const current = currentById.get(snapshot.station_id);
      if (!current) return snapshot;
      if (timeValue(current.observed_at) < timeValue(snapshot.observed_at)) return snapshot;
      const available = Object.fromEntries(Object.entries(current).filter(([, value]) => value !== null && value !== undefined && value !== ""));
      return { ...snapshot, ...available };
    });
  } else {
    state.stations = liveStations.length ? liveStations : (state.snapshotStations || []);
  }
  state.stations = state.stations
    .filter((station) => station.station_id && Number.isFinite(Number(station.latitude)) && Number.isFinite(Number(station.longitude)));
  state.dataMode = liveStations.length && !state.sourceStale ? "live" : "snapshot";
  state.latestObservationAt = newestObservedAt(state.stations);
  state.lastSyncedAt = new Date().toISOString();
  $("#station-total").textContent = formatInteger(state.stations.length);
  $("#observation-total").textContent = state.stations.length ? "1" : "--";
  $("#forecast-total").textContent = state.forecastCount ? formatInteger(state.forecastCount) : "--";
  await loadHealth();
  populateCounties();
  if (!keepSelection || !state.stations.some((station) => station.station_id === state.selectedStationId)) {
    state.selectedStationId = null;
  }
  renderMarkers();
  return state.stations;
}

function renderStation(station) {
  $("#station-placeholder").classList.add("hidden");
  $("#station-content").classList.remove("hidden");
  $("#station-id").textContent = station.station_id;
  $("#station-name").textContent = station.station_name;
  $("#station-location").textContent = `${station.county || "--"} · ${station.town || "--"} · 海拔 ${formatNumber(station.altitude)} m`;
  const observedAt = $("#station-observed-at");
  observedAt.textContent = formatDateTime(station.observed_at, true);
  if (station.observed_at) observedAt.dateTime = station.observed_at;
  $("#metric-temperature").textContent = formatNumber(station.temperature);
  $("#metric-humidity").textContent = formatNumber(station.humidity, 0);
  $("#metric-rain").textContent = formatNumber(station.hourly_rainfall);
  $("#rain-note").textContent = `${formatDateTime(station.observed_at)} · CWA 逐時觀測`;
  $("#metric-wind").textContent = formatNumber(station.wind_speed);
  $("#metric-range").textContent = `${formatNumber(station.daily_high)} / ${formatNumber(station.daily_low)}°`;
  $("#humidity-note").textContent = Number(station.humidity) >= 80 ? "環境較為潮濕" : Number(station.humidity) <= 45 ? "空氣較為乾燥" : "濕度適中";
  $("#wind-direction").textContent = `風向 ${windDirection(station.wind_direction)}`;
  $("#weather-summary").textContent = station.weather || "目前無天氣現象描述";
  $("#metric-pressure").textContent = `${formatNumber(station.pressure)} hPa`;
  $("#prediction-card").classList.add("hidden");
}

function renderRainfallSummary(result) {
  state.rainfallStation = result || null;
  const observations = Array.isArray(result?.observations) ? result.observations : [];
  const latest = observations.length ? observations[observations.length - 1] : null;
  $("#metric-rain").textContent = formatNumber(latest?.hourly_rainfall);
  if (!latest) {
    $("#rain-note").textContent = "雨量資料正在累積";
    return;
  }
  const source = result.is_nearest
    ? `鄰近 ${result.station_name} · ${formatNumber(result.distance_km)} km`
    : result.station_name;
  $("#rain-note").textContent = `${formatDateTime(latest.observed_at)} · ${source || "雨量站"}`;
}

async function selectStation(stationId) {
  const station = state.stations.find((item) => item.station_id === stationId);
  if (!station) return;
  const token = ++state.selectionToken;
  state.selectedStationId = stationId;
  renderStation(station);
  renderMarkers();
  state.map?.panTo([station.latitude, station.longitude], { animate: true });
  $("#forecast-county").textContent = `${station.county || "縣市"} `;

  const [historyResult, forecastResult] = await Promise.allSettled([
    request(`/history/${encodeURIComponent(stationId)}`),
    station.county ? request(`/forecast/${encodeURIComponent(station.county)}`) : Promise.resolve({ forecast: [] }),
  ]);
  if (token !== state.selectionToken) return;

  const candidateHistory = historyResult.status === "fulfilled"
    ? payloadRows(historyResult.value).map(normalizeHistory)
    : [];
  const stationTime = timeValue(station.observed_at);
  const historyCutoff = stationTime - 26 * 60 * 60 * 1000;
  state.history = candidateHistory.filter((row) => {
    const rowTime = timeValue(row.observed_at);
    return rowTime >= historyCutoff && rowTime <= stationTime + 10 * 60 * 1000;
  });
  if (!state.history.some((row) => timeValue(row.observed_at) === stationTime)) {
    state.history.push(normalizeHistory(station));
  }
  state.history.sort((a, b) => timeValue(a.observed_at) - timeValue(b.observed_at));
  state.rainfall = state.history
    .filter((row) => Number.isFinite(Number(row.hourly_rainfall)))
    .slice(-8);
  if (!state.rainfall.length && Number.isFinite(Number(station.hourly_rainfall))) {
    state.rainfall = [{ observed_at: station.observed_at, hourly_rainfall: station.hourly_rainfall }];
  }
  renderRainfallSummary({
    station_id: station.station_id,
    station_name: station.station_name,
    is_nearest: false,
    observations: state.rainfall,
  });
  renderHistoryChart();
  const candidateForecasts = forecastResult.status === "fulfilled"
    ? (Array.isArray(forecastResult.value?.forecast) ? forecastResult.value.forecast : payloadRows(forecastResult.value))
    : [];
  const normalizedCounty = String(station.county || "").replaceAll("台", "臺");
  const snapshotForecasts = state.snapshotForecast.filter(
    (row) => String(row.location_name || row.county || "").replaceAll("台", "臺") === normalizedCounty,
  );
  const forecastCutoff = Date.now() - 12 * 60 * 60 * 1000;
  const seenForecasts = new Set();
  const forecasts = [...snapshotForecasts, ...candidateForecasts]
    .filter((row) => timeValue(row.start_time ?? row.time) >= forecastCutoff)
    .filter((row) => {
      const key = `${row.start_time ?? row.time}|${row.end_time ?? ""}|${row.weather ?? row.weather_type ?? row.wx_desc ?? ""}`;
      if (seenForecasts.has(key)) return false;
      seenForecasts.add(key);
      return true;
    })
    .sort((a, b) => timeValue(a.start_time ?? a.time) - timeValue(b.start_time ?? b.time));
  state.forecastCount = forecasts.length;
  $("#forecast-total").textContent = forecasts.length ? formatInteger(forecasts.length) : "--";
  renderForecast(forecasts);
}

function renderHistoryChart() {
  const placeholder = $("#chart-placeholder");
  const title = $("#chart-placeholder-title");
  const copy = $("#chart-placeholder-copy");
  const configs = {
    temperature: { label: "氣溫", unit: "°C", color: "#e47b29", type: "scatter" },
    humidity: { label: "相對濕度", unit: "%", color: "#14969c", type: "scatter" },
    precipitation: { label: "每小時雨量", unit: "mm", color: "#287fd1", type: "bar" },
    wind_speed: { label: "平均風速", unit: "m/s", color: "#7056c8", type: "scatter" },
  };
  const config = configs[state.chartMetric];
  const isRainfall = state.chartMetric === "precipitation";
  const valueKey = isRainfall ? "hourly_rainfall" : state.chartMetric;
  const rows = (isRainfall ? state.rainfall : state.history)
    .filter((row) => Number.isFinite(Number(row[valueKey])));
  $("#history-period-label").textContent = isRainfall ? "PAST 8 HOURS" : "PAST 24 HOURS";
  $("#history-title").textContent = isRainfall ? "每小時雨量（近 8 小時）" : "歷史觀測變化趨勢";
  $("#history-count").textContent = isRainfall ? `${rows.length} / 8 小時` : `${rows.length} 筆資料`;

  if (!window.Plotly) {
    placeholder.classList.remove("hidden");
    title.textContent = "圖表元件載入失敗";
    copy.textContent = "請確認網路連線後重新整理頁面";
    return;
  }

  const minimumRows = isRainfall ? 1 : 2;
  if (rows.length < minimumRows) {
    Plotly.purge("history-chart");
    placeholder.classList.remove("hidden");
    title.textContent = rows.length ? "歷史資料正在累積" : `尚無${config.label}觀測資料`;
    copy.textContent = rows.length
      ? `目前已有 ${rows.length} 個小時，系統每小時自動保存，累積至 8 小時後會完整呈現。`
      : isRainfall
        ? "尚無 O-A0002-001 每小時雨量，下一次自動更新後再試。"
        : "此測站目前沒有可用數值，請選擇其他測站。";
    return;
  }

  placeholder.classList.add("hidden");
  const trace = {
    x: rows.map((row) => row.observed_at),
    y: rows.map((row) => Number(row[valueKey])),
    name: config.label,
    type: config.type,
    mode: config.type === "bar" ? undefined : "lines+markers",
    line: { color: config.color, width: 2.2, shape: "spline" },
    marker: { color: config.color, size: config.type === "bar" ? undefined : 7 },
    hovertemplate: `%{x|%m/%d %H:%M}<br>${config.label} %{y:.1f} ${config.unit}<extra></extra>`,
  };
  const xaxis = { gridcolor: "rgba(43,75,98,.10)", linecolor: "rgba(43,75,98,.18)", tickformat: "%m/%d\n%H:%M" };
  if (isRainfall) {
    const latestTime = new Date(rows[rows.length - 1].observed_at);
    if (!Number.isNaN(latestTime.getTime())) {
      xaxis.range = [
        new Date(latestTime.getTime() - 7.5 * 60 * 60 * 1000),
        new Date(latestTime.getTime() + 0.5 * 60 * 60 * 1000),
      ];
    }
  }
  const yaxis = { title: { text: config.unit, font: { size: 12 } }, gridcolor: "rgba(43,75,98,.10)", zerolinecolor: "rgba(43,75,98,.16)" };
  if (isRainfall) {
    yaxis.range = [0, 50];
    yaxis.dtick = 10;
    yaxis.fixedrange = true;
  }
  const layout = {
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    margin: { l: 48, r: 20, t: 25, b: 44 },
    font: { family: "Noto Sans TC", color: "#526979", size: 12 },
    xaxis,
    yaxis,
    hoverlabel: { bgcolor: "#ffffff", bordercolor: config.color, font: { color: "#193246", size: 12 } },
    showlegend: false,
  };
  Plotly.react("history-chart", [trace], layout, { displayModeBar: false, responsive: true });
}

function renderForecast(rows) {
  const list = $("#forecast-list");
  if (!Array.isArray(rows) || !rows.length) {
    list.innerHTML = `<div class="forecast-placeholder"><span>☼</span><p>預報來源尚未同步至今天，已停止顯示過期預報</p></div>`;
    return;
  }
  list.innerHTML = rows.map((row) => {
    const time = shortForecastTime(row.start_time ?? row.time);
    const weather = row.weather ?? row.weather_type ?? row.wx_desc ?? row.description ?? "天氣預報";
    const detail = row.wx_desc ?? (row.description && row.description !== weather ? row.description : `${row.wind_direction || ""} ${row.wind_speed ? `風速 ${row.wind_speed} m/s` : ""}`.trim());
    const high = row.max_temperature ?? row.max_t ?? row.temperature;
    const low = row.min_temperature ?? row.min_t ?? row.temperature;
    const probability = row.precipitation_probability ?? row.pop;
    return `<article class="forecast-item"><time>${escapeHtml(time.date)}<small>${escapeHtml(time.period)}</small></time><span class="forecast-copy"><b>${escapeHtml(weather)}</b><small>${escapeHtml(detail || "逐 12 小時預報")}</small></span><span class="forecast-values"><b>${formatNumber(high, 0)}° / ${formatNumber(low, 0)}°</b><small>☂ ${formatNumber(probability, 0)}%</small></span></article>`;
  }).join("");
}

async function runPrediction() {
  if (!state.selectedStationId) return;
  if (state.sourceStale) {
    showToast("AI 歷史來源仍是舊資料，為避免誤導已暫停預測");
    return;
  }
  const button = $("#ai-button");
  button.disabled = true;
  button.innerHTML = `<span>✦</span> 分析中…`;
  try {
    const payload = await request(`/predict/${encodeURIComponent(state.selectedStationId)}`);
    const result = payload?.prediction ?? payload;
    $("#predict-temperature").textContent = `${formatNumber(result.temperature)}°`;
    $("#predict-humidity").textContent = `${formatNumber(result.humidity, 0)}%`;
    $("#predict-rain").textContent = `${formatNumber(result.precipitation ?? result.rainfall)} mm`;
    $("#predict-wind").textContent = `${formatNumber(result.wind_speed)} m/s`;
    $("#prediction-notice").textContent = result.notice
      ? `${result.notice}${result.sample_count ? `｜樣本 ${result.sample_count} 筆` : ""}`
      : `趨勢模型：${result.model_used || "最近觀測線性分析"}｜非中央氣象署官方預報`;
    $("#prediction-card").classList.remove("hidden");
  } catch (error) {
    showToast(error.message);
  } finally {
    button.disabled = false;
    button.innerHTML = `<span>✦</span> AI 趨勢預測`;
  }
}

async function triggerUpdate() {
  const button = $("#update-button");
  const label = $("#update-label");
  button.disabled = true;
  button.classList.add("loading");
  if (label) label.textContent = "同步中…";
  setConnection("正在同步最新官方資料");
  try {
    await loadStations({ keepSelection: true, force: true });
    if (state.selectedStationId) {
      await selectStation(state.selectedStationId);
    } else if (state.stations.length) {
      await selectStation(preferredStation().station_id);
    }
    showToast(`同步完成｜最新觀測 ${formatDateTime(state.latestObservationAt, true)}`);
  } catch (error) {
    showToast(error.message);
    state.dataMode = "error";
    setConnection("資料同步失敗", "error");
  } finally {
    button.disabled = false;
    button.classList.remove("loading");
    if (label) label.textContent = "同步最新資料";
  }
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 3000);
}

function bindEvents() {
  $("#update-button").addEventListener("click", triggerUpdate);
  $("#fit-taiwan").addEventListener("click", () => fitTaiwan(true));
  $("#station-search").addEventListener("input", () => renderMarkers());
  $("#station-search").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      const first = filteredStations()[0];
      if (first) selectStation(first.station_id);
    }
  });
  $("#county-select").addEventListener("change", () => renderMarkers({ fit: true }));
  $("#ai-button").addEventListener("click", runPrediction);
  $("#close-prediction").addEventListener("click", () => $("#prediction-card").classList.add("hidden"));
  $("#dismiss-alert").addEventListener("click", () => $("#setup-alert").classList.add("hidden"));
  document.querySelectorAll(".chart-tab").forEach((button) => button.addEventListener("click", () => {
    state.chartMetric = button.dataset.metric;
    document.querySelectorAll(".chart-tab").forEach((item) => item.classList.toggle("active", item === button));
    renderHistoryChart();
  }));
}

async function refreshDashboard() {
  try {
    await loadStations({ keepSelection: true });
    if (state.selectedStationId) await selectStation(state.selectedStationId);
  } catch (error) {
    showToast(`無法載入資料：${error.message}`);
  }
}

function preferredStation() {
  return state.stations.find((station) => station.county === "臺北市" && Number.isFinite(Number(station.temperature))) || state.stations[0];
}

async function init() {
  initMap();
  bindEvents();
  await refreshDashboard();
  if (!state.selectedStationId && state.stations.length) {
    await selectStation(preferredStation().station_id);
  }
  window.setInterval(refreshDashboard, FRONTEND_REFRESH_INTERVAL);
}

init();
