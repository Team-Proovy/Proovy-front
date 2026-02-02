import { type TokenDto } from "../../../shared/api/shared_types";

// ============================================================
// 사용자 정보 타입
// ============================================================

/** 사용자 정보 (로그인 응답용) */
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

// ============================================================
// 소셜 로그인 정보 타입
// ============================================================

/** 소셜 로그인 정보 (공통) */
export interface SocialInfo {
  id: string;
  email: string;
  name?: string;
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

// ============================================================
// 요청 (Request) 타입
// ============================================================

/** 카카오 로그인 요청 */
export interface KakaoLoginRequest {
  authorizationCode: string;
  redirectUri?: string;
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

/** 로그인 결과 데이터 */
export interface LoginResult {
  loginType: "LOGIN" | "SIGNUP_REQUIRED";
  user?: UserDto;
  token?: TokenDto;
  signupToken?: string;
  kakaoInfo?: SocialInfo;
  naverInfo?: SocialInfo;
  googleInfo?: SocialInfo;
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
