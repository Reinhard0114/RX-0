/**
 * RX-0 TAIPEI DEBUGGER // NT-D SYSTEM MAIN CONTROLLER
 * High-performance Modular Architecture (Native ES Modules)
 */

import { audio } from './modules/audio.js';
import { SECTOR_ROUTES, SECTOR_TRACKS, getRoutePoint } from './modules/routes.js';
import { GisMapController } from './modules/gis.js';
import { MunicipalAnalytics } from './modules/analytics.js';
import { RadarRenderer, CameraRenderer, FlameRenderer } from './modules/canvas.js';

// Access presets from data.js
const SECTORS = window.RX0_DATA ? window.RX0_DATA.SECTORS : {};
const INCIDENT_TEMPLATES = window.RX0_DATA ? window.RX0_DATA.INCIDENT_TEMPLATES : {};
const PRESET_INSPECTIONS = window.RX0_DATA ? window.RX0_DATA.PRESET_INSPECTIONS : [];
const HISTORICAL_TREND_7D = window.RX0_DATA ? window.RX0_DATA.HISTORICAL_TREND_7D : null;
const generateSnapshotSvg = window.RX0_DATA ? window.RX0_DATA.generateSnapshotSvg : () => '';

export class TaipeiDebuggerApp {
  constructor() {
    this.currentSectorKey = 'dadaocheng';
    this.currentSector = SECTORS.dadaocheng || {
      name: '大稻埕碼頭水岸段 (淡水河右岸 · 3.8 km)',
      center: { lat: 25.0569, lng: 121.5078 },
      deltaLat: 0.008,
      deltaLng: 0.006
    };
    this.currentFilter = 'all';
    this.currentDate = '2026-10-14';
    this.currentView = 'tactical'; // 'tactical' | 'analytics'
    this.mapViewMode = 'radar';    // 'radar' | 'osm'

    this.activeIncidents = [];
    this.selectedIncident = null;
    this.hoveredPinIndex = -1;

    this.isMuted = false;
    this.bgmPlaying = false;
    this.isAwakened = false;
    this.isNtdIgnited = false;
    this.countdownTimer = null;
    this.toastTimer = null;

    // DOM References
    this.radarCanvas = document.getElementById('radarCanvas');
    this.cameraCanvas = document.getElementById('cameraCanvas');
    this.flameCanvas = document.getElementById('ntd-flame-canvas');
    this.bgm = document.getElementById('ntd-bgm');

    // Preload field evidence photos
    this.evidenceImages = {};
    const photoSources = {
      trash: 'assets/evidence/trash_overflow.jpg',
      pavement: 'assets/evidence/pavement_crack.jpg',
      tree: 'assets/evidence/fallen_tree.jpg',
      hygiene: 'assets/evidence/hygiene_deadzone.jpg'
    };
    for (const [cat, src] of Object.entries(photoSources)) {
      const img = new Image();
      img.src = src;
      this.evidenceImages[cat] = img;
    }

    // Subsystem Modules
    this.gis = new GisMapController();
    this.analytics = new MunicipalAnalytics();
    this.radarRenderer = new RadarRenderer(this.radarCanvas);
    this.cameraRenderer = new CameraRenderer(this.cameraCanvas, this.evidenceImages);
    this.flameRenderer = new FlameRenderer(this.flameCanvas);

    // Global window bridge for inline HTML onclick handlers
    window.app = this;
    window.rx0App = this;

    this.init();
  }

  init() {
    if (this.bgm) {
      this.bgm.volume = 0.6;
      this.bgm.addEventListener('play', () => this.updateBgmUi(true));
      this.bgm.addEventListener('pause', () => this.updateBgmUi(false));
      this.bgm.addEventListener('ended', () => this.updateBgmUi(false));
    }

    this.bindEvents();
    this.initBootScreen();
    this.applyFilterAndRefresh();

    // Start Canvas Renderers (with reactive state getters)
    this.radarRenderer.start(() => ({
      currentSectorKey: this.currentSectorKey,
      activeIncidents: this.activeIncidents,
      currentFilter: this.currentFilter,
      hoveredPinIndex: this.hoveredPinIndex,
      selectedIncident: this.selectedIncident
    }));

    this.cameraRenderer.start(() => ({
      selectedIncident: this.selectedIncident,
      activeIncidents: this.activeIncidents
    }));

    this.flameRenderer.start(() => ({
      isNtdIgnited: this.isNtdIgnited,
      isAwakened: this.isAwakened
    }));

    this.startClock();
  }

