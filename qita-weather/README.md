# 七逃趣｜台灣即時氣象與每小時雨量

「七逃趣」整合中央氣象署三組開放資料，提供全台測站地圖、即時氣象卡、最近 8 小時雨量、一週預報與自動更新功能。

線上互動 Demo：<https://lilujj03-oss-github-io.vercel.app/qita-weather/index.html>

作品介紹／截圖頁：<https://lilujj03-oss-github-io.vercel.app/qita-weather/project.html>

## 資料來源

- `O-A0001-001`：氣象測站逐時觀測。
- `O-A0002-001`：雨量站過去 1 小時雨量。
- `F-D0047-091`：各縣市未來一週預報。

雨量圖使用 `Past1hr/Precipitation`，單位為 mm；每小時保存一筆，顯示最近 8 個小時，縱軸固定為 0–50 mm。若所選氣象站沒有同代碼的雨量站，後端會自動配對距離最近的雨量站。

## 主要功能

- Leaflet 全台氣象測站地圖與縣市／關鍵字篩選。
- 即時溫度、濕度、風向風速、氣壓與天氣現象。
- 最近 1 小時雨量卡與最近 8 小時雨量柱狀圖。
- 過去 24 小時氣象趨勢與各縣市一週預報。
- FastAPI REST API、SQLite 歷史資料與 CSV 匯出。
- 每 60 分鐘自動同步，並支援手動更新。
- 使用指定的「七逃趣」旅遊 Logo、淺黃色介面與響應式版面。
- 分開顯示「中央氣象署最新觀測時間」與「瀏覽器本次同步時間」。
- 比較每筆時間戳，禁止較舊 API 資料覆蓋較新的官方快照。
- 提供「縣市 → 行政區」連動雙層選單，篩選後自動縮放地圖並切換至區內測站。

## 專案結構

```text
HW 10 netwarm-rain/
├── backend/
│   ├── api.py                 # FastAPI、REST API、自動更新排程
│   ├── common.py              # 共用設定、CWA API 與資料清理
│   ├── download_weather.py    # O-A0001-001 下載
│   ├── parser.py              # 氣象觀測解析與儲存
│   ├── export_snapshot.py     # 匯出線上 Demo 備援測站快照
│   └── rainfall.py            # O-A0002-001 每小時雨量解析與儲存
├── database/                  # SQLite、CSV 與原始資料（執行後產生）
├── frontend/
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   └── qita-logo.jpg
├── crawler.py                 # F-D0047-091 一週預報
├── requirements.txt
├── CONVERSATION-HIGHLIGHTS.md # AI 協作開發重點紀錄
└── README.md
```

## 安裝

建議使用 Python 3.10 以上版本與虛擬環境：

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

在專案根目錄新增 `.env`：

```dotenv
CWA_API_KEY=你的中央氣象署授權碼
AUTO_UPDATE_MINUTES=60
```

`.env` 已列入 `.gitignore`，請勿把 API Key 提交至 GitHub 或放入前端程式。

## 執行

```powershell
.\.venv\Scripts\python.exe backend\api.py
```

開啟：

- 儀表板：`http://127.0.0.1:8000/`
- API 文件：`http://127.0.0.1:8000/docs`

首次啟動前也可分別更新資料：

```powershell
.\.venv\Scripts\python.exe backend\download_weather.py
.\.venv\Scripts\python.exe backend\parser.py
.\.venv\Scripts\python.exe backend\rainfall.py
.\.venv\Scripts\python.exe crawler.py
```

新安裝的雨量歷史會從第一筆開始累積；服務持續執行滿 8 小時後，即會呈現完整 8 小時序列。

## REST API

| 方法 | 路徑 | 說明 |
| --- | --- | --- |
| GET | `/api/health` | 服務、資料筆數與下一次自動更新狀態 |
| GET | `/api/stations` | 最新測站列表，可使用 `county`、`search` |
| GET | `/api/stations/{id}` | 指定測站最新觀測 |
| GET | `/api/stations/{id}/history?hours=24` | 指定測站氣象歷史 |
| GET | `/api/stations/{id}/rainfall?hours=8` | 最近 8 個每小時雨量與雨量站配對資訊 |
| GET | `/api/stations/{id}/predict` | 最近資料的短期線性趨勢展示 |
| GET | `/api/forecast?county=臺北市` | 指定縣市一週預報 |
| POST | `/api/update` | 在背景更新三組資料 |
| GET | `/api/update/status` | 查詢更新進度與結果 |

## 部署提醒

GitHub Pages 可直接顯示已匯出的 876 站備援快照；Vercel 版本另以同網域 rewrite 轉接既有 FastAPI 服務，取得即時測站、歷史、預報、AI 趨勢與手動更新資料。CWA API Key 仍只保留在後端，不會寫進前端或 GitHub。

### GitHub 每小時自動同步

`.github/workflows/update-qita-weather.yml` 會在每小時第 12 分自動下載 CWA 的 O-A0001-001、O-A0002-001 與 F-D0047-091，更新 `assets/current-stations.json` 後提交。請在 GitHub 專案的 `Settings → Secrets and variables → Actions` 新增 Repository secret：

```text
Name: CWA_API_KEY
Value: 中央氣象署 API 授權碼
```

授權碼只存在 GitHub Secret，不得寫入 HTML、JavaScript、JSON 或 Git commit。也可從 Actions 頁面手動執行 `Update Qita Weather Data` 立即同步。

## 安全

- 不提交 `.env`、API Key、伺服器紀錄或瀏覽器測試資料。
- 後端錯誤訊息會遮蔽授權碼。
- AI 趨勢功能僅供技術展示，不是中央氣象署正式預報。
