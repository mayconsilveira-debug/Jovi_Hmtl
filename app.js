const platformButtons = document.querySelectorAll('.platform-btn');
const navButtons = document.querySelectorAll('.nav-btn');
const platformPageButtons = document.querySelectorAll('.platform-page-btn');
const campaignButtons = document.querySelectorAll('.campaign-btn');
const kpiCards = document.getElementById('kpiCards');
const campaignTable = document.getElementById('campaignTable');
const insightsList = document.getElementById('insightsList');
const downloadBtn = document.getElementById('downloadBtn');
const fileInput = document.getElementById('fileInput');
const fileStatus = document.getElementById('fileStatus');
const menuToggleBtn = document.getElementById('menuToggleBtn');
const appShell = document.querySelector('.app-shell');
const periodButtons = document.querySelectorAll('.period-btn');
const startDateInput = document.getElementById('startDate');
const endDateInput = document.getElementById('endDate');
const pageEyebrow = document.getElementById('pageEyebrow');
const pageTitle = document.getElementById('pageTitle');
const pageDesc = document.getElementById('pageDesc');

let rawData = [];
let activePlatform = 'all';
let activePage = 'dashboard';
let activeCampaign = 'all';
let activePeriod = null;
let revenueChart;
let performanceChart;
const pieCharts = [];
const timeSeriesCharts = [];

const fieldMap = {
  date: ['data', 'date', 'periodo', 'dia', 'timestamp', 'day', 'data_inicio', 'data inicio', 'data_fim', 'data fim'],
  platform: [
    'plataforma', 'platform', 'channel', 'midia', 'source', 'network', 'publisher_platform', 'publisher platform',
    'advertising_channel_type', 'advertising channel type', 'advertising_channel_sub_type', 'advertising channel sub-type',
    'rede', 'rede_publicitaria', 'rede publicitária', 'account_name', 'account name', 'account_id', 'account id'
  ],
  campaign: [
    'campanha', 'campaign', 'campaign_name', 'campaign name', 'nome_da_campanha', 'nome da campanha',
    'ad_set_name', 'ad set name', 'ad_name', 'ad name', 'campaign_id', 'campaign id'
  ],
  impressions: ['impressoes', 'impressions', 'impression', 'imps', 'impressões'],
  clicks: ['cliques', 'clicks', 'clique'],
  cost: ['custo', 'cost', 'spend', 'investimento', 'investment', 'gasto', 'valor_gasto', 'valor gasto', 'cpc_total', 'cpc total'],
  revenue: ['receita', 'revenue', 'faturamento', 'retorno', 'retorno_total', 'retorno total', 'roas', 'valor_receita', 'valor receita'],
  conversions: ['conversoes', 'conversions', 'leads', 'vendas', 'sales', 'conversões', 'numero_conversoes', 'numero conversoes'],
  videoViews: [
    'video_views', 'video views', 'views', 'video views total', 'video views', 'video views 100%',
    'video_views_total', 'video views total', 'views_100', 'views 100%', 'video_views_100', 'video views 100'
  ],
  completeViews: [
    'complete_views', 'complete views', 'completeviews', 'complete_view', 'complete view',
    'views_100', 'views 100%', 'thruplay actions', 'thruplay_actions', 'thruplay', 'complete_views_total', 'complete views total'
  ],
  frequency: ['frequencia', 'frequency', 'freq', 'frequência', 'frequencia_media', 'frequencia media'],
  higherReach: ['higher_reach', 'higher reach', 'reach', 'alcance', 'alcance_total', 'alcance total']
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
  if (!value || typeof value !== 'string') return 'Desconhecido';
  
  const normalized = value.toString().trim().toLowerCase();
  
  // Google Ads
  if (normalized.includes('google') || normalized.includes('search') || normalized.includes('display') || 
      normalized.includes('youtube') || normalized.includes('video') || normalized.includes('discovery')) {
    return 'Google Ads';
  }
  
  // Meta Ads (Facebook, Instagram, Audience Network)
  if (normalized.includes('meta') || normalized.includes('facebook') || normalized.includes('instagram') || 
      normalized.includes('audience') || normalized.includes('messenger') || normalized.includes('facebook_ads')) {
    return 'Meta Ads';
  }
  
  // TikTok Ads
  if (normalized.includes('tiktok') || normalized.includes('tik tok') || normalized.includes('tiktok_ads')) {
    return 'TikTok Ads';
  }
  
  // Outros casos
  if (normalized.includes('linkedin') || normalized.includes('twitter') || normalized.includes('pinterest')) {
    return value.toString().trim(); // Mantém o nome original para plataformas futuras
  }
  
  return 'Desconhecido';
}

