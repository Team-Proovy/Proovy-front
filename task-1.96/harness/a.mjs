import { launch, planNext, control, openHome, typeAndSend, activityRows, panelText } from "./common.mjs";
const { page, shot, done } = await launch(process.argv[2], "A");
try {
  await openHome(page);
  await planNext(page, { scenario: "default", faults: { hold_at: "verification" } });
  await typeAndSend(page, "x^2-5x+6=0을 풀어줘");
  await page.waitForURL(/\/app\/chat\/\d+/, { timeout: 30000 });
  await page.waitForTimeout(2500);
  await shot("1-progress");
  console.log("url", page.url());
  console.log("rows-progress", JSON.stringify(await activityRows(page)));
  console.log("AI응답 region during hold:", await page.locator("[aria-label='AI 응답']").count());
  // 접기
  const header = page.locator("button[aria-expanded]").filter({ hasText: "" }).first();
  const box = page.locator("button[aria-controls]").first();
  console.log("box expanded:", await box.getAttribute("aria-expanded"), "|", await box.innerText());
  await box.click(); await page.waitForTimeout(300);
  console.log("after click expanded:", await box.getAttribute("aria-expanded"));
  await shot("2-collapsed");
  await box.click();
  await control("POST", `/__testkit__/v1/plans/${page.__lastRequestId}/release`);
  await page.locator("[aria-label='AI 응답']").first().waitFor({ timeout: 30000 });
  await page.waitForTimeout(1500);
  await shot("3-done");
  console.log("rows-done", JSON.stringify(await activityRows(page)));
  console.log("TEXT:\n" + (await page.locator("[aria-label='AI 응답']").first().innerText()));
  console.log("expanders:", JSON.stringify(await page.locator("button[aria-expanded]").evaluateAll(b => b.map(x => (x.getAttribute("aria-label")||x.innerText).slice(0,40)+"="+x.getAttribute("aria-expanded")))));
  // 같은 Note 두 번째 질문
  await planNext(page, { scenario: "default" });
  await typeAndSend(page, "이번엔 x^2-7x+12=0을 풀어줘");
  await page.waitForFunction(() => document.querySelectorAll("[aria-label='AI 응답']").length >= 2, null, { timeout: 40000 });
  await page.waitForTimeout(1500);
  await shot("4-second");
  console.log("responses:", await page.locator("[aria-label='AI 응답']").count(), "url", page.url());
} catch (e) { console.log("FAIL", e.message.split("\n")[0]); await shot("fail"); console.log((await panelText(page)).slice(0, 1500)); }
finally { await done(); }
