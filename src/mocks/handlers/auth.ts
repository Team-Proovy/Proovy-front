import { http, HttpResponse, delay } from "msw";
import type { ApiResponse } from "../../shared/api/shared_types";
import type {
  LoginResult,
  SignupCompleteResponse,
  NaverAuthUrlResponse,
  KakaoLoginRequest,
  NaverLoginRequest,
  SignupCompleteRequest,
  TokenRefreshRequest,
} from "../../features/auth/api/auth_types";
import type { TokenDto } from "../../shared/api/shared_types";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ============================================================
// 목 데이터
// ============================================================

/** 기존 회원 로그인 응답 (목) */
const mockLoginResult: LoginResult = {
  loginType: "LOGIN",
  user: {
    id: 1,
    name: "지현구",
    nickname: "proovy_user",
    email: "user@example.com",
    profileImageUrl: null,
  },
  token: {
    accessToken: "mock_access_token_12345",
    refreshToken: "mock_refresh_token_67890",
    accessTokenExpiresIn: 3600,
    refreshTokenExpiresIn: 604800,
  },
};

/** 신규 회원 (회원가입 필요) 응답 (목) */
const mockSignupRequiredResult: LoginResult = {
  loginType: "SIGNUP_REQUIRED",
  signupToken: "mock_signup_token_abc123",
  kakaoInfo: {
    id: "kakao_12345",
    email: "newuser@kakao.com",
  },
};

/** 회원가입 완료 응답 (목) */
const mockSignupCompleteResponse: SignupCompleteResponse = {
  user: {
    userId: 2,
    email: "newuser@kakao.com",
    name: "신규유저",
    nickname: "new_proovy",
    department: "컴퓨터공학과",
    profileImageUrl: null,
    createdAt: new Date().toISOString(),
  },
  token: {
    accessToken: "mock_access_token_new_user",
    refreshToken: "mock_refresh_token_new_user",
    accessTokenExpiresIn: 3600,
    refreshTokenExpiresIn: 604800,
  },
  welcomeCredit: 100,
};

/** 토큰 갱신 응답 (목) */
const mockTokenDto: TokenDto = {
  accessToken: "mock_new_access_token",
  refreshToken: "mock_new_refresh_token",
  accessTokenExpiresIn: 3600,
  refreshTokenExpiresIn: 604800,
};

// ============================================================
// Auth API 핸들러
// ============================================================

export const authHandlers = [
  // 카카오 로그인
  http.post<never, KakaoLoginRequest>(
    `${BASE_URL}/api/auth/login/kakao`,
    async ({ request }) => {
      await delay(500); // 네트워크 지연 시뮬레이션

      const body = await request.json();
      console.log("[MSW] 카카오 로그인 요청:", body);

      // 특정 코드로 신규 회원 시뮬레이션
      if (body.authorizationCode === "NEW_USER") {
        return HttpResponse.json<ApiResponse<LoginResult>>({
          isSuccess: true,
          code: "AUTH2001",
          message: "회원가입이 필요합니다.",
          result: mockSignupRequiredResult,
        });
      }

      return HttpResponse.json<ApiResponse<LoginResult>>({
        isSuccess: true,
        code: "AUTH2000",
        message: "로그인 성공",
        result: mockLoginResult,
      });
    },
  ),

  // 네이버 로그인 URL 생성
  http.get(`${BASE_URL}/api/auth/naver/url`, async () => {
    await delay(300);

    const response: NaverAuthUrlResponse = {
      authUrl:
        "https://nid.naver.com/oauth2.0/authorize?client_id=xxx&state=mock_state",
      state: "mock_state_12345",
    };

    return HttpResponse.json<ApiResponse<NaverAuthUrlResponse>>({
      isSuccess: true,
      code: "AUTH2000",
      message: "URL 생성 성공",
      result: response,
    });
  }),

  // 네이버 로그인
  http.post<never, NaverLoginRequest>(
    `${BASE_URL}/api/auth/login/naver`,
    async ({ request }) => {
      await delay(500);

      const body = await request.json();
      console.log("[MSW] 네이버 로그인 요청:", body);

      return HttpResponse.json<ApiResponse<LoginResult>>({
        isSuccess: true,
        code: "AUTH2000",
        message: "로그인 성공",
        result: {
          ...mockLoginResult,
          naverInfo: {
            id: "naver_12345",
            email: "user@naver.com",
            name: "네이버유저",
          },
        },
      });
    },
  ),

  // 회원가입 완료
  http.post<never, SignupCompleteRequest>(
    `${BASE_URL}/api/auth/signup/complete`,
    async ({ request }) => {
      await delay(700);

      const body = await request.json();
      console.log("[MSW] 회원가입 완료 요청:", body);

      return HttpResponse.json<ApiResponse<SignupCompleteResponse>>(
        {
          isSuccess: true,
          code: "AUTH2010",
          message: "회원가입 성공",
          result: {
            ...mockSignupCompleteResponse,
            user: {
              ...mockSignupCompleteResponse.user,
              name: body.name,
              nickname: body.nickname,
              department: body.department,
            },
          },
        },
        { status: 201 },
      );
    },
  ),

  // 토큰 갱신
  http.post<never, TokenRefreshRequest>(
    `${BASE_URL}/api/auth/refresh`,
    async ({ request }) => {
      await delay(300);

      const body = await request.json();
      console.log("[MSW] 토큰 갱신 요청:", body);

      // refreshToken 만료 시뮬레이션
      if (body.refreshToken === "EXPIRED") {
        return HttpResponse.json<ApiResponse<TokenDto>>(
          {
            isSuccess: false,
            code: "AUTH4012",
            message: "토큰이 만료되었습니다.",
            result: {} as TokenDto,
          },
          { status: 401 },
        );
      }

      return HttpResponse.json<ApiResponse<TokenDto>>({
        isSuccess: true,
        code: "AUTH2000",
        message: "토큰 갱신 성공",
        result: mockTokenDto,
      });
    },
  ),

  // 로그아웃
  http.post(`${BASE_URL}/api/auth/logout`, async () => {
    await delay(300);

    return HttpResponse.json<ApiResponse<null>>({
      isSuccess: true,
      code: "AUTH2000",
      message: "로그아웃 성공",
      result: null,
    });
  }),
];
