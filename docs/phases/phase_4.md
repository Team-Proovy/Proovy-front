# Phase 4: Auth 도메인 로직 완전 분리

> **목표**: 인증 관련 모든 로직의 책임 소재를 명확히 하고, 토큰 관리를 단일 진실 공급원(auth_store)으로 통합한다.  
> **예상 소요**: 2~3일 (변경 범위가 넓고 버그 위험이 높아 신중하게 진행)  
> **주의**: 이 Phase는 로그인·로그아웃·세션 유지 등 핵심 인증 흐름을 건드린다. 변경 후 반드시 전체 인증 플로우 테스트가 필요하다.

---

## 전제 조건

- **Phase 1-D 완료**: `client.ts`의 `window.history.replaceState` 라우팅 우회가 먼저 제거되어야 한다.  
  1-D는 라우팅 우회만 제거하고, 토큰 저장 책임 이전은 이 Phase(4-A)에서 진행한다.  
  두 작업을 동시에 진행하면 어느 쪽에서 문제가 생긴 건지 구분하기 어렵다.
- Phase 2 Button/Input은 4-D(LoginPage 정리)에 필요하므로 4-D 직전에 완료되어 있으면 된다.

---

## 작업 목록 (체크리스트)

- [ ] **4-A** 토큰 관리 단일화 — `auth_store`를 단일 진실 공급원으로
- [ ] **4-B** `auth_api.ts` 부수 효과 분리 — API 함수에서 `tokenUtils.setTokens()` 제거
- [ ] **4-C** OAuth URL 빌드 로직 훅 추출 — `useOAuthLogin.ts` 생성
- [ ] **4-D** LoginPage / SignupPage View 정리 — 공용 Button/Input 적용

---

## 현재 Auth 구조 문제 요약

```
[현재 이중 관리 구조]

localStorage 'accessToken' / 'refreshToken'
  ↑ 읽기/쓰기: client.ts의 tokenUtils
  ↑ auth_store는 이 값을 모름

localStorage 'auth-storage'
  ↑ 읽기/쓰기: Zustand persist
  ↑ user, isAuthenticated만 저장 (token 필드는 메모리에만 있고 persist 제외)

결과:
  - 로그아웃 시 auth_store.logout() 호출 → isAuthenticated: false
  - 그러나 tokenUtils.clearTokens() 가 함께 호출되지 않으면 토큰이 localStorage에 잔존
  - 반대로 토큰이 만료되어도 isAuthenticated는 여전히 true
```

---

## 4-A. 토큰 관리 단일화

### 핵심 설계 원칙

```
[변경 후 책임 분리]

src/shared/auth/token_storage.ts   ← 토큰 읽기/쓰기 전담 (신규)
  - getAccessToken(), getRefreshToken()
  - setTokens(), clearTokens()

src/features/auth/store/auth_store.ts  ← 인증 상태 + 토큰 저장/삭제 액션
  - login()    : 로그인 완료 후 user + token 저장
  - setToken() : 토큰 갱신 시에만 token 교체 (user 변경 없음)
  - logout()   : 모든 인증 상태 + 토큰 삭제

src/shared/api/client.ts  ← 로그인/로그아웃 토큰 저장 책임 없음
  - 일반 요청: token_storage.getAccessToken()으로 읽기만
  - 401 refresh 인터셉터: 새 토큰을 token_storage에 저장 후 store에 이벤트 전달
    (refresh 결과 저장은 client.ts의 불가피한 역할 — Zustand 직접 import 금지이므로)
  - 로그인/로그아웃 시 토큰 저장·삭제 책임 없음 (auth_store가 담당)
```

**왜 token_storage를 client.ts 밖으로 분리하는가?**  
기존 `tokenUtils`가 `client.ts` 안에 있으면 `auth_store`가 `client.ts`를 import하고,  
`client.ts`도 `auth_store`를 참조해야 하는 **순환 참조**가 생긴다.  
독립 모듈 `token_storage.ts`를 만들면 양쪽이 이 파일만 import하면 되어 순환이 사라진다.

---

### Step 1. `token_storage.ts` 생성 (신규)

```ts
// src/shared/auth/token_storage.ts

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

export const tokenStorage = {
  getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  setTokens: (accessToken: string, refreshToken: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },
  clearTokens: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};
```

---

### Step 2. `auth_store.ts` 수정

`tokenUtils` import를 `tokenStorage`로 교체하고, 토큰 갱신 전용 `setToken` 액션을 추가한다.

