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

// Registrar plugin ChartDataLabels se disponível
if (typeof Chart !== 'undefined' && typeof ChartDataLabels !== 'undefined') {
  Chart.register(ChartDataLabels);
}

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
    'campanha', 'campaign', 'campaign_name', 'campaign name', 'nome_da_campanha', 'nome da campanha', 'campaign_id', 'campaign id'
  ],
  adSet: [
    'ad_set_name', 'ad set name', 'adset_name', 'adset name', 'adset', 'ad_set', 'ad set', 'group_name', 'group name'
  ],
  adName: [
    'ad_name', 'ad name', 'adname', 'nome_anuncio', 'nome anuncio', 'anuncio', 'anúncio', 'ad', 'creative_name', 'creative name'
  ],
  impressions: ['impressoes', 'impressions', 'impression', 'imps', 'impressões'],
  clicks: ['cliques', 'clicks', 'clique'],
  cost: ['custo', 'cost', 'spend', 'investimento', 'investment', 'gasto', 'valor_gasto', 'valor gasto', 'cpc_total', 'cpc total'],
  revenue: ['receita', 'revenue', 'faturamento', 'retorno', 'retorno_total', 'retorno total', 'roas', 'valor_receita', 'valor receita'],
  conversions: ['conversoes', 'conversions', 'leads', 'vendas', 'sales', 'conversões', 'numero_conversoes', 'numero conversoes'],
  videoViews: [
    'video_views', 'video views', 'views', 'video views total', 'video views', 'video views 100%',
    'video_views_total', 'video views total', 'views_100', 'views 100%', 'video_views_100', 'video views 100',
    'three-second video views', 'three_second_video_views', '3-second video views', '2-second continuous video plays',
    '15-second video views', 'video play actions', 'avg watch time per person'
  ],
  completeViews: [
    'complete_views', 'complete views', 'completeviews', 'complete_view', 'complete view',
    'views_100', 'views 100%', 'thruplay actions', 'thruplay_actions', 'thruplay', 'complete_views_total', 'complete views total',
    'video watches at 100%', 'video_watches_at_100', 'video views at 100%', 'video_views_at_100',
    'video_watches_at_100_', 'video_views_at_100_'
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
  if (value === null || value === undefined || value === '') return 'Desconhecido';
  
  const normalized = String(value).trim().toLowerCase();
  if (!normalized) return 'Desconhecido';
  
  // Google Ads - also catch 'search', 'display', 'youtube', 'video' as Google subtypes
  if (normalized.includes('google') || normalized.includes('search') || normalized.includes('display') ||
      normalized.includes('youtube') || normalized.includes('discovery')) {
    return 'Google Ads';
  }
  
  // Meta Ads (Facebook, Instagram, Audience Network)
  if (normalized.includes('meta') || normalized.includes('facebook') || normalized.includes('instagram') ||
      normalized.includes('audience') || normalized.includes('messenger')) {
    return 'Meta Ads';
  }
  
  // TikTok Ads — catch all variations including just 'tik' alone
  if (normalized.includes('tiktok') || normalized.includes('tik tok') || normalized.includes('tik_tok') ||
      normalized.includes('ttads') || normalized.includes('tt ads') || normalized === 'tik') {
    return 'TikTok Ads';
  }
  
  // LinkedIn / Twitter / Pinterest — keep original name
  if (normalized.includes('linkedin') || normalized.includes('twitter') || normalized.includes('pinterest')) {
    return String(value).trim();
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
  // Priority 1: injected platform tag (key becomes 'x_platform' after normalizeHeader)
  // Priority 2: fall back to fieldMap column detection
  const injectedPlatform = normalized['x_platform'] || '';
  const rawPlatform = injectedPlatform
    ? String(injectedPlatform).trim()
    : String(extractField(normalized, fieldMap.platform) || '').trim();
  const platform = injectedPlatform ? String(injectedPlatform).trim() : normalizePlatform(rawPlatform);
  
  // Extract campaign and detect type
  const campaign = String(extractField(normalized, fieldMap.campaign) || '').trim();
  const campaignType = detectCampaignType(campaign);
  
  // Skip rows missing date only — we always have a platform now thanks to injection
  if (!parsedDate) {
    return null;
  }
  
  // Extract ad set and ad name
  const adSet = String(extractField(normalized, fieldMap.adSet) || '').trim();
  const adName = String(extractField(normalized, fieldMap.adName) || '').trim();
  
  return {
    date: parsedDate,
    platform: platform,
    campaign: campaign,
    adSet: adSet,
    adName: adName,
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
  // Already a valid Date object
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;

  // Excel serial number (integer like 45291 = Jan 1, 2024)
  // Excel epoch: Dec 30, 1899. JS: Jan 1, 1970.
  if (typeof value === 'number' && Number.isFinite(value)) {
    if (value > 25000) {
      // Treat as Excel serial date
      const excelEpoch = new Date(1899, 11, 30); // Dec 30, 1899
      const ms = excelEpoch.getTime() + value * 86400000;
      const d = new Date(ms);
      if (!Number.isNaN(d.getTime()) && d.getFullYear() > 1990) return d;
    }
    // Fallback: treat as JS timestamp
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
    return null;
  }

  if (typeof value !== 'string' || !value.trim()) return null;

  const normalized = value.trim();

  // ISO format or datetime with space
  const iso = normalized.replace(/\s+/, 'T');
  const parsed = new Date(iso);
  if (!Number.isNaN(parsed.getTime()) && parsed.getFullYear() > 1990) return parsed;

  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const parts = normalized.split(/[-\/\.]/).map((p) => p.replace(/^0+/, '') || '0');
  if (parts.length === 3) {
    const [a, b, c] = parts.map(Number);
    if (a > 31) { // YYYY-MM-DD
      const d = new Date(a, b - 1, c);
      if (!Number.isNaN(d.getTime())) return d;
    } else { // DD-MM-YYYY
      const d = new Date(c, b - 1, a);
      if (!Number.isNaN(d.getTime())) return d;
    }
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

function formatDateBR(dateInput) {
  // Converte Date ou YYYY-MM-DD para DD/MM/YYYY
  if (!dateInput) return '';
  
  // Se for objeto Date, extrair componentes
  if (dateInput instanceof Date) {
    const day = String(dateInput.getDate()).padStart(2, '0');
    const month = String(dateInput.getMonth() + 1).padStart(2, '0');
    const year = dateInput.getFullYear();
    return `${day}/${month}/${year}`;
  }
  
  // Se for string, tentar converter de YYYY-MM-DD
  if (typeof dateInput === 'string') {
    const parts = dateInput.split('-');
    if (parts.length !== 3) return dateInput;
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  
  return '';
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

function groupByPlatformWithDrilldown(platform = 'all') {
  const filtered = getFilteredRows(platform);
  
  // Agrupar por plataforma -> adSet -> adName
  const platformData = {};
  
  filtered.forEach((item) => {
    const platformName = item.platform || 'Desconhecido';
    const adSetName = item.adSet || 'Sem grupo';
    const adName = item.adName || 'Sem anúncio';
    
    // Inicializar estrutura se não existir
    if (!platformData[platformName]) {
      platformData[platformName] = {
        totals: { impressions: 0, clicks: 0, cost: 0, videoViews: 0, completeViews: 0, frequencySum: 0, frequencyCount: 0, higherReach: 0 },
        adSets: {}
      };
    }
    
    if (!platformData[platformName].adSets[adSetName]) {
      platformData[platformName].adSets[adSetName] = {
        totals: { impressions: 0, clicks: 0, cost: 0, videoViews: 0, completeViews: 0, frequencySum: 0, frequencyCount: 0, higherReach: 0 },
        ads: {}
      };
    }
    
    if (!platformData[platformName].adSets[adSetName].ads[adName]) {
      platformData[platformName].adSets[adSetName].ads[adName] = { 
        impressions: 0, clicks: 0, cost: 0, videoViews: 0, completeViews: 0, frequencySum: 0, frequencyCount: 0, higherReach: 0 
      };
    }
    
    // Agregar valores
    const ad = platformData[platformName].adSets[adSetName].ads[adName];
    ad.impressions += item.impressions;
    ad.clicks += item.clicks;
    ad.cost += item.cost;
    ad.videoViews += item.videoViews;
    ad.completeViews += item.completeViews;
    ad.frequencySum += item.frequency;
    ad.frequencyCount += item.frequency > 0 ? 1 : 0;
    ad.higherReach += item.higherReach;
    
    // Agregar no adSet
    const adSet = platformData[platformName].adSets[adSetName];
    adSet.totals.impressions += item.impressions;
    adSet.totals.clicks += item.clicks;
    adSet.totals.cost += item.cost;
    adSet.totals.videoViews += item.videoViews;
    adSet.totals.completeViews += item.completeViews;
    adSet.totals.frequencySum += item.frequency;
    adSet.totals.frequencyCount += item.frequency > 0 ? 1 : 0;
    adSet.totals.higherReach += item.higherReach;
    
    // Agregar na plataforma
    const plat = platformData[platformName];
    plat.totals.impressions += item.impressions;
    plat.totals.clicks += item.clicks;
    plat.totals.cost += item.cost;
    plat.totals.videoViews += item.videoViews;
    plat.totals.completeViews += item.completeViews;
    plat.totals.frequencySum += item.frequency;
    plat.totals.frequencyCount += item.frequency > 0 ? 1 : 0;
    plat.totals.higherReach += item.higherReach;
  });
  
  // Calcular métricas derivadas
  return Object.entries(platformData).map(([platformName, platform]) => {
    const platTotals = platform.totals;
    const adSets = Object.entries(platform.adSets).map(([adSetName, adSet]) => {
      const adSetTotals = adSet.totals;
      const ads = Object.entries(adSet.ads).map(([adName, ad]) => ({
        adName,
        impressions: ad.impressions,
        clicks: ad.clicks,
        cost: ad.cost,
        videoViews: ad.videoViews,
        completeViews: ad.completeViews,
        cpm: ad.impressions ? ad.cost / (ad.impressions / 1000) : 0,
        cpv: ad.videoViews ? ad.cost / ad.videoViews : 0,
        vtr: ad.impressions ? ad.videoViews / ad.impressions : 0,
        completeViewRate: ad.videoViews ? ad.completeViews / ad.videoViews : 0,
        averageFrequency: ad.frequencyCount ? ad.frequencySum / ad.frequencyCount : 0,
        higherReach: ad.higherReach
      }));
      
      return {
        adSetName,
        impressions: adSetTotals.impressions,
        clicks: adSetTotals.clicks,
        cost: adSetTotals.cost,
        videoViews: adSetTotals.videoViews,
        completeViews: adSetTotals.completeViews,
        cpm: adSetTotals.impressions ? adSetTotals.cost / (adSetTotals.impressions / 1000) : 0,
        cpv: adSetTotals.videoViews ? adSetTotals.cost / adSetTotals.videoViews : 0,
        vtr: adSetTotals.impressions ? adSetTotals.videoViews / adSetTotals.impressions : 0,
        completeViewRate: adSetTotals.videoViews ? adSetTotals.completeViews / adSetTotals.videoViews : 0,
        averageFrequency: adSetTotals.frequencyCount ? adSetTotals.frequencySum / adSetTotals.frequencyCount : 0,
        higherReach: adSetTotals.higherReach,
        ads
      };
    });
    
    return {
      platform: platformName,
      impressions: platTotals.impressions,
      clicks: platTotals.clicks,
      cost: platTotals.cost,
      videoViews: platTotals.videoViews,
      completeViews: platTotals.completeViews,
      cpm: platTotals.impressions ? platTotals.cost / (platTotals.impressions / 1000) : 0,
      cpv: platTotals.videoViews ? platTotals.cost / platTotals.videoViews : 0,
      vtr: platTotals.impressions ? platTotals.videoViews / platTotals.impressions : 0,
      completeViewRate: platTotals.videoViews ? platTotals.completeViews / platTotals.videoViews : 0,
      averageFrequency: platTotals.frequencyCount ? platTotals.frequencySum / platTotals.frequencyCount : 0,
      higherReach: platTotals.higherReach,
      adSets
    };
  });
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
  try {
    // Obter data atual no formato YYYY-MM-DD
    const today = new Date();
    const todayStr = formatAsDateValue(today);
    
    // Filtrar dados apenas para o dia atual
    const dailyData = groupByDate(activePlatform).filter(item => item.date === todayStr);
    const dailyKpiCards = document.getElementById('dailyKpiCards');
    if (!dailyKpiCards) return;
    
    if (!dailyData.length) {
      dailyKpiCards.innerHTML = `<p>Nenhum dado disponível para ${today.toLocaleDateString('pt-BR')}</p>`;
      return;
    }
    
    const todayData = dailyData[0]; // Pega o dado do dia atual
    const cards = [
      { label: 'Investimento', value: formatCurrency(todayData.cost) },
      { label: 'Impressões', value: todayData.impressions.toLocaleString('pt-BR') },
      { label: 'Cliques', value: todayData.clicks.toLocaleString('pt-BR') },
      { label: 'CPM', value: formatCurrency(todayData.cpm) },
      { label: 'CPC', value: formatCurrency(todayData.cpc) },
      { label: 'CTR', value: formatPercent(todayData.ctr) }
    ];
    
    dailyKpiCards.innerHTML = cards.map((card) => `
      <div class="kpi-card">
        <p>${card.label}</p>
        <strong>${card.value}</strong>
      </div>
    `).join('');
    
    // Render time series charts com dados do dia atual
    renderTimeSeriesCharts([todayData]);
    forceChartResize();
  } catch (error) {
    console.error('Erro ao renderizar pagina diaria:', error);
  }
}

function renderTimeSeriesCharts(dailyData) {
  const labels = dailyData.map((d) => formatDateBR(d.date));
  const barChartConfig = (canvasId, barData, lineData, barLabel, lineLabel, yAxisLabel) => {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;
    
    try {
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
        maintainAspectRatio: true,
        aspectRatio: 2,
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
    } catch (error) {
      console.error(`Erro ao criar grafico ${canvasId}:`, error);
      return null;
    }
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
  try {
    console.log(`Renderizando página da plataforma: ${page}`);
    const platformMap = { google: 'Google Ads', meta: 'Meta Ads', tiktok: 'TikTok Ads' };
    const platform = platformMap[page];
    const dailyData = groupByDate(platform);
    
    console.log(`Dados encontrados para ${platform}: ${dailyData.length} dias`);
    
    const kpiContainer = document.getElementById(`${page}KpiCards`);
    if (!kpiContainer) {
      console.error(`Container ${page}KpiCards não encontrado`);
      return;
    }
    
    if (!dailyData.length) {
      console.warn(`Sem dados para a plataforma ${platform}`);
      kpiContainer.innerHTML = '<p>Nenhum dado disponível</p>';
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
    const tableBody = document.getElementById(tableId);
    if (tableBody) {
      tableBody.innerHTML = `
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
    
    forceChartResize();
  } catch (error) {
    console.error(`Erro ao renderizar pagina ${page}:`, error);
  }
}

function renderPlatformTimeSeriesCharts(page, dailyData) {
  if (!dailyData || dailyData.length === 0) {
    console.warn(`Sem dados para renderizar gráficos da plataforma ${page}`);
    return;
  }
  
  console.log('Dados recebidos:', dailyData);
  console.log('Primeira data bruta:', dailyData[0]?.date);
  console.log('Tipo da data:', typeof dailyData[0]?.date);
  const labels = dailyData.map((d) => {
    const formatted = formatDateBR(d.date);
    console.log(`Formatando: ${d.date} -> ${formatted}`);
    return formatted;
  });
  console.log('Labels formatados:', labels);
  
  const barChartConfig = (canvasId, barData, lineData, barLabel, lineLabel) => {
    const ctx = document.getElementById(canvasId);
    if (!ctx) {
      console.warn(`Canvas ${canvasId} não encontrado`);
      return null;
    }
    
    if (!barData || barData.length === 0) {
      console.warn(`Sem dados para o gráfico ${canvasId}`);
      return null;
    }
    
    try {
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
        maintainAspectRatio: true,
        aspectRatio: 2,
        interaction: { intersect: false },
        plugins: { legend: { labels: { color: '#cbd4ef' } } },
        scales: {
          y: { ticks: { color: '#8a9bc5' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
          y1: { position: 'right', ticks: { color: '#ff6b6b' }, grid: { drawOnChartArea: false } }
        }
      }
      });
    } catch (error) {
      console.error(`Erro ao criar grafico ${canvasId}:`, error);
      return null;
    }
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
    if (!ctx) return null;

    try {
      return new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [
            {
              data,
              backgroundColor: ['#4d8cff', '#4dd7c4', '#a78bfa', '#fb923c'],
              hoverBackgroundColor: ['#6ba3ff', '#6fe4d5', '#b49dfc', '#fca86d'],
              borderWidth: 3,
              borderColor: '#0c1428',
              hoverBorderColor: '#0c1428',
              hoverOffset: 8,
              borderRadius: 5,
              spacing: 2
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          aspectRatio: 1.5,
          cutout: '68%',
          animation: {
            animateRotate: true,
            animateScale: false,
            duration: 600,
            easing: 'easeInOutQuart'
          },
          plugins: {
            legend: {
              display: false
            },
            datalabels: {
              color: '#ffffff',
              anchor: 'end',
              align: 'end',
              offset: 8,
              font: {
                size: 11,
                weight: '500',
                family: 'Inter, system-ui, sans-serif'
              },
              formatter: (value, ctx) => {
                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                const formattedValue = title === 'Investimento' ? formatCurrency(value) : value.toLocaleString('pt-BR');
                return `${ctx.chart.data.labels[ctx.dataIndex]}\n${formattedValue} (${pct}%)`;
              }
            },
            tooltip: {
              backgroundColor: 'rgba(7, 13, 31, 0.96)',
              borderColor: 'rgba(255,255,255,0.1)',
              borderWidth: 1,
              titleColor: '#e9f0ff',
              bodyColor: '#8fa8d4',
              padding: 12,
              cornerRadius: 10,
              callbacks: {
                label(context) {
                  const value = context.parsed;
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                  const formattedValue = title === 'Investimento' ? formatCurrency(value) : value.toLocaleString('pt-BR');
                  return `  ${context.label}: ${formattedValue} (${pct}%)`;
                }
              }
            }
          }
        }
      });
    } catch (error) {
      console.error(`Erro ao renderizar gráfico ${elementId}:`, error);
      return null;
    }
  };

  [
    { id: 'investmentPie', data: investmentData, label: 'Investimento' },
    { id: 'impressionsPie', data: impressionData, label: 'Impressões' },
    { id: 'clicksPie', data: clicksData, label: 'Cliques' },
    { id: 'videoViewsPie', data: videoData, label: 'Video Views' }
  ].forEach((config) => {
    try {
      const canvas = document.getElementById(config.id);
      
      // Se canvas não existe (em outra página), pular
      if (!canvas) return;
      
      if (config.data.every((value) => value === 0)) {
        const parent = canvas.closest('.pie-card');
        if (parent) {
          const descElement = parent.querySelector('.chart-card-header p');
          if (descElement) {
            descElement.textContent = 'Nenhum dado disponível para este gráfico.';
          }
        }
        return;
      }
      
      const chart = pieConfig(config.id, config.data, config.label);
      if (chart) pieCharts.push(chart);
    } catch (error) {
      console.error(`Erro ao processar gráfico ${config.id}:`, error);
    }
  });
}

function renderChannelTable() {
  const data = groupByPlatformWithDrilldown(activePlatform);
  if (!data.length) {
    campaignTable.innerHTML = '<tr><td colspan="12" class="empty-state">Nenhum dado disponível. Carregue um arquivo para visualizar o relatório.</td></tr>';
    return;
  }

  let html = '';
  
  data.forEach((platform, platformIndex) => {
    // Linha principal do canal
    html += `
      <tr class="platform-row" data-platform="${platformIndex}">
        <td><span class="expand-icon">▶</span> ${platform.platform}</td>
        <td>${formatCurrency(platform.cost)}</td>
        <td>${platform.impressions.toLocaleString('pt-BR')}</td>
        <td>${formatCurrency(platform.cpm)}</td>
        <td>${platform.clicks.toLocaleString('pt-BR')}</td>
        <td>${platform.videoViews.toLocaleString('pt-BR')}</td>
        <td>${formatCurrency(platform.cpv)}</td>
        <td>${formatPercent(platform.vtr)}</td>
        <td>${platform.completeViews.toLocaleString('pt-BR')}</td>
        <td>${formatPercent(platform.completeViewRate)}</td>
        <td>${platform.averageFrequency.toFixed(2)}</td>
        <td>${platform.higherReach.toLocaleString('pt-BR')}</td>
      </tr>
    `;
    
    // Linhas de adSets (inicialmente escondidas)
    platform.adSets.forEach((adSet, adSetIndex) => {
      html += `
        <tr class="adset-row platform-${platformIndex}" data-platform="${platformIndex}" data-adset="${adSetIndex}" style="display: none; background: rgba(65, 169, 255, 0.05);">
          <td style="padding-left: 30px;"><span class="expand-icon">▶</span> 📁 ${adSet.adSetName}</td>
          <td>${formatCurrency(adSet.cost)}</td>
          <td>${adSet.impressions.toLocaleString('pt-BR')}</td>
          <td>${formatCurrency(adSet.cpm)}</td>
          <td>${adSet.clicks.toLocaleString('pt-BR')}</td>
          <td>${adSet.videoViews.toLocaleString('pt-BR')}</td>
          <td>${formatCurrency(adSet.cpv)}</td>
          <td>${formatPercent(adSet.vtr)}</td>
          <td>${adSet.completeViews.toLocaleString('pt-BR')}</td>
          <td>${formatPercent(adSet.completeViewRate)}</td>
          <td>${adSet.averageFrequency.toFixed(2)}</td>
          <td>${adSet.higherReach.toLocaleString('pt-BR')}</td>
        </tr>
      `;
      
      // Linhas de ads (inicialmente escondidas)
      adSet.ads.forEach((ad) => {
        html += `
          <tr class="ad-row platform-${platformIndex} adset-${adSetIndex}" style="display: none; background: rgba(65, 169, 255, 0.02);">
            <td style="padding-left: 60px;">📄 ${ad.adName}</td>
            <td>${formatCurrency(ad.cost)}</td>
            <td>${ad.impressions.toLocaleString('pt-BR')}</td>
            <td>${formatCurrency(ad.cpm)}</td>
            <td>${ad.clicks.toLocaleString('pt-BR')}</td>
            <td>${ad.videoViews.toLocaleString('pt-BR')}</td>
            <td>${formatCurrency(ad.cpv)}</td>
            <td>${formatPercent(ad.vtr)}</td>
            <td>${ad.completeViews.toLocaleString('pt-BR')}</td>
            <td>${formatPercent(ad.completeViewRate)}</td>
            <td>${ad.averageFrequency.toFixed(2)}</td>
            <td>${ad.higherReach.toLocaleString('pt-BR')}</td>
          </tr>
        `;
      });
    });
  });
  
  campaignTable.innerHTML = html;
  
  // Adicionar event listeners para expandir/colapsar
  setTimeout(() => {
    // Click nas linhas de plataforma
    document.querySelectorAll('.platform-row').forEach(row => {
      row.addEventListener('click', function() {
        const platformIndex = this.dataset.platform;
        const isExpanded = this.classList.toggle('expanded');
        const icon = this.querySelector('.expand-icon');
        icon.textContent = isExpanded ? '▼' : '▶';
        
        // Mostrar/esconder adSets
        document.querySelectorAll(`.adset-row.platform-${platformIndex}`).forEach(adsetRow => {
          adsetRow.style.display = isExpanded ? 'table-row' : 'none';
          // Resetar estado expandido do adSet
          adsetRow.classList.remove('expanded');
          adsetRow.querySelector('.expand-icon').textContent = '▶';
        });
        
        // Esconder todos os ads desta plataforma
        document.querySelectorAll(`.ad-row.platform-${platformIndex}`).forEach(adRow => {
          adRow.style.display = 'none';
        });
      });
    });
    
    // Click nas linhas de adSet
    document.querySelectorAll('.adset-row').forEach(row => {
      row.addEventListener('click', function(e) {
        e.stopPropagation();
        const platformIndex = this.dataset.platform;
        const adSetIndex = this.dataset.adset;
        const isExpanded = this.classList.toggle('expanded');
        const icon = this.querySelector('.expand-icon');
        icon.textContent = isExpanded ? '▼' : '▶';
        
        // Mostrar/esconder ads
        document.querySelectorAll(`.ad-row.platform-${platformIndex}.adset-${adSetIndex}`).forEach(adRow => {
          adRow.style.display = isExpanded ? 'table-row' : 'none';
        });
      });
    });
  }, 100);
}

function renderInsights() {
  const { totals, totalVideoViews, totalCompleteViews, averageFrequency } = aggregateAdvancedData(activePlatform);
  const cpm = totals.impressions ? totals.cost / (totals.impressions / 1000) : 0;
  const cpv = totalVideoViews ? totals.cost / totalVideoViews : 0;
  const ctr = totals.impressions ? (totals.clicks / totals.impressions) * 100 : 0;
  const vtr = totals.impressions ? (totalVideoViews / totals.impressions) * 100 : 0;
  const cpc = totals.clicks ? totals.cost / totals.clicks : 0;
  const completeRate = totalVideoViews ? (totalCompleteViews / totalVideoViews) * 100 : 0;
  
  // Análise por plataforma
  const platformData = groupByPlatform(activePlatform);
  const platformInsights = [];
  
  platformData.forEach(p => {
    const pCtr = p.impressions ? (p.clicks / p.impressions) * 100 : 0;
    const pCpm = p.impressions ? p.cost / (p.impressions / 1000) : 0;
    platformInsights.push({
      platform: p.platform,
      ctr: pCtr,
      cpm: pCpm,
      cost: p.cost,
      impressions: p.impressions
    });
  });
  
  // Ordenar por CTR para identificar melhor e pior performance
  platformInsights.sort((a, b) => b.ctr - a.ctr);
  const bestPlatform = platformInsights[0];
  const worstPlatform = platformInsights[platformInsights.length - 1];
  
  // Gerar insights positivos
  const positivos = [];
  const negativos = [];
  const melhorias = [];
  
  // Pontos positivos
  if (ctr > 1.0) {
    positivos.push(`✅ CTR de ${ctr.toFixed(2)}% está acima da média do mercado (1%), indicando boa relevância dos anúncios`);
  }
  if (completeRate > 30) {
    positivos.push(`✅ Taxa de visualização completa de ${completeRate.toFixed(1)}% mostra conteúdo engajador`);
  }
  if (bestPlatform && bestPlatform.ctr > 1.5) {
    positivos.push(`✅ ${bestPlatform.platform} apresenta excelente performance com CTR de ${bestPlatform.ctr.toFixed(2)}%`);
  }
  if (cpc < 5) {
    positivos.push(`✅ CPC baixo de ${formatCurrency(cpc)} indica custo eficiente por clique`);
  }
  if (vtr > 50) {
    positivos.push(`✅ VTR de ${vtr.toFixed(1)}% demonstra alto interesse no conteúdo de vídeo`);
  }
  
  // Pontos negativos
  if (ctr < 0.5) {
    negativos.push(`⚠️ CTR de ${ctr.toFixed(2)}% está abaixo do esperado, considere revisar criativos`);
  }
  if (worstPlatform && worstPlatform.ctr < 0.8) {
    negativos.push(`⚠️ ${worstPlatform.platform} apresenta CTR baixo (${worstPlatform.ctr.toFixed(2)}%), avaliar pausar campanhas`);
  }
  if (averageFrequency > 3) {
    negativos.push(`⚠️ Frequência média de ${averageFrequency.toFixed(1)}x pode indicar saturação do público`);
  }
  if (cpm > 150) {
    negativos.push(`⚠️ CPM elevado de ${formatCurrency(cpm)} sugere segmentação muito restrita`);
  }
  if (cpc > 10) {
    negativos.push(`⚠️ CPC de ${formatCurrency(cpc)} está alto, verificar qualidade do tráfego`);
  }
  if (completeRate < 20 && totalVideoViews > 1000) {
    negativos.push(`⚠️ Taxa de completação baixa (${completeRate.toFixed(1)}%), vídeos podem estar longos demais`);
  }
  
  // Sugestões de melhorias
  if (worstPlatform && worstPlatform.cost > totals.cost * 0.3 && worstPlatform.ctr < 1) {
    melhorias.push(`💡 Reduzir investimento em ${worstPlatform.platform} e realocar para ${bestPlatform.platform}`);
  }
  if (averageFrequency > 2.5) {
    melhorias.push(`💡 Ampliar público-alvo para reduzir frequência e evitar saturação`);
  }
  if (ctr < 1) {
    melhorias.push(`💡 Testar novos criativos com chamadas de ação mais claras`);
  }
  if (cpm > 100) {
    melhorias.push(`💡 Expandir segmentação para reduzir CPM e aumentar alcance`);
  }
  if (totalVideoViews > 0 && vtr < 30) {
    melhorias.push(`💡 Otimizar primeiros 3 segundos dos vídeos para reter atenção`);
  }
  if (completeRate < 40 && totalVideoViews > 1000) {
    melhorias.push(`💡 Criar versões mais curtas dos vídeos (15-30s) para aumentar completação`);
  }
  melhorias.push(`💡 Monitorar métricas diariamente e ajustar orçamento entre plataformas`);
  
  // Selecionar top 2 positivos, top 2 negativos e top 3 melhorias
  const selectedPositivos = positivos.slice(0, 2);
  const selectedNegativos = negativos.slice(0, 2);
  const selectedMelhorias = melhorias.slice(0, 3);
  
  // Se não houver suficientes, preencher com genéricos
  if (selectedPositivos.length === 0) {
    selectedPositivos.push(`✅ Investimento total de ${formatCurrency(totals.cost)} distribuído entre ${platformData.length} plataformas`);
    selectedPositivos.push(`✅ Alcance total de ${totals.impressions.toLocaleString('pt-BR')} impressões`);
  }
  if (selectedNegativos.length === 0) {
    selectedNegativos.push(`⚠️ Nenhum ponto crítico identificado, manter monitoramento`);
  }
  if (selectedMelhorias.length === 0) {
    selectedMelhorias.push(`💡 Continuar estratégia atual e testar novos formatos de criativo`);
  }
  
  // Combinar todos os insights
  const allInsights = [
    ...selectedPositivos,
    ...selectedNegativos,
    ...selectedMelhorias
  ];
  
  insightsList.innerHTML = allInsights.map((text) => `<li>${text}</li>`).join('');
}

function clearPieCharts() {
  pieCharts.forEach((chart) => chart.destroy());
  pieCharts.length = 0;
}

function clearTimeSeriesCharts() {
  timeSeriesCharts.forEach((chart) => chart.destroy());
  timeSeriesCharts.length = 0;
}

function forceChartResize() {
  // Force resize all active charts after they're rendered
  setTimeout(() => {
    [...pieCharts, ...timeSeriesCharts].forEach(chart => {
      if (chart && chart.resize) {
        chart.resize();
      }
    });
  }, 100);
}

const pageConfig = {
  dashboard: { title: 'Performance', eyebrow: 'Relatório Integrado', desc: 'Acompanhe investimento, receita, ROAS e conversão para as plataformas de advertising da JOVI.' },
  daily: { title: 'Acompanhamento Diário', eyebrow: 'Série Temporal', desc: 'Acompanhe o desempenho dia a dia com gráficos de série temporal.' },
  google: { title: 'Google Ads', eyebrow: 'Análise Isolada', desc: 'Dados consolidados apenas da plataforma Google Ads.' },
  meta: { title: 'Meta Ads', eyebrow: 'Análise Isolada', desc: 'Dados consolidados apenas da plataforma Meta Ads (Facebook, Instagram).' },
  tiktok: { title: 'TikTok Ads', eyebrow: 'Análise Isolada', desc: 'Dados consolidados apenas da plataforma TikTok Ads.' }
};

function changePage(newPage) {
  try {
    // Limpar gráficos ANTES de mudar página
    clearTimeSeriesCharts();
    clearPieCharts();
    
    activePage = newPage;
    
    // Hide all pages
    document.querySelectorAll('.page-content').forEach((page) => {
      page.style.display = 'none';
    });
    
    // Show selected page
    const targetPage = document.querySelector(`.page-content[data-page="${newPage}"]`);
    if (targetPage) targetPage.style.display = 'flex';
    
    // Update topbar
    const config = pageConfig[newPage];
    if (config) {
      if (pageEyebrow) pageEyebrow.textContent = config.eyebrow;
      if (pageTitle) pageTitle.textContent = config.title;
      if (pageDesc) pageDesc.textContent = config.desc;
    }
    
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
      platformButtons.forEach((btn) => btn.classList.remove('active'));
      document.querySelector('[data-platform="all"]')?.classList.add('active');
    }
    
    // Forçar atualização visual para garantir que o menu reflita o estado correto
    setTimeout(() => {
      // Garantir que apenas o botão correto está ativo
      document.querySelectorAll('.nav-btn').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.page === newPage);
      });
      
      // Garantir que apenas o botão de plataforma correto está ativo
      if (['google', 'meta', 'tiktok'].includes(newPage)) {
        const platformMap = { google: 'Google Ads', meta: 'Meta Ads', tiktok: 'TikTok Ads' };
        document.querySelectorAll('.platform-btn').forEach((btn) => {
          btn.classList.toggle('active', btn.dataset.platform === platformMap[newPage]);
        });
      } else {
        document.querySelectorAll('.platform-btn').forEach((btn) => {
          btn.classList.toggle('active', btn.dataset.platform === 'all');
        });
      }
    }, 10);
    
    // Reset campaign filter when changing pages
    if (newPage !== 'dashboard') {
      activeCampaign = 'all';
      campaignButtons.forEach((btn) => btn.classList.remove('active'));
      document.querySelector('[data-campaign="all"]')?.classList.add('active');
    }
    
    // Render content for the page after a small delay to ensure DOM is ready
    setTimeout(() => {
      if (newPage === 'dashboard') {
        updateDashboard();
      } else if (newPage === 'daily') {
        renderDailyPage();
      } else if (['google', 'meta', 'tiktok'].includes(newPage)) {
        renderPlatformPage(newPage);
      }
    }, 50); // Small delay to ensure page is visible and DOM is ready
  } catch (error) {
    console.error(`Erro ao mudar para página ${newPage}:`, error);
  }
}

function updateDashboard() {
  try {
    renderKPIs();
    clearPieCharts();
    renderPieCharts();
    renderChannelTable();
    renderInsights();
    forceChartResize();
  } catch (error) {
    console.error('Erro ao atualizar dashboard:', error);
  }
}

function loadFileData(file) {
  const reader = new FileReader();
  reader.onload = (event) => {
    let rows = [];
    const data = event.target.result;

    if (file.name.toLowerCase().endsWith('.csv')) {
      rows = parseCSV(data);
    } else {
      const workbook = XLSX.read(new Uint8Array(data), { type: 'array', cellDates: true });
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

// ─── Central re-render: updates whichever page is currently active ───────────
function renderCurrentPage() {
  if (activePage === 'dashboard') {
    updateDashboard();
  } else if (activePage === 'daily') {
    clearTimeSeriesCharts();
    renderDailyPage();
  } else if (['google', 'meta', 'tiktok'].includes(activePage)) {
    clearTimeSeriesCharts();
    renderPlatformPage(activePage);
  }
}

// ─── Platform / Channel sidebar buttons ──────────────────────────────────────
// Each .platform-btn either navigates to a dedicated page (if it has data-page)
// or resets to the full dashboard ("Todos").
platformButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const targetPage = button.dataset.page;   // e.g. "google", undefined for "Todos"
    if (targetPage) {
      // Navigate to the platform-specific page
      changePage(targetPage);
    } else {
      // "Todos" → always go back to the main dashboard
      changePage('dashboard');
    }
  });
});

// ─── Menu toggle ─────────────────────────────────────────────────────────────
menuToggleBtn.addEventListener('click', () => {
  const isClosed = appShell.classList.toggle('sidebar-closed');
  menuToggleBtn.textContent = isClosed ? '☰' : '✕';
});

// ─── File upload ─────────────────────────────────────────────────────────────
fileInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file) loadFileData(file);
});

// ─── Export CSV (desativado - botão removido) ─────────────────────────────────
// downloadBtn.addEventListener('click', () => {
//   const { filtered } = aggregateData(activePlatform);
//   if (!filtered.length) return;
//
//   const headers = ['Campanha', 'Plataforma', 'Data', 'Investimento', 'Receita', 'Impressões', 'Cliques', 'Conversões'];
//   const rows = filtered.map((item) => [
//     item.campaign,
//     item.platform,
//     item.date instanceof Date ? formatAsDateValue(item.date) : item.date,
//     item.cost,
//     item.revenue,
//     item.impressions,
//     item.clicks,
//     item.conversions
//   ]);
//
//   const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
//   const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
//   const link = document.createElement('a');
//   link.href = URL.createObjectURL(blob);
//   link.download = 'jovi-campanhas.csv';
//   document.body.appendChild(link);
//   link.click();
//   document.body.removeChild(link);
//   URL.revokeObjectURL(link.href);
// });

// ─── Period date filter buttons ───────────────────────────────────────────────
function setDateFilterRange(option) {
  activePeriod = option === 'custom' ? null : option;
  periodButtons.forEach((btn) => btn.classList.toggle('active', btn.dataset.period === option));

  if (option !== 'custom') {
    applyRangeToButtons();
  } else {
    startDateInput.value = '';
    endDateInput.value = '';
  }

  renderCurrentPage();
}

periodButtons.forEach((button) => {
  button.addEventListener('click', () => setDateFilterRange(button.dataset.period));
});

[startDateInput, endDateInput].forEach((input) => {
  input.addEventListener('change', () => {
    activePeriod = null;
    periodButtons.forEach((btn) => btn.classList.remove('active'));
    renderCurrentPage();
  });
});

// ─── Navigation (main pages: Dashboard, Acompanhamento Diário) ───────────────
navButtons.forEach((button) => {
  button.addEventListener('click', () => changePage(button.dataset.page));
});

// ─── Campaign type filter ─────────────────────────────────────────────────────
campaignButtons.forEach((button) => {
  button.addEventListener('click', () => {
    campaignButtons.forEach((btn) => btn.classList.remove('active'));
    button.classList.add('active');
    activeCampaign = button.dataset.campaign;
    updateDashboard();
  });
});

async function autoLoadFakeData() {
  // Map filename fragment -> canonical platform name to inject into rows
  const files = [
    { url: 'Base_Fake/Base_Ficticia_GoogleAds_Display&Video.xlsx', platform: 'Google Ads' },
    { url: 'Base_Fake/Base_Ficticia_GoogleAds_Search.xlsx',         platform: 'Google Ads' },
    { url: 'Base_Fake/Base_Ficticia_MetaAds.xlsx',                  platform: 'Meta Ads'   },
    { url: 'Base_Fake/Base_Ficticia_TiktokAds.xlsx',                platform: 'TikTok Ads' }
  ];

  fileStatus.textContent = 'Carregando dados...';
  
  try {
    let allRows = [];
    
    for (const { url, platform } of files) {
      try {
        console.log(`Carregando arquivo: ${url}`);
        const response = await fetch(url);
        if (!response.ok) {
          console.warn(`Não foi possível carregar ${url}: ${response.statusText}`);
          continue;
        }
        const data = await response.arrayBuffer();
        // cellDates: true -> XLSX returns Date objects instead of serial numbers
        const workbook = XLSX.read(new Uint8Array(data), { type: 'array', cellDates: true });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        
        console.log(`Arquivo ${url}: ${rows.length} linhas brutas`);
        
        // Debug: mostrar primeira linha para verificar estrutura
        if (rows.length > 0) {
          console.log('Estrutura da primeira linha:', Object.keys(rows[0]));
          console.log('Primeira linha (sample):', rows[0]);
        }
        
        // Inject canonical platform so normalizeRow always gets a guaranteed match
        // Key must survive normalizeHeader(): 'x_platform' -> 'x_platform' 
        const tagged = rows.map((row) => ({ ...row, x_platform: platform }));
        allRows = allRows.concat(tagged);
      } catch (e) {
        console.error(`Erro ao buscar ${url}:`, e);
      }
    }
    
    console.log(`Total de linhas antes da normalização: ${allRows.length}`);
    
    if (allRows.length > 0) {
      rawData = normalizeRows(allRows);
      console.log(`Total de linhas após normalização: ${rawData.length}`);
      
      // Debug: mostrar primeiras linhas normalizadas
      if (rawData.length > 0) {
        console.log('Primeira linha normalizada:', rawData[0]);
        console.log('Colunas disponíveis após normalização:', Object.keys(rawData[0]));
      }
      
      validateData(rawData);
      fileStatus.textContent = `${rawData.length} registros carregados`;
      
      activePlatform = 'all';
      platformButtons.forEach((btn) => btn.classList.toggle('active', btn.dataset.platform === 'all'));
      updateDashboard();
    } else {
      fileStatus.textContent = 'Nenhum dado encontrado';
      updateDashboard();
    }
  } catch (err) {
    console.error('Erro geral ao carregar arquivos:', err);
    fileStatus.textContent = 'Erro ao carregar bases';
    updateDashboard();
  }
}

// Inicializar carregando os dados fakes do servidor local
autoLoadFakeData();
