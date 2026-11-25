import { render, screen } from "@testing-library/react";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { KakaoCallbackPage } from "./KakaoCallbackPage";
import { NaverCallbackPage } from "./NaverCallbackPage";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});

describe("OAuth callback direct entry when provider is disabled", () => {
  it("KakaoCallbackPage preserves existing tokens and skips exchange when Kakao is not configured", () => {
    vi.stubEnv("VITE_KAKAO_CLIENT_ID", "");
    vi.stubEnv("VITE_KAKAO_REDIRECT_URI", "");
    localStorage.setItem("accessToken", "existing-access");
    localStorage.setItem("refreshToken", "existing-refresh");
    const postSpy = vi.spyOn(axios, "post");

    render(
      <MemoryRouter initialEntries={["/oauth/kakao/callback?code=auth-code"]}>
        <KakaoCallbackPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText("카카오 로그인이 현재 환경에서 비활성화되어 있습니다."),
    ).toBeInTheDocument();
    expect(postSpy).not.toHaveBeenCalled();
    expect(localStorage.getItem("accessToken")).toBe("existing-access");
    expect(localStorage.getItem("refreshToken")).toBe("existing-refresh");
  });

  it("NaverCallbackPage preserves existing tokens and skips exchange when Naver is not configured", () => {
    vi.stubEnv("VITE_NAVER_CLIENT_ID", "");
    vi.stubEnv("VITE_NAVER_REDIRECT_URI", "");
    localStorage.setItem("accessToken", "existing-access");
    localStorage.setItem("refreshToken", "existing-refresh");
    sessionStorage.setItem("naver_oauth_state", "valid-state");
    const postSpy = vi.spyOn(axios, "post");

    render(
      <MemoryRouter
        initialEntries={[
          "/oauth/naver/callback?code=auth-code&state=valid-state",
        ]}
      >
        <NaverCallbackPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText("네이버 로그인이 현재 환경에서 비활성화되어 있습니다."),
    ).toBeInTheDocument();
    expect(postSpy).not.toHaveBeenCalled();
    expect(localStorage.getItem("accessToken")).toBe("existing-access");
    expect(localStorage.getItem("refreshToken")).toBe("existing-refresh");
    expect(sessionStorage.getItem("naver_oauth_state")).toBe("valid-state");
  });
});
