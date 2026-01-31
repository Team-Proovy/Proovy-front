// src/features/auth/api/auth_api.ts
import axios from "axios";
import type { LoginResponse } from "./auth_types";

// TODO: 환경변수로 분리 권장 (VITE_API_URL, VITE_KAKAO_REDIRECT_URI)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
export const KAKAO_REDIRECT_URI = import.meta.env.VITE_KAKAO_REDIRECT_URI;

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const loginWithKakao = async (code: string) => {
  const response = await api.post<LoginResponse>("/api/auth/login/kakao", {
    authorizationCode: code,
    redirectUri: KAKAO_REDIRECT_URI,
  });

  return response.data;
};
