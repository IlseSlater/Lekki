import { chromium } from 'playwright';
import fs from 'node:fs';

const OUT = 'docs/ux/evidence/fora-research';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('https://fora.so/', { waitUntil: 'networkidle', timeout: 60_000 });
await page.waitForTimeout(2500);
const okay = page.getByRole('button', { name: /okay/i });
if (await okay.count()) await okay.click().catch(() => {});

const layers = await page.evaluate(() => {
  const imgs = [...document.querySelectorAll('img, picture, canvas, svg, video')].map((el) => {
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      tag: el.tagName,
      src: el.currentSrc || el.src || el.getAttribute('src') || '',
      alt: el.getAttribute('alt'),
      className: String(el.className || '').slice(0, 120),
      w: Math.round(r.width),
      h: Math.round(r.height),
      top: Math.round(r.top),
      left: Math.round(r.left),
      opacity: s.opacity,
      z: s.zIndex,
      pos: s.position,
      transform: s.transform,
      filter: s.filter,
      mask: s.maskImage || s.webkitMaskImage,
    };
  });
  return imgs.filter((i) => i.w > 80 && i.h > 40).slice(0, 60);
});

fs.writeFileSync(`${OUT}/layers.json`, JSON.stringify(layers, null, 2));
await page.screenshot({ path: `${OUT}/fora-hero-now.png` });
await page.evaluate(() => window.scrollTo(0, 420));
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/fora-hero-lower.png` });
console.log(JSON.stringify(layers, null, 2));
await browser.close();
