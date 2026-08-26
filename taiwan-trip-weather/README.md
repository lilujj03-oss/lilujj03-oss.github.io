# 🚌 台灣好行 ✕ 中央氣象署 即時天氣旅遊網
### Taiwan Tourist Shuttle & CWA Real-time Weather Hub

[![GitHub Pages](https://img.shields.io/badge/GitHub-Pages-327fc7?style=flat-square&logo=github)](https://pages.github.com/)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)](https://developer.mozilla.org/zh-TW/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)](https://developer.mozilla.org/zh-TW/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://developer.mozilla.org/zh-TW/docs/Web/JavaScript)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4-199900?style=flat-square&logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![CWA API](https://img.shields.io/badge/CWA_OpenData-O--A0003--001-008080?style=flat-square)](https://opendata.cwa.gov.tw/)

> 本專案為結合**交通部觀光署「台灣好行 (Taiwan Tourist Shuttle)」觀光公車路線**與**交通部中央氣象署 (CWA) 自動氣象站 (O-A0003-001) 即時觀測資料**的互動式觀光天氣地圖平台。

---

## 🌟 核心特色 (Key Features)

- 🚌 **全臺觀光接駁路線探索**
  - 收錄臺灣北部、中部、南部、東部與離島等全臺熱門台灣好行觀光路線（如：日月潭線、阿里山線、墾丁快線、九份金瓜石線等）。
  - 提供多維度篩選功能：地區（北/中/南/東/離島）、縣市選單、主題分類（山林芬多精、人文古蹟、蔚藍海岸、親子同樂）與即時關鍵字模糊搜尋。

- 🌤️ **中央氣象署 (CWA) 即時觀測資料整合**
  - 介接中央氣象署 `O-A0003-001` 自動氣象站即時觀測 API。
  - 內建 **Haversine Formula 測站智能距離演算法**，精確計算並匹配各路線站點最近之氣象觀測站。
  - 即時呈現氣溫、體感溫度、天氣現象、累積雨量、相對濕度、紫外線指標 (UV) 及風速。

- 🗺️ **互動式 GIS 地圖視覺化 (Leaflet.js)**
  - 整合 Leaflet.js 與 OpenStreetMap，提供直覺的路線軌跡、起迄點與周邊氣象站視覺化標記。
  - 點擊地圖標記可快速展開該景點之即時氣象氣泡與路線詳情。

- 🎒 **智能出遊穿著與裝備建議**
  - 根據各路線即時氣象要素（降雨機率、溫差、紫外線係數），動態運算出專屬的行前穿搭建議（如攜帶雨具、防曬配備、保暖防風衣物等）。

- ❤️ **個人化收藏清單 (LocalStorage)**
  - 支援路線快速加入/移除收藏，資料本地持久化儲存，隨時掌握喜愛景點最新路況與天氣。

- 🌓 **現代化響應式介面 (RWD & Dark Mode)**
  - 支援深色模式 (Dark Theme) 與淺色模式自由切換。
  - 採用毛玻璃質感 (Glassmorphism)、微互動動態效果與自適應流體版面，完美支援手機、平板與桌機瀏覽。

---

## 🛠️ 技術架構 (Technology Stack)

| 領域 | 技術 / 工具 | 說明 |
| :--- | :--- | :--- |
| **前端架構** | HTML5, CSS3, Vanilla JavaScript (ES6+) | 輕量化純原生架構，無需依賴繁重框架，載入極速 |
| **樣式與動效** | Custom CSS3, Glassmorphism, CSS Grid/Flexbox | 現代質感深淺主題、平滑微動畫與全響應式版面 |
| **地圖模組** | Leaflet.js (v1.9.4), OpenStreetMap Tiles | 輕量高效率之互動式地圖圖層與自訂標記系統 |
| **資料來源** | 交通部中央氣象署開放資料平臺 API (`O-A0003-001`) | 即時自動氣象觀測站資料介接與本地備援資料集 |
| **字體與圖標** | Google Fonts (Noto Sans TC, Outfit), FontAwesome 6 | 精緻排版與高識別度向量圖示庫 |
| **部署發布** | GitHub Pages | 免費、安全且高可用性之靜態網站代管服務 |

---

## 📁 目錄結構 (Project Structure)

```text
├── index.html              # 應用程式主頁面 (語意化 HTML 結構與 SEO 標籤)
├── css/
│   └── style.css           # 全域樣式、設計系統變數 (Design Tokens) 與響應式設定
├── js/
│   ├── app.js              # 主控制器：UI 互動、搜尋篩選、收藏與主題管理
│   ├── weather-api.js      # 中央氣象署 API 串接、快取管理與 Haversine 距離配對模組
│   ├── map.js              # Leaflet 互動地圖控制器與標記圖層管理
│   └── routes-data.js      # 台灣好行全臺路線、停靠站與坐標資料集
├── .gitignore              # Git 版本控制忽略檔
└── README.md               # 專案作品集說明文件
```

---

## 🚀 本地端預覽與執行 (Local Development)

本專案為純前端靜態網站，無需安裝額外依賴套件，直接啟動本機伺服器即可預覽：

1. **複製 (Clone) 專案至本機：**
   ```bash
   git clone https://github.com/<your-username>/<your-repo-name>.git
   cd <your-repo-name>
   ```

2. **啟動本機伺服器（任選一種方式）：**
   - **使用 VS Code Live Server 擴充套件：** 於 `index.html` 右鍵點擊 `Open with Live Server`。
   - **使用 Python 內建伺服器：**
     ```bash
     python -m http.server 8000
     ```
   - **使用 Node.js `serve` / `http-server`：**
     ```bash
     npx serve .
     ```

3. 開啟瀏覽器造訪 `http://localhost:8000` 即可檢視完整功能。

---

## 🌐 GitHub Pages 發布步驟 (GitHub Pages Deployment)

1. 在 GitHub 建立一個公開儲存庫 (Public Repository)。
2. 將本機代碼推送到該儲存庫的主分支 (`main`)：
   ```bash
   git init
   git add .
   git commit -m "feat: Initial commit for Taiwan Tourist Shuttle & CWA Weather Hub"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```
3. 前往 GitHub 儲存庫頁面：
   - 點擊 **Settings** (設定) ➔ 左側選單選擇 **Pages**。
   - 在 **Build and deployment** 下方的 **Source** 選擇 **Deploy from a branch**。
   - 分支選擇 **`main`**，資料夾選擇 **`/(root)`**，點擊 **Save**。
4. 等待 1~2 分鐘，即可透過 `https://<your-username>.github.io/<your-repo-name>/` 瀏覽線上作品集！

---

## 📄 授權與宣告 (License & Acknowledgement)

- 氣象觀測數據介接自 [交通部中央氣象署開放資料平臺](https://opendata.cwa.gov.tw/)。
- 台灣好行路線資訊參考 [交通部觀光署 台灣好行旅遊服務網](https://www.taiwantrip.com.tw/)。
- 本專案僅供個人作品集與技術交流學習使用。
