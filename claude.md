# CLAUDE.md / 開發與助手指導規範

本檔案為此專案之 AI Assistant（包含 Antigravity IDE / Claude）運作指引與開發規範。每次開啟本工作區時自動載入並遵循。

---

## 🌐 核心指令與語言偏好

1. **回覆語言**：全程一律使用**繁體中文（Traditional Chinese, zh-TW）**回覆。
2. **開發角色**：作為高階前端與全端開發專家，提供高質感、兼具美感與實用性的程式碼。
3. **設計美學準則**：
   - 避免平庸、陽春的設計。優先採用現代頂級設計語彙（精緻毛玻璃 Glassmorphism、調和漸層、動態微動畫、現代排版）。
   - 嚴格遵守 RWD（Responsive Web Design）響應式手機與桌機適配。

---

## 📁 專案架構與導覽

本專案為 `lilujj03-oss` 的個人作品集與前端展示站點，包含以下核心模組：

```plaintext
├── index.html / index-zh.html   # 作品集展示主頁 (Vue 3 + GSAP 頂級視覺動態)
├── styles.css                   # 作品集核心樣式 (毛玻璃導覽、卡片浮起與資訊遮罩)
├── app.js                       # Vue 3 響應式資料與 GSAP 入場動畫
│
├── pizza-bot/                   # 🍕 披薩智慧推薦機器人 (達美樂/必勝客菜單決策工具)
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   └── pizza-data.json
│
├── version-1/                   # 💻 自介版本 1 · 極簡暗色 GitHub 風格
│   ├── index.html
│   ├── style.css
│   └── script.js
│
├── AboutMe/                     # 🎨 自介版本 2 · 典雅雜誌雙欄卡片風格
│   ├── index-zh.html
│   ├── style.css
│   └── script.js
│
├── version-3/                   # ✨ 自介版本 3 · 現代毛玻璃科技互動風 (含終端機模擬)
│   ├── index.html
│   ├── style.css
│   └── script.js
│
└── github-pages-repo/           # GitHub Pages 部署儲存庫 (需隨時保持同步)
```

---

## 🛠️ 開發與同步規範

1. **同步機制**：
   - 當修改或新增根目錄下的專案檔案時，務必將更新同步至 `github-pages-repo/` 子目錄。
   - 確保 `git -C github-pages-repo commit` 與 `push origin main` 正常更新至 GitHub Pages。
2. **連結互通性**：
   - 保持所有獨立子頁面（`pizza-bot/`, `version-1/`, `AboutMe/`, `version-3/`）均具備清晰的返回作品集按鈕（`../index.html`）。
3. **技術棧規範**：
   - 主頁面採用 Vue 3 CDN + GSAP 動畫庫。
   - 子頁面維持輕量、高相容性的 Vanilla HTML/CSS/JS 原生架構。

---

## 🚀 常用網址參考

- **線上作品集**：`https://lilujj03-oss.github.io/`
- **GitHub 專頁**：`https://github.com/lilujj03-oss`
- **GitHub 儲存庫**：`https://github.com/lilujj03-oss/lilujj03-oss.github.io`
