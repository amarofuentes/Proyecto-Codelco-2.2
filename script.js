const canvas = document.getElementById('costCanvas');
const ctx = canvas.getContext('2d');

const ids = {
  ctBase: document.getElementById('ctBase'),
  ctFall: document.getElementById('ctFall'),
  ccBase: document.getElementById('ccBase'),
  ccRise: document.getElementById('ccRise'),
  level: document.getElementById('level'),
  ctBaseVal: document.getElementById('ctBaseVal'),
  ctFallVal: document.getElementById('ctFallVal'),
  ccBaseVal: document.getElementById('ccBaseVal'),
  ccRiseVal: document.getElementById('ccRiseVal'),
  levelVal: document.getElementById('levelVal'),
  ctPoint: document.getElementById('ctPoint'),
  ccPoint: document.getElementById('ccPoint'),
  totalPoint: document.getElementById('totalPoint'),
  optimumPoint: document.getElementById('optimumPoint'),
  diagnosisText: document.getElementById('diagnosisText'),
  resetBtn: document.getElementById('resetBtn')
};

const defaults = {
  ctBase: 100,
  ctFall: 1.2,
  ccBase: 10,
  ccRise: 0.9,
  level: 50
};

function getParams() {
  return {
    ctBase: parseFloat(ids.ctBase.value),
    ctFall: parseFloat(ids.ctFall.value),
    ccBase: parseFloat(ids.ccBase.value),
    ccRise: parseFloat(ids.ccRise.value),
    level: parseFloat(ids.level.value)
  };
}

function transactionCost(x, p) {
  return Math.max(5, p.ctBase - p.ctFall * (x * 0.72) + 0.002 * Math.pow(x - 15, 2));
}

function coordinationCost(x, p) {
  return Math.max(0, p.ccBase + p.ccRise * (0.018 * Math.pow(x, 2) + 0.08 * x));
}

function totalCost(x, p) {
  return transactionCost(x, p) + coordinationCost(x, p);
}

