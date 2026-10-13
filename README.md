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

2. **市政痛點 AI 辨識巡檢 (對接四大政策)**
   - `#02 找回消失的垃圾桶`：滿溢比率預警、周遭違規棄置稽查（環保局）。
   - `#07 步道安全除錯 (Bug)`：地磚破損、沉陷坑洞、反光標線與護欄鬆脫檢測（工務局水利處）。
   - `#01 把三千棵樹種回來`：老樹倒伏與真菌病害識別、樹木身分證 ID 建檔（工務局公園處）。
   - `#03 鼠患衛生死角治理`：碼頭熱點追蹤、大型雜物與病媒孳生通報（衛生局/環保局）。

3. **戰術駕駛艙 HUD (NT-D Cockpit Dashboard)**
   - **4 條台北河濱巡邏路線**：大佳河濱段 (基隆河左岸)、大稻埕碼頭段 (淡水河右岸)、彩虹河濱段 (內湖迎風面)、關渡水鳥保護區段 (高灘地步道)。
   - **即時 GPS 雷達軌跡**：動態繪製巡邏車移動點、座標與航向角（Heading）。
   - **車載前鏡頭 AI 鎖定**：即時攝影機視角動態渲染 YOLO 綠/紅瞄準鎖定框與置信度。
   - **事件生成與資料管線**：支援手動注入（Inject Fake Bug）、批次產 10 筆、資料清空與即時過濾。
   - **標準資料匯出**：一鍵匯出或複製標準化 `patrol_data.json`。

4. **1999 市政自動派工閉環**
   - 點擊任一事件卡片，即時彈出「1999 DISPATCH TICKET」派工單。
   - 包含現場 AI 影像舉證、GPS 經緯度座標、權責局處、建議處置與 100 天落地說明。
   - 支援「模擬傳送至台北市 1999 陳情派工系統」API 拋轉驗證。

---

## 🚀 本地執行

本專案為零依賴之純前端單頁系統（Vanilla HTML5 / CSS3 / Web Audio API / Canvas）：

```bash
# 啟動本機簡易 HTTP 伺服器
python -m http.server 8088
```

打開瀏覽器造訪 `http://localhost:8088/` 即可體驗完整的 NT-D 啟動與駕駛艙操作！

---

## 📂 專案檔案結構

```
RX-0/
├── index.html           # 駕駛艙主頁面與 NT-D 啟動外框 HUD
├── style.css            # NT-D 霓虹紫光、螢幕震顫與駕駛艙格線樣式
├── app.js               # Web Audio 音效引擎、Canvas 火焰與資料串流邏輯
├── bgm.mp3              # 澤野弘之《UNICORN》BGM 音訊檔
├── SYSTEM_PROPOSAL.md   # 完整系統架構與市政落地企劃書
├── README.md            # 專案介紹與使用說明
└── .gitignore           # Git 忽略檔案設定
```
