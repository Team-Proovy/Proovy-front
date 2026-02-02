import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { LoginResult, UserDto } from "../api/auth_types";
import type { TokenDto } from "@/shared/api/shared_types";

interface AuthState {
  user: UserDto | null;
  token: TokenDto | null;
  isAuthenticated: boolean;
  login: (result: LoginResult) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (result) => {
        // 1. 토큰 데이터 추출 (객체 안 혹은 바로 아래)
        const accessToken = result.token?.accessToken || result.accessToken;
        const refreshToken = result.token?.refreshToken || result.refreshToken;
        const accessTokenExpiresIn = result.token?.accessTokenExpiresIn || 0;
        const refreshTokenExpiresIn = result.token?.refreshTokenExpiresIn || 0;

        const hasToken = !!accessToken;

        set({
          user: result.user ?? null,
          // 2. TokenDto 타입 규격 완벽 일치시키기
          token: hasToken
            ? {
                accessToken: accessToken as string,
                refreshToken: (refreshToken as string) || "",
                accessTokenExpiresIn: accessTokenExpiresIn,
                refreshTokenExpiresIn: refreshTokenExpiresIn,
              }
            : null,
          isAuthenticated: hasToken,
        });
      },
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
