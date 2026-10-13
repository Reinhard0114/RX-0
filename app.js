/**
 * RX-0 TAIPEI DEBUGGER // NT-D SYSTEM CONTROLLER
 * Full Web Audio Synthesizer + Rover Simulator + Fake Data Engine
 */

// ============================================================================
// 1. WEB AUDIO API SYNTHESIZER (NT-D MECHA SOUND EFFECTS)
// ============================================================================
class MechaAudioEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  // Gundam Lock-on Beep (High pitch double chirp)
  playLockOn() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    
    [0, 0.08].forEach((delay) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1480, now + delay);
      osc.frequency.exponentialRampToValueAtTime(1920, now + delay + 0.05);

      gain.gain.setValueAtTime(0.18, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + 0.06);
    });
  }

  // NT-D Psycho-Frame Engage Sequence (Rising hum + power swell)
  playNtdEngage() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;

    // Sub-bass hum
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(75, now);
    subOsc.frequency.exponentialRampToValueAtTime(220, now + 1.2);
    subGain.gain.setValueAtTime(0.3, now);
    subGain.gain.exponentialRampToValueAtTime(0.01, now + 1.5);
    subOsc.connect(subGain);
    subGain.connect(this.ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 1.5);

    // Psycho-frame resonance harmonic
    const harmOsc = this.ctx.createOscillator();
    const harmGain = this.ctx.createGain();
    harmOsc.type = 'sawtooth';
    harmOsc.frequency.setValueAtTime(440, now + 0.2);
    harmOsc.frequency.exponentialRampToValueAtTime(880, now + 1.0);
    harmGain.gain.setValueAtTime(0.01, now);
    harmGain.gain.linearRampToValueAtTime(0.15, now + 0.4);
    harmGain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
    harmOsc.connect(harmGain);
    harmGain.connect(this.ctx.destination);
    harmOsc.start(now);
    harmOsc.stop(now + 1.4);

    // Warning alarm chirps
    [0.3, 0.6, 0.9].forEach((t) => {
      const beep = this.ctx.createOscillator();
      const beepGain = this.ctx.createGain();
      beep.type = 'square';
      beep.frequency.setValueAtTime(1040, now + t);
      beepGain.gain.setValueAtTime(0.12, now + t);
      beepGain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.12);
      beep.connect(beepGain);
      beepGain.connect(this.ctx.destination);
      beep.start(now + t);
      beep.stop(now + t + 0.12);
    });
  }

  // Mecha mechanical click
  playClick() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.04);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.04);
  }

  // Success / Dispatch Beep
  playDispatchSuccess() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    [0, 0.1, 0.22].forEach((delay, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const freqs = [659, 880, 1318]; // E5, A5, E6
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freqs[idx], now + delay);
      gain.gain.setValueAtTime(0.18, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + 0.15);
    });
  }
}

const audio = new MechaAudioEngine();

// ============================================================================
// 2. FAKE DATA GENERATOR DEFINITIONS & SECTORS
// ============================================================================
const SECTORS = {
  dajia: {
    name: '大佳河濱公園段 (基隆河左岸)',
    center: { lat: 25.0742, lng: 121.5348 },
    deltaLat: 0.006,
    deltaLng: 0.012
  },
  dadaocheng: {
    name: '大稻埕碼頭水岸段 (淡水河右岸)',
    center: { lat: 25.0569, lng: 121.5078 },
    deltaLat: 0.008,
    deltaLng: 0.005
  },
  rainbow: {
    name: '彩虹河濱公園段 (內湖迎風面)',
    center: { lat: 25.0551, lng: 121.5742 },
    deltaLat: 0.005,
    deltaLng: 0.015
  },
  guandu: {
    name: '關渡水鳥保護區段 (高灘地步道)',
    center: { lat: 25.1225, lng: 121.4682 },
    deltaLat: 0.007,
    deltaLng: 0.008
  }
};