```ts
// src/features/auth/store/auth_store.ts — 변경 후
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { tokenStorage } from "@/shared/auth/token_storage";
import type { LoginResult, UserDto } from "../api/auth_types";
import type { TokenDto } from "@/shared/api/shared_types";

interface AuthState {
  user: UserDto | null;
  token: TokenDto | null;
  isAuthenticated: boolean;
  login: (result: LoginResult) => void;
  setToken: (token: TokenDto) => void; // 토큰 갱신 전용 액션
  updateUser: (updates: Partial<UserDto>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      // 로그인 완료: user + token 동시 저장
      // LoginResult에는 loginType이 필수이므로 loginType === "LOGIN"인 경우에만 호출
      login: (result) => {
        if (result.token) {
          tokenStorage.setTokens(
            result.token.accessToken,
            result.token.refreshToken,
          );
        }
        set({
          user: result.user ?? null,
          token: result.token ?? null,
          isAuthenticated: !!result.token,
        });
      },

      // 토큰 갱신 전용: user는 변경하지 않고 token만 교체
      // client.ts의 401 자동 갱신 완료 후 이 액션을 호출한다
      // isAuthenticated: true를 함께 설정 — refresh 성공은 인증 유효를 의미하므로 상태 불일치 방지
      setToken: (token) => {
        tokenStorage.setTokens(token.accessToken, token.refreshToken);
        set({ token, isAuthenticated: true });
      },

      updateUser: (updates) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }));
      },

      logout: () => {
        tokenStorage.clearTokens(); // localStorage 토큰 삭제
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        // token은 persist 제외 (tokenStorage가 별도 key로 영속 관리)
      }),
    },
  ),
);
```

---

### Step 3. `client.ts` 수정

`tokenUtils` → `tokenStorage` import 경로 변경.  
401 갱신 성공 후 새 토큰을 `tokenStorage`에 저장하고, Custom Event로 store에 동기화를 요청한다.

```ts
// client.ts — import 변경
import { tokenStorage } from "@/shared/auth/token_storage";

// 기존 tokenUtils.* 호출을 tokenStorage.*로 교체 (시그니처 동일)

// 401 갱신 성공 후 처리
// response.data.result는 TokenDto 전체 (accessToken, refreshToken,
// accessTokenExpiresIn, refreshTokenExpiresIn 모두 포함)
const token = response.data.result; // TokenDto

// refresh 결과 저장: client.ts에서 허용되는 유일한 쓰기 작업
tokenStorage.setTokens(token.accessToken, token.refreshToken);

// ⚠️ client.ts는 Zustand 직접 import 금지 (순환 참조)
// Custom Event로 store 동기화 — detail에 TokenDto 전체를 넘겨야 타입 에러 없음
// satisfies 대신 서버 응답 객체를 그대로 사용 (expiresIn 필드 누락 방지)
window.dispatchEvent(
  new CustomEvent<TokenDto>("proovy:token-refreshed", { detail: token }),
);

// ℹ️ setTokens가 두 번 호출되는 것처럼 보이는 이유:
//   1. client.ts → tokenStorage.setTokens() : localStorage에 새 토큰 즉시 저장 (네트워크 재시도 전에 필요)
//   2. AuthEventBridge → store.setToken() → tokenStorage.setTokens() : Zustand store 상태 동기화
// 두 번째 setTokens는 같은 값을 한 번 더 쓰는 것으로 idempotent하다. 의도된 동작이다.
```

```tsx
// ⚠️ 이 프로젝트에는 App.tsx가 없고, main.tsx는 엔트리 파일이라 훅을 직접 쓸 수 없다.
// 별도 브릿지 컴포넌트를 만들어 렌더 트리 안에 삽입한다.

// src/shared/auth/AuthEventBridge.tsx (신규 생성)
import { useEffect } from "react";
import { useAuthStore } from "@/features/auth/store/auth_store";
import type { TokenDto } from "@/shared/api/shared_types";

export function AuthEventBridge() {
  useEffect(() => {
    const handler = (e: CustomEvent<TokenDto>) => {
      // ⚠️ setToken() 사용 — login()은 LoginResult(loginType 필수)를 요구하므로 타입 에러 발생
      useAuthStore.getState().setToken(e.detail);
    };
    window.addEventListener("proovy:token-refreshed", handler as EventListener);
    return () =>
      window.removeEventListener(
        "proovy:token-refreshed",
        handler as EventListener,
      );
  }, []);

  return null; // UI 없음, 이벤트 리스너만 등록
}
```

