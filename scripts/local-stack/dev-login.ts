import { execFile } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import type { IncomingMessage } from "node:http";
import type { Plugin } from "vite";

const PAGE = `<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>개발 로그인</title>
<style>body{font:18px system-ui;max-width:420px;margin:15vh auto;padding:24px;color:#222}button{font:inherit;padding:14px 24px;margin:8px;border-radius:12px;border:1px solid #ccc;background:#fff}button:first-of-type{background:#333;color:white}p{line-height:1.6}</style>
<h1>개발 로그인</h1><p>같은 사용자로 로그인하면 이전 노트에서 이어갈 수 있습니다.</p><button id="login">로그인</button><button id="create">새 사용자</button><p id="status" role="status"></p>
<script>async function login(newUser){const buttons=document.querySelectorAll('button');buttons.forEach(b=>b.disabled=true);document.getElementById('status').textContent='로그인 중…';try{const response=await fetch('/__local-stack/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({newUser})});if(!response.ok)throw new Error();const data=await response.json();localStorage.setItem('accessToken',data.accessToken);localStorage.removeItem('refreshToken');localStorage.setItem('auth-storage',JSON.stringify({state:{user:{userId:Number(data.userId),nickname:'local'},isAuthenticated:true},version:0}));location.assign('/app/home');}catch{document.getElementById('status').textContent='로그인하지 못했습니다. 잠시 후 다시 시도해 주세요.';buttons.forEach(b=>b.disabled=false);}}document.getElementById('login').onclick=()=>login(false);document.getElementById('create').onclick=()=>login(true);</script></html>`;

type TokenResult = { userId: string; accessToken: string };

function execute(command: string[], userId?: string): Promise<TokenResult> {
  const args = [...command.slice(1), ...(userId ? ["--user", userId] : [])];
  return new Promise((resolve, reject) => {
    execFile(
      command[0],
      args,
      { timeout: 20_000, maxBuffer: 64_000 },
      (error, stdout) => {
        if (error) return reject(new Error("Token issuer unavailable"));
        try {
          const data: unknown = JSON.parse(stdout);
          if (!data || typeof data !== "object") throw new Error();
          const result = data as Record<string, unknown>;
          if (
            typeof result.userId !== "string" ||
            !/^[1-9][0-9]*$/.test(result.userId) ||
            typeof result.accessToken !== "string" ||
            !result.accessToken ||
            (userId !== undefined && result.userId !== userId)
          )
            throw new Error();
          resolve({ userId: result.userId, accessToken: result.accessToken });
        } catch {
          reject(new Error("Invalid token issuer response"));
        }
      },
    );
  });
}

async function newUserRequest(request: IncomingMessage): Promise<boolean> {
  if (request.headers["content-type"]?.split(";")[0] !== "application/json")
    throw new Error();
  let raw = "";
  for await (const chunk of request) {
    raw += String(chunk);
    if (Buffer.byteLength(raw) > 1024) throw new Error();
  }
  const body: unknown = JSON.parse(raw);
  if (!body || typeof body !== "object" || Array.isArray(body))
    throw new Error();
  const fields = body as Record<string, unknown>;
  if (Object.keys(fields).length !== 1 || typeof fields.newUser !== "boolean")
    throw new Error();
  return fields.newUser;
}

/** Enabled only by trusted dev-server configuration; no shell command comes from HTTP. */
export function devLoginPlugin(command: string[], userFile: string): Plugin {
  if (
    !command.length ||
    command.some((arg) => typeof arg !== "string" || !arg)
  ) {
    throw new Error(
      "DEV_LOGIN_ISSUE_CMD must be a non-empty JSON array of command arguments",
    );
  }
  let queue = Promise.resolve();
  async function issue(newUser: boolean): Promise<TokenResult> {
    let userId: string | undefined;
    if (!newUser) {
      try {
        userId = (await readFile(userFile, "utf8")).trim();
        if (!/^[1-9][0-9]*$/.test(userId))
          throw new Error("Invalid saved dev user");
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      }
    }
    const result = await execute(command, userId);
    await writeFile(userFile, result.userId, { mode: 0o600 });
    return result;
  }
  return {
    name: "local-stack-dev-login",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const pathname = request.url?.split("?")[0];
        if (pathname !== "/dev-login" && pathname !== "/__local-stack/login")
          return next();
        const allowed = server.config.server.allowedHosts;
        const hosts = [
          "localhost",
          "127.0.0.1",
          "[::1]",
          ...(Array.isArray(allowed) ? allowed : []),
        ];
        let hostname = "";
        try {
          hostname = new URL(
            "http://" + request.headers.host,
          ).hostname.toLowerCase();
        } catch {
          /* rejected below */
        }
        if (!hosts.some((host) => host.toLowerCase() === hostname)) {
          response.statusCode = 403;
          response.end();
          return;
        }
        response.setHeader("Cache-Control", "no-store");
        response.setHeader("X-Content-Type-Options", "nosniff");
        if (pathname === "/dev-login" && request.method === "GET") {
          response.setHeader("Content-Type", "text/html; charset=utf-8");
          response.end(PAGE);
          return;
        }
        if (pathname !== "/__local-stack/login" || request.method !== "POST") {
          response.statusCode = 405;
          response.end();
          return;
        }
        try {
          const origin = new URL(request.headers.origin ?? "");
          if (
            !["http:", "https:"].includes(origin.protocol) ||
            origin.host !== request.headers.host
          )
            throw new Error();
        } catch {
          response.statusCode = 403;
          response.end();
          return;
        }
        let newUser: boolean;
        try {
          newUser = await newUserRequest(request);
        } catch {
          response.statusCode = 400;
          response.end();
          return;
        }
        const current = queue.then(() => issue(newUser));
        queue = current.then(
          () => {},
          () => {},
        );
        try {
          const result = await current;
          response.setHeader("Content-Type", "application/json");
          response.end(JSON.stringify(result));
        } catch {
          response.statusCode = 503;
          response.end();
        }
      });
    },
  };
}
