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
// 2. IMPORTED CIVIC INSPECTION DATABASE (FROM data.js)
// ============================================================================
const SECTORS = window.RX0_DATA ? window.RX0_DATA.SECTORS : {};
const INCIDENT_TEMPLATES = window.RX0_DATA ? window.RX0_DATA.INCIDENT_TEMPLATES : {};
const PRESET_INSPECTIONS = window.RX0_DATA ? window.RX0_DATA.PRESET_INSPECTIONS : [];
const generateSnapshotSvg = window.RX0_DATA ? window.RX0_DATA.generateSnapshotSvg : () => '';

// ============================================================================
// 3. MAIN APPLICATION CONTROLLER
// ============================================================================
class TaipeiDebuggerApp {
  constructor() {
    this.currentDate = '2026-10-14';
    this.currentSectorKey = 'dadaocheng';
    this.currentSector = SECTORS.dadaocheng;
    this.currentFilter = 'all';

    // Active incidents based on date & sector
    this.activeIncidents = [];
    this.selectedIncident = null;
    this.hoveredPinIndex = -1;

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

    // View Navigation (tactical | analytics)
    this.currentView = 'tactical';
    this.echartsInstances = {};

    this.init();
  }

  init() {
    if (this.bgm) {
      this.bgm.volume = 0.6;
    }
    this.bindEvents();
    this.initBootScreen();
    this.applyFilterAndRefresh();
    this.startRadarLoop();
    this.startCameraSimulationLoop();
    this.startFlameAnimationLoop();
    this.startClock();
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

    // View Switcher (Tactical vs Municipal Analytics War Room)
    document.querySelectorAll('.hud-view-tab').forEach((tab) => {
      tab.addEventListener('click', (e) => {
        audio.init();
        audio.playClick();
        const targetView = e.currentTarget.dataset.view;
        this.switchView(targetView);
      });
    });

    // Date fast switcher
    const dateSelect = document.getElementById('mission-date-select');
    if (dateSelect) {
      dateSelect.addEventListener('change', (e) => {
        audio.playClick();
        this.currentDate = e.target.value;
        this.applyFilterAndRefresh();
        const summaryText = this.currentDate === 'range-7d'
          ? '近 7 日歷史彙整成果'
          : `${this.currentDate} 巡邏分析成果`;
        document.getElementById('loaded-summary').textContent = summaryText;
        this.showToast(`📅 已載入：${summaryText}`);
      });
    }

    // Sector Selection
    const routeSelect = document.getElementById('route-select');
    if (routeSelect) {
      routeSelect.addEventListener('change', (e) => {
        audio.playClick();
        this.currentSectorKey = e.target.value;
        this.currentSector = SECTORS[e.target.value] || SECTORS.dadaocheng;
        this.applyFilterAndRefresh();
        this.showToast(`巡邏河段已切換至：${this.currentSector.name}`);
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

    const btnAudioControl = document.getElementById('btn-audio-control');
    if (btnAudioControl) {
      btnAudioControl.addEventListener('click', () => {
        audio.init();
        const on = audio.toggle();
        const sfxIcon = document.getElementById('sfx-icon');
        if (sfxIcon) {
          sfxIcon.textContent = on ? '🔊' : '🔇';
        } else {
          btnAudioControl.textContent = on ? '🔊 AUDIO ON' : '🔇 AUDIO OFF';
        }
        btnAudioControl.title = on ? '戰術音效：開啟中 (點擊靜音)' : '戰術音效：已靜音 (點擊開啟)';
        this.showToast(on ? '🔊 NT-D 戰術音效已開啟' : '🔇 戰術音效已靜音');
      });
    }

    // Brand Logo as Home Button (Re-trigger NT-D Intro)
    const btnBrandHome = document.getElementById('btn-brand-home') || document.getElementById('btn-reboot-ntd');
    if (btnBrandHome) {
      btnBrandHome.addEventListener('click', () => {
        audio.init();
        audio.playNtdEngage();
        this.triggerBootScreen();
      });
    }

    // Manual Injection Buttons (Add test bug to active set)
    document.querySelectorAll('.btn-inject').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        audio.init();
        audio.playLockOn();
        const cat = e.currentTarget.dataset.cat;
        this.injectCustomIncident(cat);
      });
    });

    // Clear / Reset Data
    const btnClear = document.getElementById('btn-clear-data');
    if (btnClear) {
      btnClear.addEventListener('click', () => {
        audio.playClick();
        this.activeIncidents = [];
        this.selectedIncident = null;
        this.renderStatsAndMetrics();
        this.renderIncidentList();
        this.showToast('已清空當前視圖資料');
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
        if (this.selectedIncident) {
          this.selectedIncident.status = 'dispatched';
          this.renderStatsAndMetrics();
          this.renderIncidentList();
        }
        this.showToast('✅ 工單已成功推播至台北市 1999 派工 API [HTTP 200 OK]');
        this.closeModal();
      });
    }