```tsx
// src/main.tsx — 렌더 트리에 AuthEventBridge 추가
// AppQueryProvider 안에 넣어야 React Query context를 공유할 수 있다
<StrictMode>
  <AppQueryProvider>
    <AuthEventBridge /> {/* 토큰 갱신 이벤트 수신 */}
    <RouterProvider router={router} />
    <ToastHost />
  </AppQueryProvider>
</StrictMode>
```

---

### Step 4. 기존 `tokenUtils` 사용처 분류 후 교체

`client.ts`에서 `export const tokenUtils = { ... }` 블록을 삭제한다.  
**단순히 `tokenUtils.*` → `tokenStorage.*`로 일괄 치환하면 안 된다.**  
store를 거치지 않아 Zustand 상태가 갱신되지 않는 새로운 dual source 문제가 생긴다.

```bash
# 현재 tokenUtils를 import하는 파일 목록 확인
rg "tokenUtils" src/ -l
```

**확인 결과 실제 사용 파일 (코드베이스 기준):**

```
읽기만 하는 파일:
  src/features/editor/api/editor_api.ts
  src/features/settings/hooks/useUser.ts
  src/features/settings/hooks/useCredit.ts

쓰기(setTokens/clearTokens)를 하는 파일:
  src/features/auth/api/auth_api.ts
  src/features/auth/hooks/useAuth.ts
  src/features/auth/pages/KakaoCallbackPage.tsx
  src/features/auth/pages/NaverCallbackPage.tsx
  src/features/auth/pages/GoogleCallbackPage.tsx
  src/features/auth/pages/SignupPage.tsx
```

**파일 유형별 교체 규칙:**

**[카테고리 1] 읽기만 하는 파일** → `tokenStorage.getAccessToken()` 직접 사용

```ts
// Before
import { tokenUtils } from "@/shared/api/client";
enabled: !!tokenUtils.getAccessToken();

// After
import { tokenStorage } from "@/shared/auth/token_storage";
enabled: !!tokenStorage.getAccessToken();
```

**[카테고리 2] 로그인/회원가입 후 토큰 저장** → `auth_store.login()` 경유 (tokenStorage 직접 호출 금지)

```ts
// Before (콜백 페이지 패턴)
tokenUtils.setTokens(result.token.accessToken, result.token.refreshToken);
useAuthStore.getState().login(result);

// After — login() 액션이 tokenStorage.setTokens()까지 책임짐
// tokenStorage.setTokens() 직접 호출 제거, login() 하나로 통일
useAuthStore.getState().login(result); // loginType === "LOGIN" 확인 후 호출
```

**[카테고리 3] 로그아웃 시 토큰 삭제** → `auth_store.logout()` 경유 (tokenStorage 직접 호출 금지)

```ts
// Before
tokenUtils.clearTokens();
useAuthStore.getState().logout();

// After — logout() 액션이 tokenStorage.clearTokens()까지 책임짐
useAuthStore.getState().logout();
```

**[카테고리 4] `client.ts` 401 refresh 인터셉터** → `tokenStorage.setTokens()` 직접 허용 (예외)

```ts
// client.ts 내부에서만 허용 — 이미 Step 3에서 처리
tokenStorage.setTokens(token.accessToken, token.refreshToken);
window.dispatchEvent(
  new CustomEvent<TokenDto>("proovy:token-refreshed", { detail: token }),
);
```

### ⚠️ 주의

- `LoginResult` 타입에는 `loginType: "LOGIN" | "SIGNUP_REQUIRED"` 필드가 필수다.  
  `login()`은 반드시 `loginType === "LOGIN"`인 경우에만 호출한다.
- 토큰 갱신(`client.ts` 401 인터셉터)에서는 **`login()` 호출 금지** — `setToken()` 사용.
- 이 변경 후 로그아웃 시 토큰이 항상 함께 삭제되는지 반드시 확인.

### 완료 기준

- `src/shared/auth/token_storage.ts` 파일 존재
- `client.ts`에 `tokenUtils` export 없음, `tokenStorage` import로 대체
- 로그아웃 후 `localStorage.getItem('accessToken')`이 `null`
- 새로고침 후 로그인 세션 유지
- 401 자동 갱신 → `setToken()` 호출 → 원래 요청 재시도 플로우 정상 동작

---

## 4-B. auth_api.ts 부수 효과 분리

### 작업 대상 파일

`src/features/auth/api/auth_api.ts`

### 현재 상태

각 OAuth 콜백 API 함수 내부에서 API 응답 후 `tokenUtils.setTokens()`를 직접 호출한다.

