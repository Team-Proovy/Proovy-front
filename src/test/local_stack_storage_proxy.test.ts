// @vitest-environment node
import http from "node:http";
import type { AddressInfo } from "node:net";
import { createServer } from "vite";
import { afterEach, describe, expect, it } from "vitest";
import {
  localStorageProxy,
  resolveLocalStorageProxy,
} from "../../scripts/local-stack/dev-storage-proxy";

function sendHttpRequest(options: {
  port: number;
  method: string;
  path: string;
  headers?: Record<string, string>;
  body?: Buffer;
}): Promise<{
  status: number;
  headers: http.IncomingHttpHeaders;
  body: Buffer;
}> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: "127.0.0.1",
        port: options.port,
        method: options.method,
        path: options.path,
        headers: options.headers,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => {
          resolve({
            status: res.statusCode ?? 0,
            headers: res.headers,
            body: Buffer.concat(chunks),
          });
        });
      },
    );
    req.on("error", reject);
    if (options.body) {
      req.end(options.body);
    } else {
      req.end();
    }
  });
}

describe("localStorageProxy", () => {
  const servers: Array<() => Promise<void>> = [];

  afterEach(async () => {
    while (servers.length > 0) {
      const close = servers.pop();
      if (close) {
        await close();
      }
    }
  });

  it("is disabled unless both target and bucket env vars are explicitly set", () => {
    expect(resolveLocalStorageProxy({})).toEqual({});
    expect(
      resolveLocalStorageProxy({
        DEV_STORAGE_PROXY_TARGET: "   ",
        DEV_STORAGE_BUCKET: "",
      }),
    ).toEqual({});
  });

  it("fails closed on partial config, unsafe bucket names, or invalid proxy targets", () => {
    expect(() =>
      resolveLocalStorageProxy({
        DEV_STORAGE_PROXY_TARGET: "http://127.0.0.1:4443",
      }),
    ).toThrow(/DEV_STORAGE_BUCKET/);

    expect(() =>
      resolveLocalStorageProxy({
        DEV_STORAGE_BUCKET: "proovy-local-assets",
      }),
    ).toThrow(/DEV_STORAGE_PROXY_TARGET/);

    for (const badBucket of [
      "api",
      "assets",
      "__local-stack",
      "a/b",
      "BadCap",
      "x..y",
    ]) {
      expect(() =>
        resolveLocalStorageProxy({
          DEV_STORAGE_PROXY_TARGET: "http://127.0.0.1:4443",
          DEV_STORAGE_BUCKET: badBucket,
        }),
      ).toThrow(/DEV_STORAGE_BUCKET/);
    }

    for (const badTarget of [
      "ftp://127.0.0.1:4443",
      "http://127.0.0.1:4443/subpath",
      "http://user:pass@127.0.0.1:4443",
      "not-a-url",
    ]) {
      expect(() => localStorageProxy(badTarget, "proovy-local-assets")).toThrow(
        /DEV_STORAGE_PROXY_TARGET/,
      );
    }
  });

  it("configures Vite proxy with changeOrigin=false when opted in", () => {
    expect(
      resolveLocalStorageProxy({
        DEV_STORAGE_PROXY_TARGET: "http://127.0.0.1:4443/",
        DEV_STORAGE_BUCKET: "proovy-local-assets",
      }),
    ).toEqual({
      "/proovy-local-assets/": {
        target: "http://127.0.0.1:4443",
        changeOrigin: false,
        bypass: expect.any(Function),
      },
    });
  });

  it("preserves Host, method, path, query params, Content-Type, and binary bytes across PUT/GET/HEAD", async () => {
    const stored = new Map<string, { contentType: string; bytes: Buffer }>();
    const recorded: Array<{
      method: string | undefined;
      url: string | undefined;
      host: string | undefined;
      contentType: string | undefined;
    }> = [];

    const upstream = http.createServer((req, res) => {
      recorded.push({
        method: req.method,
        url: req.url,
        host: req.headers.host,
        contentType: req.headers["content-type"],
      });

      const parsedUrl = new URL(req.url ?? "/", "http://127.0.0.1");
      if (req.method === "PUT") {
        const chunks: Buffer[] = [];
        req.on("data", (chunk: Buffer) => chunks.push(chunk));
        req.on("end", () => {
          stored.set(parsedUrl.pathname, {
            contentType: String(
              req.headers["content-type"] ?? "application/octet-stream",
            ),
            bytes: Buffer.concat(chunks),
          });
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end('{"ok":true}');
        });
        return;
      }

      if (req.method === "GET" || req.method === "HEAD") {
        const item = stored.get(parsedUrl.pathname);
        if (!item) {
          res.statusCode = 404;
          res.end();
          return;
        }
        res.statusCode = 200;
        res.setHeader("Content-Type", item.contentType);
        res.setHeader("Content-Length", String(item.bytes.length));
        if (req.method === "HEAD") {
          res.end();
        } else {
          res.end(item.bytes);
        }
        return;
      }

      res.statusCode = 405;
      res.end();
    });

    await new Promise<void>((resolve) =>
      upstream.listen(0, "127.0.0.1", resolve),
    );
    const upstreamPort = (upstream.address() as AddressInfo).port;
    servers.push(
      () =>
        new Promise<void>((resolve, reject) =>
          upstream.close((err) => (err ? reject(err) : resolve())),
        ),
    );

    const publicHost = "macmini.tailnet.ts.net";
    const vite = await createServer({
      configFile: false,
      logLevel: "silent",
      server: {
        host: "127.0.0.1",
        port: 0,
        allowedHosts: [publicHost],
        proxy: resolveLocalStorageProxy({
          DEV_STORAGE_PROXY_TARGET: `http://127.0.0.1:${upstreamPort}`,
          DEV_STORAGE_BUCKET: "proovy-local-assets",
        }),
      },
    });
    await vite.listen();
    servers.push(() => vite.close());

    const vitePort = (vite.httpServer?.address() as AddressInfo).port;
    const objectPath =
      "/proovy-local-assets/users/7/notes/42/assets/uuid-1_my%20photo.jpg?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-SignedHeaders=content-type%3Bhost&X-Goog-Signature=abcd";
    const sampleBytes = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46,
    ]);

    const putResp = await sendHttpRequest({
      port: vitePort,
      method: "PUT",
      path: objectPath,
      headers: {
        Host: publicHost,
        "Content-Type": "image/jpeg",
        "Content-Length": String(sampleBytes.length),
      },
      body: sampleBytes,
    });
    expect(putResp.status).toBe(200);

    const getResp = await sendHttpRequest({
      port: vitePort,
      method: "GET",
      path: `${objectPath}&response-content-disposition=inline`,
      headers: {
        Host: publicHost,
      },
    });
    expect(getResp.status).toBe(200);
    expect(getResp.headers["content-type"]).toBe("image/jpeg");
    expect(getResp.body).toEqual(sampleBytes);

    const headResp = await sendHttpRequest({
      port: vitePort,
      method: "HEAD",
      path: objectPath,
      headers: {
        Host: publicHost,
      },
    });
    expect(headResp.status).toBe(200);

    expect(recorded).toEqual([
      {
        method: "PUT",
        url: objectPath,
        host: publicHost,
        contentType: "image/jpeg",
      },
      {
        method: "GET",
        url: `${objectPath}&response-content-disposition=inline`,
        host: publicHost,
        contentType: undefined,
      },
      {
        method: "HEAD",
        url: objectPath,
        host: publicHost,
        contentType: undefined,
      },
    ]);
  });
  it("never forwards other buckets, listing or traversal paths to emulator APIs", async () => {
    const received: string[] = [];
    const upstream = http.createServer((req, res) => {
      received.push(req.url ?? "");
      res.end("upstream");
    });
    await new Promise<void>((resolve) =>
      upstream.listen(0, "127.0.0.1", resolve),
    );
    servers.push(
      () => new Promise<void>((resolve) => upstream.close(() => resolve())),
    );
    const vite = await createServer({
      configFile: false,
      logLevel: "silent",
      appType: "custom",
      server: {
        host: "127.0.0.1",
        port: 0,
        proxy: resolveLocalStorageProxy({
          DEV_STORAGE_PROXY_TARGET: `http://127.0.0.1:${(upstream.address() as AddressInfo).port}`,
          DEV_STORAGE_BUCKET: "proovy-local-assets",
        }),
      },
    });
    await vite.listen();
    servers.push(() => vite.close());
    const port = (vite.httpServer!.address() as AddressInfo).port;
    for (const path of [
      "/proovy-local-assets-other/object",
      "/another-bucket/object",
      "/proovy-local-assets?list-type=2",
      "/proovy-local-assets/",
      "/proovy-local-assets/../storage/v1/b",
      "/proovy-local-assets/%2e%2e/storage/v1/b",
      "/proovy-local-assets/%252e%252e/storage/v1/b",
      "/proovy-local-assets/%2f..%2fstorage/v1/b",
      "/proovy-local-assets/%5c..%5cstorage/v1/b",
      "/proovy-local-assets/..\\storage/v1/b",
      "/proovy-local-assets/%00/object",
      "/proovy-local-assets/%invalid",
    ]) {
      const response = await sendHttpRequest({ port, method: "GET", path });
      expect(response.status, path).toBe(404);
    }
    const removed = await sendHttpRequest({
      port,
      method: "DELETE",
      path: "/proovy-local-assets/object",
    });
    expect(removed.status).toBe(404);
    expect(received).toEqual([]);
  });
});