    // Radar Canvas Mouse Interactions for Pins
    if (this.radarCanvas) {
      this.radarCanvas.addEventListener('mousemove', (e) => {
        this.handleRadarMouseMove(e);
      });
      this.radarCanvas.addEventListener('mouseleave', () => {
        this.hoveredPinIndex = -1;
        const popover = document.getElementById('map-pin-popover');
        if (popover) popover.classList.add('hidden');
      });
      this.radarCanvas.addEventListener('click', (e) => {
        this.handleRadarClick(e);
      });
    }
  }

  // Calculate & Refresh Data based on Date & Sector Filter
  applyFilterAndRefresh() {
    if (this.currentDate === 'range-7d') {
      // 7-day range: include matching sector across all dates
      this.activeIncidents = PRESET_INSPECTIONS.filter((item) => {
        return item.sectorKey === this.currentSectorKey;
      });
    } else {
      // Single date + sector
      this.activeIncidents = PRESET_INSPECTIONS.filter((item) => {
        return item.date === this.currentDate && item.sectorKey === this.currentSectorKey;
      });
    }

    // If no incidents in this specific slice, provide fallback default
    if (this.activeIncidents.length === 0) {
      const fallback = PRESET_INSPECTIONS.filter((i) => i.sectorKey === this.currentSectorKey);
      this.activeIncidents = fallback.length > 0 ? fallback : [PRESET_INSPECTIONS[0]];
    }

    // Default select first item
    this.selectedIncident = this.activeIncidents[0] || null;

    this.renderStatsAndMetrics();
    this.renderIncidentList();
    if (this.selectedIncident) {
      this.updateTargetLockBox(this.selectedIncident);
    }

    // Live update Municipal Analytics ECharts & KPIs with active date/sector filters
    this.updateMunicipalAnalyticsData();
  }

  // Render KPI Cards, Progress Bar, and Left Telemetry
  renderStatsAndMetrics() {
    const list = this.activeIncidents;

    // Count by category
    const countTrash = list.filter((i) => i.category === 'trash').length;
    const countPavement = list.filter((i) => i.category === 'pavement').length;
    const countTree = list.filter((i) => i.category === 'tree').length;
    const countHygiene = list.filter((i) => i.category === 'hygiene').length;

    document.getElementById('stat-trash').textContent = countTrash;
    document.getElementById('stat-pavement').textContent = countPavement;
    document.getElementById('stat-tree').textContent = countTree;
    document.getElementById('stat-hygiene').textContent = countHygiene;

    // Dispatch SLA Progress
    const dispatchedCount = list.filter((i) => i.status === 'dispatched').length;
    const rate = list.length > 0 ? Math.round((dispatchedCount / list.length) * 100) : 100;
    const fillEl = document.getElementById('dispatch-prog-fill');
    const rateEl = document.getElementById('dispatch-prog-rate');
    if (fillEl) fillEl.style.width = `${rate}%`;
    if (rateEl) rateEl.textContent = `${rate}% 派發 (${dispatchedCount}/${list.length})`;

    // Left Telemetry Box
    const sectorDistances = {
      dajia: '4.2 km',
      dadaocheng: '3.8 km',
      rainbow: '5.1 km',
      guandu: '6.5 km'
    };
    const sectorFrames = {
      dajia: '3,780 F',
      dadaocheng: '3,420 F',
      rainbow: '4,590 F',
      guandu: '5,850 F'
    };
    document.getElementById('telem-dist').textContent = sectorDistances[this.currentSectorKey] || '4.0 km';
    document.getElementById('telem-frames').textContent = sectorFrames[this.currentSectorKey] || '3,600 F';
    document.getElementById('telem-anomalies').textContent = `${list.length} 處`;
    document.getElementById('telem-conf').textContent = '94.2%';
    document.getElementById('map-pin-count').textContent = `${list.length} HOTSPOTS`;

    const sectorTag = document.getElementById('rover-sector-tag');
    if (sectorTag) sectorTag.textContent = this.currentSector.name.split(' (')[0];
  }

  // Select an Incident to view in Evidence HUD
  selectIncident(incident) {
    this.selectedIncident = incident;
    this.updateTargetLockBox(incident);
    this.renderIncidentList();
  }

  // Update Center Camera Targeting HUD Box
  updateTargetLockBox(incident) {
    const conf = document.getElementById('lock-conf');
    const title = document.getElementById('lock-title');
    const dept = document.getElementById('lock-dept');
    const coords = document.getElementById('lock-coords');
    const timeEl = document.getElementById('ev-timestamp');
    const frameEl = document.getElementById('ev-frameid');

    if (conf) conf.textContent = incident.confidence || '94.8%';
    if (title) title.textContent = incident.title;
    if (dept) dept.textContent = `權責局處：${incident.department}`;
    if (coords) coords.textContent = `COORD: ${incident.coordinates.lat}°N, ${incident.coordinates.lng}°E (${incident.sectorName || ''} ${incident.mileage || ''})`;
    if (timeEl) timeEl.textContent = `RECORDED: ${incident.time || '11:24:18'}`;
    if (frameEl) frameEl.textContent = `FRAME: ${incident.frameId || '#01842'}`;
  }

  // Inject Custom Test Incident
  injectCustomIncident(categoryKey) {
    const templates = INCIDENT_TEMPLATES[categoryKey] || INCIDENT_TEMPLATES.trash;
    const template = templates[Math.floor(Math.random() * templates.length)];
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const ticketId = `TPE-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const latOffset = (Math.random() - 0.5) * this.currentSector.deltaLat;
    const lngOffset = (Math.random() - 0.5) * this.currentSector.deltaLng;
    const coords = {
      lat: parseFloat((this.currentSector.center.lat + latOffset).toFixed(5)),
      lng: parseFloat((this.currentSector.center.lng + lngOffset).toFixed(5))
    };

    const newIncident = {
      id: ticketId,
      date: this.currentDate === 'range-7d' ? '2026-10-14' : this.currentDate,
      time: timeStr,
      sectorKey: this.currentSectorKey,
      sectorName: this.currentSector.name,
      category: categoryKey,
      categoryName: template.categoryName,
      title: template.title,
      severity: template.severity,
      department: template.department,
      suggestedAction: template.suggestedAction,
      coordinates: coords,
      mileage: `${Math.floor(Math.random() * 3)}K+${Math.floor(100 + Math.random() * 800)}`,
      confidence: (89 + Math.random() * 9).toFixed(1) + '%',
      frameId: `#0${Math.floor(1000 + Math.random() * 3000)}`,
      routeT: Math.min(0.92, Math.max(0.08, Math.random())),
      status: 'pending'
    };

    this.activeIncidents.unshift(newIncident);
    this.selectIncident(newIncident);
    this.renderStatsAndMetrics();
    this.showToast(`🚨 新增測試案例：${newIncident.title.substring(0, 22)}...`);
  }

  // Render Incident Cards
  renderIncidentList() {
    const container = document.getElementById('incident-list-container');
    const badge = document.getElementById('incident-count-badge');
    if (!container) return;

    // Filter incidents
    const filtered = this.activeIncidents.filter((item) => {
      if (this.currentFilter === 'all') return true;
      return item.category === this.currentFilter;
    });

    if (badge) {
      badge.textContent = `${filtered.length} ISSUES`;
    }

    // Update Filter Tab Counters
    document.getElementById('count-all').textContent = this.activeIncidents.length;
    ['trash', 'pavement', 'tree', 'hygiene'].forEach((cat) => {
      const el = document.getElementById(`count-${cat}`);
      if (el) {
        el.textContent = this.activeIncidents.filter((i) => i.category === cat).length;
      }
    });

    container.innerHTML = '';

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="padding: 24px; text-align: center; color: var(--text-muted); font-family: var(--font-mono);">
          [目前篩選條件下無紀錄事件]
        </div>
      `;
      return;
    }

    filtered.forEach((item) => {
      const card = document.createElement('div');
      const isSelected = this.selectedIncident && this.selectedIncident.id === item.id;
      card.className = `incident-card ${isSelected ? 'selected' : ''}`;
      const sevClass = item.severity === 'high' ? 'sev-high' : 'sev-medium';

      card.innerHTML = `
        <div class="card-top">
          <span class="card-time">${item.time} · ${item.id}</span>
          <span class="card-badge-severity ${sevClass}">${item.severity.toUpperCase()}</span>
        </div>
        <div class="card-title">${item.title}</div>
        <div class="card-meta">
          <span class="card-dept">${item.department}</span>
          <span>${item.mileage || ''} (置信度 ${item.confidence})</span>
        </div>
        <div class="card-action-bar">
          <span class="card-tag-status ${item.status === 'dispatched' ? 'status-ok' : 'status-pending'}">
            ${item.status === 'dispatched' ? '✔ 1999 已派發' : '⏳ 待審核派工'}
          </span>
          <span class="card-btn-ticket">檢視派工單 ➔</span>
        </div>
      `;

      card.addEventListener('click', () => {
        audio.playClick();
        this.selectIncident(item);
        this.openModal(item);
      });

      container.appendChild(card);
    });
  }

  // Handle Radar Canvas Mouse Hover
  handleRadarMouseMove(e) {
    if (!this.radarCanvas || this.activeIncidents.length === 0) return;
    const rect = this.radarCanvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (this.radarCanvas.width / rect.width);
    const my = (e.clientY - rect.top) * (this.radarCanvas.height / rect.height);

    const w = this.radarCanvas.width;
    const h = this.radarCanvas.height;

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

    let foundIdx = -1;
    this.activeIncidents.forEach((item, idx) => {
      const t = item.routeT || ((idx * 0.18 + 0.1) % 0.9);
      const px = ax * Math.pow(t, 3) + bx * Math.pow(t, 2) + cx * t + p0.x;
      const py = ay * Math.pow(t, 3) + by * Math.pow(t, 2) + cy * t + p0.y;

      const dist = Math.hypot(mx - px, my - py);
      if (dist < 14) {
        foundIdx = idx;
      }
    });

    this.hoveredPinIndex = foundIdx;
    const popover = document.getElementById('map-pin-popover');
    if (foundIdx >= 0) {
      this.radarCanvas.style.cursor = 'pointer';
      const item = this.activeIncidents[foundIdx];
      if (popover) {
        popover.classList.remove('hidden');
        document.getElementById('pop-title').textContent = item.title;
        document.getElementById('pop-meta').textContent = `${item.categoryName} · ${item.mileage} · 置信度 ${item.confidence}`;
      }
    } else {
      this.radarCanvas.style.cursor = 'default';
      if (popover) popover.classList.add('hidden');
    }
  }

  // Handle Radar Canvas Click
  handleRadarClick() {
    if (this.hoveredPinIndex >= 0 && this.activeIncidents[this.hoveredPinIndex]) {
      audio.init();
      audio.playLockOn();
      const item = this.activeIncidents[this.hoveredPinIndex];
      this.selectIncident(item);
      this.showToast(`🎯 已鎖定路線異常點：${item.title.substring(0, 20)}...`);
    }
  }

  // NT-D Boot Screen Lifecycle
  initBootScreen() {
    this.isNtdIgnited = false;
  }

  igniteNtdSequence() {
    if (this.isNtdIgnited) return;
    this.isNtdIgnited = true;

    audio.init();
    audio.playNtdEngage();
    this.playBgm();

    const bootScreen = document.getElementById('ntd-boot-screen');
    if (bootScreen) {
      bootScreen.classList.add('ntd-ignited', 'screen-shake');
    }

    const engageBtnText = document.getElementById('engage-btn-text');
    if (engageBtnText) {
      engageBtnText.textContent = '🚨 DESTROY MODE ENGAGED // 系統超頻共振中 🚨';
    }

    const durationMs = 10000;
    const startTime = Date.now();
    const countdownDigits = document.getElementById('countdown-digits');
    const countdownFill = document.getElementById('countdown-fill');
    const countdownSubLogs = document.getElementById('countdown-sub-logs');

    if (this.countdownTimer) clearInterval(this.countdownTimer);

    this.countdownTimer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, (durationMs - elapsed) / 1000);

      if (countdownDigits) countdownDigits.textContent = remaining.toFixed(1) + 's';
      if (countdownFill) countdownFill.style.width = Math.min(100, (elapsed / durationMs) * 100) + '%';

      if (countdownSubLogs) {
        if (remaining > 8) {
          countdownSubLogs.textContent = '> PSYCHO-FRAME BIO-SENSOR RESONATING AT 120% CRITICAL...';
        } else if (remaining > 5) {
          countdownSubLogs.textContent = '> LOADING HISTORICAL PATROL DATA & MUNICIPAL DATASETS...';
        } else if (remaining > 2) {
          countdownSubLogs.textContent = '> WATERFRONT INCIDENT PIPELINE READY FOR 1999 DISPATCH...';
        } else {
          countdownSubLogs.textContent = '> ENGAGING RX-0 WAR ROOM HUD // 3... 2... 1...';
        }
      }

      if (elapsed >= durationMs) {
        clearInterval(this.countdownTimer);
        this.countdownTimer = null;
        if (bootScreen) bootScreen.classList.remove('screen-shake');
        this.dismissBootScreen();
      }
    }, 50);
  }

  dismissBootScreen() {
    const bootScreen = document.getElementById('ntd-boot-screen');
    if (bootScreen) bootScreen.classList.add('fade-out');
    if (!this.bgmPlaying) this.playBgm();
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
    if (engageBtnText) engageBtnText.textContent = 'ACTIVATE NT-D SYSTEM // 啟動毀滅模式';
    const countdownFill = document.getElementById('countdown-fill');
    if (countdownFill) countdownFill.style.width = '0%';
    const countdownDigits = document.getElementById('countdown-digits');
    if (countdownDigits) countdownDigits.textContent = '10.0s';
  }

  // Start Background Clock
  startClock() {
    setInterval(() => {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0];
      const clockEl = document.getElementById('live-clock');
      if (clockEl) clockEl.textContent = `${dateStr} ${timeStr}`;

      const resMeter = document.getElementById('resonance-meter-bar');
      const resVal = document.getElementById('resonance-val');
      if (resMeter && resVal) {
        const sync = (93 + Math.random() * 6).toFixed(1);
        resMeter.style.width = `${sync}%`;
        resVal.textContent = `${sync}% CRITICAL`;
      }
    }, 1000);
  }

  // 1999 Modal Operations
  openModal(incident) {
    const modal = document.getElementById('ticket-modal');
    if (!modal) return;

    document.getElementById('modal-incident-title').textContent = incident.title;
    document.getElementById('modal-ticket-id').textContent = incident.id;
    document.getElementById('modal-ticket-category').textContent = incident.categoryName;
    document.getElementById('modal-ticket-severity').textContent =
      incident.severity === 'high' ? 'HIGH (重大優先處理)' : 'MEDIUM (一般追蹤修復)';
    document.getElementById('modal-ticket-coords').textContent =
      `${incident.coordinates.lat}° N, ${incident.coordinates.lng}° E (${incident.sectorName} ${incident.mileage || ''})`;
    document.getElementById('modal-ticket-dept').textContent = incident.department;
    document.getElementById('modal-ticket-action').textContent = incident.suggestedAction;
    document.getElementById('modal-snapshot-img').src = generateSnapshotSvg(incident.category, incident.title, incident.coordinates);

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
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.activeIncidents, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', 'patrol_data.json');
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
    this.showToast(`💾 已匯出 patrol_data.json (共 ${this.activeIncidents.length} 筆資料)`);
  }

  // Copy JSON to Clipboard
  copyJsonClipboard() {
    const jsonStr = JSON.stringify(this.activeIncidents, null, 2);
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
      console.log('Autoplay deferred:', err);
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
    if (btn) {
      btn.classList.toggle('playing', isPlaying);
      btn.title = isPlaying ? '暫停 BGM: UNICORN (澤野弘之)' : '播放 BGM: UNICORN (澤野弘之)';
    }
    if (text) {
      text.textContent = isPlaying ? 'BGM (ON)' : 'BGM (OFF)';
    }
  }

  // ==========================================================================
  // 5. RADAR & ROUTE CANVAS LOOP (INTERACTIVE HOTSPOT PINS)
  // ==========================================================================
  startRadarLoop() {
    if (!this.radarCtx) return;

    const render = () => {
      const ctx = this.radarCtx;
      const w = this.radarCanvas.width;
      const h = this.radarCanvas.height;

      // Dark background
      ctx.fillStyle = '#06080d';
      ctx.fillRect(0, 0, w, h);

      // Grid Lines
      ctx.strokeStyle = 'rgba(255, 0, 60, 0.1)';
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

      // River Water Body
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(0, 243, 255, 0.35)';
      ctx.lineWidth = 18;
      ctx.moveTo(0, h * 0.7);
      ctx.bezierCurveTo(w * 0.35, h * 0.8, w * 0.65, h * 0.2, w, h * 0.3);
      ctx.stroke();

      // Bike / Patrol Path (Dashed Parallel)
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 0, 60, 0.7)';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 4]);
      ctx.moveTo(0, h * 0.7 - 20);
      ctx.bezierCurveTo(w * 0.35, h * 0.8 - 20, w * 0.65, h * 0.2 - 20, w, h * 0.3 - 20);
      ctx.stroke();
      ctx.setLineDash([]);

      // Bezier Path Equation Parameters
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

      // Draw Incident Pins along Path
      const catColors = {
        trash: '#ff003c',
        pavement: '#ff9f1c',
        tree: '#2ec4b6',
        hygiene: '#b5179e'
      };

      this.activeIncidents.forEach((item, index) => {
        const t = item.routeT || ((index * 0.18 + 0.1) % 0.9);
        const px = ax * Math.pow(t, 3) + bx * Math.pow(t, 2) + cx * t + p0.x;
        const py = ay * Math.pow(t, 3) + by * Math.pow(t, 2) + cy * t + p0.y;

        const isHovered = this.hoveredPinIndex === index;
        const isSelected = this.selectedIncident && this.selectedIncident.id === item.id;
        const color = catColors[item.category] || '#ff003c';

        // Outer pulsing ring
        const pulse = Math.sin(Date.now() * 0.005 + index) * 3 + (isSelected ? 7 : 5);
        ctx.strokeStyle = color;
        ctx.lineWidth = isSelected ? 2.5 : 1.5;
        ctx.beginPath();
        ctx.arc(px, py, pulse + (isSelected ? 6 : 4), 0, Math.PI * 2);
        ctx.stroke();

        // Inner Solid Dot
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = isSelected || isHovered ? 14 : 6;
        ctx.beginPath();
        ctx.arc(px, py, isSelected ? 6.5 : (isHovered ? 5.5 : 4), 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Anomaly Label Tag for selected
        if (isSelected) {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px "Share Tech Mono", monospace';
          ctx.fillText(`[${item.id}]`, px - 18, py - 14);
        }
      });

      requestAnimationFrame(render);
    };

    render();
  }

  // ==========================================================================
  // 6. AI EVIDENCE VIEWER CANVAS LOOP (SHOWS SELECTED ANOMALY)
  // ==========================================================================
  startCameraSimulationLoop() {
    if (!this.cameraCtx) return;

    let frame = 0;
    const render = () => {
      frame++;
      const ctx = this.cameraCtx;
      const w = this.cameraCanvas.width;
      const h = this.cameraCanvas.height;

      // 1. Cyber Twilight Sky Background
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.58);
      skyGrad.addColorStop(0, '#0a0d18');
      skyGrad.addColorStop(0.5, '#1e0c24');
      skyGrad.addColorStop(1, '#52132b');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h * 0.58);

      // Digital Noise / Star Points
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      for (let i = 0; i < 15; i++) {
        const sx = (i * 43) % w;
        const sy = (i * 23) % (h * 0.4);
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }

      // 2. Taipei Skyline & Bridges
      ctx.fillStyle = '#0e121e';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.58);
      ctx.lineTo(0, h * 0.50);
      ctx.lineTo(50, h * 0.50);
      ctx.lineTo(60, h * 0.44);
      ctx.lineTo(110, h * 0.44);
      ctx.lineTo(120, h * 0.52);
      ctx.lineTo(170, h * 0.52);
      ctx.lineTo(175, h * 0.38);
      ctx.lineTo(205, h * 0.38);
      ctx.lineTo(210, h * 0.54);
      // Taipei 101 Structure
      ctx.lineTo(250, h * 0.54);
      ctx.lineTo(255, h * 0.28);
      ctx.lineTo(258, h * 0.18);
      ctx.lineTo(262, h * 0.54);
      // Bridge Span
      ctx.lineTo(320, h * 0.54);
      ctx.lineTo(380, h * 0.36);
      ctx.lineTo(440, h * 0.54);
      ctx.lineTo(w, h * 0.54);
      ctx.lineTo(w, h * 0.58);
      ctx.fill();

      // Bridge Cable Lines
      ctx.strokeStyle = 'rgba(255, 0, 60, 0.3)';
      ctx.lineWidth = 1;
      for (let c = 330; c <= 430; c += 18) {
        ctx.beginPath();
        ctx.moveTo(380, h * 0.36);
        ctx.lineTo(c, h * 0.54);
        ctx.stroke();
      }

      // 3. Riverside Waterway (Left)
      const riverGrad = ctx.createLinearGradient(0, h * 0.58, 0, h);
      riverGrad.addColorStop(0, '#0c1a2e');
      riverGrad.addColorStop(1, '#050c18');
      ctx.fillStyle = riverGrad;
      ctx.fillRect(0, h * 0.58, w * 0.36, h * 0.42);

      // Water Ripple Lines
      ctx.strokeStyle = 'rgba(0, 243, 255, 0.2)';
      ctx.lineWidth = 1;
      for (let r = 0; r < 4; r++) {
        const ry = h * 0.64 + r * 16;
        ctx.beginPath();
        ctx.moveTo(10, ry);
        ctx.lineTo(w * 0.32, ry);
        ctx.stroke();
      }

      // 4. Riverside Bike Path (Center to Right)
      const pathGrad = ctx.createLinearGradient(0, h * 0.58, 0, h);
      pathGrad.addColorStop(0, '#242b3d');
      pathGrad.addColorStop(1, '#0f1420');
      ctx.fillStyle = pathGrad;
      ctx.beginPath();
      ctx.moveTo(w * 0.34, h * 0.58);
      ctx.lineTo(w * 0.95, h * 0.58);
      ctx.lineTo(w * 1.25, h);
      ctx.lineTo(w * 0.15, h);
      ctx.fill();

      // Road Center Divider
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(w * 0.62, h * 0.58);
      ctx.lineTo(w * 0.68, h);
      ctx.stroke();

      // 5. Render Selected Anomaly Evidence Subject
      const activeItem = this.selectedIncident || this.activeIncidents[0];
      const targetCategory = activeItem ? activeItem.category : 'trash';

      ctx.save();
      ctx.translate(w * 0.62, h * 0.76);

      if (targetCategory === 'trash') {
        // Trash Can
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#ff003c';
        ctx.lineWidth = 2.5;
        ctx.fillRect(-28, -50, 56, 65);
        ctx.strokeRect(-28, -50, 56, 65);
        // Overflowing Trash
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(-10, -60, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ff5722';
        ctx.beginPath();
        ctx.arc(12, -58, 14, 0, Math.PI * 2);
        ctx.fill();
      } else if (targetCategory === 'pavement') {
        // Pavement crack / pothole
        ctx.strokeStyle = '#ff9f1c';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-50, -10);
        ctx.lineTo(-20, 10);
        ctx.lineTo(15, -5);
        ctx.lineTo(45, 15);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255, 159, 28, 0.35)';
        ctx.fillRect(-40, -15, 80, 30);
      } else if (targetCategory === 'tree') {
        // Tilted Tree Trunk
        ctx.save();
        ctx.rotate(0.32); // 18 degree tilt
        ctx.fillStyle = '#8d6e63';
        ctx.fillRect(-8, -90, 16, 100);
        ctx.fillStyle = '#2ec4b6';
        ctx.beginPath();
        ctx.arc(0, -95, 35, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else {
        // Hygiene hotspot / rodent symbol
        ctx.fillStyle = '#374151';
        ctx.beginPath();
        ctx.ellipse(0, 0, 40, 22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#b5179e';
        ctx.beginPath();
        ctx.arc(28, -5, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      // YOLO Bounding Box & Annotations
      const boxColor = targetCategory === 'trash' ? '#ff003c' : (targetCategory === 'pavement' ? '#ff9f1c' : (targetCategory === 'tree' ? '#2ec4b6' : '#b5179e'));
      ctx.strokeStyle = boxColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(-55, -95, 110, 125);

      // Corner Brackets
      ctx.fillStyle = boxColor;
      ctx.fillRect(-55, -95, 12, 3);
      ctx.fillRect(-55, -95, 3, 12);
      ctx.fillRect(43, -95, 12, 3);
      ctx.fillRect(52, -95, 3, 12);
      ctx.fillRect(-55, 27, 12, 3);
      ctx.fillRect(-55, 18, 3, 12);
      ctx.fillRect(43, 27, 12, 3);
      ctx.fillRect(52, 18, 3, 12);

      // Floating AI Tag Header
      ctx.fillStyle = boxColor;
      ctx.fillRect(-55, -112, 110, 17);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 9px "Share Tech Mono", monospace';
      const confText = activeItem ? `${activeItem.categoryName.substring(0, 6)} ${activeItem.confidence}` : 'AI LOCK 94%';
      ctx.fillText(confText, -52, -100);

      ctx.restore();

      // Static watermark
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.font = '9px "Share Tech Mono", monospace';
      ctx.fillText('OFFLINE AI KEYFRAME INSPECTOR // TAIPEI CIVIC DEBUGGER', 12, h - 12);

      requestAnimationFrame(render);
    };

    render();
  }

  // ==========================================================================
  // 7. PURPLE FLAME & PSYCHO-FRAME EQUALIZER LOOP (MATCHES SCREENSHOT)
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

  // ==========================================================================
  // VIEW SWITCHER & MUNICIPAL ANALYTICS (ECHARTS ENGINE)
  // ==========================================================================
  switchView(viewName) {
    if (this.currentView === viewName) return;
    this.currentView = viewName;

    const tacticalGrid = document.querySelector('.cockpit-grid');
    const analyticsView = document.getElementById('municipal-analytics-view');
    const tabs = document.querySelectorAll('.hud-view-tab');

    tabs.forEach((tab) => {
      tab.classList.toggle('active', tab.dataset.view === viewName);
    });

    if (viewName === 'analytics') {
      if (tacticalGrid) tacticalGrid.classList.add('hidden');
      if (analyticsView) analyticsView.classList.remove('hidden');
      this.initMunicipalCharts();
      this.showToast('📊 已切換至：市政物件統計與工務局解決進度戰報');
    } else {
      if (analyticsView) analyticsView.classList.add('hidden');
      if (tacticalGrid) tacticalGrid.classList.remove('hidden');
      this.showToast('🎯 已切換至：戰術巡檢地圖與 1999 派工清單');
    }
  }

  // Render & Resize all 4 ECharts Panels
  initMunicipalCharts() {
    if (typeof echarts === 'undefined') {
      console.warn('ECharts not loaded yet');
      return;
    }

    // Chart 1: Category Distribution (Donut Chart)
    this.renderCategoryDonutChart();

    // Chart 2: Resolution & Dispatch Funnel
    this.renderResolveFunnelChart();

    // Chart 3: Sector Hotspot Comparison (Bar Chart)
    this.renderSectorBarChart();

    // Chart 4: 7-Day Trend & MTTR Reduction (Line Area Chart)
    this.renderTrendLineChart();

    // Auto-resize on window resize
    if (!this._chartResizeBound) {
      window.addEventListener('resize', () => {
        Object.values(this.echartsInstances).forEach((inst) => inst && inst.resize());
      });
      this._chartResizeBound = true;
    }
  }

  // Chart 1: Donut breakdown of defects
  renderCategoryDonutChart() {
    const el = document.getElementById('chart-category-donut');
    if (!el) return;

    if (!this.echartsInstances.donut) {
      this.echartsInstances.donut = echarts.init(el, 'dark', { renderer: 'canvas' });
    }
    const chart = this.echartsInstances.donut;

    // Filter by date or all if range-7d
    const targetPool = this.currentDate === 'range-7d'
      ? PRESET_INSPECTIONS
      : PRESET_INSPECTIONS.filter((i) => i.date === this.currentDate);
    const pool = targetPool.length > 0 ? targetPool : PRESET_INSPECTIONS;

    const countTrash = pool.filter((i) => i.category === 'trash').length;
    const countPavement = pool.filter((i) => i.category === 'pavement').length;
    const countTree = pool.filter((i) => i.category === 'tree').length;
    const countHygiene = pool.filter((i) => i.category === 'hygiene').length;

    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        formatter: '{b}: <b>{c} 處</b> ({d}%)',
        backgroundColor: 'rgba(13, 16, 24, 0.95)',
        borderColor: '#ff003c',
        borderWidth: 1,
        textStyle: { color: '#fff', fontFamily: 'Share Tech Mono' }
      },
      legend: {
        orient: 'vertical',
        right: '4%',
        top: 'middle',
        itemGap: 12,
        textStyle: {
          color: '#cbd5e1',
          fontSize: 11,
          fontFamily: 'Noto Sans TC, Share Tech Mono'
        }
      },
      series: [
        {
          name: '異常分類',
          type: 'pie',
          radius: ['45%', '72%'],
          center: ['36%', '50%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 4,
            borderColor: '#0d1018',
            borderWidth: 2
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold',
              color: '#00f3ff',
              formatter: '{b}\n{d}%'
            },
            itemStyle: {
              shadowBlur: 14,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 243, 255, 0.6)'
            }
          },
          data: [
            { value: countTrash || 1, name: '#02 滿溢/遺失垃圾桶', itemStyle: { color: '#ff003c' } },
            { value: countPavement || 1, name: '#07 地磚坑洞與標線磨損', itemStyle: { color: '#00f3ff' } },
            { value: countTree || 1, name: '#01 枯木/倒木/空樹穴', itemStyle: { color: '#10b981' } },
            { value: countHygiene || 1, name: '#03 鼠患堆置死角', itemStyle: { color: '#f59e0b' } }
          ]
        }
      ]
    };

    chart.setOption(option);
    setTimeout(() => chart.resize(), 50);
  }

  // Chart 2: Resolution Funnel
  renderResolveFunnelChart() {
    const el = document.getElementById('chart-resolve-funnel');
    if (!el) return;

    if (!this.echartsInstances.funnel) {
      this.echartsInstances.funnel = echarts.init(el, 'dark', { renderer: 'canvas' });
    }
    const chart = this.echartsInstances.funnel;

    const targetPool = this.currentDate === 'range-7d'
      ? PRESET_INSPECTIONS
      : PRESET_INSPECTIONS.filter((i) => i.date === this.currentDate);
    const pool = targetPool.length > 0 ? targetPool : PRESET_INSPECTIONS;

    const total = pool.length;
    const dispatched = pool.filter((i) => i.status === 'dispatched').length;
    const inProgress = Math.max(1, Math.round(dispatched * 0.9));
    const resolved = Math.max(1, Math.round(dispatched * 0.8));

    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        formatter: '{b}: <b>{c} 件</b> ({d}%)',
        backgroundColor: 'rgba(13, 16, 24, 0.95)',
        borderColor: '#00f3ff',
        textStyle: { color: '#fff', fontFamily: 'Share Tech Mono' }
      },
      series: [
        {
          name: '1999 派工修復鏈路',
          type: 'funnel',
          left: '10%',
          top: 20,
          bottom: 20,
          width: '80%',
          min: 0,
          max: total,
          minSize: '30%',
          maxSize: '100%',
          sort: 'descending',
          gap: 4,
          label: {
            show: true,
            position: 'inside',
            formatter: '{b} ({c}件)',
            color: '#ffffff',
            fontWeight: 'bold',
            fontFamily: 'Noto Sans TC, Share Tech Mono'
          },
          itemStyle: {
            borderColor: '#0d1018',
            borderWidth: 2
          },
          data: [
            { value: total, name: '1. AI 巡檢辨識成案', itemStyle: { color: '#ff003c' } },
            { value: dispatched, name: `2. 1999 自動立案派發 (${Math.round((dispatched / total) * 100)}%)`, itemStyle: { color: '#a855f7' } },
            { value: inProgress, name: `3. 工務局處現場進場 (${Math.round((inProgress / total) * 100)}%)`, itemStyle: { color: '#00f3ff' } },
            { value: resolved, name: `4. 完工驗收與修復結案 (${Math.round((resolved / total) * 100)}%)`, itemStyle: { color: '#10b981' } }
          ]
        }
      ]
    };

    chart.setOption(option);
    setTimeout(() => chart.resize(), 50);
  }

  // Chart 3: Sector Hotspot Comparison
  renderSectorBarChart() {
    const el = document.getElementById('chart-sector-bar');
    if (!el) return;

    if (!this.echartsInstances.bar) {
      this.echartsInstances.bar = echarts.init(el, 'dark', { renderer: 'canvas' });
    }
    const chart = this.echartsInstances.bar;

    // Filter by date or entire dataset
    const targetPool = this.currentDate === 'range-7d'
      ? PRESET_INSPECTIONS
      : PRESET_INSPECTIONS.filter((i) => i.date === this.currentDate);
    const pool = targetPool.length > 0 ? targetPool : PRESET_INSPECTIONS;

    const sectorKeys = ['dadaocheng', 'dajia', 'rainbow', 'guandu'];
    const sectorLabels = ['大稻埕水岸', '大佳河濱', '彩虹河濱', '關渡高灘地'];

    const resolvedData = sectorKeys.map((sec) => {
      const items = pool.filter((i) => i.sectorKey === sec);
      const dispatched = items.filter((i) => i.status === 'dispatched').length;
      return Math.max(1, Math.round(dispatched * 0.8));
    });

    const pendingData = sectorKeys.map((sec) => {
      const items = pool.filter((i) => i.sectorKey === sec);
      const pending = items.filter((i) => i.status !== 'dispatched').length;
      return Math.max(1, pending || Math.round(items.length * 0.2));
    });

    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(13, 16, 24, 0.95)',
        borderColor: '#a855f7',
        textStyle: { color: '#fff', fontFamily: 'Share Tech Mono' }
      },
      legend: {
        top: 6,
        right: '4%',
        textStyle: { color: '#cbd5e1', fontSize: 11, fontFamily: 'Noto Sans TC' }
      },
      grid: {
        left: '4%',
        right: '4%',
        bottom: '8%',
        top: '20%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: sectorLabels,
        axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.2)' } },
        axisLabel: { color: '#cbd5e1', fontFamily: 'Noto Sans TC' }
      },
      yAxis: {
        type: 'value',
        name: '件數',
        nameTextStyle: { color: '#94a3b8' },
        splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.08)' } },
        axisLabel: { color: '#94a3b8', fontFamily: 'Share Tech Mono' }
      },
      series: [
        {
          name: '已修復結案',
          type: 'bar',
          stack: 'total',
          emphasis: { focus: 'series' },
          itemStyle: { color: '#10b981' },
          data: resolvedData
        },
        {
          name: '派工處理中',
          type: 'bar',
          stack: 'total',
          emphasis: { focus: 'series' },
          itemStyle: { color: '#ff003c' },
          data: pendingData
        }
      ]
    };

    chart.setOption(option);
    setTimeout(() => chart.resize(), 50);
  }

  // Chart 4: 7-Day Trend
  renderTrendLineChart() {
    const el = document.getElementById('chart-trend-line');
    if (!el) return;

    if (!this.echartsInstances.line) {
      this.echartsInstances.line = echarts.init(el, 'dark', { renderer: 'canvas' });
    }
    const chart = this.echartsInstances.line;

    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(13, 16, 24, 0.95)',
        borderColor: '#00f3ff',
        textStyle: { color: '#fff', fontFamily: 'Share Tech Mono' }
      },
      legend: {
        top: 6,
        right: '4%',
        textStyle: { color: '#cbd5e1', fontSize: 11, fontFamily: 'Noto Sans TC' }
      },
      grid: {
        left: '4%',
        right: '4%',
        bottom: '8%',
        top: '20%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: ['10/08', '10/09', '10/10', '10/11', '10/12', '10/13', '10/14 (今日)'],
        axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.2)' } },
        axisLabel: { color: '#cbd5e1', fontFamily: 'Share Tech Mono' }
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.08)' } },
        axisLabel: { color: '#94a3b8', fontFamily: 'Share Tech Mono' }
      },
      series: [
        {
          name: '每日新辨識異常',
          type: 'line',
          smooth: true,
          lineStyle: { width: 3, color: '#ff003c' },
          itemStyle: { color: '#ff003c' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(255, 0, 60, 0.35)' },
              { offset: 1, color: 'rgba(255, 0, 60, 0.01)' }
            ])
          },
          data: [26, 22, 19, 18, 16, 14, 13]
        },
        {
          name: '當日修復結案數',
          type: 'line',
          smooth: true,
          lineStyle: { width: 3, color: '#00f3ff' },
          itemStyle: { color: '#00f3ff' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(0, 243, 255, 0.3)' },
              { offset: 1, color: 'rgba(0, 243, 255, 0.01)' }
            ])
          },
          data: [15, 18, 20, 21, 19, 17, 18]
        }
      ]
    };

    chart.setOption(option);
    setTimeout(() => chart.resize(), 50);
  }

  // ==========================================================================
  // DYNAMIC ECHARTS DATA CONNECTOR (REACTS TO DATE & SECTOR FILTERS)
  // ==========================================================================
  updateMunicipalAnalyticsData() {
    // Determine scope of records: if range-7d, all records; else by date
    const dateRecords = this.currentDate === 'range-7d'
      ? PRESET_INSPECTIONS
      : PRESET_INSPECTIONS.filter((i) => i.date === this.currentDate);

    // Records filtered by date + sector
    const currentSlice = dateRecords.filter((i) => i.sectorKey === this.currentSectorKey);
    const activePool = currentSlice.length > 0 ? currentSlice : dateRecords;

    // 1. Update KPI Cards Dynamically
    const totalCount = activePool.length;
    const dispatchedCount = activePool.filter((i) => i.status === 'dispatched').length;
    const dispatchRate = totalCount > 0 ? ((dispatchedCount / totalCount) * 100).toFixed(1) : '100.0';
    const resolvedEstimate = totalCount > 0 ? Math.round(dispatchedCount * 0.85) : 0;
    const resolveRate = totalCount > 0 ? ((resolvedEstimate / totalCount) * 100).toFixed(1) : '85.0';

    const kpiTotal = document.getElementById('kpi-total-defects');
    const kpiDispatch = document.getElementById('kpi-dispatch-rate');
    const kpiResolve = document.getElementById('kpi-resolve-rate');

    if (kpiTotal) kpiTotal.textContent = totalCount;
    if (kpiDispatch) kpiDispatch.textContent = dispatchRate;
    if (kpiResolve) kpiResolve.textContent = resolveRate;

    // 2. Refresh charts if already initialized or currently in analytics view
    if (this.currentView === 'analytics' || this.echartsInstances.donut) {
      this.initMunicipalCharts();
    }
  }
}

// Instantiate on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new TaipeiDebuggerApp();
});
