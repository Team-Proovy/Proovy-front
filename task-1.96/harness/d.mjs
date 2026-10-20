import { launch, planNext, openHome, typeAndSend, panelText } from "./common.mjs";
const { page, shot, done } = await launch(process.argv[2], "D");
const responses = () => page.locator("[aria-label='AI 응답']");
const waitIdle = () => page.getByRole("button", { name: "전송" }).waitFor({ timeout: 40000 });
const last = async () => (await responses().last().innerText());
try {
  await openHome(page);
  const steps = [
    ["unsupported_only", "이 문제로 영상 만들어줘"],
    ["inconclusive", "x^3-6x^2+11x-6=0을 풀어줘"],
    ["mixed", "x^2-4=0을 풀고 영상도 만들어줘"],
    ["clarification", "이거 풀어줘"],
  ];
  for (const [i, [scenario, text]] of steps.entries()) {
    await planNext(page, { scenario, faults: {} });
    await typeAndSend(page, text);
    if (i === 0) await page.waitForURL(/\/app\/chat\/\d+/, { timeout: 30000 });
    await page.waitForFunction((n) => document.querySelectorAll("[aria-label='AI 응답']").length >= n, i + 1, { timeout: 40000 });
    await waitIdle();
    await page.waitForTimeout(1200);
    await responses().last().scrollIntoViewIfNeeded();
    await shot(`${i + 1}-${scenario}`);
    console.log(`=== ${scenario}\n${await last()}`);
    const toggles = await responses().last().locator("button[aria-expanded]").evaluateAll(b => b.map(x => `${x.getAttribute("aria-label")}=${x.getAttribute("aria-expanded")}`));
    if (toggles.length) console.log("toggles:", JSON.stringify(toggles));
  }
} catch (e) { console.log("FAIL", e.message.split("\n")[0]); await shot("fail"); console.log((await panelText(page)).slice(-1500)); }
finally { await done(); }
