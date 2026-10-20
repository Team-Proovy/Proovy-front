import axios, { AxiosError } from "axios";
import type { AxiosAdapter, InternalAxiosRequestConfig } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// redirect 여부는 client 모듈을 읽을 때 정해지므로 import보다 먼저 켠다.
vi.hoisted(() => {
  vi.stubEnv("VITE_ENABLE_ERROR_REDIRECT", "true");
});

import { apiClient, refreshAccessToken, tokenUtils } from "./client";

afterEach(() => {
  localStorage.clear();
});

describe("refreshAccessToken", () => {
  it("동시에 불러도 refresh 요청은 한 번이다(refresh token 1회용)", async () => {
    tokenUtils.setTokens("old-access", "old-refresh");
    let resolveRefresh!: (value: unknown) => void;
    const post = vi.spyOn(axios, "post").mockReturnValue(
      new Promise((resolve) => {
        resolveRefresh = resolve;
      }),
    );

    const first = refreshAccessToken();
    const second = refreshAccessToken();
    resolveRefresh({
      data: {
        result: { accessToken: "new-access", refreshToken: "new-refresh" },
      },
    });

    expect(await Promise.all([first, second])).toEqual([
      "new-access",
      "new-access",
    ]);
    expect(post).toHaveBeenCalledOnce();
    expect(post.mock.calls[0][1]).toEqual({ refreshToken: "old-refresh" });
    expect(tokenUtils.getAccessToken()).toBe("new-access");
    expect(tokenUtils.getRefreshToken()).toBe("new-refresh");
  });

  it("실패하면 기다리던 쪽도 실패하고 token을 지운다", async () => {
    tokenUtils.setTokens("old-access", "old-refresh");
    const failure = new Error("refresh 거부");
    vi.spyOn(axios, "post").mockRejectedValue(failure);

    const results = await Promise.allSettled([
      refreshAccessToken(),
      refreshAccessToken(),
    ]);

    expect(results.map((result) => result.status)).toEqual([
      "rejected",
      "rejected",
    ]);
    expect(tokenUtils.getAccessToken()).toBeNull();
  });

  it("refresh token이 없으면 요청하지 않고 실패한다", async () => {
    const post = vi.spyOn(axios, "post");
    await expect(refreshAccessToken()).rejects.toThrow();
    expect(post).not.toHaveBeenCalled();
  });
});