function detectCampaignType(campaignName) {
  if (!campaignName || typeof campaignName !== 'string') return 'all';
  
  const normalized = campaignName.toString().trim().toLowerCase();
  
  // Awareness/Brand
  if (normalized.includes('awareness') || normalized.includes('brand') || normalized.includes('reach') || 
      normalized.includes('brand awareness') || normalized.includes('brand_awareness') ||
      normalized.includes('alcance') || normalized.includes('conscientizacao')) {
    return 'awareness';
  }
  
  // Consideration
  if (normalized.includes('consideration') || normalized.includes('consideracao') || 
      normalized.includes('traffic') || normalized.includes('engagement') || 
      normalized.includes('interacao') || normalized.includes('video') || normalized.includes('view')) {
    return 'consideration';
  }
  
  // Conversion
  if (normalized.includes('conversion') || normalized.includes('conversao') || 
      normalized.includes('sales') || normalized.includes('vendas') || 
      normalized.includes('leads') || normalized.includes('conversoes') || 
      normalized.includes('purchase') || normalized.includes('compra')) {
    return 'conversion';
  }
  
  // Default to awareness if can't determine
  return 'awareness';
}

function parseNumber(value) {
  if (value === undefined || value === null || value === '' || value === 'N/A' || value === 'n/a') return 0;
  
  // Remove currency symbols, spaces, and convert commas to dots
  let cleanValue = value.toString().trim()
    .replace(/R\$|USD|\$|€|£|¥|₹/g, '') // Remove currency symbols
    .replace(/\s+/g, '') // Remove spaces
    .replace(/,/g, '.'); // Convert comma to dot
  
  // Handle percentage signs
  if (cleanValue.includes('%')) {
    cleanValue = cleanValue.replace('%', '');
    const parsed = parseFloat(cleanValue);
    return Number.isFinite(parsed) ? parsed / 100 : 0; // Convert percentage to decimal
  }
  
  // Parse the number
  const parsed = parseFloat(cleanValue.replace(/[^0-9.\-]/g, ''));
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
  
  // Normalize all headers
  Object.keys(row).forEach((key) => {
    normalized[normalizeHeader(key)] = row[key];
  });
  
  // Extract and validate date
  const rawDateValue = extractField(normalized, fieldMap.date) || '';
  const parsedDate = parseDate(rawDateValue);
  
  // Extract and normalize platform
  const rawPlatform = String(extractField(normalized, fieldMap.platform) || '').trim();
  const platform = normalizePlatform(rawPlatform);
  
  // Extract campaign and detect type
  const campaign = String(extractField(normalized, fieldMap.campaign) || '').trim();
  const campaignType = detectCampaignType(campaign);
  
  // Validate required fields
  if (!parsedDate || !platform || !campaign) {
    console.warn('Linha inválida - faltando dados obrigatórios:', { date: rawDateValue, platform: rawPlatform, campaign });
    return null; // Skip invalid rows
  }
  
  return {
    date: parsedDate,
    platform: platform,
    campaign: campaign,
    campaignType: campaignType,
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
  const validRows = rows
    .map(normalizeRow)
    .filter((item) => item !== null); // Remove invalid rows
  
  console.log(`Dados processados: ${validRows.length} linhas válidas de ${rows.length} totais`);
  
  // Log summary by platform
  const platformSummary = validRows.reduce((acc, item) => {
    acc[item.platform] = (acc[item.platform] || 0) + 1;
    return acc;
  }, {});
  console.log('Resumo por plataforma:', platformSummary);
  
  return validRows;
}

function validateData(data) {
  const warnings = [];
  
  // Check for data consistency
  const platforms = [...new Set(data.map(item => item.platform))];
  const dateRange = data.reduce((range, item) => {
    if (!range.min || item.date < range.min) range.min = item.date;
    if (!range.max || item.date > range.max) range.max = item.date;
    return range;
  }, { min: null, max: null });
  
  // Check for negative values
  const negativeValues = data.filter(item => 
    item.cost < 0 || item.revenue < 0 || item.impressions < 0 || item.clicks < 0
  );
  if (negativeValues.length > 0) {
    warnings.push(`Encontrados ${negativeValues.length} registros com valores negativos`);
  }
  
  // Check for unrealistic CTR (click-through rate)
  const highCTR = data.filter(item => 
    item.impressions > 0 && (item.clicks / item.impressions) > 0.5
  );
  if (highCTR.length > 0) {
    warnings.push(`Encontrados ${highCTR.length} registros com CTR > 50% (possível erro de dados)`);
  }
  
  // Check for missing data patterns
  const missingRevenue = data.filter(item => item.cost > 0 && item.revenue === 0);
  if (missingRevenue.length > data.length * 0.3) {
    warnings.push('Grande quantidade de registros sem receita - verifique se os dados estão completos');
  }
  
  // Log validation results
  if (warnings.length > 0) {
    console.warn('Avisos de validação de dados:', warnings);
  } else {
    console.log('Validação de dados concluída - nenhum problema identificado');
  }
  
  console.log(`Período dos dados: ${dateRange.min ? dateRange.min.toLocaleDateString('pt-BR') : 'N/A'} até ${dateRange.max ? dateRange.max.toLocaleDateString('pt-BR') : 'N/A'}`);
  console.log(`Plataformas encontradas: ${platforms.join(', ')}`);
  
  return warnings;
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
  let filtered = rawData;
  
  // Filter by platform
  if (platform !== 'all') {
    filtered = filtered.filter((item) => item.platform === platform);
  }
  
  // Filter by campaign type
  if (activeCampaign !== 'all') {
    filtered = filtered.filter((item) => {
      const campaignName = item.campaign.toLowerCase();
      if (activeCampaign === 'awareness') {
        return campaignName.includes('awareness') || campaignName.includes('brand') || campaignName.includes('reach');
      }
      return true; // For future campaign types
    });
  }
  
  // Filter by date
  return filterByDate(filtered);
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

function groupByDate(platform = 'all') {
  const filtered = getFilteredRows(platform);
  const groupedByDate = {};
  
  filtered.forEach((item) => {
    const dateStr = item.date instanceof Date ? formatAsDateValue(item.date) : item.date;
    if (!groupedByDate[dateStr]) {
      groupedByDate[dateStr] = [];
    }
    groupedByDate[dateStr].push(item);
  });
  
  return Object.keys(groupedByDate)
    .sort()
    .map((date) => {
      const dayData = groupedByDate[date];
      const totals = dayData.reduce((acc, item) => ({
        date: item.date,
        cost: acc.cost + item.cost,
        impressions: acc.impressions + item.impressions,
        clicks: acc.clicks + item.clicks,
        videoViews: acc.videoViews + item.videoViews,
        completeViews: acc.completeViews + item.completeViews
      }), { date: dayData[0]?.date, cost: 0, impressions: 0, clicks: 0, videoViews: 0, completeViews: 0 });
      
      return {
        date,
        ...totals,
        cpm: totals.impressions ? totals.cost / (totals.impressions / 1000) : 0,
        cpc: totals.clicks ? totals.cost / totals.clicks : 0,
        cpv: totals.videoViews ? totals.cost / totals.videoViews : 0,
        ctr: totals.impressions ? totals.clicks / totals.impressions : 0,
        vtr: totals.impressions ? totals.videoViews / totals.impressions : 0
      };
    });
}

function renderDailyPage() {
  const dailyData = groupByDate(activePlatform);
  if (!dailyData.length) {
    document.getElementById('dailyKpiCards').innerHTML = '<p>Nenhum dado disponível</p>';
    return;
  }
  
  const latest = dailyData[dailyData.length - 1];
  const cards = [
    { label: 'Investimento', value: formatCurrency(latest.cost) },
    { label: 'Impressões', value: latest.impressions.toLocaleString('pt-BR') },
    { label: 'Cliques', value: latest.clicks.toLocaleString('pt-BR') },
    { label: 'CPM', value: formatCurrency(latest.cpm) },
    { label: 'CPC', value: formatCurrency(latest.cpc) },
    { label: 'CTR', value: formatPercent(latest.ctr) }
  ];
  
  const dailyKpiCards = document.getElementById('dailyKpiCards');
  dailyKpiCards.innerHTML = cards.map((card) => `
    <div class="kpi-card">
      <p>${card.label}</p>
      <strong>${card.value}</strong>
    </div>
  `).join('');
  
  // Render time series charts
  renderTimeSeriesCharts(dailyData);
}

function renderTimeSeriesCharts(dailyData) {
  const labels = dailyData.map((d) => d.date);
  const barChartConfig = (canvasId, barData, lineData, barLabel, lineLabel, yAxisLabel) => {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;
    
    return new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: barLabel,
            data: barData,
            backgroundColor: 'rgba(65, 169, 255, 0.6)',
            borderColor: 'rgba(65, 169, 255, 1)',
            borderWidth: 0,
            yAxisID: 'y',
            order: 2
          },
          {
            label: lineLabel,
            data: lineData,
            type: 'line',
            borderColor: 'rgba(255, 107, 107, 1)',
            borderWidth: 2.5,
            borderDash: [5, 5],
            fill: false,
            yAxisID: 'y1',
            order: 1,
            pointRadius: 0,
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        interaction: { intersect: false },
        plugins: {
          legend: { position: 'top', labels: { color: '#cbd4ef', usePointStyle: true } }
        },
        scales: {
          y: { position: 'left', ticks: { color: '#8a9bc5' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
          y1: { position: 'right', ticks: { color: '#ff6b6b' }, grid: { drawOnChartArea: false } }
        }
      }
    });
  };
  
  const investmentChart = barChartConfig('investmentChart', dailyData.map((d) => d.cost), [], 'Investimento', '', 'Custo');
  if (investmentChart) timeSeriesCharts.push(investmentChart);
  
  const impressionsCPMChart = barChartConfig('impressionsCPMChart', dailyData.map((d) => d.impressions), dailyData.map((d) => d.cpm), 'Impressões', 'CPM', 'Impressões');
  if (impressionsCPMChart) timeSeriesCharts.push(impressionsCPMChart);
  
  const clicksCPCChart = barChartConfig('clicksCPCChart', dailyData.map((d) => d.clicks), dailyData.map((d) => d.cpc), 'Cliques', 'CPC', 'Cliques');
  if (clicksCPCChart) timeSeriesCharts.push(clicksCPCChart);
  
  const viewsCPVChart = barChartConfig('viewsCPVChart', dailyData.map((d) => d.videoViews), dailyData.map((d) => d.cpv), 'Video Views', 'CPV', 'Views');
  if (viewsCPVChart) timeSeriesCharts.push(viewsCPVChart);
  
  const ctrChart = barChartConfig('ctrChart', dailyData.map((d) => d.ctr * 100), [], 'CTR (%)', '', 'CTR');
  if (ctrChart) timeSeriesCharts.push(ctrChart);
  
  const vtrChart = barChartConfig('vtrChart', dailyData.map((d) => d.vtr * 100), [], 'VTR (%)', '', 'VTR');
  if (vtrChart) timeSeriesCharts.push(vtrChart);
}

function renderPlatformPage(page) {
  const platformMap = { google: 'Google Ads', meta: 'Meta Ads', tiktok: 'TikTok Ads' };
  const platform = platformMap[page];
  const dailyData = groupByDate(platform);
  
  if (!dailyData.length) {
    document.getElementById(`${page}KpiCards`).innerHTML = '<p>Nenhum dado disponível</p>';
    return;
  }
  
  // Render KPIs
  const { totals } = aggregateAdvancedData(platform);
  const cpm = totals.impressions ? totals.cost / (totals.impressions / 1000) : 0;
  const cpc = totals.clicks ? totals.cost / totals.clicks : 0;
  const ctr = totals.impressions ? totals.clicks / totals.impressions : 0;
  
  const cards = [
    { label: 'Investimento', value: formatCurrency(totals.cost) },
    { label: 'Impressões', value: totals.impressions.toLocaleString('pt-BR') },
    { label: 'CPM', value: formatCurrency(cpm) },
    { label: 'Cliques', value: totals.clicks.toLocaleString('pt-BR') },
    { label: 'CPC', value: formatCurrency(cpc) },
    { label: 'CTR', value: formatPercent(ctr) }
  ];
  
  const kpiContainer = document.getElementById(`${page}KpiCards`);
  kpiContainer.innerHTML = cards.map((card) => `
    <div class="kpi-card">
      <p>${card.label}</p>
      <strong>${card.value}</strong>
    </div>
  `).join('');
  
  // Render time series charts
  renderPlatformTimeSeriesCharts(page, dailyData);
  
  // Render summary table
  const latest = dailyData[dailyData.length - 1];
  const tableId = `${page}Table`;
  document.getElementById(tableId).innerHTML = `
    <tr>
      <td>${formatCurrency(totals.cost)}</td>
      <td>${totals.impressions.toLocaleString('pt-BR')}</td>
      <td>${formatCurrency(cpm)}</td>
      <td>${totals.clicks.toLocaleString('pt-BR')}</td>
      <td>${formatCurrency(cpc)}</td>
      ${page === 'tiktok' ? `<td>${totals.videoViews.toLocaleString('pt-BR')}</td><td>${formatPercent(totals.videoViews ? totals.videoViews / totals.impressions : 0)}</td>` : ''}
    </tr>
  `;
}

function renderPlatformTimeSeriesCharts(page, dailyData) {
  const labels = dailyData.map((d) => d.date);
  
  const barChartConfig = (canvasId, barData, lineData, barLabel, lineLabel) => {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;
    
    return new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: barLabel,
            data: barData,
            backgroundColor: 'rgba(65, 169, 255, 0.6)',
            borderWidth: 0,
            yAxisID: 'y',
            order: 2
          },
          {
            label: lineLabel,
            data: lineData,
            type: 'line',
            borderColor: 'rgba(255, 107, 107, 1)',
            borderWidth: 2.5,
            borderDash: [5, 5],
            fill: false,
            yAxisID: 'y1',
            order: 1,
            pointRadius: 0,
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        interaction: { intersect: false },
        plugins: { legend: { labels: { color: '#cbd4ef' } } },
        scales: {
          y: { ticks: { color: '#8a9bc5' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
          y1: { position: 'right', ticks: { color: '#ff6b6b' }, grid: { drawOnChartArea: false } }
        }
      }
    });
  };
  
  const investChart = barChartConfig(`${page}InvestmentChart`, dailyData.map((d) => d.cost), [], 'Investimento', '');
  if (investChart) timeSeriesCharts.push(investChart);
  
  const impChart = barChartConfig(`${page}ImpressionsCPMChart`, dailyData.map((d) => d.impressions), dailyData.map((d) => d.cpm), 'Impressões', 'CPM');
  if (impChart) timeSeriesCharts.push(impChart);
  
  const clickChart = barChartConfig(`${page}ClicksCPCChart`, dailyData.map((d) => d.clicks), dailyData.map((d) => d.cpc), 'Cliques', 'CPC');
  if (clickChart) timeSeriesCharts.push(clickChart);
  
  const ctrChart = barChartConfig(`${page}CTRChart`, dailyData.map((d) => d.ctr * 100), [], 'CTR (%)', '');
  if (ctrChart) timeSeriesCharts.push(ctrChart);
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

function clearTimeSeriesCharts() {
  timeSeriesCharts.forEach((chart) => chart.destroy());
  timeSeriesCharts.length = 0;
}

const pageConfig = {
  dashboard: { title: 'Performance de Campanhas', eyebrow: 'Relatório Integrado', desc: 'Acompanhe investimento, receita, ROAS e conversão para as plataformas de advertising da JOVI.' },
  daily: { title: 'Acompanhamento Diário', eyebrow: 'Série Temporal', desc: 'Acompanhe o desempenho dia a dia com gráficos de série temporal.' },
  google: { title: 'Google Ads', eyebrow: 'Análise Isolada', desc: 'Dados consolidados apenas da plataforma Google Ads.' },
  meta: { title: 'Meta Ads', eyebrow: 'Análise Isolada', desc: 'Dados consolidados apenas da plataforma Meta Ads (Facebook, Instagram).' },
  tiktok: { title: 'TikTok Ads', eyebrow: 'Análise Isolada', desc: 'Dados consolidados apenas da plataforma TikTok Ads.' }
};

function changePage(newPage) {
  activePage = newPage;
  
  // Hide all pages
  document.querySelectorAll('.page-content').forEach((page) => {
    page.style.display = 'none';
  });
  
  // Show selected page
  const targetPage = document.querySelector(`[data-page="${newPage}"]`);
  if (targetPage) targetPage.style.display = 'flex';
  
  // Update topbar
  const config = pageConfig[newPage];
  pageEyebrow.textContent = config.eyebrow;
  pageTitle.textContent = config.title;
  pageDesc.textContent = config.desc;
  
  // Update nav buttons
  navButtons.forEach((btn) => btn.classList.remove('active'));
  document.querySelector(`.nav-btn[data-page="${newPage}"]`)?.classList.add('active');
  
  // Update platform buttons if on platform page
  if (['google', 'meta', 'tiktok'].includes(newPage)) {
    platformButtons.forEach((btn) => btn.classList.remove('active'));
    const platformMap = { google: 'Google Ads', meta: 'Meta Ads', tiktok: 'TikTok Ads' };
    document.querySelector(`[data-platform="${platformMap[newPage]}"]`)?.classList.add('active');
    activePlatform = platformMap[newPage];
  } else {
    activePlatform = 'all';
    document.querySelector('[data-platform="all"]')?.classList.add('active');
  }
  
  // Reset campaign filter when changing pages
  if (newPage !== 'dashboard') {
    activeCampaign = 'all';
    campaignButtons.forEach((btn) => btn.classList.remove('active'));
    document.querySelector('[data-campaign="all"]')?.classList.add('active');
  }
  
  // Render content for the page
  clearTimeSeriesCharts();
  clearPieCharts();
  
  if (newPage === 'dashboard') {
    updateDashboard();
  } else if (newPage === 'daily') {
    renderDailyPage();
  } else if (['google', 'meta', 'tiktok'].includes(newPage)) {
    renderPlatformPage(newPage);
  }
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
    validateData(rawData);
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

menuToggleBtn.addEventListener('click', () => {
  const isClosed = appShell.classList.toggle('sidebar-closed');
  menuToggleBtn.textContent = isClosed ? 'Abrir menu' : 'Fechar menu';
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

// Navigation buttons
navButtons.forEach((button) => {
  button.addEventListener('click', () => changePage(button.dataset.page));
});

// Platform page buttons
platformPageButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const page = button.dataset.page;
    changePage(page);
  });
});

// Campaign type buttons
campaignButtons.forEach((button) => {
  button.addEventListener('click', () => {
    campaignButtons.forEach((btn) => btn.classList.remove('active'));
    button.classList.add('active');
    activeCampaign = button.dataset.campaign;
    updateDashboard();
  });
});

updateDashboard();
