import { launch, openHome, typeAndSend, input, panelText } from "./common.mjs";
const { page, net, shot, done } = await launch(process.argv[2], "F");
const statuses = () => net.filter(n => n.method === "POST" && /\/api\/conversations$/.test(n.url)).map(n => n.status);
try {
  await openHome(page);
  await typeAndSend(page, "1번 질문 x^2-1=0");
  await page.waitForURL(/\/app\/chat\/\d+/, { timeout: 30000 });
  for (let i = 2; i <= 5; i++) {
    await page.getByRole("button", { name: "전송" }).waitFor({ timeout: 40000 });
    await page.waitForTimeout(500);
    await typeAndSend(page, `${i}번 질문 x^2-${i * i}=0`);
    await page.waitForTimeout(2500);
  }
  await page.waitForTimeout(1500);
  await shot("1-rate-limited");
  console.log("POST statuses:", JSON.stringify(statuses()));
  console.log("notices:", JSON.stringify((await panelText(page)).match(/[^\n]*(요청이 많아|잠시|다시 보낼)[^\n]*/g)));
  console.log("draft:", JSON.stringify(await input(page).innerText()));
  const send = page.getByRole("button", { name: "전송" });
  console.log("send aria-disabled:", await send.getAttribute("aria-disabled"));
  await send.click({ force: true }); await page.waitForTimeout(800);
  console.log("POST count after click while blocked:", statuses().length);
  const rej = net.find(n => n.status === 429);
  console.log("429 seen at", rej && new Date(rej.t).toISOString());
} catch (e) { console.log("FAIL", e.message.split("\n")[0]); await shot("fail"); console.log((await panelText(page)).slice(-1500)); }
finally { await done(); }
