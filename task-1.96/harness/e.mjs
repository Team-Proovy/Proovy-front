import { launch, planNext, control, openHome, typeAndSend, input, panelText, BASE } from "./common.mjs";
const { page, context, net, shot, done } = await launch(process.argv[2], "E");
const resp = (p) => p.locator("[aria-label='AI 응답']");
try {
  await openHome(page);
  await planNext(page, { scenario: "default", faults: {} });
  await typeAndSend(page, "x^2-5x+6=0을 풀어줘");
  await page.waitForURL(/\/app\/chat\/\d+/, { timeout: 30000 });
  await resp(page).first().waitFor({ timeout: 40000 });
  const noteUrl = page.url();
  // 탭 2: 같은 Note를 run이 없을 때 연다
  const tab2 = await context.newPage();
  const net2 = [];
  tab2.on("response", async (r) => { if (r.request().method() === "POST" && r.url().endsWith("/api/conversations")) net2.push({ status: r.status(), url: r.url() }); });
  await tab2.goto(noteUrl, { waitUntil: "domcontentloaded" });
  await resp(tab2).first().waitFor({ timeout: 30000 });
  // 탭 1: 두 번째 질문(검증에서 대기)
  await planNext(page, { scenario: "default", faults: { hold_at: "verification" } });
  await typeAndSend(page, "x^2-7x+12=0을 풀어줘");
  await page.locator("ol[aria-label='진행 상황']").nth(0).waitFor({ timeout: 20000 });
  await page.waitForTimeout(2000);
  // 탭 2: 같은 Note에 전송 → 409 activeRun
  await tab2.bringToFront();
  await typeAndSend(tab2, "탭 2에서 보낸 질문");
  await tab2.waitForTimeout(3000);
  await tab2.screenshot({ path: `${process.env.S}/shots/E-1-tab2-after-409.png` });
  console.log("tab2 POST:", JSON.stringify(net2));
  console.log("tab2 rows:", JSON.stringify(await tab2.locator("ol[aria-label='진행 상황'] > li").allInnerTexts()));
  console.log("tab2 draft:", JSON.stringify(await input(tab2).innerText()), "| send area:", JSON.stringify(await tab2.evaluate(() => [...document.querySelectorAll("button")].filter(b => /중단|전송/.test((b.getAttribute("aria-label") || "") + b.innerText) && !b.hasAttribute("aria-controls")).map(b => b.getAttribute("aria-label") || b.innerText))));
  console.log("tab2 notices:", JSON.stringify((await panelText(tab2)).match(/[^\n]*(이미|진행 중인|답변)[^\n]*/g)));
  const tab2Events = (await tab2.evaluate(() => performance.getEntriesByType("resource").map(e => e.name).filter(n => n.includes("/events"))));
  console.log("tab2 events GET:", JSON.stringify(tab2Events.map(u => u.replace(/^http:\/\/localhost:519\d/, ""))));
  await control("POST", `/__testkit__/v1/plans/${page.__lastRequestId}/release`);
  await tab2.waitForFunction(() => document.querySelectorAll("[aria-label='AI 응답']").length >= 2, null, { timeout: 40000 });
  await tab2.waitForTimeout(1500);
  await tab2.screenshot({ path: `${process.env.S}/shots/E-2-tab2-done.png` });
  console.log("tab1 responses:", await resp(page).count(), "tab2 responses:", await resp(tab2).count(), "tab2 user bubbles with '탭 2':", await tab2.getByText("탭 2에서 보낸 질문").count());
} catch (e) { console.log("FAIL", e.message.split("\n")[0]); await shot("fail"); }
finally { await done(); }
