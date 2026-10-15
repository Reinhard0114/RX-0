/**
 * RX-0 TAIPEI DEBUGGER // CANVAS ANIMATION SUBSYSTEMS
 * High-performance 60fps renderers for Radar, AI Camera Feed & NT-D Flame Loops
 */

import { SECTOR_ROUTES, getRoutePoint } from './routes.js';

export class RadarRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas ? canvas.getContext('2d') : null;
    this.animId = null;
  }

  start(getState) {
    if (!this.ctx) return;

    const render = () => {
      const state = getState();
      const ctx = this.ctx;
      const w = this.canvas.width;
      const h = this.canvas.height;
      const currentSectorKey = state.currentSectorKey || 'dadaocheng';
      const activeIncidents = state.activeIncidents || [];
      const currentFilter = state.currentFilter || 'all';
      const hoveredPinIndex = state.hoveredPinIndex;
      const selectedIncident = state.selectedIncident;

      // 1. Dark background
      ctx.fillStyle = '#06080d';
      ctx.fillRect(0, 0, w, h);

      // 2. Cyber Coordinate Grid
      ctx.strokeStyle = 'rgba(255, 0, 60, 0.08)';
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

      // 3. Sector-Specific River Water Body
      const config = SECTOR_ROUTES[currentSectorKey] || SECTOR_ROUTES.dadaocheng;
      const r = config.river;
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(0, 243, 255, 0.28)';
      ctx.lineWidth = 22;
      ctx.lineCap = 'round';
      ctx.moveTo(r.p0.x * w, r.p0.y * h);
      ctx.bezierCurveTo(r.p1.x * w, r.p1.y * h, r.p2.x * w, r.p2.y * h, r.p3.x * w, r.p3.y * h);
      ctx.stroke();

      // Flowing water ripple stream line
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(0, 243, 255, 0.55)';
      ctx.lineWidth = 2;
      ctx.setLineDash([12, 10]);
      ctx.lineDashOffset = -(Date.now() * 0.02) % 22;
      ctx.moveTo(r.p0.x * w, r.p0.y * h);
      ctx.bezierCurveTo(r.p1.x * w, r.p1.y * h, r.p2.x * w, r.p2.y * h, r.p3.x * w, r.p3.y * h);
      ctx.stroke();
      ctx.setLineDash([]);

      // 4. Segmented Health-Trace Quality Trajectory Line
      const numSegments = 32;
      for (let s = 0; s < numSegments; s++) {
        const tStart = s / numSegments;
        const tEnd = (s + 1) / numSegments;
        const ptA = getRoutePoint(currentSectorKey, tStart, w, h);
        const ptB = getRoutePoint(currentSectorKey, tEnd, w, h);

        const midT = (tStart + tEnd) / 2;
        const nearby = activeIncidents.filter(
          (inc) => Math.abs((inc.routeT !== undefined ? inc.routeT : 0.5) - midT) < 0.06
        );

        let strokeColor = 'rgba(0, 243, 255, 0.65)';
        let lineW = 3;
        let glow = 0;

        if (nearby.some((i) => i.severity === 'high')) {
          strokeColor = 'rgba(255, 0, 60, 0.95)';
          lineW = 4.5;
          glow = 10;
        } else if (nearby.length > 0) {
          strokeColor = 'rgba(255, 159, 28, 0.9)';
          lineW = 3.8;
          glow = 6;
        }

        ctx.beginPath();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = lineW;
        if (glow > 0) {
          ctx.shadowColor = strokeColor;
          ctx.shadowBlur = glow;
        }
        ctx.moveTo(ptA.x, ptA.y);
        ctx.lineTo(ptB.x, ptB.y);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // 5. Start Waypoint & Finish Waypoint Badges
      const startPt = getRoutePoint(currentSectorKey, 0.02, w, h);
      ctx.fillStyle = '#10b981';
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(startPt.x, startPt.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.font = 'bold 8px "Share Tech Mono", monospace';
      ctx.fillStyle = '#10b981';
      ctx.fillText('▶ START K0.0', startPt.x + 6, startPt.y + 3);

      const finishPt = getRoutePoint(currentSectorKey, 0.98, w, h);
      ctx.fillStyle = '#00f3ff';
      ctx.shadowColor = '#00f3ff';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.rect(finishPt.x - 3, finishPt.y - 3, 6, 6);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.font = 'bold 8px "Share Tech Mono", monospace';
      ctx.fillStyle = '#00f3ff';
      ctx.fillText('■ FINISH', finishPt.x - 42, finishPt.y + 3);

      // 6. Waterfront Landmark Tags along Route
      if (config.landmarks) {
        config.landmarks.forEach((lm) => {
          if (lm.t > 0.1 && lm.t < 0.9) {
            const pt = getRoutePoint(currentSectorKey, lm.t, w, h);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(pt.x, pt.y - 4);
            ctx.lineTo(pt.x, pt.y + 4);
            ctx.stroke();

            ctx.font = '8px "Noto Sans TC", sans-serif';
            ctx.fillStyle = 'rgba(203, 213, 225, 0.65)';
            ctx.fillText(`⌖ ${lm.label}`, pt.x - 14, pt.y - 8);
          }
        });
      }

      // 7. Draw Incident Pins along Path
      const catColors = {
        trash: '#ff003c',
        pavement: '#ff9f1c',
        tree: '#2ec4b6',
        hygiene: '#b5179e'
      };

      activeIncidents.forEach((item, index) => {
        const t = item.routeT !== undefined ? item.routeT : ((index * 0.18 + 0.12) % 0.88);
        const pt = getRoutePoint(currentSectorKey, t, w, h);
        const px = pt.x;
        const py = pt.y;

        const isHovered = hoveredPinIndex === index;
        const isSelected = selectedIncident && selectedIncident.id === item.id;
        const isFilteredOut = currentFilter !== 'all' && item.category !== currentFilter;
        const color = catColors[item.category] || '#ff003c';

        ctx.save();
        if (isFilteredOut) {
          ctx.globalAlpha = 0.22;
        }

        const isHigh = item.severity === 'high';
        const pulseSpeed = isHigh ? 0.007 : 0.004;
        const pulse = Math.sin(Date.now() * pulseSpeed + index) * (isHigh ? 4 : 2.5) + (isSelected ? 7 : 5);

        ctx.strokeStyle = color;
        ctx.lineWidth = isSelected ? 2.5 : 1.5;
        ctx.beginPath();
        ctx.arc(px, py, pulse + (isSelected ? 6 : 4), 0, Math.PI * 2);
        ctx.stroke();

        if (isHigh && !isFilteredOut) {
          ctx.strokeStyle = 'rgba(255, 0, 60, 0.35)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(px, py, pulse + 8, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = (isSelected || isHovered) ? 16 : 8;
        ctx.beginPath();
        ctx.arc(px, py, isSelected ? 6.5 : (isHovered ? 5.5 : 4), 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        if (isSelected || isHovered) {
          const tagText = `[${item.id}] ${item.frameId || ''} (${item.mileage || ''})`;
          ctx.font = 'bold 9px "Share Tech Mono", monospace';
          const textWidth = ctx.measureText(tagText).width;

          ctx.fillStyle = 'rgba(5, 7, 12, 0.94)';
          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(px - textWidth / 2 - 5, py - 26, textWidth + 10, 15, 2);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.fillText(tagText, px - textWidth / 2, py - 15);

          ctx.beginPath();
          ctx.moveTo(px, py - 11);
          ctx.lineTo(px, py - 5);
          ctx.strokeStyle = color;
          ctx.stroke();
        }

        ctx.restore();
      });

      this.animId = requestAnimationFrame(render);
    };

    render();
  }
}

export class CameraRenderer {
  constructor(canvas, evidenceImages) {
    this.canvas = canvas;
    this.ctx = canvas ? canvas.getContext('2d') : null;
    this.evidenceImages = evidenceImages || {};
    this.animId = null;
  }

  start(getState) {
    if (!this.ctx) return;

    let frame = 0;
    const render = () => {
      frame++;
      const state = getState();
      const ctx = this.ctx;
      const w = this.canvas.width;
      const h = this.canvas.height;

      const activeItem = state.selectedIncident || (state.activeIncidents && state.activeIncidents[0]);
      const targetCategory = activeItem ? activeItem.category : 'trash';
      const realImg = this.evidenceImages[targetCategory];
      const isPhotoReady = realImg && realImg.complete && realImg.naturalWidth > 0;

      if (isPhotoReady) {
        ctx.drawImage(realImg, 0, 0, w, h);

        ctx.fillStyle = 'rgba(10, 15, 25, 0.22)';
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
        for (let y = 0; y < h; y += 4) {
          ctx.fillRect(0, y, w, 1.5);
        }

        let bx, by, bw, bh;
        if (targetCategory === 'trash') {
          bx = w * 0.44; by = h * 0.35; bw = 145; bh = 175;
        } else if (targetCategory === 'pavement') {
          bx = w * 0.34; by = h * 0.52; bw = 210; bh = 120;
        } else if (targetCategory === 'tree') {
          bx = w * 0.24; by = h * 0.26; bw = 260; bh = 170;
        } else {
          bx = w * 0.35; by = h * 0.42; bw = 190; bh = 150;
        }

        const boxColor = targetCategory === 'trash' ? '#ff003c' : (targetCategory === 'pavement' ? '#ff9f1c' : (targetCategory === 'tree' ? '#2ec4b6' : '#b5179e'));
        
        ctx.save();
        ctx.strokeStyle = boxColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(bx, by, bw, bh);

        ctx.fillStyle = boxColor;
        const cornerLen = 14;
        const thick = 3;
        ctx.fillRect(bx, by, cornerLen, thick);
        ctx.fillRect(bx, by, thick, cornerLen);
        ctx.fillRect(bx + bw - cornerLen, by, cornerLen, thick);
        ctx.fillRect(bx + bw - thick, by, thick, cornerLen);
        ctx.fillRect(bx, by + bh - thick, cornerLen, thick);
        ctx.fillRect(bx, by + bh - cornerLen, thick, cornerLen);
        ctx.fillRect(bx + bw - cornerLen, by + bh - thick, cornerLen, thick);
        ctx.fillRect(bx + bw - thick, by + bh - cornerLen, thick, cornerLen);

        ctx.fillStyle = boxColor;
        ctx.fillRect(bx, by - 19, bw, 19);
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 10px "Share Tech Mono", monospace';
        const labelText = activeItem ? `${activeItem.categoryName || targetCategory} [${activeItem.confidence || '95.2%'}]` : `AI LOCK [95%]`;
        ctx.fillText(labelText.substring(0, 24), bx + 4, by - 5);
        ctx.restore();

      } else {
        // Fallback: Cyber Twilight Skyline Vector Scene
        const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.58);
        skyGrad.addColorStop(0, '#0a0d18');
        skyGrad.addColorStop(0.5, '#1e0c24');
        skyGrad.addColorStop(1, '#52132b');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, w, h * 0.58);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        for (let i = 0; i < 15; i++) {
          const sx = (i * 43) % w;
          const sy = (i * 23) % (h * 0.4);
          ctx.fillRect(sx, sy, 1.5, 1.5);
        }

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
        ctx.lineTo(250, h * 0.54);
        ctx.lineTo(255, h * 0.28);
        ctx.lineTo(258, h * 0.18);
        ctx.lineTo(262, h * 0.54);
        ctx.lineTo(320, h * 0.54);
        ctx.lineTo(380, h * 0.36);
        ctx.lineTo(440, h * 0.54);
        ctx.lineTo(w, h * 0.54);
        ctx.lineTo(w, h * 0.58);
        ctx.fill();

        const riverGrad = ctx.createLinearGradient(0, h * 0.58, 0, h);
        riverGrad.addColorStop(0, '#0c1a2e');
        riverGrad.addColorStop(1, '#050c18');
        ctx.fillStyle = riverGrad;
        ctx.fillRect(0, h * 0.58, w * 0.36, h * 0.42);

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

        ctx.save();
        ctx.translate(w * 0.62, h * 0.76);
        const boxColor = targetCategory === 'trash' ? '#ff003c' : (targetCategory === 'pavement' ? '#ff9f1c' : (targetCategory === 'tree' ? '#2ec4b6' : '#b5179e'));
        ctx.strokeStyle = boxColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(-55, -95, 110, 125);
        ctx.restore();
      }

      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.font = '9px "Share Tech Mono", monospace';
      ctx.fillText('OFFLINE AI KEYFRAME INSPECTOR // TAIPEI CIVIC DEBUGGER', 12, h - 12);

      this.animId = requestAnimationFrame(render);
    };

    render();
  }
}

export class FlameRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas ? canvas.getContext('2d') : null;
    this.particles = [];
    this.animId = null;

    if (canvas) {
      for (let i = 0; i < 55; i++) {
        this.particles.push({
          x: Math.random() * 860,
          y: Math.random() * 420,
          speedY: 1.8 + Math.random() * 4.2,
          speedX: (Math.random() - 0.5) * 2.2,
          size: 1.8 + Math.random() * 3.5,
          hue: Math.random() > 0.45 ? 285 : 340,
          alpha: 0.35 + Math.random() * 0.65
        });
      }
    }
  }

  start(getState) {
    if (!this.ctx) return;

    let frame = 0;
    const render = () => {
      frame++;
      const state = getState();
      const ctx = this.ctx;
      const w = this.canvas.width;
      const h = this.canvas.height;
      const isIgnited = state.isNtdIgnited;
      const isAwakened = state.isAwakened;

      ctx.clearRect(0, 0, w, h);

      // Equalizer Spectrum Flame Bars
      const numBars = 64;
      const barWidth = w / numBars;

      for (let i = 0; i < numBars; i++) {
        const wave1 = Math.sin(frame * 0.04 + i * 0.22);
        const wave2 = Math.cos(frame * 0.08 + i * 0.15);
        const wave3 = Math.sin(frame * 0.12 + i * 0.38);

        const intensity = (wave1 + wave2 + wave3 + 3) / 6;
        const multiplier = isIgnited ? 0.95 : 0.35;
        const barHeight = Math.max(8, intensity * h * multiplier);
        const x = i * barWidth;
        const y = (h - barHeight) / 2;

        const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
        if (isAwakened) {
          grad.addColorStop(0, 'rgba(0, 255, 204, 0.08)');
          grad.addColorStop(0.25, 'rgba(52, 211, 153, 0.85)');
          grad.addColorStop(0.5, 'rgba(0, 255, 204, 0.98)');
          grad.addColorStop(0.75, 'rgba(16, 185, 129, 0.88)');
          grad.addColorStop(1, 'rgba(6, 78, 59, 0.08)');
        } else if (isIgnited) {
          grad.addColorStop(0, 'rgba(168, 85, 247, 0.08)');
          grad.addColorStop(0.25, 'rgba(217, 70, 239, 0.85)');
          grad.addColorStop(0.5, 'rgba(255, 0, 85, 0.98)');
          grad.addColorStop(0.75, 'rgba(147, 51, 234, 0.88)');
          grad.addColorStop(1, 'rgba(107, 33, 168, 0.08)');
        } else {
          grad.addColorStop(0, 'rgba(147, 51, 234, 0.04)');
          grad.addColorStop(0.5, 'rgba(192, 38, 211, 0.35)');
          grad.addColorStop(1, 'rgba(88, 28, 135, 0.04)');
        }

        ctx.fillStyle = grad;
        ctx.fillRect(x, y, barWidth - 1, barHeight);

        if (isIgnited && Math.random() > 0.80) {
          ctx.fillStyle = '#00f3ff';
          ctx.fillRect(x, y + Math.random() * barHeight, 2, 5);
        }
      }

      // Rising Energy Embers / Purple Fire Particles
      if (isIgnited) {
        this.particles.forEach((p) => {
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

      this.animId = requestAnimationFrame(render);
    };

    render();
  }
}