const INCIDENT_TEMPLATES = {
  trash: [
    {
      title: '#02 找回消失的垃圾桶：容量滿溢警報',
      category: 'trash',
      categoryName: '#2 消失的垃圾桶',
      severity: 'high',
      department: '環境保護局 清潔隊',
      suggestedAction: '派駐清運專車前往替換內膽並加強周遭違規棄置稽查',
      color: '#ff003c',
      svgIcon: 'trash'
    },
    {
      title: '#02 行人清潔箱周遭遭非法家戶垃圾堆置',
      category: 'trash',
      categoryName: '#2 消失的垃圾桶',
      severity: 'medium',
      department: '環境保護局 環保稽查大隊',
      suggestedAction: '通報分隊清除廢棄物並調閱路口監視器開罰',
      color: '#ffb703',
      svgIcon: 'trash'
    }
  ],
  pavement: [
    {
      title: '#07 河岸步道透水地磚大面積破損與沉陷',
      category: 'pavement',
      categoryName: '#7 步道安全bug',
      severity: 'high',
      department: '工務局水利工程處 河川工程科',
      suggestedAction: '已生成警示工單，調派維修工班於 48 小時內進行瀝青冷補或換磚',
      color: '#ff003c',
      svgIcon: 'pavement'
    },
    {
      title: '#07 自行車道反光標線磨損暨護欄螺栓鬆脫',
      category: 'pavement',
      categoryName: '#7 步道安全bug',
      severity: 'medium',
      department: '工務局水利工程處 工務科',
      suggestedAction: '納入每週例行五金加固與熱拌標線補繪排程',
      color: '#ffb703',
      svgIcon: 'pavement'
    }
  ],
  tree: [
    {
      title: '#01 把三千棵樹種回來：苦楝老樹受強風吹襲半倒伏',
      category: 'tree',
      categoryName: '#1 種回三千棵樹',
      severity: 'high',
      department: '工務局公園路燈工程管理處 園藝工程隊',
      suggestedAction: '判定具有傾倒壓傷行人風險，出動吊卡車進行支架扶正與修剪',
      color: '#ff003c',
      svgIcon: 'tree'
    },
    {
      title: '#01 高灘地步道白千層樹穴缺漏與樹皮遭真菌病害',
      category: 'tree',
      categoryName: '#1 種回三千棵樹',
      severity: 'medium',
      department: '工務局公園處 青年公園管理所',
      suggestedAction: '建檔樹木身分證 ID，安排樹醫進行塗劑治療與補植評估',
      color: '#ffb703',
      svgIcon: 'tree'
    }
  ],
  hygiene: [
    {
      title: '#03 鼠患四處跑：碼頭餐飲散場周圍發現溝鼠蹤跡',
      category: 'hygiene',
      categoryName: '#3 鼠患衛生治理',
      severity: 'high',
      department: '衛生局 疾病管制科 / 環保局',
      suggestedAction: '繪製鼠患傳播熱點圖，安排下水道熱煙霧消毒並督導攤商油脂截留',
      color: '#ff003c',
      svgIcon: 'rat'
    },
    {
      title: '#03 草叢死角大型廢棄物遭棄置滋生孑孓病媒',
      category: 'hygiene',
      categoryName: '#3 鼠患衛生治理',
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
// 3. MAIN APPLICATION CONTROLLER
// ============================================================================
class TaipeiDebuggerApp {
  constructor() {
    this.currentSectorKey = 'dajia';
    this.currentSector = SECTORS.dajia;
    this.rover = {
      lat: this.currentSector.center.lat,
      lng: this.currentSector.center.lng,
      speed: 14.2,
      heading: 72,
      progress: 0,
      battery: 86
    };

    this.incidents = [];
    this.autoIngest = true;
    this.autoIntervalSec = 3;
    this.autoTimer = null;
    this.currentFilter = 'all';

    // Canvas contexts
    this.radarCanvas = document.getElementById('radarCanvas');
    this.radarCtx = this.radarCanvas ? this.radarCanvas.getContext('2d') : null;
    this.cameraCanvas = document.getElementById('cameraCanvas');
    this.cameraCtx = this.cameraCanvas ? this.cameraCanvas.getContext('2d') : null;
    this.flameCanvas = document.getElementById('ntd-flame-canvas');
    this.flameCtx = this.flameCanvas ? this.flameCanvas.getContext('2d') : null;

    // BGM Audio Element
    this.bgm = document.getElementById('ntd-bgm');
    this.bgmPlaying = false;

    // NT-D 10s Ignition State
    this.isNtdIgnited = false;
    this.countdownTimer = null;

    this.init();
  }

  init() {
    if (this.bgm) {
      this.bgm.volume = 0.6;
    }
    this.bindEvents();
    this.initBootScreen();
    this.seedInitialData();
    this.startRadarLoop();
    this.startCameraSimulationLoop();
    this.startFlameAnimationLoop();
    this.startClock();
    this.restartAutoIngest();
  }

  // Bind all interactive controls
  bindEvents() {
    // NT-D Boot sequence activation button
    const btnEngage = document.getElementById('btn-engage-ntd');
    if (btnEngage) {
      btnEngage.addEventListener('click', () => {
        this.igniteNtdSequence();
      });
    }

    const monitorWindow = document.getElementById('monitor-window');
    if (monitorWindow) {
      monitorWindow.addEventListener('click', () => {
        if (!this.isNtdIgnited) {
          this.igniteNtdSequence();
        }
      });
    }

    // BGM Controls
    const btnToggleBgm = document.getElementById('btn-toggle-bgm');
    if (btnToggleBgm) {
      btnToggleBgm.addEventListener('click', () => {
        audio.init();
        this.toggleBgm();
      });
    }

    const bgmVolumeSlider = document.getElementById('bgm-volume');
    if (bgmVolumeSlider) {
      bgmVolumeSlider.addEventListener('input', (e) => {
        if (this.bgm) {
          this.bgm.volume = parseFloat(e.target.value);
        }
      });
    }

    const btnSoundToggle = document.getElementById('btn-toggle-sound');
    if (btnSoundToggle) {
      btnSoundToggle.addEventListener('click', () => {
        audio.init();
        const on = audio.toggle();
        document.getElementById('sound-icon').textContent = on ? '🔊' : '🔇';
        document.getElementById('sound-text').textContent = on ? 'SOUND FX: ON' : 'SOUND FX: OFF';
      });
    }

    const btnAudioControl = document.getElementById('btn-audio-control');
    if (btnAudioControl) {
      btnAudioControl.addEventListener('click', () => {
        audio.init();
        const on = audio.toggle();
        btnAudioControl.textContent = on ? '🔊 AUDIO ON' : '🔇 AUDIO OFF';
        this.showToast(on ? 'NT-D 戰術音效已開啟' : '音效已靜音');
      });
    }

    // Re-trigger NT-D Intro
    const btnReboot = document.getElementById('btn-reboot-ntd');
    if (btnReboot) {
      btnReboot.addEventListener('click', () => {
        audio.init();
        audio.playNtdEngage();
        this.triggerBootScreen();
      });
    }

    // Sector Selection
    const routeSelect = document.getElementById('route-select');
    if (routeSelect) {
      routeSelect.addEventListener('change', (e) => {
        audio.playClick();
        this.changeSector(e.target.value);
      });
    }

    // Manual Injection Buttons
    document.querySelectorAll('.btn-inject').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        audio.init();
        audio.playLockOn();
        const cat = e.currentTarget.dataset.cat;
        this.injectIncident(cat);
      });
    });

    // Auto Ingest Toggle
    const btnToggleAuto = document.getElementById('btn-toggle-auto');
    if (btnToggleAuto) {
      btnToggleAuto.addEventListener('click', () => {
        audio.playClick();
        this.autoIngest = !this.autoIngest;
        btnToggleAuto.classList.toggle('running', this.autoIngest);
        document.getElementById('auto-state-text').textContent = this.autoIngest
          ? 'AUTO INGEST: ON'
          : 'AUTO INGEST: OFF';
        this.restartAutoIngest();
      });
    }

    // Auto Interval input
    const autoIntervalInput = document.getElementById('auto-interval');
    if (autoIntervalInput) {
      autoIntervalInput.addEventListener('change', (e) => {
        const val = parseInt(e.target.value, 10);
        if (val >= 1 && val <= 30) {
          this.autoIntervalSec = val;
          this.restartAutoIngest();
        }
      });
    }

    // Batch Generate
    const btnBatch = document.getElementById('btn-generate-batch');
    if (btnBatch) {
      btnBatch.addEventListener('click', () => {
        audio.init();
        audio.playLockOn();
        for (let i = 0; i < 10; i++) {
          const cats = ['trash', 'pavement', 'tree', 'hygiene'];
          const randomCat = cats[Math.floor(Math.random() * cats.length)];
          this.injectIncident(randomCat, true);
        }
        this.renderIncidentList();
        this.showToast('⚡ 成功批次生成 10 筆河濱巡檢資料');
      });
    }

    // Clear Data
    const btnClear = document.getElementById('btn-clear-data');
    if (btnClear) {
      btnClear.addEventListener('click', () => {
        audio.playClick();
        this.incidents = [];
        this.renderIncidentList();
        this.showToast('已清空所有暫存事件');
      });
    }

    // Export JSON
    const btnDownload = document.getElementById('btn-download-json');
    if (btnDownload) {
      btnDownload.addEventListener('click', () => {
        audio.playClick();
        this.exportJsonFile();
      });
    }

    // Copy JSON
    const btnCopy = document.getElementById('btn-copy-json');
    if (btnCopy) {
      btnCopy.addEventListener('click', () => {
        audio.playClick();
        this.copyJsonClipboard();
      });
    }

    // Filter Tabs
    document.querySelectorAll('.filter-tab').forEach((tab) => {
      tab.addEventListener('click', (e) => {
        audio.playClick();
        document.querySelectorAll('.filter-tab').forEach((t) => t.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.currentFilter = e.currentTarget.dataset.filter;
        this.renderIncidentList();
      });
    });

    // 1999 Modal Close
    const modalClose = document.getElementById('modal-close');
    const modalCancel = document.getElementById('modal-cancel-btn');
    const modalBackdrop = document.getElementById('modal-backdrop');
    [modalClose, modalCancel, modalBackdrop].forEach((el) => {
      if (el) {
        el.addEventListener('click', () => {
          this.closeModal();
        });
      }
    });

    // Modal Mock Submit
    const btnModalSubmit = document.getElementById('modal-submit-mock-btn');
    if (btnModalSubmit) {
      btnModalSubmit.addEventListener('click', () => {
        audio.playDispatchSuccess();
        this.showToast('✅ 工單已成功推播至台北市 1999 派工 API [HTTP 200 OK]');
        this.closeModal();
      });
    }
  }

  // NT-D Boot Screen Lifecycle
  initBootScreen() {
    // Keep user in boot screen until they click to activate!
    // No automatic 5-second transition.
    this.isNtdIgnited = false;
  }

  // Ignite NT-D Destroy Mode Sequence (10 Seconds with Purple Flame & Music)
  igniteNtdSequence() {
    if (this.isNtdIgnited) return;
    this.isNtdIgnited = true;

    // 1. Audio activation
    audio.init();
    audio.playNtdEngage();
    this.playBgm();

    // 2. Visual ignition & screen shake
    const bootScreen = document.getElementById('ntd-boot-screen');
    if (bootScreen) {
      bootScreen.classList.add('ntd-ignited', 'screen-shake');
    }

    const engageBtnText = document.getElementById('engage-btn-text');
    if (engageBtnText) {
      engageBtnText.textContent = '🚨 DESTROY MODE ENGAGED // 系統超頻共振中 🚨';
    }

    const footStatus = document.getElementById('monitor-foot-status');
    if (footStatus) {
      footStatus.textContent = 'PSYCHO-FRAME OVERDRIVE: 120% ACTIVE';
    }

    const promptText = document.getElementById('boot-prompt-text');
    if (promptText) {
      promptText.textContent = '⚡ 精神感應骨架超頻啟動中！10 秒後無縫接入駕駛艙 ⚡';
    }

    this.showToast('🔥 NT-D 毀滅模式啟動！《UNICORN》BGM 播放中 (10 秒後接入駕駛艙)...');

    // 3. 10-Second Countdown Timer
    const durationMs = 10000;
    const startTime = Date.now();

    const countdownDigits = document.getElementById('countdown-digits');
    const countdownFill = document.getElementById('countdown-fill');
    const countdownSubLogs = document.getElementById('countdown-sub-logs');

    if (this.countdownTimer) clearInterval(this.countdownTimer);

    this.countdownTimer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, (durationMs - elapsed) / 1000);

      if (countdownDigits) {
        countdownDigits.textContent = remaining.toFixed(1) + 's';
      }
      if (countdownFill) {
        countdownFill.style.width = Math.min(100, (elapsed / durationMs) * 100) + '%';
      }

      if (countdownSubLogs) {
        if (remaining > 8) {
          countdownSubLogs.textContent = '> BIO-SENSOR PSYCHO-FRAME RESONANCE REACHING 120% CRITICAL...';
        } else if (remaining > 6) {
          countdownSubLogs.textContent = '> OVERRIDING RESTRICTION CODES // PURPLE HARMONIC MATRIX LOCKED...';
        } else if (remaining > 4) {
          countdownSubLogs.textContent = '> 112KM TAIPEI WATERFRONT GPS SATELLITE NETWORK SYNCHRONIZED...';
        } else if (remaining > 2) {
          countdownSubLogs.textContent = '> AI VISION PIPELINE CHARGING // READY TO DETECT MUNICIPAL BUGS...';
        } else {
          countdownSubLogs.textContent = '> TRANSITIONING TO RX-0 COCKPIT HUD // 3... 2... 1...';
        }
      }

      if (elapsed >= durationMs) {
        clearInterval(this.countdownTimer);
        this.countdownTimer = null;
        if (bootScreen) {
          bootScreen.classList.remove('screen-shake');
        }
        this.dismissBootScreen();
      }
    }, 50);
  }

  dismissBootScreen() {
    const bootScreen = document.getElementById('ntd-boot-screen');
    if (bootScreen) {
      bootScreen.classList.add('fade-out');
    }
    // Ensure BGM continues in the main cockpit HUD
    if (!this.bgmPlaying) {
      this.playBgm();
    }
  }

  triggerBootScreen() {
    const bootScreen = document.getElementById('ntd-boot-screen');
    if (bootScreen) {
      bootScreen.classList.remove('fade-out', 'ntd-ignited', 'screen-shake');
    }
    this.isNtdIgnited = false;
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
    const engageBtnText = document.getElementById('engage-btn-text');
    if (engageBtnText) {
      engageBtnText.textContent = 'ACTIVATE NT-D SYSTEM // 啟動毀滅模式';
    }
    const countdownFill = document.getElementById('countdown-fill');
    if (countdownFill) {
      countdownFill.style.width = '0%';
    }
    const countdownDigits = document.getElementById('countdown-digits');
    if (countdownDigits) {
      countdownDigits.textContent = '10.0s';
    }
    const footStatus = document.getElementById('monitor-foot-status');
    if (footStatus) {
      footStatus.textContent = 'STANDBY FOR ENGAGEMENT';
    }
    const promptText = document.getElementById('boot-prompt-text');
    if (promptText) {
      promptText.textContent = '🔥 點擊按鈕啟動 NT-D 紫色火焰特效與《UNICORN》BGM，10 秒後進入駕駛艙 🔥';
    }
  }

  changeSector(sectorKey) {
    if (SECTORS[sectorKey]) {
      this.currentSectorKey = sectorKey;
      this.currentSector = SECTORS[sectorKey];
      this.rover.lat = this.currentSector.center.lat;
      this.rover.lng = this.currentSector.center.lng;
      this.rover.progress = 0;
      this.showToast(`巡邏扇區已切換至：${this.currentSector.name}`);
    }
  }

  // Start Background Clock & Rover Telemetry Jitter
  startClock() {
    setInterval(() => {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const clockEl = document.getElementById('live-clock');
      if (clockEl) clockEl.textContent = timeStr;

      // Small jitter for realism
      const speedEl = document.getElementById('rover-speed');
      if (speedEl) {
        const jitter = (Math.random() * 0.8 - 0.4).toFixed(1);
        speedEl.textContent = (14.2 + parseFloat(jitter)).toFixed(1);
      }

      const resMeter = document.getElementById('resonance-meter-bar');
      const resVal = document.getElementById('resonance-val');
      if (resMeter && resVal) {
        const sync = (93 + Math.random() * 6).toFixed(1);
        resMeter.style.width = `${sync}%`;
        resVal.textContent = `${sync}% CRITICAL`;
      }
    }, 1000);
  }

  // Initial Seed Data
  seedInitialData() {
    const initialItems = [
      {
        cat: 'trash',
        title: '#02 找回消失的垃圾桶：彩虹橋畔垃圾箱容量滿溢',
        lat: 25.0512,
        lng: 121.5784,
        sev: 'high'
      },
      {
        cat: 'pavement',
        title: '#07 河岸自行車道 14.5K 鋪面碎石及沉陷坑洞',
        lat: 25.0538,
        lng: 121.5762,
        sev: 'high'
      },
      {
        cat: 'tree',
        title: '#01 把三千棵樹種回來：苦楝老樹受強風吹襲半倒伏',
        lat: 25.0565,
        lng: 121.5721,
        sev: 'medium'
      },
      {
        cat: 'hygiene',
        title: '#03 鼠患四處跑：夜市與水岸交界處發現溝鼠活動熱點',
        lat: 25.0579,
        lng: 121.5694,
        sev: 'high'
      }
    ];

    initialItems.forEach((item) => {
      this.injectIncident(item.cat, true, item);
    });

    this.renderIncidentList();
  }

  // Inject a single fake data incident
  injectIncident(categoryKey, silent = false, override = null) {
    const templates = INCIDENT_TEMPLATES[categoryKey] || INCIDENT_TEMPLATES.trash;
    const template = templates[Math.floor(Math.random() * templates.length)];

    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const ticketId = `TPE-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const latOffset = (Math.random() - 0.5) * this.currentSector.deltaLat;
    const lngOffset = (Math.random() - 0.5) * this.currentSector.deltaLng;

    const coords = {
      lat: override ? override.lat : parseFloat((this.rover.lat + latOffset).toFixed(5)),
      lng: override ? override.lng : parseFloat((this.rover.lng + lngOffset).toFixed(5))
    };

    const incident = {
      id: ticketId,
      timestamp: timeStr,
      dateTime: now.toISOString(),
      sector: this.currentSector.name,
      category: categoryKey,
      categoryName: template.categoryName,
      title: override ? override.title : template.title,
      severity: override ? override.sev : template.severity,
      department: template.department,
      suggestedAction: template.suggestedAction,
      coordinates: coords,
      confidence: (88 + Math.random() * 11).toFixed(1) + '%',
      snapshotUrl: generateSnapshotSvg(categoryKey, template.title, coords)
    };

    this.incidents.unshift(incident);

    // Update target lock UI in camera feed
    this.updateTargetLockBox(incident);

    if (!silent) {
      this.renderIncidentList();
      this.showToast(`🚨 新增市政異常：${incident.title.substring(0, 20)}...`);
    }

    return incident;
  }

  // Update Center Camera Targeting HUD Box
  updateTargetLockBox(incident) {
    const box = document.getElementById('target-lock-box');
    const conf = document.getElementById('lock-conf');
    const title = document.getElementById('lock-title');
    const dept = document.getElementById('lock-dept');
    const coords = document.getElementById('lock-coords');

    if (box && conf && title && dept && coords) {
      conf.textContent = incident.confidence;
      title.textContent = incident.title;
      dept.textContent = `權責局處：${incident.department}`;
      coords.textContent = `COORD: ${incident.coordinates.lat}°N, ${incident.coordinates.lng}°E`;
    }
  }

  // Render Incident Cards
  renderIncidentList() {
    const container = document.getElementById('incident-list-container');
    const badge = document.getElementById('incident-count-badge');
    if (!container) return;

    // Filter incidents
    const filtered = this.incidents.filter((item) => {
      if (this.currentFilter === 'all') return true;
      return item.category === this.currentFilter;
    });

    if (badge) {
      badge.textContent = `${filtered.length} ISSUES`;
    }

    // Update Filter Tab Counters
    document.getElementById('count-all').textContent = this.incidents.length;
    ['trash', 'pavement', 'tree', 'hygiene'].forEach((cat) => {
      const el = document.getElementById(`count-${cat}`);
      if (el) {
        el.textContent = this.incidents.filter((i) => i.category === cat).length;
      }
    });

    container.innerHTML = '';

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="padding: 24px; text-align: center; color: var(--text-muted); font-family: var(--font-mono);">
          [NO ISSUES RECORDED IN CURRENT FILTER]
        </div>
      `;
      return;
    }

    filtered.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'incident-card';
      const sevClass = item.severity === 'high' ? 'sev-high' : 'sev-medium';

      card.innerHTML = `
        <div class="card-top">
          <span class="card-time">${item.timestamp} · ${item.id}</span>
          <span class="card-badge-severity ${sevClass}">${item.severity.toUpperCase()}</span>
        </div>
        <div class="card-title">${item.title}</div>
        <div class="card-meta">
          <span class="card-dept">${item.department}</span>
          <span>${item.coordinates.lat}, ${item.coordinates.lng}</span>
        </div>
      `;

      card.addEventListener('click', () => {
        audio.playClick();
        this.openModal(item);
      });

      container.appendChild(card);
    });
  }

  // Auto Ingest Timer
  restartAutoIngest() {
    if (this.autoTimer) clearInterval(this.autoTimer);
    if (!this.autoIngest) return;

    this.autoTimer = setInterval(() => {
      const categories = ['trash', 'pavement', 'tree', 'hygiene'];
      const randomCat = categories[Math.floor(Math.random() * categories.length)];
      audio.playLockOn();
      this.injectIncident(randomCat);
    }, this.autoIntervalSec * 1000);
  }

  // 1999 Modal Operations
  openModal(incident) {
    const modal = document.getElementById('ticket-modal');
    if (!modal) return;

    document.getElementById('modal-incident-title').textContent = incident.title;
    document.getElementById('modal-ticket-id').textContent = incident.id;
    document.getElementById('modal-ticket-category').textContent = incident.categoryName;
    document.getElementById('modal-ticket-severity').textContent =
      incident.severity === 'high' ? 'HIGH (重大優先)' : 'MEDIUM (一般追蹤)';
    document.getElementById('modal-ticket-coords').textContent =
      `${incident.coordinates.lat}° N, ${incident.coordinates.lng}° E (${incident.sector})`;
    document.getElementById('modal-ticket-dept').textContent = incident.department;
    document.getElementById('modal-ticket-action').textContent = incident.suggestedAction;
    document.getElementById('modal-snapshot-img').src = incident.snapshotUrl;

    modal.classList.add('show');
  }

  closeModal() {
    const modal = document.getElementById('ticket-modal');
    if (modal) modal.classList.remove('show');
  }

  // Toast Notification
  showToast(message) {
    const toast = document.getElementById('hud-toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  // Export JSON File
  exportJsonFile() {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.incidents, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', 'patrol_data.json');
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
    this.showToast('💾 已下載 patrol_data.json (共 ' + this.incidents.length + ' 筆資料)');
  }

  // Copy JSON to Clipboard
  copyJsonClipboard() {
    const jsonStr = JSON.stringify(this.incidents, null, 2);
    navigator.clipboard.writeText(jsonStr).then(() => {
      this.showToast('📋 patrol_data.json 已複製到剪貼簿！');
    }).catch(() => {
      this.showToast('複製失敗，請手動匯出');
    });
  }

  // BGM Player Management
  playBgm() {
    if (!this.bgm) return;
    this.bgm.play().then(() => {
      this.bgmPlaying = true;
      this.updateBgmUi(true);
    }).catch((err) => {
      console.log('Autoplay policy deferred audio until next gesture:', err);
    });
  }

  pauseBgm() {
    if (!this.bgm) return;
    this.bgm.pause();
    this.bgmPlaying = false;
    this.updateBgmUi(false);
  }

  toggleBgm() {
    if (this.bgmPlaying) {
      this.pauseBgm();
      this.showToast('🔇 BGM 已暫停');
    } else {
      this.playBgm();
      this.showToast('🎵 播放 BGM: UNICORN (澤野弘之)');
    }
  }

  updateBgmUi(isPlaying) {
    const btn = document.getElementById('btn-toggle-bgm');
    const text = document.getElementById('bgm-btn-text');
    if (btn) btn.classList.toggle('playing', isPlaying);
    if (text) text.textContent = isPlaying ? '🎵 BGM: UNICORN (ON)' : '🔇 BGM: PAUSED';
  }

  // ==========================================================================
  // 4. RADAR CANVAS LOOP (RIVER PATH & BLIPS)
  // ==========================================================================
  startRadarLoop() {
    if (!this.radarCtx) return;

    const render = () => {
      const ctx = this.radarCtx;
      const w = this.radarCanvas.width;
      const h = this.radarCanvas.height;

      // Fade out background
      ctx.fillStyle = '#06080d';
      ctx.fillRect(0, 0, w, h);

      // Draw Grid Lines
      ctx.strokeStyle = 'rgba(255, 0, 60, 0.12)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Draw River Path (Curved Water Body)
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(0, 243, 255, 0.35)';
      ctx.lineWidth = 18;
      ctx.moveTo(0, h * 0.7);
      ctx.bezierCurveTo(w * 0.35, h * 0.8, w * 0.65, h * 0.2, w, h * 0.3);
      ctx.stroke();

      // Bike / Patrol Path (Dashed Parallel)
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 0, 60, 0.65)';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 4]);
      ctx.moveTo(0, h * 0.7 - 20);
      ctx.bezierCurveTo(w * 0.35, h * 0.8 - 20, w * 0.65, h * 0.2 - 20, w, h * 0.3 - 20);
      ctx.stroke();
      ctx.setLineDash([]);

      // Rover Position along path
      this.rover.progress = (this.rover.progress + 0.002) % 1;
      const t = this.rover.progress;

      // Cubic Bezier calculation
      const p0 = { x: 0, y: h * 0.7 - 20 };
      const p1 = { x: w * 0.35, y: h * 0.8 - 20 };
      const p2 = { x: w * 0.65, y: h * 0.2 - 20 };
      const p3 = { x: w, y: h * 0.3 - 20 };

      const cx = 3 * (p1.x - p0.x);
      const bx = 3 * (p2.x - p1.x) - cx;
      const ax = p3.x - p0.x - cx - bx;

      const cy = 3 * (p1.y - p0.y);
      const by = 3 * (p2.y - p1.y) - cy;
      const ay = p3.y - p0.y - cy - by;

      const roverX = ax * Math.pow(t, 3) + bx * Math.pow(t, 2) + cx * t + p0.x;
      const roverY = ay * Math.pow(t, 3) + by * Math.pow(t, 2) + cy * t + p0.y;

      // Update Rover Lat/Lng display based on progress
      this.rover.lat = parseFloat((this.currentSector.center.lat + (t - 0.5) * this.currentSector.deltaLat).toFixed(4));
      this.rover.lng = parseFloat((this.currentSector.center.lng + (t - 0.5) * this.currentSector.deltaLng).toFixed(4));
      const latEl = document.getElementById('rover-lat');
      const lngEl = document.getElementById('rover-lng');
      if (latEl && lngEl) {
        latEl.textContent = this.rover.lat;
        lngEl.textContent = this.rover.lng;
      }

      // Draw Incident Blips on Radar
      this.incidents.slice(0, 8).forEach((item, index) => {
        const blipT = (index * 0.12 + 0.1) % 1;
        const bx = ax * Math.pow(blipT, 3) + bx * Math.pow(blipT, 2) + cx * blipT + p0.x;
        const by = ay * Math.pow(blipT, 3) + by * Math.pow(blipT, 2) + cy * blipT + p0.y;

        // Pulsing red dot
        const pulse = Math.sin(Date.now() * 0.005 + index) * 3 + 4;
        ctx.fillStyle = item.severity === 'high' ? '#ff003c' : '#ffb703';
        ctx.beginPath();
        ctx.arc(bx, by, Math.max(2, pulse), 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = item.severity === 'high' ? 'rgba(255, 0, 60, 0.4)' : 'rgba(255, 183, 3, 0.4)';
        ctx.beginPath();
        ctx.arc(bx, by, pulse + 4, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Draw Rover Unit Icon (Glow Arrow)
      ctx.fillStyle = '#00f3ff';
      ctx.shadowColor = '#00f3ff';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(roverX, roverY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Rover Radar Sweep Cone
      const angle = (Date.now() * 0.003) % (Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 243, 255, 0.25)';
      ctx.beginPath();
      ctx.moveTo(roverX, roverY);
      ctx.lineTo(roverX + Math.cos(angle) * 35, roverY + Math.sin(angle) * 35);
      ctx.stroke();

      requestAnimationFrame(render);
    };

    render();
  }

  // ==========================================================================
  // 5. CAMERA CANVAS SIMULATION LOOP (FIRST PERSON VIEW)
  // ==========================================================================
  startCameraSimulationLoop() {
    if (!this.cameraCtx) return;

    let frame = 0;
    const render = () => {
      frame++;
      const ctx = this.cameraCtx;
      const w = this.cameraCanvas.width;
      const h = this.cameraCanvas.height;

      // 1. Clear & Draw Dynamic Cyber Twilight Sky
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.58);
      skyGrad.addColorStop(0, '#0a0d18');
      skyGrad.addColorStop(0.45, '#1e0c24');
      skyGrad.addColorStop(0.85, '#52132b');
      skyGrad.addColorStop(1, '#ff1744'); // Crimson horizon glow
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h * 0.58);

      // Star / Digital Sensor Noise Points
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      for (let i = 0; i < 20; i++) {
        const sx = ((i * 37) + (frame * 0.2)) % w;
        const sy = (i * 19) % (h * 0.4);
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }

      // 2. Distant Taipei City Skyline & Hills (Keelung River Basin)
      ctx.fillStyle = '#0e121e';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.58);
      ctx.lineTo(0, h * 0.50);
      ctx.lineTo(35, h * 0.50);
      ctx.lineTo(40, h * 0.45);
      ctx.lineTo(75, h * 0.45);
      ctx.lineTo(80, h * 0.52);
      ctx.lineTo(130, h * 0.52);
      ctx.lineTo(135, h * 0.40); // Skyscraper
      ctx.lineTo(165, h * 0.40);
      ctx.lineTo(170, h * 0.54);
      // Taipei 101 Structure
      ctx.lineTo(210, h * 0.54);
      ctx.lineTo(215, h * 0.32);
      ctx.lineTo(220, h * 0.22); // Spire
      ctx.lineTo(222, h * 0.22);
      ctx.lineTo(224, h * 0.32);
      ctx.lineTo(228, h * 0.54);
      // River Bridges (e.g. Dazhi Bridge / Rainbow Bridge cables)
      ctx.lineTo(280, h * 0.54);
      ctx.lineTo(340, h * 0.36);
      ctx.lineTo(400, h * 0.54);
      ctx.lineTo(w, h * 0.54);
      ctx.lineTo(w, h * 0.58);
      ctx.fill();

      // Bridge Cable Lines (Neon Cyan / Red Accent)
      ctx.strokeStyle = 'rgba(255, 0, 60, 0.4)';
      ctx.lineWidth = 1;
      for (let c = 290; c <= 390; c += 15) {
        ctx.beginPath();
        ctx.moveTo(340, h * 0.36);
        ctx.lineTo(c, h * 0.54);
        ctx.stroke();
      }

      // 3. Keelung / Tamsui River Waterway (Left Side)
      const riverGrad = ctx.createLinearGradient(0, h * 0.58, 0, h);
      riverGrad.addColorStop(0, '#0c1a2e');
      riverGrad.addColorStop(1, '#050c18');
      ctx.fillStyle = riverGrad;
      ctx.fillRect(0, h * 0.58, w * 0.36, h * 0.42);

      // Water Ripple Waves
      ctx.strokeStyle = 'rgba(0, 243, 255, 0.25)';
      ctx.lineWidth = 1;
      for (let r = 0; r < 5; r++) {
        const ry = h * 0.62 + r * 14 + (Math.sin(frame * 0.05 + r) * 3);
        ctx.beginPath();
        ctx.moveTo(10, ry);
        ctx.lineTo(w * 0.32, ry);
        ctx.stroke();
      }

      // 4. Riverside Embankment & Bike Path (Ground Perspective)
      const pathGrad = ctx.createLinearGradient(0, h * 0.58, 0, h);
      pathGrad.addColorStop(0, '#242b3d');
      pathGrad.addColorStop(0.5, '#19202f');
      pathGrad.addColorStop(1, '#0f1420');
      ctx.fillStyle = pathGrad;
      ctx.beginPath();
      ctx.moveTo(w * 0.34, h * 0.58);
      ctx.lineTo(w * 0.95, h * 0.58);
      ctx.lineTo(w * 1.25, h);
      ctx.lineTo(w * 0.15, h);
      ctx.fill();

      // Grass Verge (Right Side)
      ctx.fillStyle = '#0a2118';
      ctx.beginPath();
      ctx.moveTo(w * 0.95, h * 0.58);
      ctx.lineTo(w, h * 0.58);
      ctx.lineTo(w, h);
      ctx.lineTo(w * 1.25, h);
      ctx.fill();

      // 5. 3D Road Grid / Forward Motion Speedlines
      ctx.strokeStyle = 'rgba(255, 0, 60, 0.45)';
      ctx.lineWidth = 2;
      const speedOffset = (frame * 6) % 50;

      // Road dividers moving towards camera
      for (let y = h * 0.60; y < h; y += 28) {
        const lineY = y + (speedOffset * (y / h));
        if (lineY > h) continue;
        const lineProgress = (lineY - h * 0.58) / (h * 0.42);
        const lineX = (w * 0.62) + (lineProgress * 15);
        const lineWidth = 15 + (lineProgress * 40);

        ctx.beginPath();
        ctx.moveTo(lineX - lineWidth / 2, lineY);
        ctx.lineTo(lineX + lineWidth / 2, lineY);
        ctx.stroke();
      }

      // 6. Draw Approaching Municipal Bug / Target
      const cycle = 160;
      const progress = (frame % cycle) / cycle;
      const targetY = (h * 0.60) + Math.pow(progress, 1.8) * (h * 0.32);
      const targetScale = 0.25 + Math.pow(progress, 1.5) * 1.35;
      const targetX = (w * 0.66) + Math.sin(frame * 0.03) * 12;

      ctx.save();
      ctx.translate(targetX, targetY);
      ctx.scale(targetScale, targetScale);

      // Render Trash Can Object
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#ff003c';
      ctx.lineWidth = 2.5;
      ctx.fillRect(-20, -45, 40, 50);
      ctx.strokeRect(-20, -45, 40, 50);
      
      // Overflowing trash bags
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(-8, -52, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff5722';
      ctx.beginPath();
      ctx.arc(8, -50, 10, 0, Math.PI * 2);
      ctx.fill();

      // NT-D Psycho Target Box (Flashing Red Bracket)
      ctx.strokeStyle = '#ff003c';
      ctx.lineWidth = 2;
      ctx.strokeRect(-32, -70, 64, 85);

      // Corner brackets
      ctx.fillStyle = '#ff003c';
      ctx.fillRect(-32, -70, 10, 3);
      ctx.fillRect(-32, -70, 3, 10);
      ctx.fillRect(22, -70, 10, 3);
      ctx.fillRect(29, -70, 3, 10);
      ctx.fillRect(-32, 12, 10, 3);
      ctx.fillRect(-32, 5, 3, 10);
      ctx.fillRect(22, 12, 10, 3);
      ctx.fillRect(29, 5, 3, 10);

      // Floating Lock Tag
      ctx.fillStyle = 'rgba(255, 0, 60, 0.9)';
      ctx.fillRect(-32, -86, 64, 14);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('TARGET LOCK', -30, -75);

      ctx.restore();

      // Scanline Sweep inside viewport
      const scanY = (frame * 4) % h;
      ctx.strokeStyle = 'rgba(255, 0, 60, 0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, scanY);
      ctx.lineTo(w, scanY);
      ctx.stroke();

      requestAnimationFrame(render);
    };

    render();
  }

  // ==========================================================================
  // 6. PURPLE FLAME & PSYCHO-FRAME EQUALIZER LOOP (MATCHES SCREENSHOT)
  // ==========================================================================
  startFlameAnimationLoop() {
    if (!this.flameCtx) return;

    let frame = 0;
    // Pre-seed flame particle embers
    const particles = [];
    for (let i = 0; i < 55; i++) {
      particles.push({
        x: Math.random() * 860,
        y: Math.random() * 420,
        speedY: 1.8 + Math.random() * 4.2,
        speedX: (Math.random() - 0.5) * 2.2,
        size: 1.8 + Math.random() * 3.5,
        hue: Math.random() > 0.45 ? 285 : 340, // Electric Violet / Magenta Red
        alpha: 0.35 + Math.random() * 0.65
      });
    }

    const render = () => {
      frame++;
      const ctx = this.flameCtx;
      const w = this.flameCanvas.width;
      const h = this.flameCanvas.height;

      // Dark background trail
      ctx.fillStyle = this.isNtdIgnited ? 'rgba(5, 7, 18, 0.28)' : 'rgba(4, 6, 14, 0.45)';
      ctx.fillRect(0, 0, w, h);

      const isIgnited = this.isNtdIgnited;

      // 1. Vertical Flame / Equalizer Scanline Streaks (Matches Screenshot)
      const numBars = 80;
      const barWidth = w / numBars;

      for (let i = 0; i < numBars; i++) {
        const x = i * barWidth;
        const wave1 = Math.sin(frame * 0.09 + i * 0.3);
        const wave2 = Math.cos(frame * 0.14 + i * 0.18);
        const noise = (Math.sin(frame * 0.25 + i * 1.5) + 1) * 0.5;

        // Taller, violent flame streaks when ignited
        let barHeight;
        if (isIgnited) {
          barHeight = h * (0.4 + 0.52 * noise + 0.15 * wave1);
        } else {
          barHeight = h * (0.16 + 0.28 * noise);
        }

        const y = (h - barHeight) / 2;

        // Glowing Gradient: Deep Violet -> Fuchsia Pink -> Neon Crimson -> Purple
        const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
        if (isIgnited) {
          grad.addColorStop(0, 'rgba(168, 85, 247, 0.08)');
          grad.addColorStop(0.25, 'rgba(217, 70, 239, 0.85)'); // Fuchsia
          grad.addColorStop(0.5, 'rgba(255, 0, 85, 0.98)');   // Blazing Neon Crimson
          grad.addColorStop(0.75, 'rgba(147, 51, 234, 0.88)'); // Electric Purple
          grad.addColorStop(1, 'rgba(107, 33, 168, 0.08)');
        } else {
          grad.addColorStop(0, 'rgba(147, 51, 234, 0.04)');
          grad.addColorStop(0.5, 'rgba(192, 38, 211, 0.35)');
          grad.addColorStop(1, 'rgba(88, 28, 135, 0.04)');
        }

        ctx.fillStyle = grad;
        ctx.fillRect(x, y, barWidth - 1, barHeight);

        // Electric cyan glitch sparks on top of fire bars
        if (isIgnited && Math.random() > 0.80) {
          ctx.fillStyle = '#00f3ff';
          ctx.fillRect(x, y + Math.random() * barHeight, 2, 5);
        }
      }

      // 2. Rising Energy Embers / Purple Fire Particles (When NT-D is Ignited)
      if (isIgnited) {
        particles.forEach((p) => {
          p.y -= p.speedY;
          p.x += p.speedX;
          if (p.y < 0) {
            p.y = h;
            p.x = Math.random() * w;
          }

          ctx.fillStyle = `hsla(${p.hue}, 100%, 70%, ${p.alpha})`;
          ctx.shadowColor = `hsl(${p.hue}, 100%, 60%)`;
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.shadowBlur = 0;
      }

      requestAnimationFrame(render);
    };

    render();
  }
}

// Instantiate on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new TaipeiDebuggerApp();
});
