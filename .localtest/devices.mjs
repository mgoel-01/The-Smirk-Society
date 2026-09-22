/**
 * Throwaway cross-device check. Renders the live site with real mobile
 * emulation and reports anything that would break on a phone:
 * horizontal overflow, tap targets that are too small, and console errors.
 *
 * Not part of the shipped project.
 */
import puppeteer from "puppeteer-core";
import fs from "node:fs";

const CHROME =
  "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = process.argv[2] ?? "https://smirknraas.netlify.app";
const OUT = process.argv[3] ?? "./.localtest/shots";

fs.mkdirSync(OUT, { recursive: true });

const DEVICES = [
  { name: "iphone-se", width: 375, height: 667, dpr: 2, mobile: true,
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1" },
  { name: "iphone-15", width: 393, height: 852, dpr: 3, mobile: true,
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1" },
  { name: "android-pixel", width: 412, height: 915, dpr: 2.6, mobile: true,
    ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36" },
  { name: "ipad", width: 820, height: 1180, dpr: 2, mobile: true,
    ua: "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1" },
  { name: "desktop", width: 1440, height: 900, dpr: 1, mobile: false, ua: null },
];

const PAGES = ["/", "/register", "/find", "/contact", "/admin/login"];

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

let problems = 0;

for (const device of DEVICES) {
  console.log(`\n=== ${device.name} (${device.width}x${device.height} @${device.dpr}x) ===`);

  for (const path of PAGES) {
    const page = await browser.newPage();
    const errors = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text().slice(0, 130));
    });
    page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message.slice(0, 130)));

    await page.setViewport({
      width: device.width,
      height: device.height,
      deviceScaleFactor: device.dpr,
      isMobile: device.mobile,
      hasTouch: device.mobile,
    });
    if (device.ua) await page.setUserAgent(device.ua);

    try {
      await page.goto(BASE + path, { waitUntil: "networkidle2", timeout: 60000 });
    } catch (err) {
      console.log(`  ${path.padEnd(14)} LOAD FAILED: ${err.message.slice(0, 60)}`);
      problems++;
      await page.close();
      continue;
    }

    const audit = await page.evaluate(() => {
      const doc = document.documentElement;
      const overflow = doc.scrollWidth - doc.clientWidth;

      // Which elements stick out past the right edge?
      const offenders = [];
      if (overflow > 1) {
        for (const el of document.querySelectorAll("body *")) {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue;
          if (r.right > doc.clientWidth + 1) {
            offenders.push({
              tag: el.tagName.toLowerCase(),
              cls: (el.className?.toString?.() ?? "").slice(0, 55),
              right: Math.round(r.right),
              text: (el.textContent ?? "").trim().slice(0, 30),
            });
          }
        }
      }

      // Interactive elements smaller than a comfortable finger target.
      const small = [];
      for (const el of document.querySelectorAll("a,button,input,select")) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        if (r.height < 32) {
          small.push({
            tag: el.tagName.toLowerCase(),
            h: Math.round(r.height),
            text: (el.textContent ?? el.getAttribute("aria-label") ?? "").trim().slice(0, 28),
          });
        }
      }

      return {
        scrollWidth: doc.scrollWidth,
        clientWidth: doc.clientWidth,
        overflow,
        offenders: offenders.slice(0, 5),
        small: small.slice(0, 5),
      };
    });

    const flags = [];
    if (audit.overflow > 1) flags.push(`OVERFLOW +${audit.overflow}px`);
    if (audit.small.length) flags.push(`${audit.small.length} small tap target(s)`);
    if (errors.length) flags.push(`${errors.length} console error(s)`);
    if (flags.length) problems++;

    console.log(
      `  ${path.padEnd(14)} ${audit.clientWidth}px  ${flags.length ? "!! " + flags.join(", ") : "clean"}`,
    );
    audit.offenders.forEach((o) =>
      console.log(`      overflow: <${o.tag}> right=${o.right} "${o.text}" [${o.cls}]`),
    );
    audit.small.forEach((t) =>
      console.log(`      small: <${t.tag}> ${t.h}px "${t.text}"`),
    );
    errors.forEach((e) => console.log(`      console: ${e}`));

    if (path === "/") {
      await page.screenshot({
        path: `${OUT}/${device.name}-home.png`,
        fullPage: false,
      });
    }
    await page.close();
  }
}

await browser.close();
console.log(`\n${"=".repeat(50)}`);
console.log(problems === 0 ? "  NO LAYOUT PROBLEMS FOUND" : `  ${problems} page/device combos flagged`);
console.log("=".repeat(50));
