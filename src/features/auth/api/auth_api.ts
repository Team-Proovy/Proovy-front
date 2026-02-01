import axios from "axios";
import type { LoginResponse } from "./auth_types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
export const KAKAO_CLIENT_ID = import.meta.env.VITE_KAKAO_CLIENT_ID;
export const KAKAO_REDIRECT_URI = import.meta.env.VITE_KAKAO_REDIRECT_URI;

if (!API_BASE_URL || !KAKAO_CLIENT_ID || !KAKAO_REDIRECT_URI) {
  throw new Error(
    "필수 환경변수가 누락되었습니다: VITE_API_BASE_URL, VITE_KAKAO_CLIENT_ID, VITE_KAKAO_REDIRECT_URI",
  );
}

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const loginWithKakao = async (code: string) => {
  const response = await api.post<LoginResponse>("/api/auth/login/kakao", {
    authorizationCode: code,
  });
  return response.data;
};