describe("apiClient 401 처리", () => {
  const navigations: string[] = [];
  const recordNavigation = (event: Event) => {
    navigations.push((event as CustomEvent<{ route: string }>).detail.route);
  };

  beforeEach(() => {
    navigations.length = 0;
    window.addEventListener("proovy:navigate", recordNavigation);
    return () =>
      window.removeEventListener("proovy:navigate", recordNavigation);
  });

  /** `valid-access`만 통과시키고 나머지는 401로 돌려주는 adapter. 받은 Authorization을 기록한다. */
  const createAdapter = () => {
    const authorizations: unknown[] = [];
    const adapter: AxiosAdapter = async (config) => {
      authorizations.push(config.headers.Authorization);
      if (config.headers.Authorization === "Bearer valid-access")
        return {
          data: "ok",
          status: 200,
          statusText: "OK",
          headers: {},
          config,
        };
      const response = {
        data: { isSuccess: false, code: "TOKEN401" },
        status: 401,
        statusText: "Unauthorized",
        headers: {},
        config,
      };
      throw new AxiosError(
        "401",
        AxiosError.ERR_BAD_REQUEST,
        config as InternalAxiosRequestConfig,
        null,
        response,
      );
    };
    return { adapter, authorizations };
  };

  const refreshSucceeds = () =>
    vi.spyOn(axios, "post").mockResolvedValue({
      data: {
        result: { accessToken: "valid-access", refreshToken: "new-refresh" },
      },
    });

  it("401이면 갱신하고 새 token으로 재요청한다", async () => {
    tokenUtils.setTokens("old-access", "old-refresh");
    const post = refreshSucceeds();
    const { adapter, authorizations } = createAdapter();

    const response = await apiClient.get("/api/x", { adapter });

    expect(response.data).toBe("ok");
    expect(post).toHaveBeenCalledOnce();
    expect(authorizations).toEqual([
      "Bearer old-access",
      "Bearer valid-access",
    ]);
    expect(tokenUtils.getRefreshToken()).toBe("new-refresh");
    expect(navigations).toEqual([]);
  });

  it("동시에 받은 401은 갱신 한 번을 기다려 모두 재요청한다", async () => {
    tokenUtils.setTokens("old-access", "old-refresh");
    const post = refreshSucceeds();
    const { adapter } = createAdapter();

    const responses = await Promise.all([
      apiClient.get("/api/a", { adapter }),
      apiClient.get("/api/b", { adapter }),
    ]);

    expect(responses.map((response) => response.data)).toEqual(["ok", "ok"]);
    expect(post).toHaveBeenCalledOnce();
  });

  it("갱신이 실패하면 token을 지우고 /error/401로 보내며 갱신 오류로 reject한다", async () => {
    tokenUtils.setTokens("old-access", "old-refresh");
    const failure = new Error("refresh 거부");
    vi.spyOn(axios, "post").mockRejectedValue(failure);
    const { adapter } = createAdapter();

    await expect(apiClient.get("/api/x", { adapter })).rejects.toBe(failure);
    expect(tokenUtils.getAccessToken()).toBeNull();
    expect(navigations).toEqual(["/error/401"]);
  });

  it("refresh token이 없으면 원래 401로 reject하고, 갱신 상태가 고착되지 않는다", async () => {
    localStorage.setItem("accessToken", "old-access");
    const post = refreshSucceeds();
    const { adapter } = createAdapter();

    const rejection = await apiClient
      .get("/api/x", { adapter })
      .catch((error: unknown) => error);
    expect(rejection).toBeInstanceOf(AxiosError);
    expect((rejection as AxiosError).response?.status).toBe(401);
    expect(navigations).toEqual(["/error/401"]);
    expect(post).not.toHaveBeenCalled();

    // 예전에는 isRefreshing이 true로 남아 이후 갱신이 대기큐에서 끝나지 않았다.
    tokenUtils.setTokens("old-access", "old-refresh");
    await expect(refreshAccessToken()).resolves.toBe("valid-access");
  });

  it("skipErrorRedirect면 갱신 실패에도 redirect하지 않는다", async () => {
    tokenUtils.setTokens("old-access", "old-refresh");
    vi.spyOn(axios, "post").mockRejectedValue(new Error("refresh 거부"));
    const { adapter } = createAdapter();

    await expect(
      apiClient.get("/api/x", { adapter, skipErrorRedirect: true } as never),
    ).rejects.toThrow("refresh 거부");
    expect(navigations).toEqual([]);
  });

  it("axios 밖에서 시작한 갱신이 실패해도 기다리던 axios 요청은 /error/401로 보낸다", async () => {
    tokenUtils.setTokens("old-access", "old-refresh");
    let rejectRefresh!: (reason: unknown) => void;
    vi.spyOn(axios, "post").mockReturnValue(
      new Promise((_, reject) => {
        rejectRefresh = reject;
      }),
    );
    const { adapter, authorizations } = createAdapter();

    const external = refreshAccessToken();
    const request = apiClient.get("/api/x", { adapter });
    // axios 요청이 401을 받고 갱신 대기큐에 들어갈 때까지 기다린다.
    await vi.waitFor(() => expect(authorizations).toHaveLength(1));
    await new Promise((resolve) => setTimeout(resolve, 0));
    rejectRefresh(new Error("refresh 거부"));

    await expect(external).rejects.toThrow("refresh 거부");
    await expect(request).rejects.toThrow("refresh 거부");
    expect(axios.post).toHaveBeenCalledOnce();
    expect(navigations).toEqual(["/error/401"]);
  });

  it("재요청이 다시 401이면 또 갱신하지 않는다", async () => {
    tokenUtils.setTokens("old-access", "old-refresh");
    const post = vi.spyOn(axios, "post").mockResolvedValue({
      data: {
        result: { accessToken: "still-invalid", refreshToken: "new-refresh" },
      },
    });
    const { adapter, authorizations } = createAdapter();

    await expect(apiClient.get("/api/x", { adapter })).rejects.toBeInstanceOf(
      AxiosError,
    );
    expect(post).toHaveBeenCalledOnce();
    expect(authorizations).toEqual([
      "Bearer old-access",
      "Bearer still-invalid",
    ]);
    expect(navigations).toEqual(["/error/401"]);
  });
});
