import axios from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";
import { refreshAccessToken, tokenUtils } from "./client";

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
