/**
 * RX-0 TAIPEI DEBUGGER // ROUTES & GIS DATA
 * River route geometries, bezier trajectory curves, and real-world GPS coordinates
 */

export const SECTOR_ROUTES = {
  dadaocheng: {
    river: {
      p0: { x: 0.12, y: 1.0 },
      p1: { x: 0.22, y: 0.65 },
      p2: { x: 0.48, y: 0.35 },
      p3: { x: 0.88, y: 0.15 }
    },
    pathOffset: -22,
    landmarks: [
      { t: 0.05, label: '5號疏散門 K0.0' },
      { t: 0.35, label: '大稻埕碼頭市集 K1.2' },
      { t: 0.68, label: '台北橋水門 K2.5' },
      { t: 0.95, label: '迪化跨堤台 K3.8' }
    ]
  },
  dajia: {
    river: {
      p0: { x: 0.0, y: 0.72 },
      p1: { x: 0.35, y: 0.86 },
      p2: { x: 0.65, y: 0.18 },
      p3: { x: 1.0, y: 0.30 }
    },
    pathOffset: -20,
    landmarks: [
      { t: 0.05, label: '大直橋下 K0.0' },
      { t: 0.38, label: '希望之泉 K1.5' },
      { t: 0.70, label: '8號疏散門 K2.9' },
      { t: 0.95, label: '濱江抽水站 K4.2' }
    ]
  },
  rainbow: {
    river: {
      p0: { x: 0.0, y: 0.38 },
      p1: { x: 0.32, y: 0.18 },
      p2: { x: 0.68, y: 0.82 },
      p3: { x: 1.0, y: 0.62 }
    },
    pathOffset: -22,
    landmarks: [
      { t: 0.05, label: '麥帥一橋 K0.0' },
      { t: 0.40, label: '彩虹光雕橋 K1.8' },
      { t: 0.72, label: '麥帥二橋 K3.4' },
      { t: 0.95, label: '成美長壽站 K5.1' }
    ]
  },
  guandu: {
    river: {
      p0: { x: 0.0, y: 0.82 },
      p1: { x: 0.38, y: 0.45 },
      p2: { x: 0.62, y: 0.58 },
      p3: { x: 1.0, y: 0.16 }
    },
    pathOffset: -22,
    landmarks: [
      { t: 0.05, label: '水鳥園入口 K0.0' },
      { t: 0.36, label: '紅樹林木棧道 K2.4' },
      { t: 0.68, label: '關渡大橋 K4.5' },
      { t: 0.95, label: '關渡水門哨 K6.5' }
    ]
  }
};

export const SECTOR_TRACKS = {
  dadaocheng: [
    [25.0450, 121.5020],
    [25.0490, 121.5042],
    [25.0535, 121.5065],
    [25.0569, 121.5078],
    [25.0620, 121.5108],
    [25.0675, 121.5122],
    [25.0730, 121.5140]
  ],
  dajia: [
    [25.0690, 121.5200],
    [25.0715, 121.5265],
    [25.0735, 121.5310],
    [25.0742, 121.5348],
    [25.0752, 121.5420],
    [25.0740, 121.5490],
    [25.0710, 121.5560]
  ],
  rainbow: [
    [25.0480, 121.5610],
    [25.0515, 121.5660],
    [25.0540, 121.5710],
    [25.0551, 121.5742],
    [25.0575, 121.5810],
    [25.0592, 121.5875],
    [25.0580, 121.5940]
  ],
  guandu: [
    [25.1120, 121.4560],
    [25.1160, 121.4610],
    [25.1195, 121.4650],
    [25.1225, 121.4682],
    [25.1265, 121.4728],
    [25.1305, 121.4775],
    [25.1340, 121.4830]
  ]
};

// Coordinate calculation along sector bezier trajectory
export function getRoutePoint(sectorKey, t, w, h) {
  const config = SECTOR_ROUTES[sectorKey] || SECTOR_ROUTES.dadaocheng;
  const r = config.river;
  const offset = config.pathOffset || -20;

  const p0 = { x: r.p0.x * w, y: r.p0.y * h + offset };
  const p1 = { x: r.p1.x * w, y: r.p1.y * h + offset };
  const p2 = { x: r.p2.x * w, y: r.p2.y * h + offset };
  const p3 = { x: r.p3.x * w, y: r.p3.y * h + offset };

  const cx = 3 * (p1.x - p0.x);
  const bx = 3 * (p2.x - p1.x) - cx;
  const ax = p3.x - p0.x - cx - bx;

  const cy = 3 * (p1.y - p0.y);
  const by = 3 * (p2.y - p1.y) - cy;
  const ay = p3.y - p0.y - cy - by;

  const x = ax * Math.pow(t, 3) + bx * Math.pow(t, 2) + cx * t + p0.x;
  const y = ay * Math.pow(t, 3) + by * Math.pow(t, 2) + cy * t + p0.y;

  return { x, y };
}