```ts
// 현재 코드 (문제 있는 패턴)
export const loginWithKakao = async (code: string) => {
  const response = await apiClient.post("/api/auth/kakao", { code });
  // ❌ API 함수 안에서 토큰 저장 — 부수 효과
  tokenUtils.setTokens(
    response.data.result.accessToken,
    response.data.result.refreshToken,
  );
  return response.data;
};
```

### 변경 방향

API 함수는 서버 응답 데이터만 반환한다.  
토큰 저장·store 업데이트는 이를 호출하는 곳(훅 또는 콜백 페이지)에서 담당한다.

```ts
// auth_api.ts — 변경 후 (순수 API 함수)
export const loginWithKakao = async (
  code: string,
): Promise<ApiResponse<LoginResult>> => {
  const response = await apiClient.post<ApiResponse<LoginResult>>(
    "/api/auth/kakao",
    { code },
  );
  return response.data; // 토큰 저장 없이 데이터만 반환
};
```

```ts
// useAuth.ts 또는 KakaoCallbackPage.tsx — 토큰 저장은 여기서
const handleCallback = async (code: string) => {
  const result = await loginWithKakao(code);
  const loginResult = result.result;

  // ⚠️ LoginResult.loginType이 "LOGIN"인 경우에만 login() 호출
  // "SIGNUP_REQUIRED"인 경우 signupToken으로 회원가입 플로우로 이동
  if (loginResult.loginType === "LOGIN") {
    useAuthStore.getState().login(loginResult);
    navigate("/app/home");
  } else {
    navigate("/signup", { state: { signupToken: loginResult.signupToken } });
  }
};
```

### 변경 대상 함수 목록

- `loginWithKakao(code)`
- `loginWithNaver(code, state)`
- `loginWithGoogle(code)`
- `socialLogin(provider, data)` (통합 함수)
- `refreshToken(data)` — 이 함수는 client.ts 인터셉터에서 직접 호출하므로 별도 처리

### 완료 기준

- `auth_api.ts`의 모든 함수에서 `tokenUtils.setTokens()` 직접 호출 없음
- 카카오·네이버·구글 로그인 플로우 각각 E2E 테스트 통과
- 로그인 후 `auth_store`의 `isAuthenticated`, `user`, `token` 모두 정상 설정 확인

---

## 4-C. OAuth URL 빌드 로직 훅 추출

### 작업 대상 파일

- `src/features/auth/pages/LoginPage.tsx` (수정)
- `src/features/auth/hooks/useOAuthLogin.ts` (신규 생성)

### 현재 상태

소셜 로그인 URL 생성 로직이 `LoginPage.tsx` 컴포넌트 내부에 작성되어 있다.  
URL을 구성하는 `clientId`, `redirectUri`, `scope` 등의 파라미터가 뷰 컴포넌트에 뒤섞여 있다.

### 변경 방향

```ts
// src/features/auth/hooks/useOAuthLogin.ts (신규)

// ⚠️ redirect_uri는 encodeURIComponent 적용 권장
const KAKAO_AUTH_URL =
  `https://kauth.kakao.com/oauth/authorize` +
  `?client_id=${import.meta.env.VITE_KAKAO_CLIENT_ID}` +
  `&redirect_uri=${encodeURIComponent(import.meta.env.VITE_KAKAO_REDIRECT_URI)}` +
  `&response_type=code`;

const GOOGLE_AUTH_URL =
  `https://accounts.google.com/o/oauth2/v2/auth` +
  `?client_id=${import.meta.env.VITE_GOOGLE_CLIENT_ID}` +
  `&redirect_uri=${encodeURIComponent(import.meta.env.VITE_GOOGLE_REDIRECT_URI)}` +
  `&response_type=code` +
  `&scope=${encodeURIComponent("email profile")}`;

// ⚠️ Naver state는 CSRF 방지용이므로 암호학적으로 안전한 난수여야 한다.
// Math.random()은 보안 목적에 부적합 — 기존 LoginPage.tsx와 동일하게 crypto API 사용
// ⚠️ 모듈 top-level에서 생성하면 앱 로드 시 한 번만 생성됨 → 반드시 함수 안에서 호출
const generateState = (): string =>
  crypto.randomUUID?.() ??
  Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

