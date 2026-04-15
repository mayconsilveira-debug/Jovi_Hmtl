const platformButtons = document.querySelectorAll('.platform-btn');
const kpiCards = document.getElementById('kpiCards');
const campaignTable = document.getElementById('campaignTable');
const insightsList = document.getElementById('insightsList');
const downloadBtn = document.getElementById('downloadBtn');
const fileInput = document.getElementById('fileInput');
const fileStatus = document.getElementById('fileStatus');
const periodButtons = document.querySelectorAll('.period-btn');
const startDateInput = document.getElementById('startDate');
const endDateInput = document.getElementById('endDate');

let rawData = [];
let activePlatform = 'all';
let activePeriod = null;
let revenueChart;
let performanceChart;
const pieCharts = [];

const fieldMap = {
  date: ['data', 'date', 'periodo', 'dia', 'timestamp'],
  platform: ['plataforma', 'platform', 'channel', 'midia', 'source', 'network', 'publisher_platform', 'publisher platform', 'advertising_channel_type', 'advertising channel type', 'advertising_channel_sub_type', 'advertising channel sub-type'],
  campaign: ['campanha', 'campaign', 'campaign_name', 'campaign name', 'nome_da_campanha'],
  impressions: ['impressoes', 'impressions', 'impression', 'imps'],
  clicks: ['cliques', 'clicks'],
  cost: ['custo', 'cost', 'spend', 'investimento', 'investment'],
  revenue: ['receita', 'revenue', 'faturamento', 'retorno'],
  conversions: ['conversoes', 'conversions', 'leads', 'vendas', 'sales'],
  videoViews: ['video_views', 'video views', 'views', 'video views', 'video views total', 'video views', 'video views 100%'],
  completeViews: ['complete_views', 'complete views', 'completeviews', 'complete_view', 'complete view', 'views_100', 'views 100%', 'thruplay actions', 'thruplay_actions'],
  frequency: ['frequencia', 'frequency', 'freq'],
  higherReach: ['higher_reach', 'higher reach', 'reach', 'alcance']
};

function normalizeHeader(value) {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/__+/g, '_');
}

function normalizePlatform(value) {
  const normalized = value.toString().trim().toLowerCase();
  if (!normalized) return '';
  if (normalized.includes('google')) return 'Google Ads';
  if (normalized.includes('meta') || normalized.includes('facebook') || normalized.includes('instagram')) return 'Meta Ads';
  if (normalized.includes('tiktok')) return 'TikTok Ads';
  return value.toString().trim();
}

function parseNumber(value) {
  if (value === undefined || value === null || value === '') return 0;
  const text = value.toString().trim().replace(/\./g, '').replace(/,/g, '.');
  const parsed = parseFloat(text.replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function extractField(row, names) {
  for (const name of names) {
    if (Object.prototype.hasOwnProperty.call(row, name)) {
      return row[name];
    }
  }
  return undefined;
}

function normalizeRow(row) {
  const normalized = {};
  Object.keys(row).forEach((key) => {
    normalized[normalizeHeader(key)] = row[key];
  });

  const rawDateValue = extractField(normalized, fieldMap.date) || '';
  const parsedDate = parseDate(rawDateValue);
  const rawPlatform = String(extractField(normalized, fieldMap.platform) || '').trim();

  return {
    date: parsedDate,
    platform: normalizePlatform(rawPlatform),
    campaign: String(extractField(normalized, fieldMap.campaign) || '').trim(),
    impressions: parseNumber(extractField(normalized, fieldMap.impressions)),
    clicks: parseNumber(extractField(normalized, fieldMap.clicks)),
    cost: parseNumber(extractField(normalized, fieldMap.cost)),
    revenue: parseNumber(extractField(normalized, fieldMap.revenue)),
    conversions: parseNumber(extractField(normalized, fieldMap.conversions)),
    videoViews: parseNumber(extractField(normalized, fieldMap.videoViews)),
    completeViews: parseNumber(extractField(normalized, fieldMap.completeViews)),
    frequency: parseNumber(extractField(normalized, fieldMap.frequency)),
    higherReach: parseNumber(extractField(normalized, fieldMap.higherReach))
  };
}

function normalizeRows(rows) {
  return rows
    .map(normalizeRow)
    .filter((item) => item.date && item.platform && item.campaign);
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) return [];

  const headers = lines.shift().split(/;|,|\t/).map(normalizeHeader);
  return lines.map((line) => {
    const values = line.split(/;|,|\t/);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ? values[index].trim() : '';
    });
    return row;
  });
}

