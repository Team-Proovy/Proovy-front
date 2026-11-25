import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LoginPage } from "./LoginPage";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("LoginPage OAuth provider visibility", () => {
  it("shows both Kakao and Naver buttons when both providers are configured", () => {
    vi.stubEnv("VITE_KAKAO_CLIENT_ID", "kakao-client-id");
    vi.stubEnv(
      "VITE_KAKAO_REDIRECT_URI",
      "https://proovy.ai.kr/oauth/kakao/callback",
    );
    vi.stubEnv("VITE_NAVER_CLIENT_ID", "naver-client-id");
    vi.stubEnv(
      "VITE_NAVER_REDIRECT_URI",
      "https://proovy.ai.kr/oauth/naver/callback",
    );

    render(<LoginPage />);

    expect(
      screen.getByRole("button", { name: "카카오 로그인" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "네이버 로그인" }),
    ).toBeInTheDocument();
  });

  it("hides Naver button when Naver OAuth env vars are empty (staging)", () => {
    vi.stubEnv("VITE_KAKAO_CLIENT_ID", "kakao-client-id");
    vi.stubEnv(
      "VITE_KAKAO_REDIRECT_URI",
      "https://proovy-staging.web.app/oauth/kakao/callback",
    );
    vi.stubEnv("VITE_NAVER_CLIENT_ID", "");
    vi.stubEnv("VITE_NAVER_REDIRECT_URI", "");

    render(<LoginPage />);

    expect(
      screen.getByRole("button", { name: "카카오 로그인" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "네이버 로그인" }),
    ).not.toBeInTheDocument();
  });

  it("hides Kakao button when Kakao OAuth env vars are empty", () => {
    vi.stubEnv("VITE_KAKAO_CLIENT_ID", "");
    vi.stubEnv("VITE_KAKAO_REDIRECT_URI", "");
    vi.stubEnv("VITE_NAVER_CLIENT_ID", "naver-client-id");
    vi.stubEnv(
      "VITE_NAVER_REDIRECT_URI",
      "https://proovy.ai.kr/oauth/naver/callback",
    );

    render(<LoginPage />);

    expect(
      screen.queryByRole("button", { name: "카카오 로그인" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "네이버 로그인" }),
    ).toBeInTheDocument();
  });

  it("renders fallback notice without crashing when no OAuth provider is configured", () => {
    vi.stubEnv("VITE_KAKAO_CLIENT_ID", "");
    vi.stubEnv("VITE_KAKAO_REDIRECT_URI", "");
    vi.stubEnv("VITE_NAVER_CLIENT_ID", "");
    vi.stubEnv("VITE_NAVER_REDIRECT_URI", "");

    render(<LoginPage />);

    expect(
      screen.queryByRole("button", { name: "카카오 로그인" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "네이버 로그인" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("설정된 소셜 로그인 제공자가 없습니다."),
    ).toBeInTheDocument();
  });
});
