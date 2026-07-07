const puppeteer = require('puppeteer');
const path = require('path');

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const artifactDir = '/Users/vanshchaturvedi/.gemini/antigravity/brain/d16807c7-5fa2-4e44-9c0a-241b9782a640';

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

  console.log('Taking screenshot of hero section...');
  await page.screenshot({ path: path.join(artifactDir, 'screenshot_hero.png') });

  console.log('Scrolling down to categories...');
  await page.evaluate(() => window.scrollBy(0, 900));
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(artifactDir, 'screenshot_homepage_categories.png') });

  console.log('Navigating to http://localhost:3000/categories...');
  await page.goto('http://localhost:3000/categories', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: path.join(artifactDir, 'screenshot_categories_page.png') });

  console.log('Done!');
  await browser.close();
}

main().catch(err => {
  console.error('Error during screenshot generation:', err);
  process.exit(1);
});
