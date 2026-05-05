# Proovy Frontend 통합 리팩토링 계획서 (개정판)

> 작성일: 2026-05-05  
> 기준 브랜치: `poc/249-canvas-poc`  
> 이 문서는 초안 계획서(`refactor.md`)를 실제 코드베이스 현황에 맞게 갱신한 버전입니다.  
> **구현 전 반드시 이 문서를 기준으로 합니다.**

---

## 목차

1. [개요 및 핵심 변경 사항](#1-개요-및-핵심-변경-사항)
2. [초안 계획서와의 주요 차이점](#2-초안-계획서와의-주요-차이점)
3. [현재 코드베이스 구조 요약](#3-현재-코드베이스-구조-요약)
4. [Phase 1: 글로벌 인프라 및 디자인 시스템 구축](#4-phase-1-글로벌-인프라-및-디자인-시스템-구축)
5. [Phase 2: 공통 UI 컴포넌트 추상화](#5-phase-2-공통-ui-컴포넌트-추상화)
6. [Phase 3: 아키텍처 및 라우팅 정상화](#6-phase-3-아키텍처-및-라우팅-정상화)
7. [Phase 4: Auth 도메인 로직 완전 분리](#7-phase-4-auth-도메인-로직-완전-분리)
8. [Phase 5: 비즈니스 도메인(Notes/Assets) 성능 구조조정](#8-phase-5-비즈니스-도메인notesassets-성능-구조조정)
9. [반응형 디자인 표준화 가이드](#9-반응형-디자인-표준화-가이드)
10. [작업 우선순위 및 예상 난이도](#10-작업-우선순위-및-예상-난이도)

---

## 1. 개요 및 핵심 변경 사항

### 리팩토링의 목적

초반 빠른 개발 과정에서 발생한 구조적 부채를 해소하고, 실제 배포 및 사업 운영에 적합한 코드베이스를 만드는 것이 목표입니다. 단순히 "코드를 예쁘게 만드는 작업"이 아니라, 다음 목표를 달성하기 위한 작업입니다.

- **유지보수성**: 새 기능을 추가할 때 기존 코드를 건드리지 않아도 되는 구조
- **안정성**: 인증 버그, 상태 불일치, 무한 루프 등 런타임 오류 방지
- **일관성**: 색상, 폰트, 여백이 전 페이지에 걸쳐 동일한 기준으로 적용
- **성능**: 불필요한 API 호출 제거, 렌더링 병목 해소

### 초안 대비 핵심 변경 사항 요약

| 구분                  | 초안 계획                                      | 실제 적용 방향                                     | 이유                                             |
| --------------------- | ---------------------------------------------- | -------------------------------------------------- | ------------------------------------------------ |
| Tailwind 설정 방식    | `tailwind.config.ts` 수정 (v3 방식)            | `global.css @theme` 블록 수정 (v4 방식)            | 프로젝트가 Tailwind v4.1.18 사용 중              |
| 반응형 브레이크포인트 | `tailwind.config.ts`에 추가                    | `global.css @theme`에 `--breakpoint-*` 변수로 추가 | 동일한 이유 (v4 방식)                            |
| pages 위치            | `features/*/pages/` → `src/pages/`로 전면 이동 | 혼재 상태 정리 후 일관성 확보                      | 이미 일부가 `src/pages/`에 존재하여 규칙 충돌 중 |
| CVA 라이브러리        | 도입 가정                                      | 신규 패키지 설치 필요                              | 현재 미설치 상태                                 |

---

## 2. 초안 계획서와의 주요 차이점

### 2-1. Tailwind v4 — 가장 중요한 변경점

초안 계획서(`refactor.md`)와 디자인 시스템 문서(`design_system.md`)는 **Tailwind CSS v3 기준**으로 작성되어 있습니다. 그러나 현재 프로젝트는 **Tailwind CSS v4.1.18**을 사용하고 있습니다.

**v3와 v4의 핵심 차이:**

```
[v3 방식]
tailwind.config.ts 파일에 theme.extend.colors, theme.extend.fontSize 등을 JS 객체로 정의

[v4 방식]
tailwind.config.ts 파일이 없거나 거의 비어 있음
src/app/styles/global.css의 @theme 블록에 CSS 변수로 정의

  네임스페이스 규칙 (v4 공식 문서 기준):
  - 색상:        --color-*          → bg-*, text-*, border-* 클래스 생성
  - 폰트 사이즈:  --text-*           → text-* 클래스 생성  (--font-size-* 아님 ❌)
  - Border Radius: --radius-*       → rounded-* 클래스 생성
  - 브레이크포인트: --breakpoint-*   → sm:, md:, lg: 등 prefix 생성
```

현재 `global.css`의 `@theme` 블록에는 폰트(`--font-sans`)와 브레이크포인트(`--breakpoint-3xl`) 만 정의되어 있고, 색상·폰트 사이즈·border-radius 등 디자인 토큰이 전혀 없습니다.

**왜 문제인가?**  
디자인 토큰이 전역으로 등록되어 있지 않으면, 모든 컴포넌트에서 색상값을 하드코딩하거나(`#2046FF`, `#F1F4F8` 등) 파일별로 정의한 상수(`toolbar_styles.ts`)에 의존해야 합니다. 이는 색상 하나를 바꿀 때 수십 개의 파일을 수동으로 찾아 고쳐야 하는 구조를 만듭니다.

---

### 2-2. pages 폴더 혼재 문제

초안 계획은 `features/*/pages/` 내의 페이지들을 `src/pages/`로 이동하는 것을 목표로 했습니다. 그런데 **현재 `src/pages/`에 이미 일부 페이지가 존재**하고 있습니다.

```
현재 상태:
src/pages/          ← 일부 독립 페이지 (HomePage, LandingPage, 에러페이지들)
features/auth/pages/     ← LoginPage, SignupPage, 소셜 콜백 페이지들
features/notes/pages/    ← NotesPage
features/chat/pages/     ← ChatPage
features/storage/pages/  ← StoragePage
features/subscription/pages/ ← PricingPage
```

**왜 문제인가?**  
페이지 컴포넌트를 어디서 찾아야 하는지 규칙이 일관성이 없습니다. 새 팀원이 합류하거나 새 페이지를 추가할 때 어느 폴더에 넣어야 하는지 혼란이 생기며, 라우팅 파일(`routes.tsx`)과 페이지 위치 간의 대응 관계가 직관적이지 않습니다.

---

### 2-3. Auth 토큰 이중 관리 (Dual Source of Truth)

초안 계획서가 지적한 "이중 진실" 문제가 실제로 존재합니다. 구체적으로는 두 곳에서 인증 상태를 독립적으로 관리하고 있습니다.

```
[관리 주체 1] features/auth/store/auth_store.ts (Zustand)
  - user, isAuthenticated, token 필드 모두 존재 (line 6~9)
  - 단, persist의 partialize 옵션에서 token은 제외됨 (line 44~47)
  - 즉, 새로고침 후 token은 null로 초기화됨 (user, isAuthenticated만 유지)

[관리 주체 2] shared/api/client.ts
  - accessToken, refreshToken을 별도 localStorage key로 직접 영속 저장
  - Zustand의 partialize와 무관하게 독립적으로 유지됨
```

**왜 문제인가?**  
`ProtectedRoute`는 Zustand의 `isAuthenticated`를 보고 라우팅을 결정하지만, 실제 API 호출은 `client.ts`의 localStorage 토큰을 사용합니다. 예를 들어 토큰이 만료되어 `client.ts`가 갱신에 실패해도, Zustand의 `isAuthenticated`가 `true`로 남아 있으면 사용자는 계속 보호 라우트에 접근할 수 있는 것처럼 보이다가 API 호출만 전부 실패하는 좀비 세션 상태가 됩니다.

---

### 2-4. 인라인 SVG 아이콘 파편화

현재 `shared/components/icons/` 폴더 안에 **14개의 아이콘 파일**이 있습니다.

```
ChatInputIcons.tsx, ChattingPageIcons.tsx, DividerIcons.tsx,
HomepageInputIcons.tsx, LoginIcons.tsx, LoginProviderIcons.tsx,
NotesIcons.tsx, PanelToggleIcons.tsx, ProovyLogo.tsx,
SettingsIcons.tsx, SidebarIcons.tsx, SparkleIcon.tsx,
StorageActionIcons.tsx, StorageIcons.tsx
```

각 파일에는 인라인 SVG 태그가 JSX에 직접 작성되어 있습니다. 이는 사용하는 곳에서 색상, 크기, stroke 등의 속성을 외부에서 제어할 수 없어 재사용성이 낮습니다.

---

## 3. 현재 코드베이스 구조 요약

```
src/
├── app/
│   ├── providers/query_provider.tsx     # React Query 설정
│   ├── router/routes.tsx                # 전체 라우팅
│   └── styles/global.css               # Tailwind v4 진입점 (@theme 블록)
│
├── features/                           # 도메인별 기능 모듈
│   ├── auth/                           # 인증 (API, 컴포넌트, 훅, 페이지, 스토어)
│   ├── assets/                         # 파일 업로드 관리
│   ├── chat/                           # 채팅/대화 기능
│   ├── editor/                         # 입력/편집 (ChatInput, Canvas 포함)
│   ├── landing/                        # 랜딩 페이지 컴포넌트들
│   ├── notes/                          # 노트 관리
│   ├── search/                         # 검색 기능
│   ├── settings/                       # 설정 모달
│   ├── sidebar/                        # 사이드바
│   ├── storage/                        # 파일 저장소
│   └── subscription/                   # 구독/결제
│
├── pages/                              # 독립 페이지 (features와 혼재 중)
│   ├── error/                          # 에러 페이지들 (401/403/404/500)
│   ├── HomePage.tsx
│   └── LandingPage.tsx
│
├── shared/                             # 전역 공유 코드
│   ├── api/
│   │   ├── client.ts                   # Axios 인스턴스 + 토큰 관리 (문제 지점)
│   │   └── shared_types.ts             # 공통 타입
│   ├── components/
│   │   ├── icons/                      # 14개 아이콘 파일 (파편화)
│   │   └── ui/                         # Toast, Skeleton
│   ├── layout/AppLayout.tsx            # 메인 레이아웃
│   ├── lib/
│   │   ├── toast.ts                    # Custom Event 기반 토스트
│   │   └── utils.ts                    # cn() 유틸
│   └── router/components/RouteGuards.tsx  # ProtectedRoute, PublicRoute
│
└── mocks/                              # MSW Mock handlers
```

---

## 4. Phase 1: 글로벌 인프라 및 디자인 시스템 구축

> **목표**: 모든 컴포넌트가 참조할 수 있는 단일 디자인 토큰 체계를 구축하고, 타입과 네트워크 계층을 정비합니다.

### 4-1. Design Token 통합 — Tailwind v4 방식으로

**작업 대상 파일**: `src/app/styles/global.css`

**현재 상태**:  
`global.css`의 `@theme` 블록에는 폰트와 커스텀 브레이크포인트만 정의되어 있습니다. 색상, 폰트 사이즈, border-radius 등이 없기 때문에 현재는 모든 색상을 hex 코드나 임시 상수로 사용하고 있습니다.

**해야 할 작업**:  
`@theme` 블록에 `design_system.md`에 정의된 색상, 폰트 사이즈, border-radius를 CSS 변수로 추가합니다.

```css
/* 이렇게 추가해야 합니다 (v4 방식, 공식 문서 기준) */
@theme {
  /* 색상 — --color-* 네임스페이스 */
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

  /* 폰트 사이즈 — --text-* 네임스페이스 (--font-size-* 아님) */
  /* line-height, font-weight는 -- 뒤에 이중 대시(--) 로 연결 */
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

  /* Border Radius — --radius-* 네임스페이스 */
  /* ⚠️ Tailwind v4 기본값(sm=4px, md=6px, lg=8px, xl=12px)을 덮어쓰는 것 */
  /* 우리 디자인 시스템 기준값으로 재정의: md/lg/xl이 기본값과 다름 */
  --radius-sm: 4px; /* Tailwind 기본 4px — 동일 */
  --radius-md: 8px; /* Tailwind 기본 6px — 덮어씀 */
  --radius-lg: 12px; /* Tailwind 기본 8px — 덮어씀 */
  --radius-xl: 16px; /* Tailwind 기본 12px — 덮어씀 */
}
```

**등록 후 사용 방법**:

- `--color-primary-main` → `bg-primary-main`, `text-primary-main`, `border-primary-main`
- `--text-display-1` (+ line-height/weight 연동) → `text-display-1` 클래스 하나로 size·행간·굵기 동시 적용
- `--radius-lg` → `rounded-lg`

**⚠️ radius 덮어쓰기 주의**:  
Tailwind v4가 기본으로 제공하는 `rounded-md`(6px), `rounded-lg`(8px), `rounded-xl`(12px)이 우리 @theme 정의로 각각 8px, 12px, 16px로 변경됩니다. 기존 코드에서 `rounded-md`를 쓰고 있던 컴포넌트들의 실제 렌더링 크기가 바뀔 수 있으므로, Design Token 등록 후 전체 UI를 육안으로 검토해야 합니다.

**왜 지금 당장 해야 하는가?**  
이 작업이 Phase 2 이후 모든 작업의 기반입니다. 토큰이 없으면 "공용 Button 컴포넌트를 만들어도" 그 안에 색상이 하드코딩될 수밖에 없습니다. 전역 토큰이 먼저 존재해야 나머지 컴포넌트들이 토큰을 참조하는 구조로 전환할 수 있습니다.

**⚠️ 색상 토큰 네이밍 검토 필요 — `--color-text-*`**:  
`--color-text-main`으로 등록하면 Tailwind 클래스가 `text-text-main`이 됩니다. 문법상 동작하지만 `text-` prefix가 중복되어 어색합니다. 아래 두 방향 중 팀이 결정합니다.

- **유지**: `text-text-main` — 직관적이지 않지만 디자인 시스템 네이밍 그대로 유지
- **변경**: 시맨틱 네이밍으로 교체 (예: `--color-foreground`, `--color-foreground-sub`, `--color-on-surface`)  
  → 클래스가 `text-foreground`, `text-foreground-sub`처럼 자연스러워짐

결정 전까지는 `--color-text-main` 형태를 유지하되, 구현 시작 전에 팀 합의가 필요합니다.

**주의사항**:  
`features/editor/constants/toolbar_styles.ts`에 현재 버튼 색상들이 JS 상수로 정의되어 있습니다. Design Token 등록 후 이 파일의 색상값들도 Tailwind 클래스 기반으로 단계적으로 교체해야 합니다.

---

### 4-2. 반응형 브레이크포인트 표준화

**작업 대상 파일**: `src/app/styles/global.css`

**현재 상태**:  
현재 `@theme`에는 `--breakpoint-3xl: 1360px` 하나만 있고, 반응형 클래스(`md:`, `lg:`)는 Tailwind 기본값을 그대로 씁니다. 팀 컨벤션으로 정해진 3단계 브레이크포인트가 코드에 명시되어 있지 않아 컴포넌트마다 다른 기준으로 반응형이 구현될 수 있습니다.

**⚠️ 단위 주의 — px 대신 rem 사용**:  
Tailwind v4 공식 문서는 기본 브레이크포인트가 rem 기반이므로 커스텀 브레이크포인트도 **rem 단위로 통일**할 것을 권장합니다. 단위가 혼재되면 미디어쿼리 적용 순서가 어긋나 `md:`, `lg:` 클래스가 의도치 않게 무시될 수 있습니다. 현재 코드의 `--breakpoint-3xl: 1360px`도 `85rem`으로 수정이 필요합니다.

**⚠️ "강제"가 아닌 "팀 컨벤션 명시"**:  
`@theme`에 `--breakpoint-md`와 `--breakpoint-lg`를 추가해도 Tailwind 기본값인 `sm:`, `xl:`, `2xl:` prefix는 자동으로 사라지지 않습니다. 기본 브레이크포인트를 완전히 제거하려면 `initial` 키워드로 명시적으로 비활성화해야 합니다.

**해야 할 작업**:  
아래 세 가지 선택지 중 팀이 결정합니다.

**[선택지 A] 팀 컨벤션만 명시 (느슨한 강제)**  
기본 브레이크포인트는 유지하되 `@theme`에 우리 기준값을 명시해 코드 리뷰 기준으로 사용합니다.  
`sm:`, `xl:` 등 기본 prefix가 여전히 동작하므로 컨벤션 위반 방지 효과는 낮습니다.

```css
@theme {
  --breakpoint-md: 48rem; /* 768px */
  --breakpoint-lg: 64rem; /* 1024px */
  --breakpoint-3xl: 85rem; /* 1360px, 기존 1360px → rem 변환 */
}
```

**[선택지 B] 불필요한 기본 브레이크포인트 제거 (강한 강제)**  
우리가 쓰지 않기로 한 `sm:`, `xl:`, `2xl:` prefix를 `initial`로 비활성화합니다.  
코드에서 `xl:` 같은 클래스를 쓰면 아무 효과가 없으므로 컨벤션 위반이 즉시 드러납니다.

```css
@theme {
  --breakpoint-sm: initial; /* 기본 sm(640px) 제거 */
  --breakpoint-xl: initial; /* 기본 xl(1280px) 제거 */
  --breakpoint-2xl: initial; /* 기본 2xl(1536px) 제거 */

  --breakpoint-md: 48rem; /* 768px — Tablet */
  --breakpoint-lg: 64rem; /* 1024px — Desktop */
  --breakpoint-3xl: 85rem; /* 1360px — Wide */
}
```

**권장: 선택지 B.** 허용하지 않는 prefix를 명시적으로 제거해야 팀 컨벤션이 실제로 강제됩니다. 단, 기존 코드에서 `sm:`, `xl:` 클래스를 이미 사용 중인 곳이 있다면 교체 작업이 필요합니다.

```
팀 컨벤션 기준 (결정 후 이 문서에 반영):
Mobile  (기본, 0px ~ 767px):    별도 prefix 없음, 모바일 퍼스트
Tablet  (md:, 768px ~ 1023px):  md: prefix
Desktop (lg:, 1024px ~):        lg: prefix
```

---

### 4-3. Type 중앙화

**작업 대상 파일**: 각 `features/*/types/*.ts`, `src/shared/types/` (신규 폴더 생성)

**현재 상태**:  
핵심 엔티티 타입들이 각 feature 하위에 분산되어 있습니다.

```
features/auth/api/auth_types.ts       # UserDto, LoginResult 등
features/notes/api/notes_types.ts     # Note, NoteDetail 등
features/chat/types/chat_types.ts     # ChatMessage, MessageAttachment 등
features/assets/types/asset.ts        # Asset, AssetStatus 등
features/storage/api/assets_types.ts  # Asset 관련 타입 (assets와 중복 의심)
features/settings/api/user_types.ts   # UserProfile 등
shared/api/shared_types.ts            # ApiResponse, PageInfo, TokenDto
```

**문제점**:

- `features/assets/`와 `features/storage/`에 Asset 관련 타입이 중복으로 존재할 가능성이 있습니다.
- 한 feature에서 다른 feature의 타입을 참조할 때 상대 경로 import가 깊어져 순환 참조 위험이 있습니다.
- 공통으로 쓰는 타입(`Note`, `Asset` 등)이 어디서 참조해야 하는지 불명확합니다.

**해야 할 작업**:  
여러 feature에서 참조하는 핵심 엔티티 타입들을 `src/shared/types/`로 이동합니다.

```
src/shared/types/
  ├── user.types.ts       # UserDto, UserProfile 등
  ├── note.types.ts       # Note, NoteDetail, NoteCreateRequest 등
  ├── asset.types.ts      # Asset, AssetStatus 등 (assets + storage 통합)
  ├── chat.types.ts       # ChatMessage, MessageAttachment 등
  ├── auth.types.ts       # LoginResult, TokenDto 등
  └── index.ts            # barrel export
```

feature 전용 타입(특정 feature에서만 쓰는 UI 상태 타입 등)은 기존 위치에 유지합니다.

**왜 해야 하는가?**  
현재 `features/assets/`와 `features/storage/`에 유사한 Asset 타입이 중복 정의되어 있을 가능성이 높습니다. 두 타입이 달라지면 런타임 에러나 TypeScript 에러 없이 잘못된 데이터를 화면에 표시하는 버그가 생깁니다.

---

### 4-4. Network 계층 정비 — client.ts 리팩토링

**작업 대상 파일**: `src/shared/api/client.ts`

**현재 상태**:  
`client.ts`는 Axios 인스턴스와 인터셉터를 정의하는 파일인데, 현재 다음 역할을 동시에 담당하고 있습니다.

1. HTTP 요청/응답 처리 (본래 역할)
2. localStorage에서 토큰 직접 읽기/쓰기 (부수 효과)
3. 에러 발생 시 `window.history.replaceState` + `popstate` dispatch로 라우팅 우회 (안티패턴)
4. 401 발생 시 토큰 갱신 로직 실행 및 큐 관리 (복합 로직)

**문제점**:

**[문제 1] `window.history.replaceState` 기반 라우팅 우회**  
`client.ts`의 `redirectToErrorRoute` 함수(line 35~43)는 `window.history.replaceState`로 URL을 바꾼 뒤 `window.dispatchEvent(new PopStateEvent("popstate"))`를 강제로 발생시켜 React Router를 우회 조작합니다. `window.location.href` 직접 이동은 아니지만, API 계층이 브라우저 히스토리를 직접 건드리는 구조이므로 문제의 본질은 동일합니다. React Router의 히스토리 스택과 상태 관리를 우회하므로 "뒤로 가기" 동작이 깨질 수 있고, 인터셉터를 단독으로 테스트하기가 불가능합니다.

**[문제 2] 토큰 이중 저장**  
`client.ts`가 직접 `localStorage.setItem('accessToken', ...)`을 호출합니다. 동시에 `auth_store.ts`도 `zustand/persist`로 `auth-storage`라는 키에 인증 상태를 저장합니다. 두 저장소가 독립적으로 관리되므로 하나가 갱신되어도 다른 하나가 갱신되지 않는 불일치가 발생합니다.

**해야 할 작업**:

- `window.history.replaceState` + `popstate` dispatch 라우팅 → React Router의 `navigate` 함수를 주입받거나, Custom Event를 통해 간접 호출하는 방식으로 교체
- 토큰 저장 로직을 `auth_store.ts`의 액션으로 단일화 (Phase 4와 연계)

---

## 5. Phase 2: 공통 UI 컴포넌트 추상화

> **목표**: 버튼, 입력창 등 반복되는 UI 요소를 단일 공용 컴포넌트로 통합하고, 아이콘 시스템을 정비합니다.

### 5-1. CVA 기반 공용 Button 컴포넌트

**작업 대상**: `src/shared/components/ui/Button.tsx` (신규)

**현재 상태**:  
프로젝트에 공용 `Button` 컴포넌트가 없습니다. 각 feature의 컴포넌트가 `<button className="...">` 형태로 직접 스타일을 작성하거나, `toolbar_styles.ts`의 상수를 참조합니다. CVA(Class Variance Authority) 라이브러리도 현재 설치되어 있지 않습니다.

**문제점**:

- 버튼의 hover 색상, disabled 스타일, 크기 등이 컴포넌트마다 다르게 구현됩니다.
- 디자인이 바뀌면 모든 버튼을 찾아서 하나하나 수정해야 합니다.
- 접근성(aria, disabled, type 속성 등)이 일관되게 적용되지 않을 수 있습니다.

**해야 할 작업**:

1. CVA 패키지 설치: `npm install class-variance-authority`
2. `src/shared/components/ui/Button.tsx` 생성
3. variant (`primary`, `secondary`, `ghost`, `danger`)와 size (`sm`, `md`, `lg`) 조합 정의
4. Phase 1에서 등록한 디자인 토큰 클래스 사용

**버튼 variant 기준** (design_system.md + 현재 UI 분석 기반):

```
primary:    bg-primary-main, 흰색 텍스트, hover 시 bg-primary-dark
secondary:  흰색 배경, primary-main 테두리/텍스트
ghost:      배경 없음, 회색 텍스트, hover 시 gray-50 배경
danger:     bg-semantic-error, 흰색 텍스트
```

---

### 5-2. CVA 기반 공용 Input 컴포넌트

**작업 대상**: `src/shared/components/ui/Input.tsx` (신규)

**현재 상태**:  
`features/auth/components/PhoneVerificationForm.tsx` 등에서 `<input className="...">` 형태로 직접 스타일이 작성됩니다. 포커스 링, 에러 상태, disabled 상태 등이 파일마다 다르게 구현됩니다.

**해야 할 작업**:  
`Button`과 동일하게 CVA 기반으로 error, default, disabled 상태를 variant로 정의합니다.

---

### 5-3. Icon 시스템 구축

**작업 대상**: `src/shared/components/icons/` (14개 파일 정비)

**현재 상태**:

```
ChatInputIcons.tsx, ChattingPageIcons.tsx, DividerIcons.tsx,
HomepageInputIcons.tsx, LoginIcons.tsx, LoginProviderIcons.tsx,
NotesIcons.tsx, PanelToggleIcons.tsx, ProovyLogo.tsx,
SettingsIcons.tsx, SidebarIcons.tsx, SparkleIcon.tsx,
StorageActionIcons.tsx, StorageIcons.tsx
```

각 파일 안에 SVG가 JSX로 직접 작성되어 있고, 색상이나 크기가 하드코딩되어 있어 외부에서 `color`, `size` prop으로 제어할 수 없습니다.

**문제점**:

- 같은 아이콘을 다른 색으로 쓰고 싶을 때 SVG를 복사해서 별도 컴포넌트를 만들어야 합니다.
- 아이콘 크기를 바꾸려면 파일 안으로 들어가 `width`/`height` 속성을 직접 수정해야 합니다.
- 파일 분류 기준이 "어디서 쓰는지(페이지 기반)"라서, 같은 아이콘이 여러 파일에 중복 정의될 수 있습니다.

**해야 할 작업**:  
공통 `<Icon>` 래퍼 컴포넌트를 만들고, 각 SVG는 아이콘 이름 기준으로 함수 컴포넌트로 정리합니다.

```tsx
// 목표 사용법
<Icon name="search" size={20} color="text-gray-600" />
<Icon name="chevron-right" size={16} className="text-primary-main" />
```

**`lucide-react`가 이미 설치되어 있습니다** (`^0.562.0`). 별도 패키지 설치 없이 바로 활용 가능합니다. 기존 인라인 SVG 중 lucide에 동일한 아이콘이 있는 것부터 대체하고, 브랜드 고유 아이콘(Proovy 로고 등 lucide에 없는 것)만 커스텀 컴포넌트로 유지합니다. "lucide 도입 검토"가 아니라 "기존 인라인 SVG를 lucide로 단계적 대체"가 올바른 방향입니다.

---

## 6. Phase 3: 아키텍처 및 라우팅 정상화

> **목표**: 파일 위치 규칙을 통일하고, 라우팅 Guard 로직의 신뢰성을 높이며, 안티패턴을 제거합니다.

### 6-1. pages 폴더 정리 — 일관성 확보

**현재 문제**:  
페이지 컴포넌트가 두 위치에 나뉘어 있습니다.

```
src/pages/               → HomePage, LandingPage, 에러페이지
features/auth/pages/     → LoginPage, SignupPage, 소셜 콜백 3개
features/notes/pages/    → NotesPage
features/chat/pages/     → ChatPage
features/storage/pages/  → StoragePage
features/subscription/pages/ → PricingPage
```

**결정해야 할 방향 (두 가지 선택지)**:

**[Option A] 전부 `src/pages/`로 통일**  
모든 라우팅 컴포넌트를 `src/pages/`로 이동. 비즈니스 로직(hook, api)은 features에 유지.  
→ 라우팅 파일과 페이지 파일의 1:1 대응이 명확해짐. 단, feature 폴더가 "페이지 없는 기능 모음"이 됨.

**[Option B] 전부 `features/*/pages/`로 통일**  
`src/pages/`의 파일들을 해당 domain feature로 이동.  
→ feature 단위 응집도가 높아짐. 단, 에러 페이지처럼 domain이 없는 페이지의 위치가 애매함.

**권장**: Option A. 라우팅 = 페이지 = `src/pages/`라는 규칙이 신규 팀원에게 더 직관적이고, `routes.tsx`와 `src/pages/`의 관계가 1:1로 대응하여 파악이 쉽습니다.

---

### 6-2. ProtectedRoute 강화

**작업 대상 파일**: `src/shared/router/components/RouteGuards.tsx`

**현재 상태**:

```typescript
// 현재 방식 (Zustand isAuthenticated만 확인)
const { isAuthenticated } = useAuthStore();
if (!isAuthenticated) return <Navigate to="/login" />;
```

**문제점**:  
`isAuthenticated`는 localStorage에 persist된 Zustand 상태입니다. 브라우저를 닫았다 열어도 `isAuthenticated: true`가 유지됩니다. 그러나 실제 `accessToken`은 만료되거나 삭제될 수 있습니다. 이 경우 사용자는 보호된 페이지로 진입했다가 모든 API 호출이 401로 실패하는 상황이 발생합니다.

**해야 할 작업**:  
`isAuthenticated` 뿐 아니라 실제 `accessToken`의 존재 여부를 함께 확인하도록 보강합니다. 토큰 만료 시각(`exp` 클레임)을 디코딩해 미리 로그아웃 처리하는 방식도 고려합니다.

```typescript
// 개선 방향
const { isAuthenticated } = useAuthStore();
const hasToken = !!tokenUtils.getAccessToken();
if (!isAuthenticated || !hasToken) return <Navigate to="/login" />;
```

---

### 6-3. AppLayout DOM 직접 조작 제거

**작업 대상 파일**: `src/shared/layout/AppLayout.tsx`

**현재 상태**:  
`AppLayout.tsx` 내부에서 `document.querySelector` 등을 사용해 DOM을 직접 조작하는 안티패턴이 존재하는지 확인이 필요합니다.

**해야 할 작업**:  
확인 결과 존재한다면, `useRef`를 사용해 React의 선언적 렌더링 방식으로 전환합니다. DOM을 직접 조작하면 React의 가상 DOM과 실제 DOM이 불일치하여 예측 불가능한 렌더링 버그가 발생할 수 있습니다.

---

## 7. Phase 4: Auth 도메인 로직 완전 분리

> **목표**: 인증 관련 모든 로직의 책임 소재를 명확히 하고, 토큰 관리를 단일 진실 공급원으로 통합합니다.

### 7-1. 토큰 관리 단일화

**현재 문제 (상세)**:

```
[저장 경로 1] localStorage 'accessToken', 'refreshToken'
  → client.ts가 직접 읽기/쓰기
  → Zustand는 이 값을 모름

[저장 경로 2] localStorage 'auth-storage'
  → Zustand persist가 user, isAuthenticated를 저장
  → 토큰은 여기에 없음
```

사용자가 로그아웃할 때 Zustand의 `logout()` 액션을 호출하면 `isAuthenticated: false`가 되고 `auth-storage`는 초기화됩니다. 그러나 `client.ts`의 `localStorage.removeItem('accessToken')`을 별도로 호출하지 않으면 토큰이 남아 있게 됩니다. 현재 코드에서 이 두 호출이 항상 같이 실행된다는 보장이 없습니다.

**해야 할 작업**:  
`auth_store.ts`의 `login`, `logout` 액션이 토큰 저장/삭제까지 책임지도록 합니다. `client.ts`는 토큰을 "읽기"만 하고 "쓰기"는 하지 않도록 변경합니다.

```
[변경 후 책임 분리]
auth_store (Zustand):   토큰 포함 모든 인증 상태 저장/삭제 (단일 진실)
client.ts:              인터셉터에서 토큰 "읽기"만 수행 (쓰기 금지)
auth_api.ts:            API 호출 후 auth_store 액션을 호출하도록 변경
```

---

### 7-2. auth_api.ts의 부수 효과 분리

**작업 대상 파일**: `src/features/auth/api/auth_api.ts`

**현재 상태**:  
각 OAuth 콜백 API 함수(`loginWithKakao`, `loginWithGoogle` 등) 내부에서 API 응답을 받은 직후 `tokenUtils.setTokens()`를 직접 호출합니다.

**문제점**:  
API 함수는 "데이터를 서버에서 가져오는 것"만 해야 합니다. 토큰 저장은 "부수 효과(Side Effect)"이며, 이것이 API 함수 안에 포함되면 다음과 같은 문제가 생깁니다.

- 같은 API를 토큰 저장 없이 호출할 수 없습니다 (테스트 불가).
- 어디서 토큰이 저장되는지 추적하기 어렵습니다.

**해야 할 작업**:  
API 함수는 순수하게 서버 응답 데이터만 반환하고, 토큰 저장은 이를 호출하는 hook(`useAuth.ts`) 또는 콜백 페이지에서 담당하도록 분리합니다.

---

### 7-3. OAuth URL 빌드 로직 훅 추출

**작업 대상**: `features/auth/pages/LoginPage.tsx` → `features/auth/hooks/useOAuthLogin.ts`

**현재 상태**:  
소셜 로그인 URL 생성 로직(Kakao, Naver, Google OAuth URL 조립)이 `LoginPage.tsx` 컴포넌트 안에 직접 작성되어 있을 가능성이 높습니다.

**해야 할 작업**:  
URL 빌드 로직을 `useOAuthLogin` 훅으로 분리합니다. `LoginPage`는 훅에서 제공하는 URL을 `href`로 연결하는 것 외에 어떤 로직도 갖지 않도록 합니다 (Dumb Component 원칙).

---

### 7-4. LoginPage View 정리

Phase 2에서 만든 공용 `Button`, `Input` 컴포넌트를 `LoginPage`, `SignupPage`에 적용하고, 인라인 스타일과 하드코딩 색상을 전부 제거합니다.

---

## 8. Phase 5: 비즈니스 도메인(Notes/Assets) 성능 구조조정

> **목표**: 불필요한 API 호출을 제거하고, 데이터 로딩 방식을 사용자 경험에 맞게 최적화합니다.

### 8-1. Polling 방식 점검 — useAssetPolling.ts

**작업 대상 파일**: `src/features/assets/hooks/useAssetPolling.ts`

**현재 상태**:  
파일 업로드 후 처리 상태(OCR 진행 여부)를 확인하기 위해 `useAssetPolling.ts` 훅이 존재합니다. 내부에서 `while`문이 아닌 **`setTimeout` 재귀 호출** 방식으로 폴링합니다(line 25: `setTimeout(fetchStatus, interval)`). `ocrStatus`가 `completed` 또는 `failed`가 될 때까지 매 `interval`(기본 3000ms)마다 API를 재호출합니다.

**문제점**:  
`setTimeout` 재귀는 비동기이므로 렌더링을 직접 블로킹하지는 않습니다. 그러나 컴포넌트가 언마운트되어도 진행 중인 `setTimeout`이 취소되지 않아 **메모리 누수** 위험이 있습니다. 또한 React Query의 캐시·재시도·devtools 등 기능을 전혀 활용하지 못합니다.

**해야 할 작업**:  
`while`문 폴링이 확인되면 React Query의 `refetchInterval` 기반 비동기 폴링으로 교체합니다. 파일 처리 중에는 스켈레톤 UI를 보여주고, 완료 시 자동 갱신하는 방식으로 UX를 개선합니다.

---

### 8-2. Notes 다중 쿼리 최적화

**작업 대상 파일**: `src/features/notes/hooks/useNotes.ts`, `useNoteListPage.ts`

**현재 상태**:  
Notes 목록을 표시하기 위해 여러 개의 쿼리가 동시에 실행될 가능성이 있습니다 (예: 목록 쿼리 + 총 개수 쿼리 + 최근 노트 쿼리 동시 호출).

**해야 할 작업**:  
무한 스크롤 방식이 필요한 경우 `useInfiniteQuery` 단일 쿼리로 통합합니다. 페이지네이션을 유지한다면 페이지 전환 시 깜빡임을 제거하기 위해 아래 방식을 사용합니다.

```ts
// ⚠️ React Query v5 기준 — keepPreviousData: true 옵션은 v5에서 제거됨
// v5에서는 placeholderData 옵션을 사용
import { keepPreviousData } from "@tanstack/react-query";

useQuery({
  queryKey,
  queryFn,
  placeholderData: keepPreviousData, // 이전 페이지 데이터를 새 데이터 로딩 중에 유지
});
```

**추가 발견 — `getNoteDetailWithAllConversations`의 `while` 루프**:  
`notes_api.ts` line 107~156에 `while (hasNext)` 루프로 전체 대화 내역을 동기적으로 순차 풀링하는 함수가 있습니다. 페이지가 많을수록 채팅방 진입 시간이 선형으로 늘어납니다. 이 함수를 사용하는 훅을 파악하여 `useInfiniteQuery` 기반으로 교체하는 것이 Phase 5의 핵심 작업 중 하나입니다.

---

### 8-3. Notes 삭제 N+1 문제

**작업 대상**: `src/features/notes/api/notes_api.ts` — `deleteNotesBulk` 함수

**현재 상태**:  
`deleteNotesBulk`는 이름과 달리 실제 백엔드 Bulk API를 호출하지 않습니다. 내부에서 노트 ID 배열을 `MAX_CONCURRENT_NOTE_DELETES(5)` 단위로 청크 분할 후, 청크마다 `deleteNote(noteId)`를 `Promise.allSettled`로 병렬 호출합니다(line 166~186). 즉 N개를 삭제하면 최대 N번의 DELETE 요청이 발생합니다.

반면 **Storage/Assets는 이미 해결된 상태**입니다. `assets_api.ts`의 `deleteAssetsBulk`는 ID 배열을 request body에 담아 `/api/storage/assets`로 단 1번 호출합니다(line 69~77).

**왜 문제인가?**  
10개 노트 삭제 시 HTTP 요청이 10번 발생합니다. 100ms API 기준 최소 200ms(청크 2회 × 병렬)이지만, 각 청크가 순차 실행(`for...of`)되므로 네트워크 지연이 누적됩니다. 서버에도 불필요한 부하를 줍니다.

**해야 할 작업**:  
백엔드에 Notes Bulk Delete API(`DELETE /api/notes` with body `{ noteIds: number[] }`)를 추가 요청합니다. API가 생기면 Storage처럼 단일 호출로 교체합니다. 백엔드 협의 전까지는 현재 청크 방식 유지.

---

### 8-4. 인라인 스타일 최종 정리

Phase 1~4를 거치면서 교체되지 않은 인라인 스타일과 하드코딩 색상을 Notes 모달, 비즈니스 컴포넌트에서 최종적으로 정리합니다. Phase 1의 Design Token이 완성되어 있어야 이 작업이 가능합니다.

---

## 9. 반응형 디자인 표준화 가이드

모든 컴포넌트는 **모바일 퍼스트(Mobile-First)** 원칙으로 작성합니다.

```
기본 클래스 (Mobile, 0px~767px):
  → 최소 폭 375px 기준 작성
  → 예시: w-full px-4 text-base

md: prefix (Tablet, 768px~1023px):
  → 태블릿 세로 모드 대응, 2단 그리드 전환
  → 예시: md:px-8 md:grid-cols-2

lg: prefix (Desktop, 1024px~):
  → PC 환경, 최대 너비 제한 + 중앙 정렬
  → 예시: lg:max-w-[1200px] mx-auto
```

**금지 사항**:

- `sm:` prefix 사용 지양 (모바일 퍼스트에서 불필요)
- `xl:`, `2xl:` prefix는 특수 케이스에만 사용하고 팀 논의 후 적용
- 반응형 없는 고정 px 너비 (`w-[500px]` 등) 사용 금지

---

## 10. 작업 우선순위 및 예상 난이도

| Phase | 작업                      | 우선순위 | 난이도 | 의존성                                          |
| ----- | ------------------------- | -------- | ------ | ----------------------------------------------- |
| 1     | Design Token @theme 등록  | 🔴 최상  | 낮음   | 없음                                            |
| 1     | 브레이크포인트 표준화     | 🔴 최상  | 낮음   | 없음                                            |
| 1     | Type 중앙화               | 🟠 높음  | 중간   | 없음                                            |
| 1     | client.ts 라우팅 제거     | 🟠 높음  | 중간   | Phase 4와 연계                                  |
| 2     | CVA Button/Input 컴포넌트 | 🟠 높음  | 낮음   | Phase 1 Design Token                            |
| 2     | Icon 시스템               | 🟡 중간  | 중간   | 없음                                            |
| 3     | pages 폴더 정리           | 🟡 중간  | 낮음   | 없음                                            |
| 3     | ProtectedRoute 강화       | 🟠 높음  | 낮음   | Phase 4 토큰 단일화                             |
| 4     | 토큰 관리 단일화          | 🔴 최상  | 높음   | Phase 1 client.ts 정비                          |
| 4     | auth_api 부수효과 분리    | 🟠 높음  | 중간   | 토큰 단일화                                     |
| 4     | LoginPage Dumb 컴포넌트화 | 🟡 중간  | 낮음   | Phase 2 Button/Input                            |
| 5     | Polling 최적화            | 🟡 중간  | 중간   | 없음                                            |
| 5     | Notes 쿼리 최적화         | 🟡 중간  | 중간   | 없음                                            |
| 5     | Notes N+1 삭제 → Bulk API | 🟡 중간  | 낮음   | 백엔드 Bulk API 추가 필요 (Storage는 이미 해결) |
| 5     | 인라인 스타일 최종 정리   | 🟢 낮음  | 낮음   | Phase 1~4 완료 후                               |

---

## 주의사항

1. **Phase는 순서대로 진행합니다.** Phase 1의 Design Token이 없으면 Phase 2의 Button 컴포넌트를 올바르게 만들 수 없고, Phase 2의 공용 컴포넌트가 없으면 Phase 4의 LoginPage를 Dumb하게 만들 수 없습니다.

2. **Tailwind v4 방식을 철저히 따릅니다.** `tailwind.config.ts`에 `theme.extend`를 추가하는 v3 방식은 이 프로젝트에서 동작하지 않습니다. 모든 커스텀 토큰은 `global.css`의 `@theme` 블록에 CSS 변수로 정의합니다.

3. **한 번에 하나의 Phase만 진행합니다.** Phase 1이 완전히 완료되고 팀 리뷰가 끝나야 Phase 2를 시작합니다. 여러 Phase를 동시에 진행하면 충돌이 발생하고 리뷰가 어렵습니다.

4. **기존 동작을 깨지 않습니다.** 각 Phase 작업 후에는 주요 유저 플로우(로그인 → 노트 생성 → 채팅 → 파일 업로드)를 반드시 직접 테스트합니다.
