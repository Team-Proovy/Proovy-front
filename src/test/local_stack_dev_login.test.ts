// @vitest-environment node
import { afterEach, beforeEach, expect, it } from "vitest";
import { mkdtemp, readFile, rm, writeFile, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { request as httpRequest } from "node:http";
import { createServer, type ViteDevServer } from "vite";
import { devLoginPlugin } from "../../scripts/local-stack/dev-login";

let directory: string;
let server: ViteDevServer;
let origin: string;
let userFile: string;
let counter: string;

beforeEach(async () => {
  directory = await mkdtemp(path.join(tmpdir(), "proovy-dev-login-"));
  userFile = path.join(directory, "user.local");
  counter = path.join(directory, "counter");
  const issuer = path.join(directory, "issuer.cjs");
  await writeFile(
    issuer,
    `const fs=require('node:fs');const file=process.argv[2];const at=process.argv.indexOf('--user');let id;if(at>=0){id=process.argv[at+1];}else{let previous=0;try{previous=Number(fs.readFileSync(file,'utf8'));}catch{}id=String(previous+1);fs.writeFileSync(file,id);}process.stdout.write(JSON.stringify({userId:id,accessToken:'synthetic-token-'+id}));`,
  );
  server = await createServer({
    configFile: false,
    root: directory,
    logLevel: "silent",
    plugins: [devLoginPlugin([process.execPath, issuer, counter], userFile)],
    server: {
      host: "127.0.0.1",
      port: 0,
      allowedHosts: ["node.example.ts.net"],
    },
  });
  await server.listen();
  const address = server.httpServer?.address();
  if (!address || typeof address === "string")
    throw new Error("Missing test server address");
  origin = "http://127.0.0.1:" + address.port;
});

afterEach(async () => {
  await server?.close();
  await rm(directory, { recursive: true, force: true });
});

function login(newUser = false, headers: Record<string, string> = {}) {
  if (headers.Host) {
    return new Promise<Response>((resolve, reject) => {
      const request = httpRequest(
        origin + "/__local-stack/login",
        {
          method: "POST",
          headers: {
            Origin: origin,
            "Content-Type": "application/json",
            ...headers,
          },
        },
        (response) => {
          const chunks: Buffer[] = [];
          response.on("data", (chunk: Buffer) => chunks.push(chunk));
          response.on("end", () =>
            resolve(
              new Response(Buffer.concat(chunks).toString(), {
                status: response.statusCode,
                headers: response.headers as Record<string, string>,
              }),
            ),
          );
        },
      );
      request.on("error", reject);
      request.end(JSON.stringify({ newUser }));
    });
  }
  return fetch(origin + "/__local-stack/login", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json", ...headers },
    body: JSON.stringify({ newUser }),
  });
}

it("reissues for the saved user and creates another user only on request", async () => {
  const first = await login();
  expect(first.headers.get("cache-control")).toBe("no-store");
  expect(await first.json()).toEqual({
    userId: "1",
    accessToken: "synthetic-token-1",
  });
  expect(await (await login()).json()).toEqual({
    userId: "1",
    accessToken: "synthetic-token-1",
  });
  expect(await (await login(true)).json()).toEqual({
    userId: "2",
    accessToken: "synthetic-token-2",
  });
  expect(await readFile(userFile, "utf8")).toBe("2");
});

it("serializes simultaneous initial logins into the same account", async () => {
  const responses = await Promise.all([login(), login()]);
  expect(
    (await Promise.all(responses.map((response) => response.json()))).map(
      (result) => result.userId,
    ),
  ).toEqual(["1", "1"]);
  expect(await readFile(counter, "utf8")).toBe("1");
});

it("rejects foreign origins and matching untrusted Host/Origin before issuing tokens", async () => {
  expect(
    (await login(false, { Origin: "https://untrusted.example" })).status,
  ).toBe(403);
  expect(
    (
      await login(false, {
        Origin: "http://untrusted.example",
        Host: "untrusted.example",
      })
    ).status,
  ).toBe(403);
  await expect(access(counter)).rejects.toThrow();
});

it("accepts the explicitly configured tailnet host with HTTPS Origin", async () => {
  const response = await login(false, {
    Origin: "https://node.example.ts.net",
    Host: "node.example.ts.net",
  });
  expect(response.status).toBe(200);
});

it("rejects injected issuer arguments and malformed request bodies", async () => {
  const response = await fetch(origin + "/__local-stack/login", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify({ newUser: false, userId: "1; false" }),
  });
  expect(response.status).toBe(400);
  expect((await fetch(origin + "/__local-stack/login")).status).toBe(405);
  await expect(access(counter)).rejects.toThrow();
});

it("serves the iPad login page without embedding a token", async () => {
  const response = await fetch(origin + "/dev-login");
  const page = await response.text();
  expect(page).toContain("새 사용자");
  expect(page).toContain("/app/home");
  expect(page).not.toContain("synthetic-token");
  await expect(access(counter)).rejects.toThrow();
});
