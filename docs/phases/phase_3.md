# Phase 3: 아키텍처 및 라우팅 정상화

> **목표**: 파일 위치 규칙을 통일하고, 라우팅 Guard 로직의 신뢰성을 높이며, 안티패턴을 제거한다.  
> **예상 소요**: 1~2일  
> **병렬 가능 작업**: Phase 1, Phase 2와 무관한 파일을 다루므로 병렬 진행 가능.  
> 단, **3-B(ProtectedRoute 강화)는 Phase 4(토큰 단일화) 이후가 더 안전**하다.

---

## 전제 조건

- **3-A (pages 폴더 정리)**: 전제 조건 없음. 언제든 시작 가능.
- **3-B (ProtectedRoute 강화)**: Phase 4 토큰 단일화 완료 후 진행 권장.  
  토큰 구조가 바뀌기 전에 Guard를 수정하면 두 번 작업하게 된다.
- **3-C (AppLayout 안티패턴 제거)**: 전제 조건 없음.

---

## 작업 목록 (체크리스트)

- [ ] **3-A** pages 폴더 정리 — 팀 방향 결정 후 파일 이동
- [ ] **3-B** ProtectedRoute 강화 — 토큰 존재 여부 추가 검사
- [ ] **3-C** AppLayout DOM 직접 조작 확인 및 제거

---

## 3-A. pages 폴더 정리

### 현재 상태 (혼재 중)

```
src/pages/                        ← 일부 독립 페이지
  ├── error/
  │   ├── ErrorPageLayout.tsx
  │   ├── UnauthorizedPage.tsx     # 401
  │   ├── ForbiddenPage.tsx        # 403
  │   ├── NotFoundPage.tsx         # 404
  │   └── ServerErrorPage.tsx      # 500
  ├── components/
  │   └── ViewerUploadCard.tsx
  ├── hooks/
  │   ├── useHomeSend.ts
  │   └── useViewerFile.ts
  ├── HomePage.tsx
  └── LandingPage.tsx

features/auth/pages/              ← feature 하위 페이지
  ├── LoginPage.tsx
  ├── SignupPage.tsx
  ├── KakaoCallbackPage.tsx
  ├── NaverCallbackPage.tsx
  └── GoogleCallbackPage.tsx

features/notes/pages/
  └── NotesPage.tsx

features/chat/pages/
  └── ChatPage.tsx

features/storage/pages/
  └── StoragePage.tsx

features/subscription/pages/
  └── PricingPage.tsx
```

### 팀 결정 필요 — Option A vs B

**[Option A] 전부 `src/pages/`로 통일 — 권장**  
모든 라우팅 컴포넌트를 `src/pages/`로 이동. 비즈니스 로직(hook, api)은 features에 유지.

```
src/pages/
  ├── error/                     # 에러 페이지 (현행 유지)
  ├── auth/                      # 신규 이동
  │   ├── LoginPage.tsx
  │   ├── SignupPage.tsx
  │   ├── KakaoCallbackPage.tsx
  │   ├── NaverCallbackPage.tsx
  │   └── GoogleCallbackPage.tsx
  ├── notes/                     # 신규 이동
  │   └── NotesPage.tsx
  ├── chat/                      # 신규 이동
  │   └── ChatPage.tsx
  ├── storage/                   # 신규 이동
  │   └── StoragePage.tsx
  ├── subscription/              # 신규 이동
  │   └── PricingPage.tsx
  ├── HomePage.tsx               # 현행 유지
  └── LandingPage.tsx            # 현행 유지
```

장점: `routes.tsx`와 `src/pages/`가 1:1 대응. 신규 팀원이 페이지를 찾기 쉽다.  
단점: feature 폴더에 `pages/` 하위폴더가 사라져 "기능 모음"이 됨.

**[Option B] 전부 `features/*/pages/`로 통일**  
`src/pages/`의 파일들을 domain feature로 이동.

```
features/home/pages/HomePage.tsx
features/landing/pages/LandingPage.tsx
features/error/pages/...
```

장점: feature 단위 응집도가 높다.  
단점: 에러 페이지처럼 domain이 명확하지 않은 페이지 위치가 애매하다.

### Option A 진행 시 작업 절차

1. `src/pages/auth/`, `src/pages/notes/`, `src/pages/chat/`, `src/pages/storage/`, `src/pages/subscription/` 폴더 생성
2. 각 페이지 파일을 해당 폴더로 이동
3. `src/app/router/routes.tsx`의 import 경로 수정
4. 빌드 확인: `npm run build`
5. 기존 `features/*/pages/` 빈 폴더 제거

### ⚠️ 주의

