// @vitest-environment node
import { expect, it } from "vitest";
import { createServer as createHttpServer } from "node:http";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createServer, type ViteDevServer } from "vite";
import { localApiProxy } from "../../scripts/local-stack/dev-proxy";

it.each([false, true])(
  "rewrites the actual proxy request Origin only when enabled=%s",
  async (enabled) => {
    const directory = await mkdtemp(path.join(tmpdir(), "proovy-proxy-"));
    const api = createHttpServer((request, response) => {
      response.setHeader("Content-Type", "application/json");
      response.end(JSON.stringify({ origin: request.headers.origin }));
    });
    let server: ViteDevServer | undefined;
    await new Promise<void>((resolve) => api.listen(0, "127.0.0.1", resolve));
    try {
      const address = api.address();
      if (!address || typeof address === "string")
        throw new Error("Missing API address");
      const target = "http://127.0.0.1:" + address.port;
      server = await createServer({
        configFile: false,
        root: directory,
        logLevel: "silent",
        server: {
          host: "127.0.0.1",
          port: 0,
          proxy: { "/api": localApiProxy(target, enabled) },
        },
      });
      await server.listen();
      const front = server.httpServer?.address();
      if (!front || typeof front === "string")
        throw new Error("Missing Front address");
      const origin = "https://node.example.ts.net";
      const response = await fetch(
        "http://127.0.0.1:" + front.port + "/api/probe",
        {
          method: "POST",
          headers: { Origin: origin },
        },
      );
      expect(await response.json()).toEqual({
        origin: enabled ? target : origin,
      });
    } finally {
      await server?.close();
      await new Promise<void>((resolve, reject) =>
        api.close((error) => (error ? reject(error) : resolve())),
      );
      await rm(directory, { recursive: true, force: true });
    }
  },
);