export function useOAuthLogin() {
  const loginWithKakao = () => {
    window.location.href = KAKAO_AUTH_URL;
  };

  const loginWithNaver = () => {
    // 클릭마다 새 state 생성 + sessionStorage에 저장 (콜백 페이지에서 검증용)
    const state = generateState();
    sessionStorage.setItem("naver_oauth_state", state);

    const url =
      `https://nid.naver.com/oauth2.0/authorize` +
      `?client_id=${import.meta.env.VITE_NAVER_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(import.meta.env.VITE_NAVER_REDIRECT_URI)}` +
      `&response_type=code` +
      `&state=${state}`;
    window.location.href = url;
  };

  const loginWithGoogle = () => {
    window.location.href = GOOGLE_AUTH_URL;
  };

  return { loginWithKakao, loginWithNaver, loginWithGoogle };
}
```

```tsx
// LoginPage.tsx — 변경 후 (Dumb Component)
import { useOAuthLogin } from "../hooks/useOAuthLogin";
import { Button } from "@/shared/components/ui/Button";

export function LoginPage() {
  const { loginWithKakao, loginWithNaver, loginWithGoogle } = useOAuthLogin();

  return (
    <div>
      <Button onClick={loginWithKakao}>카카오 로그인</Button>
      <Button onClick={loginWithNaver}>네이버 로그인</Button>
      <Button onClick={loginWithGoogle}>구글 로그인</Button>
    </div>
  );
}
```

### 완료 기준

- `LoginPage.tsx`에 OAuth URL 문자열 조합 코드가 없음
- `useOAuthLogin` 훅이 카카오·네이버·구글 로그인 URL을 각각 생성하고 이동
- 실제 소셜 로그인 플로우 정상 동작 확인

---

## 4-D. LoginPage / SignupPage View 정리

### 작업 대상 파일

- `src/features/auth/pages/LoginPage.tsx` (또는 Phase 3 이후 `src/pages/auth/LoginPage.tsx`)
- `src/features/auth/pages/SignupPage.tsx`

### 전제 조건

Phase 2의 Button, Input 컴포넌트 완료 필요.

### 작업 내용

1. 모든 `<button>` 태그를 `<Button>` 공용 컴포넌트로 교체
2. 모든 `<input>` 태그를 `<Input>` 공용 컴포넌트로 교체
3. 인라인 스타일(`style={{ ... }}`) 전량 제거
4. 하드코딩 hex 색상(`text-[#2046FF]`, `bg-[#F1F4F8]` 등)을 디자인 토큰 클래스로 교체
5. `useOAuthLogin` 훅 적용 (4-C 완료 후)

### 교체 패턴 예시

```tsx
// Before
<button
  style={{ backgroundColor: "#2046FF", color: "white", padding: "12px 24px" }}
  onClick={handleLogin}
>
  로그인
</button>

// After
<Button variant="primary" size="lg" onClick={handleLogin}>
  로그인
</Button>
```

```tsx
// Before
<input
  type="email"
  className="border border-gray-300 rounded px-3 py-2 text-[#414141]"
  placeholder="이메일"
/>

// After
<Input
  type="email"
  placeholder="이메일"
  state={hasError ? "error" : "default"}
  errorMessage={errorMessage}
/>
```

### 완료 기준

- `LoginPage.tsx`, `SignupPage.tsx`에 `style={{ }}` 인라인 스타일 없음
- 하드코딩 hex 색상 클래스(`text-[#...]`, `bg-[#...]`) 없음
- 소셜 로그인, 이메일 로그인, 회원가입 플로우 정상 동작

---

## 완료 기준 (Phase 4 전체)

- [ ] `src/shared/auth/token_storage.ts` 파일 존재
- [ ] `src/shared/auth/AuthEventBridge.tsx` 파일 존재 + `main.tsx` 렌더 트리에 등록됨
- [ ] `src/shared/router/NavigationEventBridge.tsx` 파일 존재 + router 최상단에 등록됨 (Phase 1-D)
- [ ] 로그아웃 후 `localStorage`에 `accessToken`, `refreshToken` 잔존하지 않음
- [ ] 새로고침 후 로그인 세션 유지 정상 동작
- [ ] 401 자동 갱신 → `proovy:token-refreshed` 이벤트 발생 → `setToken()` 호출 → 재시도 플로우 정상 동작
- [ ] 카카오·네이버·구글 소셜 로그인 각각 E2E 테스트 통과
- [ ] `auth_api.ts` 함수에서 `tokenUtils.setTokens()` 직접 호출 없음
- [ ] `LoginPage.tsx`에 URL 조합 로직 없음 (`useOAuthLogin` 훅으로 분리)
- [ ] `LoginPage.tsx`, `SignupPage.tsx` 인라인 스타일 전량 제거

## Phase 4 완료 후 다음 단계

→ **Phase 3-B** (ProtectedRoute 추가 보강) 가능 — tokenUtils 구조가 확정되었으므로
→ **Phase 5** (Notes/Assets 성능 최적화) 시작
