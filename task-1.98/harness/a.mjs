import { launch, openHome, typeAndSend, rows, answers } from "./common.mjs";
const { page, shot, done, apiLog } = await launch("A");
try {
  await openHome(page);
  const t0 = Date.now();
  await typeAndSend(page, "x^2-5x+6=0을 풀어줘");
  let seen = "", shotTaken = false;
  while (Date.now() - t0 < 60000) {
    const r = JSON.stringify(await rows(page)); const a = await answers(page);
    if (r !== seen) { console.log(`+${Date.now() - t0}ms rows=${r} answers=${a}`); seen = r; if (!shotTaken && r !== "[]") { await shot("1-progress"); shotTaken = true; } }
    if (a > 0) break;
    await page.waitForTimeout(150);
  }
  console.log(`answer at +${Date.now() - t0}ms url=${page.url()}`);
  await page.waitForTimeout(1500);
  await shot("2-done");
  console.log("rows-done", JSON.stringify(await rows(page)));
  console.log("TEXT:\n" + (await page.locator("[aria-label='AI 응답']").first().innerText()).slice(0, 600));
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator("[aria-label='AI 응답']").first().waitFor({ timeout: 30000 });
  await page.waitForTimeout(1500);
  await shot("3-reload-after-done");
  console.log("history rows", JSON.stringify(await rows(page)), "answers", await answers(page));
  apiLog();
} catch (e) { console.log("FAIL", e.message.split("\n")[0]); await shot("fail"); console.log((await page.locator("body").innerText()).slice(0, 1200)); apiLog(); }
finally { await done(); }
