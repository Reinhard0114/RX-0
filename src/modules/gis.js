/**
 * RX-0 TAIPEI DEBUGGER // GIS SUBSYSTEM
 * OpenStreetMap & ESRI World Dark Gray Canvas with Leaflet.js
 */

import { SECTOR_TRACKS } from './routes.js';

export class GisMapController {
  constructor() {
    this.map = null;
    this.markers = [];
    this.routeLine = null;
    this.onMarkerClick = null;
    this.onInspectClick = null;
  }

  init(containerId, centerLat, centerLng, onMarkerClick, onInspectClick) {
    if (typeof L === 'undefined') {
      console.warn('Leaflet library not loaded.');
      return false;
    }
    const container = document.getElementById(containerId);
    if (!container) return false;

    this.onMarkerClick = onMarkerClick;
    this.onInspectClick = onInspectClick;

    try {
      this.map = L.map(containerId, {
        center: [centerLat, centerLng],
        zoom: 14,
        zoomControl: true,
        attributionControl: true
      });

      // ESRI World Dark Gray Base (Dark sci-fi background, no watermark, no API key needed)
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy; <a href="https://www.esri.com/" target="_blank">Esri</a> &mdash; Esri, DeLorme, NAVTEQ',
        maxNativeZoom: 16,
        maxZoom: 19
      }).addTo(this.map);

      // ESRI World Dark Gray Reference (Labels & Road overlay)
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
        attribution: '',
        maxNativeZoom: 16,
        maxZoom: 19
      }).addTo(this.map);

      return true;
    } catch (err) {
      console.error('Leaflet init error:', err);
      return false;
    }
  }

  flyTo(lat, lng, zoom = 14) {
    if (this.map) {
      this.map.flyTo([lat, lng], zoom, { duration: 1.2 });
    }
  }

  invalidateSize() {
    if (this.map) {
      this.map.invalidateSize();
    }
  }

  update(sectorKey, incidents, currentFilter = 'all') {
    if (!this.map) return;

    try {
      // 1. Clear existing markers
      this.markers.forEach((m) => m.remove());
      this.markers = [];

      // 2. Draw or Update River Track Polyline
      const tracks = SECTOR_TRACKS[sectorKey] || SECTOR_TRACKS.dadaocheng;
      if (this.routeLine) {
        this.routeLine.setLatLngs(tracks);
      } else {
        this.routeLine = L.polyline(tracks, {
          color: '#00f3ff',
          weight: 3.5,
          opacity: 0.85,
          dashArray: '8, 6',
          lineCap: 'round'
        }).addTo(this.map);
      }

      // 3. Render Incident Hotspot Markers
      const emojiMap = { trash: '🗑️', pavement: '⚠️', tree: '🌳', hygiene: '🐀' };
      const filteredList = incidents.filter((item) => {
        if (currentFilter === 'all') return true;
        return item.category === currentFilter;
      });

      filteredList.forEach((incident) => {
        const emoji = emojiMap[incident.category] || '⚠️';
        const customIcon = L.divIcon({
          className: `custom-osm-pin pin-${incident.category}`,
          html: `<div class="osm-pin-circle"><span class="osm-pin-emoji">${emoji}</span><div class="osm-pin-pulse"></div></div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
          popupAnchor: [0, -14]
        });

        const marker = L.marker([incident.coordinates.lat, incident.coordinates.lng], { icon: customIcon })
          .addTo(this.map);

        const popupHtml = `
          <div class="osm-popup-content">
            <div class="osm-pop-cat">[${incident.categoryName || '瑕疵檢測'}]</div>
            <div class="osm-pop-title">${incident.title}</div>
            <div class="osm-pop-meta">${incident.coordinates.lat.toFixed(4)}°N, ${incident.coordinates.lng.toFixed(4)}°E (${incident.mileage || ''})</div>
            <div class="osm-pop-badge">置信度: ${incident.confidence} | 嚴重度: ${incident.severity ? incident.severity.toUpperCase() : 'NORMAL'}</div>
            <button class="btn-osm-inspect" id="btn-inspect-${incident.id}">查看 AI 舉證與派工 ➔</button>
          </div>
        `;
        marker.bindPopup(popupHtml);

        marker.on('popupopen', () => {
          const btn = document.getElementById(`btn-inspect-${incident.id}`);
          if (btn && this.onInspectClick) {
            btn.onclick = () => this.onInspectClick(incident.id);
          }
        });

        marker.on('click', () => {
          if (this.onMarkerClick) {
            this.onMarkerClick(incident);
          }
        });

        this.markers.push(marker);
      });
    } catch (err) {
      console.error('GisMapController update error:', err);
    }
  }
}
