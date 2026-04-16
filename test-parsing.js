// Test script for data parsing improvements
const fs = require('fs');

// Copy the functions from app.js
function normalizeHeader(header) {
  return header.toString().toLowerCase().trim()
    .replace(/[^a-z0-9]/g, '')
    .replace(/ç/g, 'c')
    .replace(/ã|á|â|à/g, 'a')
    .replace(/é|ê/g, 'e')
    .replace(/í/g, 'i')
    .replace(/ó|ô|õ/g, 'o')
    .replace(/ú/g, 'u');
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

// Test data
const testData = [
  { plataforma: 'Google Ads', campanha: 'Brand Awareness Q1', custo: '500,00', impressoes: '10000' },
  { plataforma: 'facebook', campanha: 'Traffic Campaign', custo: 'R$ 750.00', impressoes: '15000' },
  { plataforma: 'tiktok', campanha: 'Video Views', custo: '600', impressoes: '20000' },
  { plataforma: 'google search', campanha: 'Search Terms', custo: '400.00', impressoes: '8000' }
];

console.log('=== Teste de Parsing Melhorado ===');

testData.forEach((row, index) => {
  const platform = normalizePlatform(row.plataforma);
  const campaignType = detectCampaignType(row.campanha);
  const cost = parseNumber(row.custo);
  const impressions = parseNumber(row.impressoes);

  console.log(`\nTeste ${index + 1}:`);
  console.log(`  Plataforma original: ${row.plataforma}`);
  console.log(`  Plataforma normalizada: ${platform}`);
  console.log(`  Tipo de campanha: ${campaignType}`);
  console.log(`  Custo original: ${row.custo}`);
  console.log(`  Custo parseado: ${cost}`);
  console.log(`  Impressões: ${impressions}`);
});

console.log('\n=== Teste concluído ===');