function formatCurrency(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatPercent(value) {
  return `${(value * 100).toFixed(1).replace('.', ',')}%`;
}

function parseDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === 'number') return new Date(value);
  if (typeof value !== 'string' || !value.trim()) return null;

  const normalized = value.trim();
  const iso = normalized.replace(/\s+/g, 'T');
  const parsed = new Date(iso);
  if (!Number.isNaN(parsed.getTime())) return parsed;

  const parts = normalized.split(/[-\/\.]/).map((part) => part.replace(/^0+/, '') || '0');
  if (parts.length === 3) {
    const [a, b, c] = parts.map(Number);
    if (a > 31) return new Date(a, b - 1, c);
    return new Date(c, b - 1, a);
  }
  return null;
}

function formatAsDateValue(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDateRange(items) {
  if (!items.length) return { min: null, max: null };
  const dates = items
    .map((item) => item.date)
    .filter((date) => date instanceof Date && !Number.isNaN(date.getTime()));
  if (!dates.length) return { min: null, max: null };
  return {
    min: new Date(Math.min(...dates.map((date) => date.getTime()))),
    max: new Date(Math.max(...dates.map((date) => date.getTime())))
  };
}

function filterByDate(items) {
  const { min, max } = getDateRange(items);
  let start = null;
  let end = null;

  if (activePeriod && max) {
    end = new Date(max);
    switch (activePeriod) {
      case 'daily':
        start = new Date(end);
        break;
      case 'weekly':
        start = new Date(end);
        start.setDate(start.getDate() - 6);
        break;
      case 'monthly':
        start = new Date(end);
        start.setMonth(start.getMonth() - 1);
        break;
      default:
        break;
    }
  } else {
    start = parseDate(startDateInput.value);
    end = parseDate(endDateInput.value);
  }

  if (!start && !end) return items;
  if (start && !end) end = start;
  if (!start && end) start = end;

  const startTime = new Date(start).setHours(0, 0, 0, 0);
  const endTime = new Date(end).setHours(23, 59, 59, 999);

  return items.filter((item) => {
    if (!(item.date instanceof Date)) return false;
    const time = item.date.getTime();
    return time >= startTime && time <= endTime;
  });
}

function getFilteredRows(platform = 'all') {
  const filteredByPlatform = platform === 'all' ? rawData : rawData.filter((item) => item.platform === platform);
  return filterByDate(filteredByPlatform);
}

function clearPeriodSelection() {
  activePeriod = null;
  periodButtons.forEach((button) => button.classList.remove('active'));
}

function applyRangeToButtons() {
  if (activePeriod) {
    const { min, max } = getDateRange(rawData);
    if (!max) return;
    const end = max;
    let start = new Date(end);
    if (activePeriod === 'weekly') start.setDate(start.getDate() - 6);
    if (activePeriod === 'monthly') start.setMonth(start.getMonth() - 1);
    startDateInput.value = formatAsDateValue(start);
    endDateInput.value = formatAsDateValue(end);
    if (activePeriod === 'daily') startDateInput.value = formatAsDateValue(end);
  }
}

function aggregateData(platform = 'all') {
  const filtered = getFilteredRows(platform);
  const totals = filtered.reduce(
    (acc, item) => {
      acc.impressions += item.impressions;
      acc.clicks += item.clicks;
      acc.cost += item.cost;
      acc.revenue += item.revenue;
      acc.conversions += item.conversions;
      return acc;
    },
    { impressions: 0, clicks: 0, cost: 0, revenue: 0, conversions: 0 }
  );

  const ctr = totals.clicks / Math.max(totals.impressions, 1);
  const cpc = totals.cost / Math.max(totals.clicks, 1);
  const cpa = totals.cost / Math.max(totals.conversions, 1);
  const roas = totals.revenue / Math.max(totals.cost, 1);

  return { filtered, totals, ctr, cpc, cpa, roas };
}

function aggregateAdvancedData(platform = 'all') {
  const filtered = getFilteredRows(platform);
  const totals = filtered.reduce(
    (acc, item) => {
      acc.impressions += item.impressions;
      acc.clicks += item.clicks;
      acc.cost += item.cost;
      acc.revenue += item.revenue;
      acc.conversions += item.conversions;
      acc.videoViews += item.videoViews;
      acc.completeViews += item.completeViews;
      acc.frequencySum += item.frequency;
      acc.frequencyCount += item.frequency > 0 ? 1 : 0;
      acc.higherReach += item.higherReach;
      return acc;
    },
    { impressions: 0, clicks: 0, cost: 0, revenue: 0, conversions: 0, videoViews: 0, completeViews: 0, frequencySum: 0, frequencyCount: 0, higherReach: 0 }
  );

  const averageFrequency = totals.frequencyCount ? totals.frequencySum / totals.frequencyCount : 0;
  return {
    filtered,
    totals,
    totalVideoViews: totals.videoViews,
    totalCompleteViews: totals.completeViews,
    averageFrequency,
    totalHigherReach: totals.higherReach
  };
}

function groupByPlatform(platform = 'all') {
  const filtered = getFilteredRows(platform);
  const aggregated = filtered.reduce((acc, item) => {
    const key = item.platform || 'Desconhecido';
    if (!acc[key]) {
      acc[key] = { impressions: 0, clicks: 0, cost: 0, videoViews: 0, completeViews: 0, frequencySum: 0, frequencyCount: 0, higherReach: 0 };
    }
    acc[key].impressions += item.impressions;
    acc[key].clicks += item.clicks;
    acc[key].cost += item.cost;
    acc[key].videoViews += item.videoViews;
    acc[key].completeViews += item.completeViews;
    acc[key].frequencySum += item.frequency;
    acc[key].frequencyCount += item.frequency > 0 ? 1 : 0;
    acc[key].higherReach += item.higherReach;
    return acc;
  }, {});

  return Object.entries(aggregated).map(([platform, totals]) => ({
    platform,
    ...totals,
    cpm: totals.impressions ? totals.cost / (totals.impressions / 1000) : 0,
    cpv: totals.videoViews ? totals.cost / totals.videoViews : 0,
    vtr: totals.impressions ? totals.videoViews / totals.impressions : 0,
    completeViewRate: totals.videoViews ? totals.completeViews / totals.videoViews : 0,
    averageFrequency: totals.frequencyCount ? totals.frequencySum / totals.frequencyCount : 0
  }));
}

function ensureCharts() {
  if (revenueChart) revenueChart.destroy();
  if (performanceChart) performanceChart.destroy();
}

function renderKPIs() {
  const { totals, averageFrequency, totalVideoViews, totalCompleteViews, totalHigherReach } = aggregateAdvancedData(activePlatform);
  const cpm = totals.impressions ? totals.cost / (totals.impressions / 1000) : 0;
  const cpv = totalVideoViews ? totals.cost / totalVideoViews : 0;
  const vtr = totals.impressions ? totalVideoViews / totals.impressions : 0;
  const completeRate = totalVideoViews ? totalCompleteViews / totalVideoViews : 0;

  const cards = [
    { label: 'Investimento', value: formatCurrency(totals.cost) },
    { label: 'Impressões', value: totals.impressions.toLocaleString('pt-BR') },
    { label: 'CPM', value: formatCurrency(cpm) },
    { label: 'Video Views', value: totalVideoViews.toLocaleString('pt-BR') },
    { label: 'CPV', value: formatCurrency(cpv) },
    { label: 'VTR', value: formatPercent(vtr) },
    { label: 'Complete Views', value: totalCompleteViews.toLocaleString('pt-BR') },
    { label: 'Complete Views Rate', value: formatPercent(completeRate) },
    { label: 'Frequência média', value: averageFrequency.toFixed(2) },
    { label: 'Higher Reach', value: totalHigherReach.toLocaleString('pt-BR') }
  ];

  kpiCards.innerHTML = cards
    .map(
      (card) => `
      <div class="kpi-card">
        <p>${card.label}</p>
        <strong>${card.value}</strong>
      </div>
    `
    )
    .join('');
}

function renderPieCharts() {
  const channels = groupByPlatform(activePlatform);
  const labels = channels.map((item) => item.platform);
  const investmentData = channels.map((item) => item.cost);
  const impressionData = channels.map((item) => item.impressions);
  const clicksData = channels.map((item) => item.clicks);
  const videoData = channels.map((item) => item.videoViews);

  const pieConfig = (elementId, data, title) => {
    const ctx = document.getElementById(elementId);
    return new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: ['#4169ff', '#5ad0ff', '#8b5cf6', '#f97316'],
            borderWidth: 0
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#cbd4ef', boxWidth: 12 } },
          tooltip: {
            callbacks: {
              label(context) {
                const value = context.parsed;
                const formattedValue = title === 'Investimento' ? formatCurrency(value) : value.toLocaleString('pt-BR');
                return `${context.label}: ${formattedValue}`;
              }
            }
          }
        }
      }
    });
  };

  [
    { id: 'investmentPie', data: investmentData, label: 'Investimento' },
    { id: 'impressionsPie', data: impressionData, label: 'Impressões' },
    { id: 'clicksPie', data: clicksData, label: 'Cliques' },
    { id: 'videoViewsPie', data: videoData, label: 'Video Views' }
  ].forEach((config) => {
    if (config.data.every((value) => value === 0)) {
      const canvas = document.getElementById(config.id);
      const parent = canvas.closest('.pie-card');
      parent.querySelector('.chart-card-header p').textContent = 'Nenhum dado disponível para este gráfico.';
      return;
    }
    const chart = pieConfig(config.id, config.data, config.label);
    if (chart) pieCharts.push(chart);
  });
}

