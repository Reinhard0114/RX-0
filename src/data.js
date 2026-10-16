/**
 * ============================================================================
 * RX-0 TAIPEI DEBUGGER // CIVIC INSPECTION DATABASE & FAKE DATA ENGINE
 * ============================================================================
 * 
 * 📄 模組說明：
 * 本檔案定義了台北河岸巡檢系統之巡檢河段 (SECTORS)、市政痛點模板 (INCIDENT_TEMPLATES)、
 * 離線影像批次分析資料庫 (PRESET_INSPECTIONS) 與 SVG 舉證產生器。
 * 採用 IIFE 模組化封裝，資料掛載於 `window.RX0_DATA`，與前端 UI 邏輯 (`app.js`) 徹底解耦。
 * 
 * ----------------------------------------------------------------------------
 * 📑 資料結構定義 (DATA SCHEMAS)
 * ----------------------------------------------------------------------------
 * 
 * 1. SECTOR SCHEMA (巡檢河段物件):
 *    @property {string} key           - 河段唯一標識碼 (e.g. 'dadaocheng', 'dajia')
 *    @property {string} name          - 完整河段名稱 (e.g. '大稻埕碼頭水岸段 (淡水河右岸 · 3.8 km)')
 *    @property {string} shortName     - 短名稱，用於圖表軸與標籤 (e.g. '大稻埕水岸')
 *    @property {Object} center        - 河段中心 GPS 基準點 { lat: number, lng: number }
 *    @property {number} deltaLat      - 緯度偏移半徑 (用於雷達畫布座標縮放)
 *    @property {number} deltaLng      - 經度偏移半徑 (用於雷達畫布座標縮放)
 *    @property {string} distanceKm    - 河段總里程長度 (e.g. '3.8 km')
 *    @property {string} framesCount   - 影像總影格數 (e.g. '3,420 F')
 *    @property {string} coverage      - 巡邏覆蓋率 (e.g. '98.5%')
 * 
 * 2. INCIDENT / INSPECTION RECORD SCHEMA (巡檢異常紀錄物件):
 *    @property {string} id            - 案件通報編號 (格式: 'TPE-YYYY-XXXX', e.g. 'TPE-2026-0891')
 *    @property {string} date          - 巡檢日期 (YYYY-MM-DD, e.g. '2026-10-14')
 *    @property {string} time          - 影格偵測時間 (HH:mm:ss, e.g. '11:24:18')
 *    @property {string} sectorKey     - 所屬河段鍵值 (對應 SECTORS 中的 key)
 *    @property {string} sectorName    - 所屬河段名稱
 *    @property {string} category      - 異常類型分類碼 ('trash' | 'pavement' | 'tree' | 'hygiene')
 *    @property {string} categoryName  - 政策分類標籤 (e.g. '#02 找回消失的垃圾桶')
 *    @property {string} title         - 異常事件標題與現場特徵描述
 *    @property {string} severity      - 嚴重度評級 ('high' | 'medium' | 'low')
 *    @property {string} department    - 建議權責派工局處 (e.g. '環境保護局 大同清潔隊')
 *    @property {string} suggestedAction- 建議現場處置或改善方案
 *    @property {Object} coordinates   - 異常地點經緯度 { lat: number, lng: number }
 *    @property {string} mileage       - 步道里程樁號定位 (e.g. '0K+850', '2K+150')
 *    @property {string} confidence    - AI 辨識置信度 (e.g. '95.4%')
 *    @property {string} frameId       - 對應影片影格編號 (關聯 GPS 遙測軌道之主鍵, e.g. '#01842')
 *    @property {number} routeT        - 路線相對位置進度 (0.0 ~ 1.0, 用於雷達地圖熱點繪製)
 *    @property {string} status        - 派工狀態 ('pending' 待審核 | 'dispatched' 已派發 1999)
 * 
 * 3. TEMPLATE SCHEMA (自訂異常注入模板):
 *    @property {string} title         - 模板預設標題
 *    @property {string} category      - 分類別代碼
 *    @property {string} categoryName  - 政策痛點分類標籤
 *    @property {string} severity      - 預設嚴重度
 *    @property {string} department    - 權責主管單位
 *    @property {string} suggestedAction- 處置建議
 *    @property {string} color         - HUD 主題色彩 (Hex)
 *    @property {string} svgIcon       - 圖示標籤
 * ============================================================================
 */
