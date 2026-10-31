import assert from "node:assert/strict";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const root = fileURLToPath(new URL("../", import.meta.url));
const out = process.env.BROWSER_CHECK_OUT || join(root, "output", "playwright");
mkdirSync(out, { recursive: true });
const executable = process.env.BROWSER_EXECUTABLE || [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
].find(existsSync);
assert.ok(executable, "未找到系统 Chrome/Edge；设置 BROWSER_EXECUTABLE 后重试，不自动下载浏览器。");
assert.ok(existsSync(join(root, "dist", "index.html")), "请先运行 npm run build 生成 dist/。");

const port = Number(process.env.BROWSER_PORT || 4188);
const server = spawn(process.execPath, [join(root, "node_modules", "vite", "bin", "vite.js"), "preview", "--host", "127.0.0.1", "--port", String(port), "--strictPort"], { cwd: root, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
let serverLog = "";
server.stdout.on("data", (chunk) => { serverLog += chunk; });
server.stderr.on("data", (chunk) => { serverLog += chunk; });
const url = "http://127.0.0.1:" + port + "/";
for (let i = 0; i < 80; i += 1) {
  if (server.exitCode !== null) throw new Error("预览服务器启动失败：" + serverLog);
  try { if ((await fetch(url)).ok) break; } catch {}
  await new Promise((resolve) => setTimeout(resolve, 100));
  if (i === 79) throw new Error("预览服务器启动超时：" + serverLog);
}

const results = [];
const errors = [];
const browser = await chromium.launch({ executablePath: executable, headless: true });
async function check(name, fn) { await fn(); results.push({ name, status: "PASS" }); console.log("PASS " + name); }
function attach(page) {
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("response", (response) => { if (response.status() >= 400) errors.push(String(response.status()) + " " + response.url()); });
  page.on("requestfailed", (request) => {
    const failure = request.failure()?.errorText || "failed";
    // Chromium may cancel a blob-backed media range request during normal loop/teardown.
    if (request.url().startsWith("blob:") && failure === "net::ERR_ABORTED") return;
    errors.push(request.url() + " " + failure);
  });
}
async function noOverflow(page) {
  const size = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, body: document.documentElement.scrollWidth }));
  assert.ok(size.body <= size.viewport + 1, JSON.stringify(size));
}
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  attach(page);
  const music = page.locator('audio[data-background-music="war"]');
  let beforeChapterChange = null;
  await page.addInitScript(() => sessionStorage.setItem("footprints-intro-v1-seen", "yes"));
  await page.goto(url, { waitUntil: "networkidle" });
  await check("首页与匿名共创目录", async () => {
    for (const id of ["home", "explore", "contemporary"]) await page.locator("#" + id).waitFor();
    assert.equal(await page.locator(".team-paper").count(), 9);
    assert.equal(await music.count(), 1);
    assert.equal(await page.locator("video").count(), 0);
    assert.equal(await page.locator(".global-music").count(), 1);
    assert.equal(await music.getAttribute("data-background-music"), "war");
    assert.equal(await page.locator(".global-music").getAttribute("data-music-enabled"), "false");
    await page.getByRole("button", { name: /开启背景音乐/ }).click();
    await page.waitForFunction(() => document.querySelector('.global-music')?.getAttribute('data-music-status') === 'playing', null, { timeout: 8000 });
    beforeChapterChange = await music.evaluate((element) => element.currentTime);
    await noOverflow(page);
  });
  await check("历史时期与1938地图", async () => {
    await page.getByRole("button", { name: "开始探索" }).click();
    for (const id of ["p1927", "p1938", "p1947", "p2026"]) {
      await page.locator("[data-period=\"" + id + "\"]").click();
      assert.equal(await page.locator("[data-period=\"" + id + "\"]").getAttribute("aria-pressed"), "true");
    }
    const afterChapterChange = await music.evaluate((element) => element.currentTime);
    assert.ok(afterChapterChange >= beforeChapterChange, JSON.stringify({ beforeChapterChange, afterChapterChange }));
    await page.locator("[data-period=\"p1938\"]").click();
    assert.ok((await page.locator("[data-place]").count()) >= 6);
  });
  await check("来源面板与匿名档案交互", async () => {
    await page.locator("[data-place]").first().click();
    const source = page.locator(".source-button");
    if (await source.count()) {
      await source.click();
      await page.locator("dialog[open]").waitFor();
      await page.keyboard.press("Escape");
      assert.equal(await page.locator("dialog[open]").count(), 0);
    }
    await page.locator("[data-period=\"p2026\"]").click();
    await page.locator(".team-paper").first().click();
    await page.locator("#member-dossier").waitFor();
    assert.match(await page.locator("#member-dossier").innerText(), /创作者0[1-9]/);
    assert.doesNotMatch(await page.locator("body").innerText(), /播放.*录音|集体创作现场影像/);
  });
  await check("手机视口无横向溢出", async () => {
    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    attach(mobile);
    await mobile.goto(url, { waitUntil: "networkidle" });
    await noOverflow(mobile);
    await mobile.close();
  });
  await check("控制台与网络请求无错误", async () => assert.deepEqual(errors, []));
  writeFileSync(join(out, "browser-results.json"), JSON.stringify({ generatedAt: new Date().toISOString(), checks: results, errors }, null, 2), "utf8");
  console.log("浏览器验收：" + results.length + "/" + results.length + " PASS");
} catch (error) {
  results.push({ name: "浏览器验收异常", status: "FAIL", message: error.stack });
  writeFileSync(join(out, "browser-results.json"), JSON.stringify({ checks: results, errors }, null, 2), "utf8");
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser.close();
  server.kill();
}
