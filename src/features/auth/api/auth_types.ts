import { type TokenDto } from "../../../shared/api/shared_types";

// ============================================================
// 요청 (Request) 타입
// ============================================================

/** 카카오 로그인 요청 */
export interface KakaoLoginRequest {
  authorizationCode: string;
  redirectUri: string;
}

/** 네이버 로그인 요청 */
export interface NaverLoginRequest {
  code: string;
  state: string;
}

/** 구글 로그인 요청 */
export interface GoogleLoginRequest {
  authorizationCode: string;
}

/** 회원가입 완료 요청 */
export interface SignupCompleteRequest {
  signupToken: string;
  name: string;
  nickname: string;
  department: string;
  referralSource: string;
}

/** 토큰 갱신 요청 */
export interface TokenRefreshRequest {
  refreshToken: string;
}

/** 로그아웃 요청 */
export interface LogoutRequest {
  refreshToken?: string;
}

// ============================================================
// 응답 (Response) 타입
// ============================================================

/** 사용자 정보 */
export interface UserDto {
  id: number;
  name: string;
  nickname: string;
  email: string;
  profileImageUrl: string | null;
}

/** 회원가입용 사용자 정보 */
export interface SignupUserDto {
  userId: number;
  email: string;
  name: string;
  nickname: string;
  department: string;
  profileImageUrl: string | null;
  createdAt: string;
}

/** 카카오 사용자 정보 */
export interface KakaoUserInfo {
  id: string;
  email: string;
}

/** 네이버 사용자 정보 */
export interface NaverUserInfo {
  id: string;
  email: string;
  name: string;
}

/** 구글 사용자 정보 */
export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
}

/** 로그인 응답 (기존 회원 / 신규 회원 분기) */
export interface LoginResponse {
  /** "LOGIN" | "SIGNUP_REQUIRED" */
  loginType: "LOGIN" | "SIGNUP_REQUIRED";
  /** 기존 회원인 경우 유저 정보 */
  user: UserDto | null;
  /** 기존 회원인 경우 토큰 */
  token: TokenDto | null;
  /** 신규 회원인 경우 회원가입 토큰 */
  signupToken: string | null;
  /** 소셜 로그인 정보 (신규 회원용) */
  kakaoInfo: KakaoUserInfo | null;
  naverInfo: NaverUserInfo | null;
  googleInfo: GoogleUserInfo | null;
}

/** 회원가입 완료 응답 */
export interface SignupCompleteResponse {
  user: SignupUserDto;
  token: TokenDto;
  welcomeCredit: number;
}

/** 네이버 인증 URL 응답 */
export interface NaverAuthUrlResponse {
  authUrl: string;
  state: string;
}

// ============================================================
// 통합 타입 (API 함수용)
// ============================================================

/** 소셜 로그인 요청 (통합) */
export type SocialLoginRequest =
  | KakaoLoginRequest
  | NaverLoginRequest
  | GoogleLoginRequest;

/** 소셜 로그인 응답 (통합) */
export interface SocialLoginResponse {
  status: "LOGIN" | "SIGNUP_REQUIRED";
  accessToken?: string;
  refreshToken?: string;
  tempToken?: string;
  email?: string;
  name?: string;
}
