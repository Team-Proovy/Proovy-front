import { launch, planNext, control, openHome, typeAndSend, panelText } from "./common.mjs";
const { page, context, net, shot, done } = await launch(process.argv[2], "B");
const rows = () => page.locator("ol[aria-label='진행 상황'] > li").allInnerTexts();
try {
  await openHome(page);
  await planNext(page, { scenario: "default", faults: { hold_at: "verification" } });
  await typeAndSend(page, "x^2-5x+6=0을 풀어줘");
  await page.waitForURL(/\/app\/chat\/\d+/, { timeout: 30000 });
  await page.waitForTimeout(2500);
  const before = await rows();
  console.log("before", JSON.stringify(before));
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator("ol[aria-label='진행 상황'] > li").first().waitFor({ timeout: 30000 });
  await page.waitForTimeout(2500);
  await shot("1-after-reload");
  const afterReload = await rows();
  console.log("afterReload", JSON.stringify(afterReload), "AI응답:", await page.locator("[aria-label='AI 응답']").count());
  // 네트워크 끊김
  console.log("cut:", await (await fetch("http://127.0.0.1:29691/cut?ms=5000", { method: "POST" })).text());
  await page.waitForTimeout(2500);
  await shot("2-disconnected");
  console.log("disconnected notice:", JSON.stringify((await panelText(page)).match(/[^\n]*연결[^\n]*/g)));
  console.log("rows-while-cut", JSON.stringify(await rows()));
  await page.waitForTimeout(8000);
  await shot("2b-reconnected");
  const afterOnline = await rows();
  console.log("afterOnline", JSON.stringify(afterOnline));
  await control("POST", `/__testkit__/v1/plans/${page.__lastRequestId}/release`);
  await page.locator("[aria-label='AI 응답']").first().waitFor({ timeout: 40000 });
  await page.waitForTimeout(1500);
  await shot("3-done");
  console.log("final", JSON.stringify(await rows()), "AI응답:", await page.locator("[aria-label='AI 응답']").count(), "boxes:", await page.locator("ol[aria-label='진행 상황']").count());
  // 완료 뒤 새로고침: 저장된 대화 조회로 같은 결과
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator("[aria-label='AI 응답']").first().waitFor({ timeout: 30000 });
  await page.waitForTimeout(1500);
  await shot("4-reload-after-done");
  console.log("history", JSON.stringify(await rows()), "AI응답:", await page.locator("[aria-label='AI 응답']").count());
  for (const n of net.filter(n => n.url?.includes("/api/ai-runs") || n.url?.includes("/api/conversations"))) console.log(new Date(n.t).toISOString().slice(14,23), n.method, n.status, n.url.replace("http://localhost:5196", ""), n.lastEventId ?? "");
} catch (e) { console.log("FAIL", e.message.split("\n")[0]); await shot("fail"); console.log((await panelText(page)).slice(0, 1200)); }
finally { await done(); }
