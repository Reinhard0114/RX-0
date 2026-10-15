/**
 * RX-0 TAIPEI DEBUGGER // MUNICIPAL ANALYTICS (ECHARTS ENGINE)
 * War Room Visualizations for Civic Inspection Defect Distribution & Resolution
 */

export class MunicipalAnalytics {
  constructor() {
    this.instances = {};
    this.resizeBound = false;
  }

  init(currentDate, presetInspections) {
    if (typeof echarts === 'undefined') {
      console.warn('ECharts library not loaded.');
      return;
    }

    const pool = (currentDate === 'range-7d' || !currentDate)
      ? presetInspections
      : (presetInspections.filter((i) => i.date === currentDate) || presetInspections);

    const activePool = pool.length > 0 ? pool : presetInspections;

    this.renderCategoryDonut(activePool);
    this.renderResolveFunnel(activePool);
    this.renderSectorBar(activePool);
    this.renderTrendLine();

    if (!this.resizeBound) {
      window.addEventListener('resize', () => this.resizeAll());
      this.resizeBound = true;
    }
  }

  resizeAll() {
    Object.values(this.instances).forEach((inst) => {
      if (inst && typeof inst.resize === 'function') {
        inst.resize();
      }
    });
  }

  // Chart 1: Donut breakdown of defects
  renderCategoryDonut(pool) {
    const el = document.getElementById('chart-category-donut');
    if (!el) return;

    if (!this.instances.donut) {
      this.instances.donut = echarts.init(el, 'dark', { renderer: 'canvas' });
    }
    const chart = this.instances.donut;

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
  renderResolveFunnel(pool) {
    const el = document.getElementById('chart-resolve-funnel');
    if (!el) return;

    if (!this.instances.funnel) {
      this.instances.funnel = echarts.init(el, 'dark', { renderer: 'canvas' });
    }
    const chart = this.instances.funnel;

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
  renderSectorBar(pool) {
    const el = document.getElementById('chart-sector-bar');
    if (!el) return;

    if (!this.instances.bar) {
      this.instances.bar = echarts.init(el, 'dark', { renderer: 'canvas' });
    }
    const chart = this.instances.bar;

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
  renderTrendLine() {
    const el = document.getElementById('chart-trend-line');
    if (!el) return;

    if (!this.instances.line) {
      this.instances.line = echarts.init(el, 'dark', { renderer: 'canvas' });
    }
    const chart = this.instances.line;

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
}
