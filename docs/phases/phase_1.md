# Phase 1: 글로벌 인프라 및 디자인 시스템 구축

> **목표**: 모든 컴포넌트가 참조할 수 있는 단일 디자인 토큰 체계를 구축하고, 타입과 네트워크 계층을 정비한다.  
> **예상 소요**: 1~2일  
> **병렬 가능 작업**: 1-A(Design Token) / 1-C(Type 중앙화)는 서로 다른 파일이므로 팀원이 동시에 진행 가능

---

## 전제 조건

없음. Phase 1은 의존성이 없는 최초 작업이다.  
단, **1-A(Design Token)가 완료되어야 Phase 2를 시작**할 수 있다.

---

## 작업 목록 (체크리스트)

- [ ] **1-A** Design Token — `global.css @theme`에 색상·폰트·radius 등록
- [ ] **1-B** 브레이크포인트 표준화 — `global.css @theme`에 breakpoint 명시 및 팀 컨벤션 결정
- [ ] **1-C** Type 중앙화 — `src/shared/types/` 폴더 생성 후 핵심 엔티티 타입 이동
- [ ] **1-D** Network 계층 정비 — `client.ts`의 라우팅 우회 로직 제거 (Phase 4 토큰 단일화와 연계)

---

## 1-A. Design Token 통합

### 작업 대상 파일

`src/app/styles/global.css`

### 현재 상태

`@theme` 블록에 폰트(`--font-sans`)와 브레이크포인트(`--breakpoint-3xl: 1360px`) 만 있다.  
색상·폰트 사이즈·radius 토큰이 없어서 모든 컴포넌트가 hex 코드를 하드코딩하거나 `toolbar_styles.ts` 상수에 의존하고 있다.

### 작업 내용

아래 코드를 기존 `@theme` 블록에 **병합**한다 (기존 내용 삭제 금지).

```css
@theme {
  /* ── 색상 (--color-* 네임스페이스) ─────────────────────────── */
  --color-primary-main: #2046ff;
  --color-primary-dark: #1428a0;
  --color-primary-darker: #002f6c;
  --color-point-light: #2549c6;
  --color-point-main: #122d8b;

  --color-gray-50: #f1f4f8;
  --color-gray-100: #e3e7ed;
  --color-gray-200: #d1d6de;
  --color-gray-400: #9ca4b0;
  --color-gray-600: #6b7280;
  --color-gray-800: #2f3440;

  --color-text-main: #414141;
  --color-text-body: #4d4d4d;
  --color-text-white: #ffffff;
  --color-wireframe: #d0d0d0;

  --color-semantic-success: #0aa63e;
  --color-semantic-warning: #e2a242;
  --color-semantic-error: #dc3545;

  /* ── 폰트 사이즈 (--text-* 네임스페이스) ──────────────────── */
  /* ⚠️ --font-size-* 아님. Tailwind v4 공식 네임스페이스는 --text-* */
  /* line-height / font-weight는 이중 대시(--)로 연결 */
  --text-display-1: 64px;
  --text-display-1--line-height: 74px;
  --text-display-1--font-weight: 700;

  --text-display-2: 48px;
  --text-display-2--line-height: 58px;
  --text-display-2--font-weight: 700;

  --text-h1: 36px;
  --text-h1--line-height: 46px;
  --text-h1--font-weight: 700;

  --text-h2-semibold: 32px;
  --text-h2-semibold--line-height: 42px;
  --text-h2-semibold--font-weight: 600;

  --text-h2-medium: 32px;
  --text-h2-medium--line-height: 42px;
  --text-h2-medium--font-weight: 500;

  --text-h3: 28px;
  --text-h3--line-height: 40px;
  --text-h3--font-weight: 600;

  --text-h4: 24px;
  --text-h4--line-height: 32px;
  --text-h4--font-weight: 700;

  --text-body-1-bold: 20px;
  --text-body-1-bold--line-height: 24px;
  --text-body-1-bold--font-weight: 700;

  --text-body-1-semibold: 20px;
  --text-body-1-semibold--line-height: 24px;
  --text-body-1-semibold--font-weight: 600;

  --text-body-2-medium: 20px;
  --text-body-2-medium--line-height: 24px;
  --text-body-2-medium--font-weight: 500;

  --text-body-2-regular: 20px;
  --text-body-2-regular--line-height: 24px;
  --text-body-2-regular--font-weight: 400;

  /* ── Border Radius (--radius-* 네임스페이스) ──────────────── */
  /* ⚠️ Tailwind v4 기본값을 덮어쓴다:
       기본 md=6px → 8px, lg=8px → 12px, xl=12px → 16px
     이 변경으로 기존에 rounded-md/lg/xl을 쓰던 컴포넌트 UI가 달라질 수 있음 → 육안 검토 필수 */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
}
```