function renderChannelTable() {
  const rows = groupByPlatform(activePlatform);
  if (!rows.length) {
    campaignTable.innerHTML = '<tr><td colspan="12" class="empty-state">Nenhum dado disponível. Carregue um arquivo para visualizar o relatório.</td></tr>';
    return;
  }

  campaignTable.innerHTML = rows
    .map((item) => `
      <tr>
        <td>${item.platform}</td>
        <td>${formatCurrency(item.cost)}</td>
        <td>${item.impressions.toLocaleString('pt-BR')}</td>
        <td>${formatCurrency(item.cpm)}</td>
        <td>${item.clicks.toLocaleString('pt-BR')}</td>
        <td>${item.videoViews.toLocaleString('pt-BR')}</td>
        <td>${formatCurrency(item.cpv)}</td>
        <td>${formatPercent(item.vtr)}</td>
        <td>${item.completeViews.toLocaleString('pt-BR')}</td>
        <td>${formatPercent(item.completeViewRate)}</td>
        <td>${item.averageFrequency.toFixed(2)}</td>
        <td>${item.higherReach.toLocaleString('pt-BR')}</td>
      </tr>
    `)
    .join('');
}

function renderInsights() {
  const { totals, totalVideoViews, totalCompleteViews } = aggregateAdvancedData(activePlatform);
  const cpm = totals.impressions ? totals.cost / (totals.impressions / 1000) : 0;
  const cpv = totalVideoViews ? totals.cost / totalVideoViews : 0;
  const insights = [
    `Investimento total: ${formatCurrency(totals.cost)}`,
    `CPM médio: ${formatCurrency(cpm)}`,
    `CPV médio: ${formatCurrency(cpv)}`,
    `Total Video Views: ${totalVideoViews.toLocaleString('pt-BR')}`,
    `Complete Views: ${totalCompleteViews.toLocaleString('pt-BR')}`
  ];
  insightsList.innerHTML = insights.map((text) => `<li>${text}</li>`).join('');
}

