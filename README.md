# RX-0 TAIPEI DEBUGGER // NT-D SYSTEM

> 2026 台北市政黑客松（Taipei Civic Debugathon）× 台北研究院先導概念驗證  
> 台北河岸無人巡檢智慧治理系統（Taipei Riverfront Autonomous Inspection & Civic Debugger System）

🌐 **線上 Demo 展示站**：[https://gundam_uc.lab.pengucat.com/](https://gundam_uc.lab.pengucat.com/)  
📑 **完整系統企劃書**：[SYSTEM_PROPOSAL.md](./SYSTEM_PROPOSAL.md)

---

## ⚡ 系統核心功能

1. **鋼彈 UC 獨角獸 NT-D 駕駛艙啟動儀式**
   - 待命駕駛艙手動啟動控制（符合瀏覽器 Autoplay 規範）。
   - 點擊按鈕觸發 Canvas 高密度紫紅火焰等化器光條粒子、全螢幕機甲震顫（Cockpit Rumble）。
   - 澤野弘之《UNICORN》BGM 同步震撼播放。
   - 10.0 秒超頻倒數與 Psycho-Frame 共振日誌，倒數完畢自動無縫接入主控台。
   - 點擊左側品牌 Logo（`RX-0 ROVER [HOME ⚡]`）可隨時重置並返回開機啟動儀式。

2. **雙模式切換導覽（HUD View Switcher）**
   - **🎯 戰術巡檢視圖 (Tactical Patrol)**：包含 4 條河濱段 GPS 航線熱點、AI 現場截圖驗證（Evidence Viewer）與 1999 自動派工卡片。
   - **📊 市政統計戰報 (Municipal Analytics War Room)**：整合 Apache ECharts 提供工務局與高層戰情室，展示瑕疵分類 Donut 圖、1999 跨局處派工漏斗、4 大河段修復堆疊長條圖與 7 日趨勢折線圖。

3. **市政痛點 AI 辨識巡檢 (對接四大政策)**
   - `#02 找回消失的垃圾桶`：滿溢比率預警、周遭違規棄置稽查（環保局）。
   - `#07 步道安全除錯 (Bug)`：地磚破損、沉陷坑洞、反光標線與護欄鬆脫檢測（工務局水利處）。
   - `#01 把三千棵樹種回來`：老樹倒伏與真菌病害識別、樹木身分證 ID 建檔（工務局公園處）。
   - `#03 鼠患衛生死角治理`：碼頭熱點追蹤、大型雜物與病媒孳生通報（衛生局/環保局）。

4. **1999 市政自動派工閉環**
   - 點擊任一事件卡片，即時彈出「1999 DISPATCH TICKET」派工單。
   - 包含現場 AI 影像舉證、GPS 經緯度座標、權責局處、建議處置與 100 天落地說明。
   - 支援「模擬傳送至台北市 1999 陳情派工系統」API 拋轉驗證。

5. **輕量極速部署與獨立資料架構 (Zero-Build & S3 Ready)**
   - 資料模組完全獨立抽離至 `data.js`，包含多河段與歷史假資料庫，業務資料與前端渲染邏輯徹底解耦。
   - 保留純前端零依賴架構，可直接放置於 AWS S3 + CloudFront CDN + Route53 託管上線。

---

## 🚀 本地執行

本專案為零依賴之純前端單頁系統（Vanilla HTML5 / CSS3 / Web Audio API / Canvas / Apache ECharts）：

```bash
# 啟動本機簡易 HTTP 伺服器
python -m http.server 8088
```

打開瀏覽器造訪 `http://localhost:8088/` 即可體驗完整的 NT-D 啟動與駕駛艙操作！

---

## 📂 專案檔案結構

```
RX-0/
├── index.html              # 駕駛艙主頁面入口、NT-D 外框 HUD 與 ECharts 戰情室結構
├── src/                    # 🎯 前端核心程式碼（Dashboard 相關模組）
│   ├── app.js              # Web Audio 音效、Canvas 擬真 HUD、雙視圖切換與 ECharts 動態連動
│   ├── data.js             # 巡檢資料庫模組（SECTORS, 歷程 Fake Data, JSDoc Schema）
│   └── style.css           # NT-D 霓虹紫光、螢幕震顫、雙視圖樣式與全域 Utility
├── assets/                 # 靜態資源目錄
│   ├── audio/              # bgm.mp3（澤野弘之《UNICORN》BGM 音訊檔）
│   ├── evidence/           # 4 大市政痛點 GoPro 擬真巡檢實證照片
│   └── icons/              # favicon.svg, favicon.ico 賽博龐克獨角獸圖示
├── SYSTEM_PROPOSAL.md      # 完整系統架構與市政落地企劃書
├── README.md               # 專案介紹與使用說明
└── .gitignore              # Git 忽略檔案設定
```