(function () {
  'use strict';

  // ============================================================================
  // 1. PATROL SECTORS CONFIGURATION
  // ============================================================================
  const SECTORS = {
  dadaocheng: {
    key: 'dadaocheng',
    name: '大稻埕碼頭水岸段 (淡水河右岸 · 3.8 km)',
    shortName: '大稻埕水岸',
    center: { lat: 25.0569, lng: 121.5078 },
    deltaLat: 0.008,
    deltaLng: 0.005,
    distanceKm: '3.8 km',
    framesCount: '3,420 F',
    coverage: '98.5%'
  },
  dajia: {
    key: 'dajia',
    name: '大佳河濱公園段 (基隆河左岸 · 4.2 km)',
    shortName: '大佳河濱',
    center: { lat: 25.0742, lng: 121.5348 },
    deltaLat: 0.006,
    deltaLng: 0.012,
    distanceKm: '4.2 km',
    framesCount: '4,150 F',
    coverage: '99.2%'
  },
  rainbow: {
    key: 'rainbow',
    name: '彩虹河濱公園段 (內湖迎風面 · 5.1 km)',
    shortName: '彩虹河濱',
    center: { lat: 25.0551, lng: 121.5742 },
    deltaLat: 0.005,
    deltaLng: 0.015,
    distanceKm: '5.1 km',
    framesCount: '5,020 F',
    coverage: '97.8%'
  },
  guandu: {
    key: 'guandu',
    name: '關渡水鳥保護區段 (高灘地步道 · 6.5 km)',
    shortName: '關渡高灘地',
    center: { lat: 25.1225, lng: 121.4682 },
    deltaLat: 0.007,
    deltaLng: 0.008,
    distanceKm: '6.5 km',
    framesCount: '6,380 F',
    coverage: '99.5%'
  }
};

// ============================================================================
// 2. INCIDENT TEMPLATES & PROCEDURAL SVG EVIDENCE GENERATOR
// ============================================================================
const INCIDENT_TEMPLATES = {
  trash: [
    {
      title: '#02 找回消失的垃圾桶：容量滿溢警報',
      category: 'trash',
      categoryName: '#02 找回消失的垃圾桶',
      severity: 'high',
      department: '環境保護局 清潔隊',
      suggestedAction: '派駐水岸清運專車前往替換內膽並加強周遭違規棄置稽查',
      color: '#ff003c',
      svgIcon: 'trash'
    },
    {
      title: '#02 行人清潔箱周遭遭非法家戶垃圾袋散落堆置',
      category: 'trash',
      categoryName: '#02 找回消失的垃圾桶',
      severity: 'medium',
      department: '環境保護局 環保稽查大隊',
      suggestedAction: '通報分隊清除廢棄物並配合智慧路口監視器破袋開罰',
      color: '#ffb703',
      svgIcon: 'trash'
    }
  ],
  pavement: [
    {
      title: '#07 河岸步道透水地磚大面積破損與沉陷坑洞',
      category: 'pavement',
      categoryName: '#07 步道安全除錯 (Bug)',
      severity: 'high',
      department: '工務局水利工程處 河川工程科',
      suggestedAction: '已生成警示工單，調派維修工班於 48 小時內進行瀝青冷補或換磚',
      color: '#ff003c',
      svgIcon: 'pavement'
    },
    {
      title: '#07 自行車道夜間反光標線脫落磨損暨護欄鬆脫',
      category: 'pavement',
      categoryName: '#07 步道安全除錯 (Bug)',
      severity: 'medium',
      department: '工務局水利工程處 工務科',
      suggestedAction: '納入每週例行五金加固與熱拌標線補繪排程',
      color: '#ffb703',
      svgIcon: 'pavement'
    }
  ],
  tree: [
    {
      title: '#01 把三千棵樹種回來：苦楝老樹受強風吹襲半倒伏 (傾角 18°)',
      category: 'tree',
      categoryName: '#01 把三千棵樹種回來',
      severity: 'high',
      department: '工務局公園路燈工程管理處 園藝工程隊',
      suggestedAction: '判定具有壓傷行人風險，出動吊卡車進行支架扶正與修剪扶育',
      color: '#ff003c',
      svgIcon: 'tree'
    },
    {
      title: '#01 高灘地步道白千層樹穴缺漏與樹幹真菌病斑',
      category: 'tree',
      categoryName: '#01 把三千棵樹種回來',
      severity: 'medium',
      department: '工務局公園處 青年公園管理所',
      suggestedAction: '建檔樹木身分證 ID，安排樹醫塗劑治療並列入秋季原生喬木補植名冊',
      color: '#ffb703',
      svgIcon: 'tree'
    }
  ],
  hygiene: [
    {
      title: '#03 鼠患四處跑：碼頭餐飲市集後方水溝發現溝鼠活動熱點',
      category: 'hygiene',
      categoryName: '#03 鼠患衛生死角治理',
      severity: 'high',
      department: '衛生局 疾病管制科 / 環保局',
      suggestedAction: '繪製鼠患傳播熱點圖，安排下水道熱煙霧消毒並督導攤商油脂截留',
      color: '#ff003c',
      svgIcon: 'rat'
    },
    {
      title: '#03 草叢死角堆置廢棄保麗龍盒與積水容器滋生病媒',
      category: 'hygiene',
      categoryName: '#03 鼠患衛生死角治理',
      severity: 'medium',
      department: '環境保護局 病媒防治隊',
      suggestedAction: '清理積水容器並噴灑粒劑投藥防治登革熱',
      color: '#ffb703',
      svgIcon: 'rat'
    }
  ]
};

// Procedural snapshot SVG generator
function generateSnapshotSvg(type, title, coords) {
  let themeColor = '#ff003c';
  let badgeText = 'OBJECT DETECTED';
  let iconSvg = '';

  if (type === 'trash') {
    themeColor = '#ff003c';
    badgeText = 'TRASH OVERFLOW 94%';
    iconSvg = `
      <rect x="130" y="70" width="60" height="70" rx="4" fill="#333" stroke="${themeColor}" stroke-width="2"/>
      <rect x="120" y="60" width="80" height="8" rx="2" fill="${themeColor}"/>
      <circle cx="150" cy="50" r="12" fill="#ff7043" opacity="0.8"/>
      <circle cx="170" cy="54" r="10" fill="#fff" opacity="0.6"/>
    `;
  } else if (type === 'pavement') {
    themeColor = '#ff9100';
    badgeText = 'PAVEMENT CRACK 91%';
    iconSvg = `
      <path d="M110,80 L140,110 L160,95 L190,130" stroke="${themeColor}" stroke-width="4" fill="none" stroke-linecap="round"/>
      <polygon points="135,100 150,90 145,115" fill="${themeColor}" opacity="0.8"/>
    `;
  } else if (type === 'tree') {
    themeColor = '#00e676';
    badgeText = 'TREE HAZARD 89%';
    iconSvg = `
      <rect x="155" y="80" width="10" height="60" fill="#8d6e63"/>
      <path d="M160,30 L130,80 L190,80 Z" fill="${themeColor}" opacity="0.8"/>
      <line x1="160" y1="50" x2="135" y2="70" stroke="#d50000" stroke-width="3"/>
    `;
  } else {
    themeColor = '#e040fb';
    badgeText = 'RODENT SIGNS 88%';
    iconSvg = `
      <ellipse cx="160" cy="100" rx="28" ry="16" fill="#616161"/>
      <circle cx="185" cy="95" r="4" fill="${themeColor}"/>
      <path d="M132,100 Q110,90 100,105" stroke="#757575" stroke-width="3" fill="none"/>
    `;
  }

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" width="320" height="200">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#0a0e17"/>
          <stop offset="100%" stop-color="#141a24"/>
        </linearGradient>
      </defs>
      <rect width="320" height="200" fill="url(#bg)"/>
      <line x1="0" y1="140" x2="320" y2="140" stroke="#1f293d" stroke-width="2"/>
      
      <!-- Simulated River Path -->
      <polygon points="40,200 140,140 180,140 280,200" fill="#1a202c"/>
      <line x1="160" y1="140" x2="160" y2="200" stroke="#374151" stroke-dasharray="8,8" stroke-width="2"/>

      <!-- Subject Target -->
      ${iconSvg}

      <!-- AI Bounding Box -->
      <rect x="95" y="35" width="130" height="120" fill="none" stroke="${themeColor}" stroke-width="2" stroke-dasharray="6,4"/>
      <rect x="95" y="20" width="130" height="15" fill="${themeColor}"/>
      <text x="100" y="31" fill="#000" font-family="monospace" font-size="9" font-weight="bold">${badgeText}</text>

      <!-- HUD Telemetry Watermark -->
      <text x="10" y="185" fill="#6b7280" font-family="monospace" font-size="8">CAM: RX0-FRONT-4K</text>
      <text x="10" y="195" fill="#6b7280" font-family="monospace" font-size="8">GPS: ${coords.lat}, ${coords.lng}</text>
      <circle cx="300" cy="20" r="5" fill="#ff1744"/>
    </svg>
  `;

  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

// ============================================================================
// 3. COMPLETE MUNICIPAL INSPECTION DATABASE (OFFLINE BATCH RUNS)
// ============================================================================
const PRESET_INSPECTIONS = [
  // ==========================================================================
  // --- 2026-10-14 TODAY (LATEST) ---
  // ==========================================================================
  // [大稻埕水岸 2026-10-14]
  {
    id: 'TPE-2026-0891',
    date: '2026-10-14',
    time: '11:24:18',
    sectorKey: 'dadaocheng',
    sectorName: '大稻埕碼頭水岸段 (淡水河右岸)',
    category: 'trash',
    categoryName: '#02 找回消失的垃圾桶',
    title: '#02 找回消失的垃圾桶：水岸階梯旁垃圾桶滿溢警報',
    severity: 'high',
    department: '環境保護局 大同清潔隊',
    suggestedAction: '調派水岸巡邏機車前往清運換膽，加強違規棄置家戶垃圾稽查',
    coordinates: { lat: 25.0569, lng: 121.5078 },
    mileage: '0K+850',
    confidence: '95.4%',
    frameId: '#01842',
    routeT: 0.22,
    status: 'dispatched'
  },
  {
    id: 'TPE-2026-0892',
    date: '2026-10-14',
    time: '11:31:05',
    sectorKey: 'dadaocheng',
    sectorName: '大稻埕碼頭水岸段 (淡水河右岸)',
    category: 'hygiene',
    categoryName: '#03 鼠患衛生死角治理',
    title: '#03 鼠患四處跑：碼頭貨櫃市集後方水溝發現溝鼠活動熱點',
    severity: 'high',
    department: '衛生局 疾病管制科 / 環保局',
    suggestedAction: '繪製鼠患傳播熱點圖，安排下水道熱煙霧消毒並督導攤商油脂截留',
    coordinates: { lat: 25.0582, lng: 121.5085 },
    mileage: '1K+120',
    confidence: '93.2%',
    frameId: '#02115',
    routeT: 0.45,
    status: 'dispatched'
  },
  {
    id: 'TPE-2026-0893',
    date: '2026-10-14',
    time: '11:38:40',
    sectorKey: 'dadaocheng',
    sectorName: '大稻埕碼頭水岸段 (淡水河右岸)',
    category: 'pavement',
    categoryName: '#07 步道安全除錯 (Bug)',
    title: '#07 步道安全除錯：自行車專用道鋪面碎石及沉陷坑洞',
    severity: 'medium',
    department: '工務局水利工程處 工務科',
    suggestedAction: '已生成警示工單，調派維修工班於 48 小時內進行瀝青冷補',
    coordinates: { lat: 25.0601, lng: 121.5092 },
    mileage: '1K+650',
    confidence: '91.8%',
    frameId: '#02580',
    routeT: 0.68,
    status: 'pending'
  },
  {
    id: 'TPE-2026-0894',
    date: '2026-10-14',
    time: '11:45:12',
    sectorKey: 'dadaocheng',
    sectorName: '大稻埕碼頭水岸段 (淡水河右岸)',
    category: 'trash',
    categoryName: '#02 找回消失的垃圾桶',
    title: '#02 行人清潔箱周遭遭非法家戶垃圾袋散落堆置',
    severity: 'high',
    department: '環境保護局 環保稽查大隊',
    suggestedAction: '調派大同清潔隊清除廢棄物並配合監視器稽查破袋開罰',
    coordinates: { lat: 25.0624, lng: 121.5101 },
    mileage: '2K+300',
    confidence: '94.6%',
    frameId: '#03010',
    routeT: 0.82,
    status: 'dispatched'
  },
  {
    id: 'TPE-2026-0895',
    date: '2026-10-14',
    time: '11:50:33',
    sectorKey: 'dadaocheng',
    sectorName: '大稻埕碼頭水岸段 (淡水河右岸)',
    category: 'tree',
    categoryName: '#01 把三千棵樹種回來',
    title: '#01 把三千棵樹種回來：苦楝老樹受強風吹襲半倒伏 (傾角 18°)',
    severity: 'medium',
    department: '工務局公園路燈工程管理處 園藝工程隊',
    suggestedAction: '判定具有壓傷行人風險，出動吊卡車進行支架扶正與樹木建檔',
    coordinates: { lat: 25.0645, lng: 121.5114 },
    mileage: '2K+900',
    confidence: '89.5%',
    frameId: '#03340',
    routeT: 0.92,
    status: 'dispatched'
  },

  // [大佳河濱 2026-10-14]
  {
    id: 'TPE-2026-0881',
    date: '2026-10-14',
    time: '09:15:20',
    sectorKey: 'dajia',
    sectorName: '大佳河濱公園段 (基隆河左岸)',
    category: 'tree',
    categoryName: '#01 把三千棵樹種回來',
    title: '#01 把三千棵樹種回來：大草皮老榕樹受強風傾斜且樹幹出現真菌病斑',
    severity: 'high',
    department: '工務局公園處 園藝隊 / 樹醫小組',
    suggestedAction: '建檔樹木身分證 ID，安排樹醫進行塗劑治療與緊急支撐架架設',
    coordinates: { lat: 25.0742, lng: 121.5348 },
    mileage: '1K+200',
    confidence: '96.1%',
    frameId: '#01120',
    routeT: 0.28,
    status: 'dispatched'
  },
  {
    id: 'TPE-2026-0882',
    date: '2026-10-14',
    time: '09:28:44',
    sectorKey: 'dajia',
    sectorName: '大佳河濱公園段 (基隆河左岸)',
    category: 'pavement',
    categoryName: '#07 步道安全除錯 (Bug)',
    title: '#07 步道安全除錯：迎風段透水地磚碎裂隆起威脅單車安全',
    severity: 'high',
    department: '工務局水利工程處 河川工程科',
    suggestedAction: '通報水利處工務所派員排程 48 小時內換磚與路面壓平',
    coordinates: { lat: 25.0758, lng: 121.5392 },
    mileage: '2K+150',
    confidence: '93.5%',
    frameId: '#01890',
    routeT: 0.52,
    status: 'dispatched'
  },
  {
    id: 'TPE-2026-0883',
    date: '2026-10-14',
    time: '09:42:10',
    sectorKey: 'dajia',
    sectorName: '大佳河濱公園段 (基隆河左岸)',
    category: 'trash',
    categoryName: '#02 找回消失的垃圾桶',
    title: '#02 找回消失的垃圾桶：大直橋下觀景平台垃圾桶容積滿溢 (84%)',
    severity: 'medium',
    department: '環境保護局 中山清潔隊',
    suggestedAction: '通報清運班攜帶替換內膽前往清空',
    coordinates: { lat: 25.0771, lng: 121.5435 },
    mileage: '3K+400',
    confidence: '92.0%',
    frameId: '#02450',
    routeT: 0.78,
    status: 'pending'
  },
  {
    id: 'TPE-2026-0884',
    date: '2026-10-14',
    time: '10:02:15',
    sectorKey: 'dajia',
    sectorName: '大佳河濱公園段 (基隆河左岸)',
    category: 'hygiene',
    categoryName: '#03 鼠患衛生死角治理',
    title: '#03 鼠患衛生防治：共融式遊戲場周圍矮灌木叢發現廢棄飲品殘渣',
    severity: 'medium',
    department: '環境保護局 中山清潔隊',
    suggestedAction: '加強遊戲區周圍垃圾桶清運頻率並實施漂白水地面沖洗',
    coordinates: { lat: 25.0762, lng: 121.5365 },
    mileage: '1K+800',
    confidence: '90.7%',
    frameId: '#02890',
    routeT: 0.38,
    status: 'dispatched'
  },

  // [彩虹河濱 2026-10-14]
  {
    id: 'TPE-2026-0871',
    date: '2026-10-14',
    time: '14:15:30',
    sectorKey: 'rainbow',
    sectorName: '彩虹河濱公園段 (內湖迎風面)',
    category: 'pavement',
    categoryName: '#07 步道安全除錯 (Bug)',
    title: '#07 步道安全除錯：麥帥二橋下自行車迴轉道鋪面破裂坑洞',
    severity: 'high',
    department: '工務局水利工程處 工務科',
    suggestedAction: '已生成緊急除錯工單，先行設置安全警示錐並排定瀝青重鋪',
    coordinates: { lat: 25.0558, lng: 121.5710 },
    mileage: '1K+100',
    confidence: '94.2%',
    frameId: '#03120',
    routeT: 0.25,
    status: 'dispatched'
  },
  {
    id: 'TPE-2026-0872',
    date: '2026-10-14',
    time: '14:32:10',
    sectorKey: 'rainbow',
    sectorName: '彩虹河濱公園段 (內湖迎風面)',
    category: 'trash',
    categoryName: '#02 找回消失的垃圾桶',
    title: '#02 找回消失的垃圾桶：壘球場看台旁垃圾筒被野狗翻弄散落',
    severity: 'medium',
    department: '環境保護局 內湖清潔隊',
    suggestedAction: '派員完成周邊撿拾，研議更換為附防鳥獸擋板之新型清潔箱',
    coordinates: { lat: 25.0565, lng: 121.5768 },
    mileage: '2K+450',
    confidence: '91.5%',
    frameId: '#03680',
    routeT: 0.58,
    status: 'pending'
  },

  // [關渡高灘地 2026-10-14]
  {
    id: 'TPE-2026-0861',
    date: '2026-10-14',
    time: '15:10:45',
    sectorKey: 'guandu',
    sectorName: '關渡水鳥保護區段 (高灘地步道)',
    category: 'tree',
    categoryName: '#01 把三千棵樹種回來',
    title: '#01 種回三千棵樹：水鳥保護區棧道口枯乾空樹穴衛星對齊確認',
    severity: 'medium',
    department: '工務局公園處 陽明山管理所',
    suggestedAction: '紀錄 GPS 坐標對齊空缺樹穴，列入台北市綠覆率回補專案',
    coordinates: { lat: 25.1235, lng: 121.4675 },
    mileage: '2K+100',
    confidence: '95.1%',
    frameId: '#04150',
    routeT: 0.35,
    status: 'dispatched'
  },
  {
    id: 'TPE-2026-0862',
    date: '2026-10-14',
    time: '15:28:12',
    sectorKey: 'guandu',
    sectorName: '關渡水鳥保護區段 (高灘地步道)',
    category: 'pavement',
    categoryName: '#07 步道安全除錯 (Bug)',
    title: '#07 步道安全除錯：紅樹林木棧道螺栓凸起鬆動恐絆倒慢跑者',
    severity: 'high',
    department: '工務局水利處 河川工程科',
    suggestedAction: '派巡修小組以氣動起子鎖固並更換腐朽橫梁',
    coordinates: { lat: 25.1248, lng: 121.4698 },
    mileage: '3K+800',
    confidence: '93.8%',
    frameId: '#04820',
    routeT: 0.62,
    status: 'dispatched'
  },

  // ==========================================================================
  // --- 2026-10-13 YESTERDAY ---
  // ==========================================================================
  {
    id: 'TPE-2026-0751',
    date: '2026-10-13',
    time: '16:10:00',
    sectorKey: 'dadaocheng',
    sectorName: '大稻埕碼頭水岸段 (淡水河右岸)',
    category: 'trash',
    categoryName: '#02 找回消失的垃圾桶',
    title: '#02 找回消失的垃圾桶：假日人潮後垃圾箱滿溢散落',
    severity: 'high',
    department: '環境保護局 大同清潔隊',
    suggestedAction: '已於 2 小時內完成清運並換膽 (SLA 達標結案)',
    coordinates: { lat: 25.0565, lng: 121.5072 },
    mileage: '0K+700',
    confidence: '95.8%',
    frameId: '#04120',
    routeT: 0.18,
    status: 'dispatched'
  },
  {
    id: 'TPE-2026-0752',
    date: '2026-10-13',
    time: '16:40:15',
    sectorKey: 'rainbow',
    sectorName: '彩虹河濱公園段 (內湖迎風面)',
    category: 'pavement',
    categoryName: '#07 步道安全除錯 (Bug)',
    title: '#07 步道安全除錯：麥帥一橋下夜間反光標線脫落磨損',
    severity: 'medium',
    department: '工務局水利工程處 工務科',
    suggestedAction: '已納入本週熱拌標線補繪工單',
    coordinates: { lat: 25.0551, lng: 121.5742 },
    mileage: '1K+800',
    confidence: '91.2%',
    frameId: '#03880',
    routeT: 0.42,
    status: 'dispatched'
  },
  {
    id: 'TPE-2026-0753',
    date: '2026-10-13',
    time: '17:05:30',
    sectorKey: 'guandu',
    sectorName: '關渡水鳥保護區段 (高灘地步道)',
    category: 'tree',
    categoryName: '#01 把三千棵樹種回來',
    title: '#01 把三千棵樹種回來：保護區棧道旁枯萎空樹穴 GPS 建檔',
    severity: 'medium',
    department: '工務局公園處 陽明山管理所',
    suggestedAction: '列入秋季河岸原生喬木補植名冊',
    coordinates: { lat: 25.1225, lng: 121.4682 },
    mileage: '3K+200',
    confidence: '94.0%',
    frameId: '#02900',
    routeT: 0.65,
    status: 'dispatched'
  },
  {
    id: 'TPE-2026-0754',
    date: '2026-10-13',
    time: '14:22:18',
    sectorKey: 'dajia',
    sectorName: '大佳河濱公園段 (基隆河左岸)',
    category: 'pavement',
    categoryName: '#07 步道安全除錯 (Bug)',
    title: '#07 步道安全除錯：划船碼頭登船引道扶手鏽蝕螺絲鬆脫',
    severity: 'medium',
    department: '工務局水利工程處 河川工程科',
    suggestedAction: '現場緊急上防鏽噴劑並更換白鐵防脫螺絲',
    coordinates: { lat: 25.0748, lng: 121.5370 },
    mileage: '1K+650',
    confidence: '92.6%',
    frameId: '#02310',
    routeT: 0.44,
    status: 'dispatched'
  },
  {
    id: 'TPE-2026-0755',
    date: '2026-10-13',
    time: '15:15:40',
    sectorKey: 'dadaocheng',
    sectorName: '大稻埕碼頭水岸段 (淡水河右岸)',
    category: 'hygiene',
    categoryName: '#03 鼠患衛生死角治理',
    title: '#03 鼠患四處跑：水門周遭草叢遺留大量烤肉炭灰與廚餘',
    severity: 'high',
    department: '環境保護局 大同清潔隊',
    suggestedAction: '已於通報當日派遣水車洗刷地面並投遞滅鼠餌劑',
    coordinates: { lat: 25.0575, lng: 121.5080 },
    mileage: '0K+950',
    confidence: '94.8%',
    frameId: '#02740',
    routeT: 0.32,
    status: 'dispatched'
  },

  // ==========================================================================
  // --- 2026-10-12 PREVIOUS (防汛專案巡檢) ---
  // ==========================================================================
  {
    id: 'TPE-2026-0610',
    date: '2026-10-12',
    time: '14:20:10',
    sectorKey: 'dadaocheng',
    sectorName: '大稻埕碼頭水岸段 (淡水河右岸)',
    category: 'hygiene',
    categoryName: '#03 鼠患衛生死角治理',
    title: '#03 鼠患四處跑：延平河濱公園草叢死角堆置廢棄保麗龍盒',
    severity: 'high',
    department: '衛生局 疾病管制科 / 環保局',
    suggestedAction: '已排程清潔隊清運完畢並投藥消毒結案',
    coordinates: { lat: 25.0595, lng: 121.5090 },
    mileage: '1K+400',
    confidence: '92.4%',
    frameId: '#02180',
    routeT: 0.55,
    status: 'dispatched'
  },
  {
    id: 'TPE-2026-0611',
    date: '2026-10-12',
    time: '14:48:30',
    sectorKey: 'dajia',
    sectorName: '大佳河濱公園段 (基隆河左岸)',
    category: 'trash',
    categoryName: '#02 找回消失的垃圾桶',
    title: '#02 找回消失的垃圾桶：防汛演練後活動式垃圾桶未歸定位',
    severity: 'medium',
    department: '環境保護局 中山清潔隊',
    suggestedAction: '移回原標繪定點並用鐵鍊防風加固',
    coordinates: { lat: 25.0760, lng: 121.5410 },
    mileage: '2K+600',
    confidence: '91.0%',
    frameId: '#01940',
    routeT: 0.65,
    status: 'dispatched'
  },
  {
    id: 'TPE-2026-0612',
    date: '2026-10-12',
    time: '15:20:15',
    sectorKey: 'rainbow',
    sectorName: '彩虹河濱公園段 (內湖迎風面)',
    category: 'tree',
    categoryName: '#01 把三千棵樹種回來',
    title: '#01 把三千棵樹種回來：防汛疏伐修剪枝葉堆置於慢跑步道旁',
    severity: 'medium',
    department: '工務局公園處 園藝隊',
    suggestedAction: '派遣大型碎木車進場碎枝清運',
    coordinates: { lat: 25.0555, lng: 121.5735 },
    mileage: '1K+500',
    confidence: '93.4%',
    frameId: '#02880',
    routeT: 0.36,
    status: 'dispatched'
  },
  {
    id: 'TPE-2026-0613',
    date: '2026-10-12',
    time: '16:05:40',
    sectorKey: 'guandu',
    sectorName: '關渡水鳥保護區段 (高灘地步道)',
    category: 'pavement',
    categoryName: '#07 步道安全除錯 (Bug)',
    title: '#07 步道安全除錯：河口潮汐漲潮造成低窪路段嚴重泥濘積水',
    severity: 'high',
    department: '工務局水利處 工務科',
    suggestedAction: '設置臨時防滑警示板並評估墊高步道路基',
    coordinates: { lat: 25.1230, lng: 121.4680 },
    mileage: '2K+800',
    confidence: '96.5%',
    frameId: '#03410',
    routeT: 0.50,
    status: 'dispatched'
  },

  // ==========================================================================
  // --- 2026-10-11 & 2026-10-10 (HISTORICAL DATA FOR 7-DAY ACCUMULATION) ---
  // ==========================================================================
  {
    id: 'TPE-2026-0520',
    date: '2026-10-11',
    time: '10:14:00',
    sectorKey: 'dadaocheng',
    sectorName: '大稻埕碼頭水岸段 (淡水河右岸)',
    category: 'trash',
    categoryName: '#02 找回消失的垃圾桶',
    title: '#02 找回消失的垃圾桶：假日街頭藝人表演區清潔箱爆滿',
    severity: 'high',
    department: '環境保護局 大同清潔隊',
    suggestedAction: '清運完畢並加設兩組活動式垃圾架',
    coordinates: { lat: 25.0571, lng: 121.5079 },
    mileage: '0K+900',
    confidence: '94.2%',
    frameId: '#01520',
    routeT: 0.26,
    status: 'dispatched'
  },
  {
    id: 'TPE-2026-0521',
    date: '2026-10-11',
    time: '11:05:22',
    sectorKey: 'dajia',
    sectorName: '大佳河濱公園段 (基隆河左岸)',
    category: 'pavement',
    categoryName: '#07 步道安全除錯 (Bug)',
    title: '#07 步道安全除錯：單車租借站前車道減速墊碎裂位移',
    severity: 'high',
    department: '工務局水利處 河川工程科',
    suggestedAction: '以膨脹螺栓重鎖新橡膠減速墊',
    coordinates: { lat: 25.0745, lng: 121.5355 },
    mileage: '1K+400',
    confidence: '95.0%',
    frameId: '#01780',
    routeT: 0.32,
    status: 'dispatched'
  },
  {
    id: 'TPE-2026-0480',
    date: '2026-10-10',
    time: '08:45:10',
    sectorKey: 'rainbow',
    sectorName: '彩虹河濱公園段 (內湖迎風面)',
    category: 'hygiene',
    categoryName: '#03 鼠患衛生死角治理',
    title: '#03 鼠患衛生防治：國慶連假野餐熱區草皮遺留廚餘吸引鼠群',
    severity: 'high',
    department: '環境保護局 內湖清潔隊',
    suggestedAction: '全面動員清掃消毒並立牌宣導「無痕山林」',
    coordinates: { lat: 25.0560, lng: 121.5725 },
    mileage: '1K+900',
    confidence: '93.9%',
    frameId: '#02050',
    routeT: 0.48,
    status: 'dispatched'
  },
  {
    id: 'TPE-2026-0481',
    date: '2026-10-10',
    time: '09:30:40',
    sectorKey: 'guandu',
    sectorName: '關渡水鳥保護區段 (高灘地步道)',
    category: 'tree',
    categoryName: '#01 把三千棵樹種回來',
    title: '#01 把三千棵樹種回來：苦楝老樹受雷擊斷枝阻礙步道',
    severity: 'high',
    department: '工務局公園處 園藝工程隊',
    suggestedAction: '出動鏈鋸班切除斷枝並以木料就地堆疊生態堆',
    coordinates: { lat: 25.1240, lng: 121.4690 },
    mileage: '3K+500',
    confidence: '97.2%',
    frameId: '#03110',
    routeT: 0.55,
    status: 'dispatched'
  }
];

  // ============================================================================
  // 4. MUNICIPAL 7-DAY HISTORICAL TREND DATASET
  // ============================================================================
  const HISTORICAL_TREND_7D = {
    dates: ['10/08', '10/09', '10/10', '10/11', '10/12', '10/13', '10/14 (今日)'],
    newIncidents: [28, 24, 21, 19, 17, 15, 13],
    resolvedIncidents: [18, 20, 22, 21, 20, 18, 19]
  };

  // Attach data objects to global window scope for modular use
  window.RX0_DATA = {
    SECTORS,
    INCIDENT_TEMPLATES,
    PRESET_INSPECTIONS,
    HISTORICAL_TREND_7D,
    generateSnapshotSvg
  };
})();