function computeSeries(p) {
  const data = [];
  let minTotal = Infinity;
  let minX = 0;

  for (let x = 0; x <= 100; x += 1) {
    const ct = transactionCost(x, p);
    const cc = coordinationCost(x, p);
    const total = ct + cc;
    data.push({ x, ct, cc, total });
    if (total < minTotal) {
      minTotal = total;
      minX = x;
    }
  }
  return { data, minX, minTotal };
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawChart(series, p) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = (rect.width * 0.58) * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const W = rect.width;
  const H = rect.width * 0.58;
  ctx.clearRect(0, 0, W, H);

  const pad = { top: 28, right: 28, bottom: 62, left: 66 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top - pad.bottom;

  const maxY = Math.max(...series.data.map(d => Math.max(d.ct, d.cc, d.total))) * 1.15;
  const minY = 0;

  const xPos = x => pad.left + (x / 100) * chartW;
  const yPos = y => pad.top + chartH - ((y - minY) / (maxY - minY)) * chartH;

  // Chart panel
  drawRoundedRect(ctx, pad.left - 10, pad.top - 8, chartW + 20, chartH + 16, 18);
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.stroke();

  // Grid
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  ctx.font = '12px Inter';
  ctx.fillStyle = 'rgba(184,199,220,0.9)';

  for (let i = 0; i <= 5; i++) {
    const yVal = minY + (maxY - minY) * (i / 5);
    const y = yPos(yVal);
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(W - pad.right, y);
    ctx.stroke();
    ctx.fillText(yVal.toFixed(1), 18, y + 4);
  }

  for (let i = 0; i <= 5; i++) {
    const xVal = i * 20;
    const x = xPos(xVal);
    ctx.beginPath();
    ctx.moveTo(x, pad.top);
    ctx.lineTo(x, H - pad.bottom);
    ctx.stroke();
    ctx.fillText(xVal + '%', x - 10, H - 38);
  }

  ctx.fillStyle = 'rgba(236,244,255,0.85)';
  ctx.font = '13px Inter';
  ctx.fillText('Nivel de costo', 10, pad.top - 2);
  ctx.fillText('Grado de integración', W / 2 - 70, H - 10);

  function drawLine(key, color) {
    ctx.beginPath();
    series.data.forEach((d, i) => {
      const x = xPos(d.x);
      const y = yPos(d[key]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.shadowBlur = 18;
    ctx.shadowColor = color;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  drawLine('ct', '#37a2ff');
  drawLine('cc', '#ff6b6b');
  drawLine('total', '#3ddc97');

  const selectedX = p.level;
  const selected = series.data.find(d => d.x === selectedX);

  // optimum vertical
  const optX = xPos(series.minX);
  ctx.setLineDash([6, 6]);
  ctx.strokeStyle = '#f2c14e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(optX, pad.top);
  ctx.lineTo(optX, H - pad.bottom);
  ctx.stroke();
  ctx.setLineDash([]);

  // selected marker on all lines
  const points = [
    { y: yPos(selected.ct), color: '#37a2ff' },
    { y: yPos(selected.cc), color: '#ff6b6b' },
    { y: yPos(selected.total), color: '#3ddc97' }
  ];
  points.forEach(pt => {
    ctx.beginPath();
    ctx.arc(xPos(selectedX), pt.y, 5.5, 0, Math.PI * 2);
    ctx.fillStyle = pt.color;
    ctx.shadowBlur = 18;
    ctx.shadowColor = pt.color;
    ctx.fill();
    ctx.shadowBlur = 0;
  });

  // optimum point on total
  ctx.beginPath();
  ctx.arc(optX, yPos(series.minTotal), 6, 0, Math.PI * 2);
  ctx.fillStyle = '#f2c14e';
  ctx.shadowBlur = 18;
  ctx.shadowColor = '#f2c14e';
  ctx.fill();
  ctx.shadowBlur = 0;

  // selected vertical
  ctx.setLineDash([4,5]);
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.moveTo(xPos(selectedX), pad.top);
  ctx.lineTo(xPos(selectedX), H - pad.bottom);
  ctx.stroke();
  ctx.setLineDash([]);
}

function updateSummary(series, p) {
  const current = series.data.find(d => d.x === p.level);
  ids.ctPoint.textContent = current.ct.toFixed(1);
  ids.ccPoint.textContent = current.cc.toFixed(1);
  ids.totalPoint.textContent = current.total.toFixed(1);
  ids.optimumPoint.textContent = series.minX + '%';

  const diff = p.level - series.minX;
  let text = '';

  if (Math.abs(diff) <= 6) {
    text = 'Con los parámetros actuales, la empresa está cerca de su punto óptimo. El equilibrio entre usar el mercado y coordinar internamente es relativamente eficiente.';
  } else if (diff < -6) {
    text = 'Con los parámetros actuales, la empresa está subintegrada. Todavía depende demasiado del mercado, por lo que los costos de transacción siguen siendo altos.';
  } else {
    text = 'Con los parámetros actuales, la empresa está sobreintegrada. Ya está coordinando más actividades de las convenientes, por lo que los costos internos aumentan más rápido que el ahorro por dejar de usar el mercado.';
  }

  ids.diagnosisText.textContent = text;
}

function syncLabels(p) {
  ids.ctBaseVal.textContent = p.ctBase.toFixed(0);
  ids.ctFallVal.textContent = p.ctFall.toFixed(1);
  ids.ccBaseVal.textContent = p.ccBase.toFixed(0);
  ids.ccRiseVal.textContent = p.ccRise.toFixed(1);
  ids.levelVal.textContent = p.level.toFixed(0) + '%';
}

function render() {
  const p = getParams();
  syncLabels(p);
  const series = computeSeries(p);
  drawChart(series, p);
  updateSummary(series, p);
}

Object.values(ids).forEach(el => {
  if (el && el.tagName === 'INPUT') {
    el.addEventListener('input', render);
  }
});

ids.resetBtn.addEventListener('click', () => {
  ids.ctBase.value = defaults.ctBase;
  ids.ctFall.value = defaults.ctFall;
  ids.ccBase.value = defaults.ccBase;
  ids.ccRise.value = defaults.ccRise;
  ids.level.value = defaults.level;
  render();
});

window.addEventListener('resize', render);
render();
