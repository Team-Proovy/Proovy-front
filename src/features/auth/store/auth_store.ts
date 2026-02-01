import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { LoginResult, UserInfo, TokenInfo } from "../api/auth_types";

interface AuthState {
  user: UserInfo | null;
  token: TokenInfo | null;
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
        set({
          user: result.user,
          token: result.token,
          isAuthenticated: true,
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
      name: "auth-storage", // localStorage Key
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
