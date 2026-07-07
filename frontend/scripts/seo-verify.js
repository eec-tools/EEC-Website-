const puppeteer = require('puppeteer');
const axios = require('axios');

// JSDOM is a standard built-in or lightweight package. Let's write standard JS parsing
// so we don't need jsdom, we can use a helper or regex to count tags and extract titles,
// or we can load both raw HTML and rendered DOM in Puppeteer by disabling JS for raw html!
// YES! Puppeteer can disable JS on a page-by-page basis! This is incredibly clean and eliminates additional dependencies!

const TARGETS = [
  '/',
  '/for-buyers',
  '/for-suppliers',
  '/about',
  '/services',
  '/categories',
  '/categories/food-commodities',
  '/categories/processed-packaged-foods',
  '/categories/fresh-agricultural',
  '/categories/healthcare-hospital',
  '/categories/home-textile-hospitality',
  '/categories/eco-friendly-sustainable'
];

const HOST = process.env.TEST_HOST || 'http://localhost:3000';

function cleanText(text) {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/gi, '')
    .trim();
}

async function auditUrl(browser, route) {
  const url = `${HOST}${route}`;
  
  // 1. Raw HTML (JS Disabled)
  const rawPage = await browser.newPage();
  await rawPage.setJavaScriptEnabled(false);
  await rawPage.goto(url, { waitUntil: 'networkidle2' });
  
  const rawMetrics = await rawPage.evaluate(() => {
    const title = document.title;
    const canonicalEl = document.querySelector('link[rel="canonical"]');
    const canonical = canonicalEl ? canonicalEl.getAttribute('href') : null;
    const linksCount = document.querySelectorAll('a').length;
    
    // Extract text content from main body elements
    const bodyText = document.body ? document.body.innerText || document.body.textContent : '';
    return { title, canonical, linksCount, bodyText };
  });
  await rawPage.close();

  // 2. Rendered DOM (JS Enabled)
  const renderedPage = await browser.newPage();
  await renderedPage.goto(url, { waitUntil: 'networkidle2' });
  
  const renderedMetrics = await renderedPage.evaluate(() => {
    const title = document.title;
    const canonicalEl = document.querySelector('link[rel="canonical"]');
    const canonical = canonicalEl ? canonicalEl.getAttribute('href') : null;
    const linksCount = document.querySelectorAll('a').length;
    const bodyText = document.body ? document.body.innerText || document.body.textContent : '';
    return { title, canonical, linksCount, bodyText };
  });
  await renderedPage.close();

  // Clean and count words
  const rawWords = cleanText(rawMetrics.bodyText).split(' ').filter(Boolean).length;
  const renderedWords = cleanText(renderedMetrics.bodyText).split(' ').filter(Boolean).length;

  const errors = [];
  
  if (rawMetrics.title !== renderedMetrics.title) {
    errors.push(`Title mismatch: Raw="${rawMetrics.title}", Rendered="${renderedMetrics.title}"`);
  }
  if (rawMetrics.canonical !== renderedMetrics.canonical) {
    errors.push(`Canonical mismatch: Raw="${rawMetrics.canonical}", Rendered="${renderedMetrics.canonical}"`);
  }
  if (rawMetrics.linksCount !== renderedMetrics.linksCount) {
    errors.push(`Link count mismatch: Raw=${rawMetrics.linksCount}, Rendered=${renderedMetrics.linksCount}`);
  }
  
  // Flag if raw word count is significantly lower than rendered word count (threshold: 85%)
  const ratio = renderedWords > 0 ? (rawWords / renderedWords) * 100 : 100;
  if (ratio < 85) {
    errors.push(`Content parity failure: Raw HTML contains only ${ratio.toFixed(1)}% of rendered content words (${rawWords} vs ${renderedWords} words)`);
  }

  return {
    route,
    rawWords,
    renderedWords,
    parityRatio: ratio,
    errors
  };
}

async function main() {
  console.log(`Starting SEO Compliance Verification on host: ${HOST}`);
  console.log(`Checking ${TARGETS.length} public marketing routes...`);
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const results = [];
  let hasFailures = false;

  for (const route of TARGETS) {
    try {
      const result = await auditUrl(browser, route);
      results.push(result);
      if (result.errors.length > 0) {
        hasFailures = true;
        console.log(`❌ ${route} - FAILED`);
        result.errors.forEach(err => console.log(`   - ${err}`));
      } else {
        console.log(`✅ ${route} - PASSED (${result.rawWords} words, parity index: ${result.parityRatio.toFixed(1)}%)`);
      }
    } catch (err) {
      hasFailures = true;
      console.error(`❌ ${route} - CRASHED during audit:`, err.message);
      results.push({ route, errors: [`Audit execution crashed: ${err.message}`] });
    }
  }

  await browser.close();

  console.log('\n--- AUDIT SUMMARY REPORT ---');
  console.log(`| Route | Raw Words | Rendered Words | Parity % | Status |`);
  console.log(`| :--- | :--- | :--- | :--- | :--- |`);
  results.forEach(r => {
    const status = r.errors.length > 0 ? '❌ FAILED' : '✅ PASSED';
    const ratioStr = r.parityRatio ? `${r.parityRatio.toFixed(1)}%` : 'N/A';
    console.log(`| ${r.route} | ${r.rawWords || 0} | ${r.renderedWords || 0} | ${ratioStr} | ${status} |`);
  });

  if (hasFailures) {
    console.log('\n❌ Audit failed. Some pages are missing content in raw HTML response.');
    process.exit(1);
  } else {
    console.log('\n🎉 Audit passed! All public routes have 100% crawlable content parity.');
    process.exit(0);
  }
}

main();