### 등록 후 클래스 사용법

| CSS 변수                 | 생성되는 Tailwind 클래스                                        |
| ------------------------ | --------------------------------------------------------------- |
| `--color-primary-main`   | `bg-primary-main` / `text-primary-main` / `border-primary-main` |
| `--color-semantic-error` | `bg-semantic-error` / `text-semantic-error`                     |
| `--text-h1`              | `text-h1` (size + line-height + font-weight 동시 적용)          |
| `--radius-lg`            | `rounded-lg`                                                    |

### ⚠️ 팀 결정 필요 — `--color-text-*` 네이밍

`--color-text-main`으로 등록하면 클래스가 `text-text-main`이 되어 `text-` prefix가 중복된다.  
구현 시작 전 아래 두 방향 중 하나를 팀이 결정해야 한다.

| 방향        | 클래스 예시       | 비고                                    |
| ----------- | ----------------- | --------------------------------------- |
| 현행 유지   | `text-text-main`  | 디자인 시스템 네이밍 그대로             |
| 시맨틱 변경 | `text-foreground` | `--color-foreground: #414141` 으로 변경 |

### ⚠️ 팀 결정 필요 — `#2046FF` vs `#2A6AFF` 색상 충돌

디자인 시스템(`design_system.md`)의 `primary-main`은 `#2046FF`이지만,  
실제 코드에는 `#2A6AFF`가 광범위하게 사용되고 있다.

```
확인된 사용 파일:
  - src/features/auth/pages/LoginPage.tsx
  - src/features/auth/pages/SignupPage.tsx (focus:border-[#2A6AFF] 다수)
  - src/features/editor/constants/toolbar_styles.ts (active 색상)
  - 기타 다수
```

토큰 등록 전 아래 두 방향 중 하나를 팀이 결정해야 한다.  
**결정 없이 `#2046FF`로 토큰을 등록하면 UI 전체 색감이 바뀐다.**

| 방향                       | 내용                                                                  | 영향                                      |
| -------------------------- | --------------------------------------------------------------------- | ----------------------------------------- |
| A. 디자인 시스템 기준 적용 | `--color-primary-main: #2046ff` 등록 후 기존 `#2A6AFF` 전량 교체      | UI 색상 변경됨 — 디자이너 확인 필요       |
| B. 기존 코드 색상 반영     | `--color-primary-main: #2A6AFF`로 토큰 등록                           | 디자인 시스템과 불일치 — 피그마 수정 필요 |
| C. 별도 토큰 추가          | `--color-primary-main: #2046ff` + `--color-interactive: #2A6AFF` 분리 | 토큰 체계 복잡해짐                        |

**이 결정이 내려지기 전까지 1-A 작업을 시작하지 않는다.**

### ⚠️ 완료 후 해야 할 것

`features/editor/constants/toolbar_styles.ts`의 색상 JS 상수들을 Tailwind 클래스로 단계적 교체.  
이 작업은 Phase 2 Button/Input 컴포넌트 작업과 함께 진행한다.

### 완료 기준

- `bg-primary-main`, `text-h1`, `rounded-lg` 등의 클래스가 브라우저에서 정상 동작
- 모든 페이지 육안 검토 완료 (radius 변경으로 인한 시각적 차이 없는지 확인)

---

## 1-B. 반응형 브레이크포인트 표준화

### 작업 대상 파일

`src/app/styles/global.css`

### 현재 상태

`@theme`에 `--breakpoint-3xl: 1360px` 하나만 있으며 단위가 `px`다.  
Tailwind v4는 기본 브레이크포인트가 `rem` 기반이므로 **단위 혼재 시 미디어쿼리 순서가 어긋날 수 있다**.  
또한 팀 컨벤션 3단계(Mobile/Tablet/Desktop)가 코드에 강제되지 않아 컴포넌트마다 기준이 다를 수 있다.

### 팀 결정 필요 — 선택지 A vs B

**[선택지 A] 컨벤션만 명시 (느슨)**  
기본 `sm:`, `xl:`, `2xl:` prefix가 살아있어 컨벤션 위반을 막기 어렵다.

```css
@theme {
  --breakpoint-md: 48rem; /* 768px  — Tablet */
  --breakpoint-lg: 64rem; /* 1024px — Desktop */
  --breakpoint-3xl: 85rem; /* 1360px — Wide (기존 1360px → rem 변환) */
}
```

