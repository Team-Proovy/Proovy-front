import { launch, planNext, control, openHome, typeAndSend, input, panelText } from "./common.mjs";
const { page, net, shot, done } = await launch(process.argv[2], "C");
const rows = () => page.locator("ol[aria-label='진행 상황'] > li").allInnerTexts();
const posts = () => net.filter(n => n.method === "POST" && /\/api\/conversations$/.test(n.url)).length;
const sendArea = () => page.evaluate(() => [...document.querySelectorAll("button")].filter(b => /중단|전송/.test((b.getAttribute("aria-label") || "") + b.innerText) && !b.hasAttribute("aria-controls")).map(b => `${(b.getAttribute("aria-label") || b.innerText).trim()}(disabled=${b.disabled})`));
try {
  await openHome(page);
  await planNext(page, { scenario: "default", faults: { hold_at: "verification" } });
  await typeAndSend(page, "x^2-5x+6=0을 풀어줘");
  await page.waitForURL(/\/app\/chat\/\d+/, { timeout: 30000 });
  await page.waitForTimeout(2500);
  await input(page).click(); await page.keyboard.type("다음 질문 초안"); await page.keyboard.press("Enter");
  await page.waitForTimeout(500);
  console.log("[active] send area:", JSON.stringify(await sendArea()), "posts:", posts());
  await shot("1-active-draft");
  // 정지 → CANCELING(약 0.8초) 동안 바로 상태를 읽는다
  const t0 = Date.now();
  await page.getByRole("button", { name: "답변 중단" }).click();
  await page.getByText("중단 중").first().waitFor({ timeout: 2000 }).then(() => console.log("[canceling] '중단 중' seen at +" + (Date.now() - t0) + "ms")).catch(() => console.log("[canceling] '중단 중' not seen"));
  console.log("[canceling] send area:", JSON.stringify(await sendArea()));
  await page.keyboard.press("Enter");
  await shot("2-canceling");
  console.log("[canceling] posts after Enter:", posts(), "+" + (Date.now() - t0) + "ms");
  await page.waitForTimeout(6000);
  await shot("3-canceled");
  console.log("[canceled] rows:", JSON.stringify(await rows()));
  console.log("[canceled] draft:", JSON.stringify(await input(page).innerText()), "posts:", posts(), "AI응답:", await page.locator("[aria-label='AI 응답']").count(), "send area:", JSON.stringify(await sendArea()));
  console.log("[canceled] texts:", JSON.stringify((await panelText(page)).match(/[^\n]*(중단|취소)[^\n]*/g)));
  for (const n of net.filter(n => n.url?.includes("/api/ai-runs") || (n.url?.includes("/api/conversations") && n.method === "POST"))) console.log(new Date(n.t).toISOString().slice(14, 23), n.method, n.status, n.url.replace(/http:\/\/localhost:519\d/, ""));
} catch (e) { console.log("FAIL", e.message.split("\n")[0]); await shot("fail"); console.log((await panelText(page)).slice(0, 1200)); }
finally { await done(); }