- 페이지 **파일**만 이동한다. hooks, api, components, types는 features에 그대로 유지.
- import 경로 수정 시 `@/pages/auth/LoginPage` 형태로 alias 사용.
- `routes.tsx` 외에도 페이지를 직접 import하는 파일이 있는지 확인.

```bash
# LoginPage를 import하는 파일 확인 예시
rg "LoginPage" src/ -l
```

### 완료 기준

- 모든 페이지 컴포넌트가 `src/pages/` 하위에 위치
- `features/*/pages/` 폴더가 존재하지 않음 (Option A 선택 시)
- `npm run build` 에러 없음
- 전체 라우팅 동작 확인 (로그인, 노트, 채팅, 스토리지 페이지 이동 테스트)

---

## 3-B. ProtectedRoute 강화

### 작업 대상 파일

`src/shared/router/components/RouteGuards.tsx`

### 현재 상태 (실제 코드 — RouteGuards.tsx)

```tsx
// 현재 구조: children을 받지 않고 <Outlet />을 반환하는 route wrapper
export const ProtectedRoute = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  return <Outlet />;
};
```

### 문제점

`isAuthenticated`는 Zustand persist로 localStorage에 저장된다 (`auth-storage` 키).  
브라우저를 닫았다 열어도 `isAuthenticated: true`가 유지된다.  
그러나 실제 `accessToken`은 별도 localStorage key(`accessToken`)에 저장되며,  
만료·삭제·localStorage 부분 초기화 등으로 없어질 수 있다.

이 경우 사용자는 보호된 페이지로 진입하지만 모든 API 호출이 401로 실패하는  
**좀비 세션 상태**가 된다.

### 작업 내용

`isAuthenticated`와 함께 실제 토큰 존재 여부를 동시에 확인한다.

```tsx
// RouteGuards.tsx — 변경 후
// ⚠️ 현재 구조는 children props가 아닌 <Outlet /> 반환 방식이므로 함수 시그니처 유지
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/features/auth/store/auth_store";
import { tokenUtils } from "@/shared/api/client"; // Phase 4 후 token_storage로 교체 예정

export const ProtectedRoute = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasToken = !!tokenUtils.getAccessToken();
  const location = useLocation();

  if (!isAuthenticated || !hasToken) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  return <Outlet />;
};
```

### Phase 4 이후 추가 개선 (선택)

Phase 4에서 토큰이 `auth_store`로 통합되면, JWT `exp` 클레임을 디코딩해  
만료된 토큰인 경우 미리 로그아웃 처리하는 로직을 추가할 수 있다.

```ts
// 향후 추가 가능한 만료 체크 유틸
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};
```

### 완료 기준

- 토큰이 없는 상태에서 `/app/home` 직접 접근 시 `/login`으로 리다이렉트
- `isAuthenticated: true`이지만 localStorage의 `accessToken`이 없을 때 `/login`으로 리다이렉트
- 정상 로그인 상태에서 보호 라우트 접근 정상 동작

---

## 3-C. AppLayout DOM 직접 조작 확인 및 제거

### 작업 대상 파일

`src/shared/layout/AppLayout.tsx`

### 확인 방법

아래 패턴이 `AppLayout.tsx`에 존재하는지 확인한다.

```bash
rg "document\.querySelector|document\.getElementById|document\.getElementsBy" src/shared/layout/AppLayout.tsx
```

### 존재하는 경우 처리 방법

DOM을 직접 조작하는 코드가 있다면 `useRef`로 대체한다.

```tsx
// Before — DOM 직접 조작 (안티패턴)
useEffect(() => {
  const el = document.querySelector(".main-content");
  if (el) el.scrollTop = 0;
}, [pathname]);

// After — useRef 기반
const mainRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  if (mainRef.current) mainRef.current.scrollTop = 0;
}, [pathname]);

// JSX
<main
  ref={mainRef}
  className="..."
>
  <Outlet />
</main>;
```

### 완료 기준

- `AppLayout.tsx`에 `document.querySelector` 등 직접 DOM 조작 코드 없음
- 기존 동작(스크롤, 레이아웃 등)이 동일하게 유지됨

---

## 완료 기준 (Phase 3 전체)

- [ ] 모든 페이지 파일이 `src/pages/` 하위에 위치 (Option A 선택 시)
- [ ] `npm run build` 에러 없음
- [ ] 전체 라우팅 동작 확인 (로그인, 노트, 채팅, 스토리지, 설정)
- [ ] 토큰 없을 때 ProtectedRoute가 `/login`으로 올바르게 리다이렉트
- [ ] `AppLayout.tsx`에 `document.querySelector` 직접 조작 없음

## Phase 3 완료 후 다음 단계

→ **Phase 4** (Auth 도메인 로직 분리) 시작  
→ Phase 3-B는 Phase 4 완료 후 추가 보강 가능
