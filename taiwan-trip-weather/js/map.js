/**
 * Leaflet 地圖模組
 * 負責渲染台灣好行路線地圖、停靠站點標記、即時天氣氣泡與路徑多邊形
 */

class RouteMapManager {
  constructor(containerId = "map-view") {
    this.containerId = containerId;
    this.map = null;
    this.routeLayerGroup = null;
    this.stationLayerGroup = null;
    this.activePolyline = null;
  }

  initMap() {
    if (this.map) return;

    // 預設以台灣為中心
    this.map = L.map(this.containerId, {
      center: [23.85, 121.0],
      zoom: 8,
      zoomControl: true,
      attributionControl: false
    });

    // 加入現代質感底圖 (CartoDB Positron / OSM)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(this.map);

    this.routeLayerGroup = L.layerGroup().addTo(this.map);
    this.stationLayerGroup = L.layerGroup().addTo(this.map);

    // 解決容器縮放尺寸問題
    setTimeout(() => {
      this.map.invalidateSize();
    }, 200);
  }

  /**
   * 渲染指定路線及其站點與天氣資訊
   */
  renderRoute(route, weatherStations) {
    if (!this.map) this.initMap();

    this.routeLayerGroup.clearLayers();
    this.stationLayerGroup.clearLayers();

    if (!route || !route.stops || route.stops.length === 0) return;

    const latLngs = [];

    route.stops.forEach((stop, index) => {
      const lat = stop.lat;
      const lng = stop.lng;
      latLngs.push([lat, lng]);

      // 取得該站最近之 CWA 氣象測站
      const nearestStation = weatherService.findNearestStation(lat, lng);
      const tempDisplay = nearestStation ? `${nearestStation.temp}°C` : "--°C";
      const weatherIcon = nearestStation ? nearestStation.icon.icon : "fa-cloud-sun";
      const isStartOrEnd = index === 0 || index === route.stops.length - 1;

      // 自訂站點 Marker HTML
      const markerHtml = `
        <div class="custom-map-marker ${isStartOrEnd ? 'marker-terminal' : ''}" style="--route-color: ${route.color}">
          <div class="marker-pin">
            <span class="marker-idx">${index + 1}</span>
          </div>
          <div class="marker-bubble">
            <i class="fa-solid ${weatherIcon}"></i>
            <span class="marker-temp">${tempDisplay}</span>
          </div>
          <div class="marker-title">${stop.name}</div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-leaflet-icon',
        html: markerHtml,
        iconSize: [120, 64],
        iconAnchor: [60, 48]
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      // 點擊彈出詳細氣象 Popup
      let popupContent = `
        <div class="map-popup-card">
          <div class="popup-header" style="border-left: 4px solid ${route.color}">
            <div class="popup-title">第 ${index + 1} 站：${stop.name}</div>
            <div class="popup-subtitle">${stop.desc || ''}</div>
          </div>
      `;

      if (nearestStation) {
        popupContent += `
          <div class="popup-weather">
            <div class="popup-w-top">
              <div class="popup-w-icon"><i class="fa-solid ${nearestStation.icon.icon}"></i></div>
              <div class="popup-w-temp">${nearestStation.temp}<span class="unit">°C</span></div>
              <div class="popup-w-status">${nearestStation.weatherText}</div>
            </div>
            <div class="popup-w-grid">
              <div><i class="fa-solid fa-temperature-half"></i> 體感: ${nearestStation.feelsLike}°C</div>
              <div><i class="fa-solid fa-cloud-rain"></i> 雨量: ${nearestStation.precipitation} mm</div>
              <div><i class="fa-solid fa-droplet"></i> 濕度: ${nearestStation.humidity}%</div>
              <div><i class="fa-solid fa-wind"></i> 風速: ${nearestStation.windSpeed} m/s</div>
            </div>
            <div class="popup-station-tag">
              <i class="fa-solid fa-satellite-dish"></i> CWA 鄰近測站: ${nearestStation.stationName} (${nearestStation.distanceKm} km)
            </div>
          </div>
        `;
      } else {
        popupContent += `<div class="popup-no-weather">尚無測站資訊</div>`;
      }

      popupContent += `</div>`;

      marker.bindPopup(popupContent, {
        maxWidth: 280,
        className: 'custom-leaflet-popup'
      });

      this.routeLayerGroup.addLayer(marker);
    });

    // 繪製平滑路線連線
    if (latLngs.length > 1) {
      // 陰影外光暈
      const glowLine = L.polyline(latLngs, {
        color: route.color,
        weight: 8,
        opacity: 0.35,
        lineCap: 'round',
        lineJoin: 'round'
      });
      this.routeLayerGroup.addLayer(glowLine);

      // 主路徑線
      const mainLine = L.polyline(latLngs, {
        color: route.color,
        weight: 4,
        opacity: 0.9,
        dashArray: '8, 8',
        lineCap: 'round',
        lineJoin: 'round'
      });
      this.routeLayerGroup.addLayer(mainLine);
    }

    // 縮放到涵蓋該路線所有站點
    if (latLngs.length > 0) {
      const bounds = L.latLngBounds(latLngs);
      this.map.fitBounds(bounds, {
        padding: [60, 60],
        maxZoom: 14,
        animate: true,
        duration: 0.8
      });
    }
  }

  resize() {
    if (this.map) {
      setTimeout(() => {
        this.map.invalidateSize();
      }, 150);
    }
  }
}

const mapManager = new RouteMapManager("map-view");
