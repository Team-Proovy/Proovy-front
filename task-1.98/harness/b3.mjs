import { compose, newToken } from "./stack.mjs";
newToken(process.env.S);
const { launch, openHome, typeAndSend, rows, answers } = await import("./common.mjs");
const { page, shot, done, apiLog } = await launch("B3");
let paused = false;
const state = async () => `rows=${JSON.stringify(await rows(page))} answers=${await answers(page)} stopBtn=${await page.getByRole("button", { name: "답변 중단" }).count()}`;
try {
  await openHome(page);
  compose("pause", "brain"); paused = true;
  const t0 = Date.now();
  await typeAndSend(page, "x^2-7x+12=0을 풀어줘");
  await page.waitForURL(/\/app\/chat\/\d+/, { timeout: 30000 });
  await page.waitForTimeout(3000);
  await shot("1-progress");
  console.log(`+${Date.now() - t0}ms before reload ${await state()}`);
  console.log("body:", JSON.stringify((await page.locator("main").innerText()).slice(0, 300)));
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(4000);
  await shot("2-after-reload");
  console.log(`+${Date.now() - t0}ms after reload ${await state()}`);
  console.log("body:", JSON.stringify((await page.locator("main").innerText()).slice(0, 300)));
  compose("unpause", "brain"); paused = false;
  console.log(`brain unpaused at +${Date.now() - t0}ms`);
  let seen = "";
  while (Date.now() - t0 < 90000) {
    const s = await state(); if (s !== seen) { console.log(`+${Date.now() - t0}ms ${s}`); seen = s; }
    if (await answers(page)) break; await page.waitForTimeout(150);
  }
  await page.waitForTimeout(1500);
  await shot("3-done");
  console.log(`final ${await state()}`);
  apiLog();
} catch (e) { console.log("FAIL", e.message.split("\n")[0]); await shot("fail"); apiLog(); }
finally { if (paused) compose("unpause", "brain"); await done(); }