**[선택지 B] 불필요한 prefix 제거 (강한 강제) — 권장**  
`sm:`, `xl:`, `2xl:`을 `initial`로 비활성화해 실수를 코드 레벨에서 차단한다.  
단, 기존 코드에서 `sm:`, `xl:`, `2xl:`, `3xl:`을 사용하는 곳을 먼저 파악하고 교체해야 한다.

```css
@theme {
  --breakpoint-sm: initial; /* 640px  제거 */
  --breakpoint-xl: initial; /* 1280px 제거 */
  --breakpoint-2xl: initial; /* 1536px 제거 */

  --breakpoint-md: 48rem; /* 768px  — Tablet */
  --breakpoint-lg: 64rem; /* 1024px — Desktop */
  --breakpoint-3xl: 85rem; /* 1360px — Wide */
}
```

### 선택지 B 진행 시 사전 작업

아래 명령으로 기존 코드의 `sm:`, `xl:`, `2xl:`, `3xl:` 사용 현황을 파악한다.

```bash
# sm: 사용 파일 목록
rg "sm:" src/ -l

# xl:, 2xl:, 3xl: 사용 파일 목록
rg "xl:|2xl:|3xl:" src/ -l
```

파악된 파일들에서 `md:` 또는 `lg:`로 대체하거나 팀 논의 후 처리한다.

### 팀 컨벤션 기준 (결정 후 모든 신규 코드에 적용)

```
Mobile  (기본, 0~767px):     prefix 없음  — 모바일 퍼스트 기본값
Tablet  (md:, 768~1023px):  md: prefix
Desktop (lg:, 1024px~):     lg: prefix
```

**금지**: `sm:`, `xl:`, `2xl:` (팀 컨벤션 외 prefix) / 고정 px 너비 (`w-[500px]`)

### 완료 기준

- `--breakpoint-3xl: 1360px` → `85rem` 으로 수정 완료
- 선택지 A/B 팀 결정 후 `@theme` 반영 완료
- 선택지 B 선택 시 기존 `sm:`/`xl:` 사용 코드 전량 교체 완료

---

## 1-C. Type 중앙화

### 작업 대상 파일

```
신규 생성: src/shared/types/
  ├── user.types.ts
  ├── note.types.ts
  ├── asset.types.ts
  ├── chat.types.ts
  ├── auth.types.ts
  └── index.ts

이동 대상 (현재 위치):
  features/auth/api/auth_types.ts
  features/notes/api/notes_types.ts
  features/chat/types/chat_types.ts
  features/assets/types/asset.ts
  features/storage/api/assets_types.ts
  features/settings/api/user_types.ts
```

### 현재 상태 및 문제점

핵심 엔티티 타입이 각 feature 하위에 분산되어 있다.  
특히 `features/assets/types/asset.ts`와 `features/storage/api/assets_types.ts`에 Asset 관련 타입이 중복 정의될 가능성이 높다.  
cross-feature import 시 상대 경로가 깊어지고 순환 참조 위험이 있다.

### 이동 기준

- **이동 대상**: 두 개 이상의 feature에서 참조하는 엔티티 타입 (`Note`, `Asset`, `UserDto`, `ChatMessage` 등)
- **이동 제외**: 특정 feature UI 전용 타입 (예: `LeftPanelTab`, 모달 상태 타입 등)

### 작업 절차

1. `src/shared/types/` 폴더 생성
2. 각 타입 파일에서 공통 타입 추출 및 통합 (`asset.ts` + `assets_types.ts` 중복 확인 후 병합)
3. 기존 파일의 해당 타입을 `@/shared/types`에서 re-export 하거나 삭제
4. 기존 파일을 import하던 모든 곳의 import 경로 수정
5. `src/shared/types/index.ts`에 barrel export 추가

```ts
// src/shared/types/index.ts 예시
export type { UserDto, UserProfile } from "./user.types";
export type { Note, NoteDetail, NoteCreateRequest } from "./note.types";
export type { Asset, AssetStatus } from "./asset.types";
export type { ChatMessage, MessageAttachment } from "./chat.types";
export type { LoginResult } from "./auth.types";
```

### ⚠️ 주의

- `shared/api/shared_types.ts`의 `ApiResponse`, `PageInfo`, `TokenDto`는 이미 shared에 있으므로 건드리지 않는다.
- 타입 이동 후 TypeScript 빌드 에러가 없어야 한다: `npm run build`

### 완료 기준

- `npm run build` 에러 없음
- `features/assets/`와 `features/storage/`의 Asset 타입이 `src/shared/types/asset.types.ts` 하나로 통합
- cross-feature import 경로가 `@/shared/types`를 참조

---

## 1-D. Network 계층 정비 — client.ts

### 작업 대상 파일

`src/shared/api/client.ts`

### 현재 문제