function clearPieCharts() {
  pieCharts.forEach((chart) => chart.destroy());
  pieCharts.length = 0;
}

function updateDashboard() {
  renderKPIs();
  clearPieCharts();
  renderPieCharts();
  renderChannelTable();
  renderInsights();
}

function loadFileData(file) {
  const reader = new FileReader();
  reader.onload = (event) => {
    let rows = [];
    const data = event.target.result;

    if (file.name.toLowerCase().endsWith('.csv')) {
      rows = parseCSV(data);
    } else {
      const workbook = XLSX.read(new Uint8Array(data), { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    }

    rawData = normalizeRows(rows);
    fileStatus.textContent = `${file.name} carregado (${rawData.length} linhas)`;
    activePlatform = 'all';
    platformButtons.forEach((btn) => btn.classList.toggle('active', btn.dataset.platform === 'all'));
    updateDashboard();
  };

  if (file.name.toLowerCase().endsWith('.csv')) {
    reader.readAsText(file, 'UTF-8');
  } else {
    reader.readAsArrayBuffer(file);
  }
}

platformButtons.forEach((button) => {
  button.addEventListener('click', () => {
    platformButtons.forEach((btn) => btn.classList.remove('active'));
    button.classList.add('active');
    activePlatform = button.dataset.platform;
    updateDashboard();
  });
});

fileInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file) loadFileData(file);
});

downloadBtn.addEventListener('click', () => {
  const { filtered } = aggregateData(activePlatform);
  if (!filtered.length) return;

  const headers = ['Campanha', 'Plataforma', 'Data', 'Investimento', 'Receita', 'Impressões', 'Cliques', 'Conversões'];
  const rows = filtered.map((item) => [
    item.campaign,
    item.platform,
    item.date instanceof Date ? formatAsDateValue(item.date) : item.date,
    item.cost,
    item.revenue,
    item.impressions,
    item.clicks,
    item.conversions
  ]);

  const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'jovi-campanhas.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
});

function setDateFilterRange(option) {
  activePeriod = option === 'custom' ? null : option;
  periodButtons.forEach((btn) => btn.classList.toggle('active', btn.dataset.period === option));

  if (option !== 'custom') {
    applyRangeToButtons();
  } else {
    startDateInput.value = '';
    endDateInput.value = '';
  }

  updateDashboard();
}

periodButtons.forEach((button) => {
  button.addEventListener('click', () => setDateFilterRange(button.dataset.period));
});

[startDateInput, endDateInput].forEach((input) => {
  input.addEventListener('change', () => {
    activePeriod = null;
    periodButtons.forEach((btn) => btn.classList.remove('active'));
    updateDashboard();
  });
});

updateDashboard();
