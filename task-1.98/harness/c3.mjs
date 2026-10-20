import { compose, newToken } from "./stack.mjs";
newToken(process.env.S);
const { launch, openHome, typeAndSend, rows, answers } = await import("./common.mjs");
const { page, shot, done, apiLog } = await launch("C3");
let paused = false;
const texts = async () => JSON.stringify((await page.locator("main").innerText()).match(/[^\n]*(중단|취소|준비)[^\n]*/g));
try {
  await openHome(page);
  compose("pause", "brain"); paused = true;
  const t0 = Date.now();
  await typeAndSend(page, "x^2-9x+20=0을 풀어줘");
  const stop = page.getByRole("button", { name: "답변 중단" });
  await stop.waitFor({ timeout: 15000 });
  await page.waitForTimeout(1500);
  await stop.click();
  console.log(`stop clicked at +${Date.now() - t0}ms`);
  await page.getByText("중단 중").first().waitFor({ timeout: 3000 }).then(() => console.log(`'중단 중' at +${Date.now() - t0}ms`)).catch(() => console.log("'중단 중' not seen"));
  await shot("1-canceling");
  await page.waitForTimeout(3000);
  console.log(`+${Date.now() - t0}ms while paused: ${await texts()} answers=${await answers(page)}`);
  compose("unpause", "brain"); paused = false;
  console.log(`brain unpaused at +${Date.now() - t0}ms`);
  await page.waitForTimeout(8000);
  await shot("2-canceled");
  console.log(`+${Date.now() - t0}ms after unpause: ${await texts()} rows=${JSON.stringify(await rows(page))} answers=${await answers(page)} stopBtn=${await stop.count()}`);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(4000);
  await shot("3-reload-after-cancel");
  console.log(`after reload: ${await texts()} answers=${await answers(page)} stopBtn=${await stop.count()}`);
  apiLog();
} catch (e) { console.log("FAIL", e.message.split("\n")[0]); await shot("fail"); apiLog(); }
finally { if (paused) compose("unpause", "brain"); await done(); }
