/**
 * 공통 API 응답 타입 (Swagger 기반)
 * 모든 API 응답은 이 형태를 따름
 */
export interface ApiResponse<T> {
  isSuccess: boolean;
  code: string;
  message: string;
  result: T;
}

/**
 * 페이지네이션 정보
 */
export interface PageInfo {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  nextCursor?: string;
}

/**
 * 토큰 정보
 */
export interface TokenDto {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn: number;
}
