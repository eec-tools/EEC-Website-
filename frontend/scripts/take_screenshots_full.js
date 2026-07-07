const puppeteer = require('puppeteer');
const path = require('path');

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1200 });

  const artifactDir = '/Users/vanshchaturvedi/.gemini/antigravity/brain/d16807c7-5fa2-4e44-9c0a-241b9782a640';

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

  console.log('Scrolling down to category cards grid...');
  await page.evaluate(() => window.scrollBy(0, 1100));
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(artifactDir, 'screenshot_homepage_categories_full.png') });

  console.log('Done!');
  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