  bindEvents() {
    // 1. Boot Screen Buttons
    const btnEngage = document.getElementById('btn-engage-ntd');
    if (btnEngage) {
      btnEngage.addEventListener('click', () => this.igniteNtdSequence());
    }

    const btnToggleSound = document.getElementById('btn-toggle-sound');
    if (btnToggleSound) {
      btnToggleSound.addEventListener('click', (e) => {
        e.stopPropagation();
        audio.init();
        this.toggleMasterMute();
      });
    }

    const btnFastPass = document.getElementById('btn-fast-pass');
    if (btnFastPass) {
      btnFastPass.addEventListener('click', (e) => {
        e.stopPropagation();
        audio.init();
        audio.playClick();
        if (this.countdownTimer) {
          clearInterval(this.countdownTimer);
          this.countdownTimer = null;
        }
        this.dismissBootScreen();
      });
    }

    // 2. Navigation View Switcher (Tactical Map vs Municipal Analytics)
    document.querySelectorAll('.hud-view-tab').forEach((tab) => {
      tab.addEventListener('click', (e) => {
        audio.playClick();
        const view = e.currentTarget.dataset.view;
        this.switchView(view);
      });
    });

    // 3. Date Selectors
    document.querySelectorAll('.btn-date').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        audio.playClick();
        document.querySelectorAll('.btn-date').forEach((b) => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.currentDate = e.currentTarget.dataset.date;
        this.applyFilterAndRefresh();
        const label = e.currentTarget.textContent.trim();
        this.showToast(`📅 資料時區已切換至：${label}`);
      });
    });

    // 4. Sector Selection
    const routeSelect = document.getElementById('route-select');
    if (routeSelect) {
      routeSelect.addEventListener('change', (e) => {
        audio.playClick();
        this.currentSectorKey = e.target.value;
        this.currentSector = SECTORS[e.target.value] || SECTORS.dadaocheng;
        
        // Update Cockpit Sector Code & Health Diagnostics
        const codeBadge = document.getElementById('sector-code-badge');
        if (codeBadge) {
          const codes = {
            dadaocheng: 'SEC-02 // DADAOCHENG',
            dajia: 'SEC-01 // DAJIA PARK',
            rainbow: 'SEC-03 // RAINBOW NEIHU',
            guandu: 'SEC-04 // GUANDU WATERBIRD'
          };
          codeBadge.textContent = codes[e.target.value] || 'SEC-00 // PATROL';
        }

        const healthScores = {
          dadaocheng: { score: '91.4% (GOOD)', pct: '91.4%' },
          dajia: { score: '88.5% (STABLE)', pct: '88.5%' },
          rainbow: { score: '94.2% (OPTIMAL)', pct: '94.2%' },
          guandu: { score: '96.0% (PRISTINE)', pct: '96.0%' }
        };
        const hs = healthScores[e.target.value] || { score: '92.0%', pct: '92%' };
        const hVal = document.getElementById('sector-health-val');
        const hBar = document.getElementById('sector-health-bar');
        if (hVal) hVal.textContent = hs.score;
        if (hBar) hBar.style.width = hs.pct;

        this.applyFilterAndRefresh();
        if (this.gis.map) {
          this.gis.flyTo(this.currentSector.center.lat, this.currentSector.center.lng, 14);
          this.gis.update(this.currentSectorKey, this.activeIncidents, this.currentFilter);
        }
        this.showToast(`巡邏河段已切換至：${this.currentSector.name}`);
      });
    }

    // 5. Audio & Volume Controls
    const btnToggleBgm = document.getElementById('btn-toggle-bgm');
    if (btnToggleBgm) {
      btnToggleBgm.addEventListener('click', (e) => {
        e.stopPropagation();
        audio.init();
        this.toggleBgm();
      });
    }

    const bgmVolumeSlider = document.getElementById('bgm-volume');
    if (bgmVolumeSlider) {
      bgmVolumeSlider.addEventListener('input', (e) => {
        const vol = parseFloat(e.target.value);
        if (this.bgm) {
          this.bgm.volume = vol;
          if (vol === 0) {
            this.setMasterMute(true);
          } else if (this.isMuted && vol > 0) {
            this.setMasterMute(false);
          }
        }
      });
    }

    const btnAudioControl = document.getElementById('btn-audio-control');
    if (btnAudioControl) {
      btnAudioControl.addEventListener('click', (e) => {
        e.stopPropagation();
        audio.init();
        this.toggleMasterMute();
      });
    }

    // 6. Brand Logo as Home Reboot
    const btnBrandHome = document.getElementById('btn-brand-home') || document.getElementById('btn-reboot-ntd');
    if (btnBrandHome) {
      btnBrandHome.addEventListener('click', () => {
        audio.init();
        audio.playNtdEngage();
        this.triggerBootScreen();
      });
    }

    // 7. Manual Test Injection Buttons
    document.querySelectorAll('.btn-inject').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        audio.init();
        audio.playLockOn();
        const cat = e.currentTarget.dataset.cat;
        this.injectCustomIncident(cat);
      });
    });

    // 8. Data Export & Clipboard
    const btnDownload = document.getElementById('btn-download-json');
    if (btnDownload) {
      btnDownload.addEventListener('click', () => {
        audio.playClick();
        this.exportJsonFile();
      });
    }

    const btnCopy = document.getElementById('btn-copy-json');
    if (btnCopy) {
      btnCopy.addEventListener('click', () => {
        audio.playClick();
        this.copyJsonClipboard();
      });
    }

    // 9. Category Filter Tabs & Legend
    document.querySelectorAll('.filter-tab').forEach((tab) => {
      tab.addEventListener('click', (e) => {
        audio.playClick();
        const filterKey = e.currentTarget.dataset.filter || 'all';
        this.setFilter(filterKey);
      });
    });

    document.querySelectorAll('#map-legend-bar .legend-item').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        audio.playClick();
        const cat = e.currentTarget.dataset.category || 'all';
        this.setFilter(cat);
      });
    });

    // 10. Modals: 1999 Ticket & Laplace's Box
    const ticketCloseIds = ['modal-close', 'modal-close-btn', 'modal-cancel-btn', 'modal-backdrop'];
    ticketCloseIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('click', (e) => {
          e.preventDefault();
          try { audio.playClick(); } catch (_) {}
          this.closeModal();
        });
      }
    });

    const btnSubmitMock = document.getElementById('modal-submit-mock-btn');
    if (btnSubmitMock) {
      btnSubmitMock.addEventListener('click', () => {
        try { audio.playDispatchSuccess(); } catch (_) {}
        if (this.selectedIncident) {
          this.selectedIncident.status = 'dispatched';
          this.renderStatsAndMetrics();
          this.renderIncidentList();
          this.showToast(`🚀 [1999 自動派工] ${this.selectedIncident.id} 已正式派發至主管局處！`);
        }
        this.closeModal();
      });
    }

    const btnDispatchNow = document.getElementById('btn-dispatch-now');
    if (btnDispatchNow) {
      btnDispatchNow.addEventListener('click', () => {
        try { audio.playDispatchSuccess(); } catch (_) {}
        if (this.selectedIncident) {
          this.selectedIncident.status = 'dispatched';
          this.renderStatsAndMetrics();
          this.renderIncidentList();
          this.showToast(`🚀 [1999 自動派工] ${this.selectedIncident.id} 已正式派發至主管局處！`);
        }
        this.closeModal();
      });
    }

    const btnLaplace = document.getElementById('btn-laplace-box');
    if (btnLaplace) {
      btnLaplace.addEventListener('click', () => this.openLaplaceModal());
    }

    const laplaceCloseIds = ['laplace-close', 'laplace-close-btn', 'laplace-dismiss-btn', 'laplace-backdrop'];
    laplaceCloseIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('click', (e) => {
          e.preventDefault();
          try { audio.playClick(); } catch (_) {}
          this.closeLaplaceModal();
        });
      }
    });

    // Global ESC key to close any open modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeModal();
        this.closeLaplaceModal();
      }
    });

    const btnAwaken = document.getElementById('btn-awaken-psycho');
    if (btnAwaken) {
      btnAwaken.addEventListener('click', () => this.toggleAwakenMode());
    }

    // 11. Radar Canvas Mouse Interactions
    if (this.radarCanvas) {
      this.radarCanvas.addEventListener('mousemove', (e) => this.handleRadarMouseMove(e));
      this.radarCanvas.addEventListener('mouseleave', () => {
        this.hoveredPinIndex = -1;
        const popover = document.getElementById('map-pin-popover');
        if (popover) popover.classList.add('hidden');
      });
      this.radarCanvas.addEventListener('click', () => this.handleRadarClick());
    }
  }

  // Calculate & Refresh Data based on Date & Sector Filter
  applyFilterAndRefresh() {
    if (this.currentDate === 'range-7d') {
      this.activeIncidents = PRESET_INSPECTIONS.filter((item) => item.sectorKey === this.currentSectorKey);
    } else {
      this.activeIncidents = PRESET_INSPECTIONS.filter(
        (item) => item.date === this.currentDate && item.sectorKey === this.currentSectorKey
      );
    }

    if (this.activeIncidents.length === 0) {
      const fallback = PRESET_INSPECTIONS.filter((i) => i.sectorKey === this.currentSectorKey);
      this.activeIncidents = fallback.length > 0 ? fallback : [PRESET_INSPECTIONS[0]];
    }

    this.selectedIncident = this.activeIncidents[0] || null;

    this.renderStatsAndMetrics();
    this.renderIncidentList();
    if (this.selectedIncident) {
      this.updateTargetLockBox(this.selectedIncident);
    }

    if (this.currentView === 'analytics') {
      this.analytics.init(this.currentDate, this.getMergedIncidentsPool(), HISTORICAL_TREND_7D);
    }

    if (this.gis.map) {
      this.gis.update(this.currentSectorKey, this.activeIncidents, this.currentFilter);
    }
  }

  getMergedIncidentsPool() {
    const activeMap = new Map();
    (this.activeIncidents || []).forEach((item) => activeMap.set(item.id, item));

    const merged = PRESET_INSPECTIONS.map((item) => activeMap.get(item.id) || item);
    (this.activeIncidents || []).forEach((item) => {
      if (!merged.some((m) => m.id === item.id)) {
        merged.push(item);
      }
    });
    return merged;
  }

  renderStatsAndMetrics() {
    const list = this.activeIncidents;

    const countTrash = list.filter((i) => i.category === 'trash').length;
    const countPavement = list.filter((i) => i.category === 'pavement').length;
    const countTree = list.filter((i) => i.category === 'tree').length;
    const countHygiene = list.filter((i) => i.category === 'hygiene').length;

    const elTrash = document.getElementById('stat-trash');
    const elPave = document.getElementById('stat-pavement');
    const elTree = document.getElementById('stat-tree');
    const elHyg = document.getElementById('stat-hygiene');
    if (elTrash) elTrash.textContent = countTrash;
    if (elPave) elPave.textContent = countPavement;
    if (elTree) elTree.textContent = countTree;
    if (elHyg) elHyg.textContent = countHygiene;

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
    const elDist = document.getElementById('telem-dist');
    const elFrames = document.getElementById('telem-frames');
    const elAnom = document.getElementById('telem-anomalies');
    const elConf = document.getElementById('telem-conf');
    if (elDist) elDist.textContent = sectorDistances[this.currentSectorKey] || '4.0 km';
    if (elFrames) elFrames.textContent = sectorFrames[this.currentSectorKey] || '3,600 F';
    if (elAnom) elAnom.textContent = `${list.length} 處`;
    if (elConf) elConf.textContent = '94.2%';

    const sectorTag = document.getElementById('rover-sector-tag');
    if (sectorTag) {
      sectorTag.textContent = this.currentSector.shortName || this.currentSector.name.split(' (')[0];
    }
    this.updateMapPinCount();
  }

  setFilter(filterKey) {
    this.currentFilter = filterKey;
    document.querySelectorAll('.filter-tab').forEach((t) => {
      t.classList.toggle('active', t.dataset.filter === filterKey);
    });
    document.querySelectorAll('#map-legend-bar .legend-item').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.category === filterKey);
    });
    this.renderIncidentList();
    this.updateMapPinCount();
    if (this.gis.map) {
      this.gis.update(this.currentSectorKey, this.activeIncidents, this.currentFilter);
    }
  }

  updateMapPinCount() {
    const list = this.activeIncidents;
    const filtered = list.filter((item) => {
      if (this.currentFilter === 'all') return true;
      return item.category === this.currentFilter;
    });
    const pinCountEl = document.getElementById('map-pin-count');
    if (pinCountEl) {
      pinCountEl.textContent = this.currentFilter === 'all'
        ? `${list.length} HOTSPOTS`
        : `${filtered.length}/${list.length} HOTSPOTS`;
    }
  }

  selectIncident(incident) {
    this.selectedIncident = incident;
    this.updateTargetLockBox(incident);
    this.renderIncidentList();
    if (this.gis.map && this.mapViewMode === 'osm' && incident && incident.coordinates) {
      this.gis.flyTo(incident.coordinates.lat, incident.coordinates.lng, 15);
    }
  }

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

  injectCustomIncident(categoryKey) {
    const templates = INCIDENT_TEMPLATES[categoryKey] || INCIDENT_TEMPLATES.trash;
    const template = templates[Math.floor(Math.random() * templates.length)];
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const ticketId = `TPE-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const latOffset = (Math.random() - 0.5) * (this.currentSector.deltaLat || 0.008);
    const lngOffset = (Math.random() - 0.5) * (this.currentSector.deltaLng || 0.006);
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
    if (this.gis.map) {
      this.gis.update(this.currentSectorKey, this.activeIncidents, this.currentFilter);
    }
    this.showToast(`🚨 新增測試案例：${newIncident.title.substring(0, 22)}...`);
  }

  renderIncidentList() {
    const container = document.getElementById('incident-list-container');
    const badge = document.getElementById('incident-count-badge');
    if (!container) return;

    const filtered = this.activeIncidents.filter((item) => {
      if (this.currentFilter === 'all') return true;
      return item.category === this.currentFilter;
    });

    if (badge) {
      badge.textContent = `${filtered.length} ISSUES`;
    }

    const countAllEl = document.getElementById('count-all');
    if (countAllEl) countAllEl.textContent = this.activeIncidents.length;
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

  handleRadarMouseMove(e) {
    if (this.mapViewMode === 'osm') return;
    if (!this.radarCanvas || this.activeIncidents.length === 0) return;
    const rect = this.radarCanvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (this.radarCanvas.width / rect.width);
    const my = (e.clientY - rect.top) * (this.radarCanvas.height / rect.height);
    const w = this.radarCanvas.width;
    const h = this.radarCanvas.height;

    let foundIdx = -1;
    this.activeIncidents.forEach((item, idx) => {
      const t = item.routeT !== undefined ? item.routeT : ((idx * 0.18 + 0.12) % 0.88);
      const pt = getRoutePoint(this.currentSectorKey, t, w, h);
      const dist = Math.hypot(mx - pt.x, my - pt.y);
      if (dist < 15) {
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
        const deptEl = document.getElementById('pop-dept');
        if (deptEl) deptEl.textContent = `權責：${item.department || '台北市政府'}`;
        document.getElementById('pop-title').textContent = item.title;
        document.getElementById('pop-meta').textContent = `🎬 錄影時標 ${item.time || '11:24'} · 影格 ${item.frameId || '#01842'} · 里程 ${item.mileage || '0K+850'} · 置信度 ${item.confidence || '95%'}`;
      }
    } else {
      this.radarCanvas.style.cursor = 'default';
      if (popover) popover.classList.add('hidden');
    }
  }

  handleRadarClick() {
    if (this.hoveredPinIndex >= 0 && this.activeIncidents[this.hoveredPinIndex]) {
      audio.init();
      audio.playLockOn();
      const item = this.activeIncidents[this.hoveredPinIndex];
      this.selectIncident(item);
      this.showToast(`🎯 已鎖定路線異常點：${item.title.substring(0, 20)}...`);
    }
  }

  setMapMode(mode) {
    this.mapViewMode = mode;
    const btnRadar = document.getElementById('btn-mode-radar');
    const btnOsm = document.getElementById('btn-mode-osm');
    const radarCanvas = document.getElementById('radarCanvas');
    const osmContainer = document.getElementById('osmMapContainer');
    const radarCross = document.getElementById('radar-cross');
    const pinPopover = document.getElementById('map-pin-popover');

    try {
      try { audio.playClick(); } catch (_) {}
      if (mode === 'osm') {
        if (btnRadar) btnRadar.classList.remove('active');
        if (btnOsm) btnOsm.classList.add('active');
        if (radarCanvas) radarCanvas.style.display = 'none';
        if (radarCross) radarCross.style.display = 'none';
        if (pinPopover) pinPopover.classList.add('hidden');
        if (osmContainer) osmContainer.classList.remove('hidden');

        if (!this.gis.map) {
          this.gis.init(
            'osmMapContainer',
            this.currentSector.center.lat,
            this.currentSector.center.lng,
            (inc) => {
              audio.playClick();
              this.selectIncident(inc);
            },
            (id) => this.selectIncidentAndInspect(id)
          );
        }

        setTimeout(() => {
          if (this.gis.map) {
            this.gis.invalidateSize();
            this.gis.update(this.currentSectorKey, this.activeIncidents, this.currentFilter);
          }
        }, 80);

        this.showToast('🗺️ [SYS-01] 切換至實景遙測圖資 (GEO TERRAIN: ESRI DARK)');
      } else {
        if (btnRadar) btnRadar.classList.add('active');
        if (btnOsm) btnOsm.classList.remove('active');
        if (radarCanvas) radarCanvas.style.display = 'block';
        if (radarCross) radarCross.style.display = 'block';
        if (osmContainer) osmContainer.classList.add('hidden');
        this.showToast('🛰️ [SYS-01] 切換至戰術動態幾何雷達 (NT-D VECTOR RADAR)');
      }
    } catch (err) {
      console.error('Error in setMapMode:', err);
    }
  }

  selectIncidentAndInspect(id) {
    const inc = this.activeIncidents.find((i) => i.id === id);
    if (inc) {
      this.selectIncident(inc);
      this.openModal(inc);
    }
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
    
    const photoMap = {
      trash: 'assets/evidence/trash_overflow.jpg',
      pavement: 'assets/evidence/pavement_crack.jpg',
      tree: 'assets/evidence/fallen_tree.jpg',
      hygiene: 'assets/evidence/hygiene_deadzone.jpg'
    };
    const realPhotoSrc = incident.evidencePhoto || photoMap[incident.category];
    const snapshotEl = document.getElementById('modal-snapshot-img');
    if (snapshotEl) {
      snapshotEl.src = realPhotoSrc || generateSnapshotSvg(incident.category, incident.title, incident.coordinates);
    }

    modal.classList.add('show');
  }

  closeModal() {
    const modal = document.getElementById('ticket-modal');
    if (modal) modal.classList.remove('show');
  }

  // Laplace's Box Easter Egg
  openLaplaceModal() {
    audio.playLaplaceChime();
    const modal = document.getElementById('laplace-modal');
    if (modal) modal.classList.add('show');
  }

  closeLaplaceModal() {
    const modal = document.getElementById('laplace-modal');
    if (modal) modal.classList.remove('show');
  }

  toggleAwakenMode() {
    this.isAwakened = !this.isAwakened;
    document.body.classList.toggle('awaken-mode', this.isAwakened);
    audio.playLaplaceChime();
    this.updateFavicon(this.isAwakened);

    const awakenBtnText = document.getElementById('awaken-btn-text');
    const resonanceVal = document.getElementById('resonance-val');
    const resonanceBar = document.getElementById('resonance-meter-bar');

    if (this.isAwakened) {
      if (awakenBtnText) awakenBtnText.textContent = '🚨 切換回 NT-D 毀滅模式 (RED OVERDRIVE)';
      if (resonanceVal) resonanceVal.textContent = '300% (AWAKEN)';
      if (resonanceBar) resonanceBar.style.width = '100%';
      this.showToast('🌟 精神感應框共鳴率突破 300%！全系統進入【覺醒綠光新人類模式】！');
    } else {
      if (awakenBtnText) awakenBtnText.textContent = '🌟 觸發精神感應狂潮 // 覺醒綠光新人類模式';
      if (resonanceVal) resonanceVal.textContent = '95%';
      if (resonanceBar) resonanceBar.style.width = '94%';
      this.showToast('⚡ 系統已切回 NT-D 紅色毀滅模式');
    }
  }

  updateFavicon(isAwakened) {
    const strokeColor = isAwakened ? '%2300ffcc' : '%2300f3ff';
    const c0 = isAwakened ? '%23e0fffa' : '%23e0faff';
    const c1 = isAwakened ? '%2334d399' : '%2367e8f9';
    const c2 = isAwakened ? '%2300ffcc' : '%2300f3ff';
    const c3 = isAwakened ? '%23059669' : '%230284c7';
    const unicornPath = 'M 9.6 6 L 24.3 19.5 L 24.7 18.3 L 23.5 14.3 L 23.5 10 L 24.3 12.7 L 29 17.5 L 38.2 19.9 L 44.1 23.5 L 46.1 25.8 L 51.3 35.4 L 55.6 48.1 L 55.6 48.9 L 53.2 50.1 L 52.4 51.3 L 46.1 54.4 L 41.3 56.4 L 34.6 58 L 28.2 57.6 L 23.9 56 L 19.9 53.6 L 19.5 53.2 L 21.1 49.3 L 28.2 38.9 L 28.6 37 L 27 36.6 L 23.1 38.2 L 19.9 40.5 L 17.5 41.3 L 14.7 44.1 L 12.4 43.7 L 9.2 41.7 L 8.4 38.9 L 8.8 36.2 L 17.5 28.6 L 21.1 23.1 L 9.6 6.4 Z';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"><defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="%23080e1a"/><stop offset="100%" stop-color="%23020408"/></linearGradient><linearGradient id="unicornGrad" x1="0.2" y1="0" x2="0.8" y2="1"><stop offset="0%" stop-color="${c0}"/><stop offset="30%" stop-color="${c1}"/><stop offset="70%" stop-color="${c2}"/><stop offset="100%" stop-color="${c3}"/></linearGradient></defs><rect x="2" y="2" width="60" height="60" rx="14" fill="url(%23bg)" stroke="%23162032" stroke-width="1.5"/><rect x="5" y="5" width="54" height="54" rx="11" fill="none" stroke="${strokeColor}" stroke-width="0.8" opacity="0.35"/><path d="${unicornPath}" fill="url(%23unicornGrad)"/></svg>`;
    const dataUri = `data:image/svg+xml;utf8,${svg}`;
    const link = document.querySelector("link[rel*='icon']");
    if (link) {
      link.href = dataUri;
    }
  }

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

  copyJsonClipboard() {
    const jsonStr = JSON.stringify(this.activeIncidents, null, 2);
    navigator.clipboard.writeText(jsonStr).then(() => {
      this.showToast('📋 patrol_data.json 已複製到剪貼簿！');
    }).catch(() => {
      this.showToast('複製失敗，請手動匯出');
    });
  }

  // Audio & Mute Management
  toggleMasterMute() {
    this.setMasterMute(!this.isMuted);
  }

  setMasterMute(mute) {
    this.isMuted = mute;
    audio.enabled = !mute;

    if (this.bgm) {
      this.bgm.muted = mute;
      if (mute) {
        this.bgm.pause();
      } else {
        this.playBgm();
      }
    }

    this.updateMuteUi();
    this.showToast(mute ? '🔇 全系統已靜音 (BGM 與音效已關閉)' : '🔊 系統聲音已恢復');
  }

  updateMuteUi() {
    const sfxIcon = document.getElementById('sfx-icon');
    const btnAudioControl = document.getElementById('btn-audio-control');
    if (sfxIcon) {
      sfxIcon.textContent = this.isMuted ? '🔇' : '🔊';
    }
    if (btnAudioControl) {
      btnAudioControl.classList.toggle('muted', this.isMuted);
      btnAudioControl.title = this.isMuted ? '全系統已靜音 (點擊開啟聲音)' : '全系統靜音 / 聲音開關 (點擊靜音)';
    }

    const soundIcon = document.getElementById('sound-icon');
    const soundText = document.getElementById('sound-text');
    const btnToggleSound = document.getElementById('btn-toggle-sound');
    if (soundIcon) soundIcon.textContent = this.isMuted ? '🔇' : '🔊';
    if (soundText) soundText.textContent = this.isMuted ? 'SOUND: OFF' : 'SOUND FX: ON';
    if (btnToggleSound) btnToggleSound.classList.toggle('muted', this.isMuted);

    if (this.isMuted) {
      this.updateBgmUi(false);
    }
  }

  playBgm() {
    if (!this.bgm || this.isMuted) return;
    this.bgm.muted = false;
    const playPromise = this.bgm.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        this.bgmPlaying = true;
        this.updateBgmUi(true);
      }).catch((err) => {
        console.log('Autoplay deferred:', err);
      });
    }
  }

  pauseBgm() {
    if (!this.bgm) return;
    this.bgm.pause();
    this.bgmPlaying = false;
    this.updateBgmUi(false);
  }

  toggleBgm() {
    const isPlaying = this.bgm && !this.bgm.paused;
    if (isPlaying) {
      this.pauseBgm();
      this.showToast('🔇 BGM 已暫停');
    } else {
      if (this.isMuted) {
        this.setMasterMute(false);
      } else {
        this.playBgm();
      }
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

  // NT-D Boot Screen Lifecycle
  initBootScreen() {
    this.isNtdIgnited = false;
  }

  igniteNtdSequence() {
    if (this.isNtdIgnited) return;
    this.isNtdIgnited = true;

    audio.init();
    if (!this.isMuted) {
      audio.playNtdEngage();
      this.playBgm();
    }

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
    if (!this.isMuted && (!this.bgm || this.bgm.paused)) {
      this.playBgm();
    }
  }

  triggerBootScreen() {
    const bootScreen = document.getElementById('ntd-boot-screen');
    if (!bootScreen) return;
    this.isNtdIgnited = false;
    bootScreen.classList.remove('fade-out', 'ntd-ignited', 'screen-shake');
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
      this.analytics.init(this.currentDate, this.getMergedIncidentsPool(), HISTORICAL_TREND_7D);
      this.showToast('📊 已切換至：市政物件統計與工務局解決進度戰報');
    } else {
      if (analyticsView) analyticsView.classList.add('hidden');
      if (tacticalGrid) tacticalGrid.classList.remove('hidden');
      this.showToast('🎯 已切換至：戰術巡檢地圖與 1999 派工清單');
    }
  }
}

// Auto-bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  new TaipeiDebuggerApp();
});
