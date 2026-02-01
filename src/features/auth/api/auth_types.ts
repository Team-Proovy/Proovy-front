// src/features/auth/api/auth_types.ts

// 1. 가장 작은 단위부터 정의
export interface UserInfo {
  id: number;
  name: string;
  nickname: string;
  email: string;
  profileImageUrl: string | null; // 이미지가 없을 수 있으니 null 허용
}

export interface TokenInfo {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn: number;
}

// 2. 소셜 로그인 정보 (선택적)
export interface SocialInfo {
  id: string;
  email: string;
  name?: string; // 네이버, 구글에만 있을 수 있음
}

// 3. 실제 결과값 데이터 (Result)
export interface LoginResult {
  loginType: string;
  user?: UserInfo;
  token?: TokenInfo;
  signupToken?: string; // 회원가입 시에만 올 수 있음
  kakaoInfo?: SocialInfo;
  naverInfo?: SocialInfo;
  googleInfo?: SocialInfo;
}

// 4. 최종 API 응답 형태 (공통 포맷)
export interface LoginResponse {
  isSuccess: boolean;
  code: string;
  message: string;
  result: LoginResult;
}