**[문제 1] API 계층이 브라우저 히스토리를 직접 조작** (line 35~43)

```ts
// 현재 코드 — 안티패턴
const redirectToErrorRoute = (route: string) => {
  window.history.replaceState(window.history.state, "", route);
  window.dispatchEvent(new PopStateEvent("popstate"));
};
```

Axios 인터셉터가 `window.history`를 직접 건드려 React Router 히스토리 스택을 우회한다.  
"뒤로 가기" 동작이 깨질 수 있고, 인터셉터를 단독으로 테스트하는 것이 불가능하다.

**[문제 2] 토큰 쓰기 로직이 client.ts에 있음**  
`tokenUtils.setTokens()`가 client.ts에 정의되어 있고, 갱신된 토큰을 localStorage에 직접 쓴다.  
토큰 저장의 단일 책임이 Phase 4에서 `auth_store`로 이전될 예정이므로 이 작업은 Phase 4와 연계된다.

### 작업 내용 — 라우팅 우회 제거만 수행

`redirectToErrorRoute` 함수를 Custom Event 방식으로 교체한다.  
`client.ts`는 이벤트를 발생시키기만 하고, React 계층에서 이 이벤트를 받아 `navigate()`로 처리한다.

```ts
// client.ts — 변경 후
const redirectToErrorRoute = (route: string) => {
  if (!SHOULD_ENABLE_ERROR_REDIRECT) return;
  const currentPath = window.location.pathname;
  if (currentPath === route || currentPath.startsWith("/error/")) return;

  window.dispatchEvent(
    new CustomEvent("proovy:navigate", { detail: { route } }),
  );
};
```

```tsx
// ⚠️ AppLayout은 /app/* 보호 라우트에서만 마운트된다.
// 로그인/회원가입 등 공개 페이지에서 API 에러가 나면 AppLayout은 마운트되어 있지 않으므로
// 이벤트를 수신하지 못한다. 전역에서 항상 마운트되는 별도 컴포넌트가 필요하다.

// src/shared/router/NavigationEventBridge.tsx (신규 생성)
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function NavigationEventBridge() {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: CustomEvent<{ route: string }>) => {
      navigate(e.detail.route, { replace: true });
    };
    window.addEventListener("proovy:navigate", handler as EventListener);
    return () =>
      window.removeEventListener("proovy:navigate", handler as EventListener);
  }, [navigate]);

  return null;
}
```

```tsx
// src/app/router/routes.tsx 또는 RouterProvider 하위 최상단 레이아웃에 삽입
// RouterProvider 안에서 useNavigate를 쓸 수 있는 위치면 어디든 가능
// AuthEventBridge(Phase 4)와 동일한 패턴으로 렌더 트리에 등록한다
<RouterProvider router={router} />
// → router 내부 root route에 <NavigationEventBridge />를 outlet wrapper로 배치하거나
//   createBrowserRouter의 최상위 element에 포함시킨다
```

### ⚠️ 1-D 범위 명확화 (Phase 4와의 경계)

```
1-D에서 하는 것:
  - window.history.replaceState + popstate dispatch → Custom Event 방식으로 교체
  - 라우팅 우회 제거만 완료

1-D에서 하지 않는 것 (Phase 4에서 처리):
  - tokenUtils → token_storage 분리
  - 토큰 저장/삭제 책임 auth_store로 이전
```

Phase 4는 1-D 완료 후 시작한다. 두 작업을 동시에 진행하면 디버깅이 어렵다.

### 완료 기준

- `window.history.replaceState` / `window.dispatchEvent(new PopStateEvent(...))` 코드가 client.ts에서 제거됨
- 에러 발생 시 `/error/401`, `/error/404` 등으로 정상 이동 확인
- React Router 히스토리 스택이 유지됨 (이동 후 뒤로 가기 동작 확인)

---

## 완료 기준 (Phase 1 전체)

- [ ] `bg-primary-main`, `text-h1`, `rounded-lg` 등 디자인 토큰 클래스가 브라우저에서 동작
- [ ] radius 변경으로 인한 UI 변화 육안 검토 완료
- [ ] `--breakpoint-3xl: 1360px` → `85rem` 수정 완료, 선택지 A/B 결정 및 반영
- [ ] `npm run build` 에러 없음
- [ ] `src/shared/types/` 폴더 생성 및 핵심 타입 이동 완료
- [ ] `client.ts`의 `window.history.replaceState` 제거 완료

## Phase 1 완료 후 다음 단계

→ **Phase 2** (CVA Button/Input, Icon 시스템) 시작 가능  
→ **Phase 3** (pages 폴더 정리)는 Phase 1과 병렬 진행 가능
