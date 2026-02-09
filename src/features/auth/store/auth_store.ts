import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { LoginResult, UserDto } from "../api/auth_types";
import type { TokenDto } from "@/shared/api/shared_types";

interface AuthState {
  user: UserDto | null;
  token: TokenDto | null;
  isAuthenticated: boolean;
  login: (result: LoginResult) => void;
  updateUser: (updates: Partial<UserDto>) => void;
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
          user: result.user ?? null,
          token: result.token ?? null,
          isAuthenticated: !!result.token,
        });
      },
      updateUser: (updates) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }));
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
