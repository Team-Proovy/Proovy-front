# Proovy Frontend

Proovy는 **이공계 대학생을 위한 퍼스널 AI 튜터** 서비스로,  
정확한 풀이 검증 · 수식 친화적인 입력 · 학습 루프 제공을 목표로 합니다.

본 저장소는 Proovy 서비스의 **Frontend(Web)** 코드베이스이며,  
팀 단위 협업을 전제로 한 명확한 컨벤션과 구조를 따릅니다.

---

## 👥 Member

|                   강민경                    |                 이다영                 |               이승준               |                 지현구                  |
| :-----------------------------------------: | :------------------------------------: | :--------------------------------: | :-------------------------------------: |
| [강민경](https://github.com/Mingyeong-Kang) | [이다영](https://github.com/dev-ldy03) | [이승준](https://github.com/L0521) | [지현구](https://github.com/stringnine) |

<br/>

---

## 1️⃣ 기술 스택 및 선정 이유

### Framework / Language

- **React** ^19.2.0
- **TypeScript** ~5.9.3

#### React 선택 이유

Proovy는 채팅, 수식 입력, PDF 뷰어, 실시간 에디터 등 **UI 복잡도가 매우 높은 화면**들로 구성되어 있습니다.

- **컴포넌트 단위 설계**로 **채팅, 뷰어, 캔버스, 워크스페이스**를 **명확한 책임 단위로 분리** 가능합니다.
- 상태 변화가 빈번한 대화형 UI와 실시간 스트리밍(SSE) 기반의 메시지 업데이트에 최적화되어 있습니다.
- 팀원 전원이 React 경험이 풍부하여, **공통 이해 수준을 기반으로 신속한 협업**이 가능합니다.

#### TypeScript 선택 이유

Proovy의 도메인 모델은 **채팅 메시지, 수식 메타데이터, API 응답** 등으로 **구조가 복잡**합니다.

- 타입 안정성으로 **런타임 에러를 사전에 방지**하고, 팀 협업 시 타입이 **자체 문서 역할** 수행합니다.
- IDE 자동완성 지원으로 **개발 생산성이 향상**됩니다.

---

### Routing

- **React Router DOM** ^7.11.0

#### React Router DOM 선택 이유

- React 생태계의 **표준 라우팅 라이브러리**로, SPA 환경에서 페이지 전환 없이 **URL 기반 네비게이션** 제공합니다.
- **동적 라우팅, 중첩 라우트, 쿼리 파라미터 관리** 등이 직관적으로 구현됩니다.
- 로그인 상태에 따른 **조건부 라우팅(Protected Routes)**이 쉽게 구현됩니다.

---

### State Management

- **TanStack Query** (React Query) ^5.90.16 — **Server State**
- **Zustand** ^5.0.9 — **Client State**

#### TanStack Query 선택 이유

API로부터 받는 데이터(채팅 메시지, 노트 목록, 사용자 정보 등)는 **서버에서 소유권**을 가집니다.

- 자동 **캐싱, 백그라운드 리페치, 에러 처리**로 **Server State 관리의 복잡성 감소**합니다.
- **DevTools**를 통해 API 요청/응답을 시각적으로 디버깅 가능합니다.
- Proovy의 **실시간 채팅, 폴링 기반 에셋 업로드** 같은 복잡한 데이터 동기화 시나리오에 최적화되어 있습니다.

#### Zustand 선택 이유

UI 상태(로그인 사용자 정보, 에디터 활성 탭, 사이드바 열림/닫힘 등)는 **클라이언트 로컬 상태**입니다.

- **Redux보다 간단한 API**로 빠르게 상태 관리 로직을 작성할 수 있습니다.
- **번들 크기가 작아** 초기 로딩 성능에 유리합니다.
- DevTools 연계로 상태 변화를 추적 가능합니다.

---

### Styling

- **TailwindCSS** ^4.1.18
- **Tailwind Merge** ^3.4.0

#### TailwindCSS 선택 이유

Proovy는 **데스크톱 에디터, 모바일 뷰어, 채팅 UI** 등 다양한 화면을 지원해야 합니다.

- 유틸리티 클래스 기반으로 **반응형 디자인(Responsive Design)**을 빠르게 구현할 수 있습니다.
- 디자인 토큰을 중앙에서 관리하여 **UI 일관성 유지**가 용이합니다.
- `prettier-plugin-tailwindcss` 활용으로 **클래스 정렬 자동화**가 가능합니다.

#### Tailwind Merge 선택 이유

- 동적 클래스 합성 시 **TailwindCSS 클래스 간 충돌을 자동으로 해결**해줍니다.
- 컴포넌트에서 기본 스타일에 사용자 정의 스타일을 병합할 때 **예측 가능한 결과**를 보장합니다.

---

### Build Tool

- **Vite** ^7.2.4

#### Vite 선택 이유

- **ES Module 기반 개발 서버**로 **핫 모듈 교체(HMR) 속도가 매우 빠름** (Webpack 대비 수십 배 차이).
- 초기 로딩 속도와 빌드 성능이 우수하여 **개발 생산성 향상**.
- React 플러그인 지원으로 **JSX/TSX 변환**이 자동으로 처리됩니다.

---

### Math Input & Rendering

- **MathLive** ^0.108.2 — 수식 입력
- **KaTeX** ^0.16.28 — 수식 렌더링
- **Remark-Math & Rehype-KaTeX** — 마크다운 수식 지원

#### 선택 이유

Proovy의 핵심 가치는 **정확한 수식 처리**입니다.

- **MathLive**는 LaTex 기반의 **전문적인 수식 에디터**로, 학생이 직관적으로 수식을 입력할 수 있습니다.
- **KaTeX**는 빠른 수식 렌더링으로 **낮은 지연시간(latency)**을 제공합니다.
- **Remark & Rehype 플러그인**으로 마크다운 내 수식을 자동으로 파싱하고 렌더링합니다.

---

### Drawing Canvas

- **TLDraw** ^4.2.1

#### TLDraw 선택 이유

- Proovy 에디터에서 학생이 **손으로 그린 그림, 도형, 주석**을 추가할 수 있어야 합니다.
- **TLDraw**는 완성도 높은 드로잉/화이트보드 라이브러리로 **실시간 협업 지원**도 좋습니다.
- 커스터마이징과 확장성이 우수합니다.

---

### API Client

- **Axios** ^1.13.4

#### Axios 선택 이유

- **요청/응답 인터셉터**로 공통 헤더(인증 토큰), 에러 처리를 중앙에서 관리 가능합니다.
- TanStack Query와의 **자연스러운 연계**로 캐싱과 무효화 처리가 용이합니다.
- Promise 기반으로 직관적이고, 취소 요청(Request Cancellation)도 지원합니다.

---

### Build & Development Tools

- **pnpm** - 패키지 매니저
- **Prettier** ^3.7.4 - 코드 포매터
- **ESLint** ^9.39.1 - 코드 린터
- **MSW** (Mock Service Worker) ^2.12.7 - API 모킹

#### pnpm 선택 이유

- **심볼릭 링크 기반**으로 **디스크 사용량을 획기적으로 감소**시킵니다.
- lockfile 기반으로 **팀원 간 완전히 동일한 의존성 환경** 보장합니다.

#### Prettier / ESLint 선택 이유

- **코드 스타일 논쟁 제거**로 리뷰 포인트를 **로직에만 집중**합니다.
- **자동 포매팅으로 일관된 코드 품질** 유지합니다.

#### MSW 선택 이유

- 실제 백엔드 서버 없이 **API 응답을 모킹**하여 독립적인 프론트엔드 개발 가능합니다.
- **테스트 및 스토리북**에서도 활용하여 개발 속도를 향상시킵니다.

---

### Deployment

- **Vercel**

#### Vercel 선택 이유

- React 기반 SPA 배포에 최적화된 환경으로 **추가 설정 없이 바로 배포** 가능합니다.
- `dev` / `main` 브랜치 기준 **자동 CI/CD 구성**이 가능합니다.
- **Preview Deployment**로 PR 단위 QA가 용이합니다.
- 엣지 함수(Edge Function)로 간단한 백엔드 로직도 구현 가능합니다.

---

## 2️⃣ 개발 철학 및 기술 적용 기준

### 기술 선택의 원칙

Proovy 팀의 모든 기술 결정은 다음 기준을 따릅니다:

1. **문제 해결 중심**
   - "익숙하니까" 또는 "유행하니까"가 아니라, **실제 프로젝트 문제를 해결하는 최적의 도구**를 선택합니다.
   - 예: 실시간 서버 상태 동기화 → TanStack Query, 로컬 UI 상태 → Zustand

2. **팀의 공동 이해**
   - 새로운 기술 도입 시 **팀 전체 논의 및 합의** 선행합니다.
   - 모든 팀원이 해당 기술을 이해하고 유지보수할 수 있어야 합니다.

3. **개발 생산성**
   - 러닝커브가 낮고, 자동화된 도구(Linter, Formatter)로 **신속한 개발** 가능해야 합니다.
   - DX(Developer Experience)를 최우선으로 고려합니다.

4. **유지보수성**
   - 신입 팀원도 **코드 구조를 빠르게 파악**할 수 있도록 일관된 패턴을 유지합니다.
   - TypeScript, 타입 정의, 명확한 폴더 구조로 **코드 안정성**을 확보합니다.

---

### 라이브러리 추가 요청 프로세스

새로운 라이브러리/프레임워크 도입을 제안할 시:

- [ ] **왜?** 현재 기술 스택으로 해결할 수 없는 문제가 무엇인가?
- [ ] **어디에?** 어느 부분의 코드에서 사용될 것인가?
- [ ] **장점?** 도입 후 개발 생산성/유지보수성에 어떤 이점이 생기는가?
- [ ] **우려?** 번들 크기, 학습곡선, 의존성 충돌 문제는 없는가?
- [ ] **대안?** 다른 라이브러리는 검토했는가?

이 항목들을 정리한 후 팀 논의를 통해 최종 결정합니다. **합의된 내용은 반드시 이 README에 기록**합니다.

---

## 3️⃣ 프레임워크/라이브러리 평가 기준

### React SPA 구조 유지 (현재 적용)

Proovy FE는 **React 기반 Single Page Application** 구조입니다.

- Server-Side Rendering(SSR)이 필요 없음
- 클라이언트에서 모든 라우팅 처리
- TanStack Query로 서버 상태 관리

**해당 구조에서 평가되는 부분**:

- 컴포넌트 분리가 명확한가?
- Feature-based 구조를 일관되게 따르는가?
- API 호출과 상태 관리가 분리되어 있는가?

---

### Next.js 도입 시 (참고)

만약 향후 Server-Side Rendering이나 정적 생성이 필요해져 Next.js를 도입한다면:

- ✅ SSR/SSG를 적절히 활용했는가?
- ✅ `use client`를 최소화하고 서버/클라이언트 경계를 명확히 구분했는가?
- ✅ Middleware를 필요한 경우에만 사용했는가?
- ✅ 기존 React SPA 로직과의 마이그레이션 전략은 명확한가?

---

### 상태 관리 라이브러리 평가

현재 **TanStack Query + Zustand** 구조에서:

- ❓ **Redux, MobX 등 다른 라이브러리 추가 도입 시**:
  - Server State와 Client State를 명확히 분리했는가?
  - 중복된 상태 관리가 없는가?
  - DevTools 지원이 되는가?

---

### UI 라이브러리 평가

현재 **TailwindCSS** 기반 컴포넌트 개발:

- ❓ **Shadcn/ui, Radix UI 등 레디메이드 컴포넌트 라이브러리 도입 시**:
  - 디자인 시스템과의 일관성을 유지하는가?
  - 번들 크기 증가를 정당화할 수 있는가?
  - 팀 전원이 해당 라이브러리의 커스터마이징 방법을 알고 있는가?

---

## 4️⃣ 프로젝트 구조 (Feature-based Structure)

```bash
src/
├── app/                      # 앱 전역 설정
│   ├── providers/            # 전역 Provider (Query, Router 등)
│   │   └── query_provider.tsx
│   ├── router/               # 라우터 설정
│   │   └── routes.tsx
│   └── styles/               # 전역 스타일
│       └── global.css
│
├── features/                 # 핵심 비즈니스 기능 (Feature-based)
│   ├── auth/                 # 인증 / 로그인
│   │   ├── api/              # API 호출 로직
│   │   ├── components/       # 인증 관련 컴포넌트
│   │   ├── hooks/            # useAuth 등
│   │   ├── pages/            # 로그인, 회원가입 페이지
│   │   ├── store/            # Zustand auth 스토어
│   │   └── types/            # 인증 관련 타입 정의
│   │
│   ├── editor/               # 수식 에디터 / 캔버스
│   │   ├── api/
│   │   ├── components/       # ChatInput, MathKeyboard 등
│   │   ├── constants/
│   │   ├── hooks/
│   │   ├── types/
│   │   └── utils/
│   │
│   ├── chat/                 # 실시간 채팅 / SSE
│   │   ├── components/
│   │   ├── hooks/            # useChatMessages, useChatPanel 등
│   │   ├── pages/
│   │   └── types/
│   │
│   ├── notes/                # 노트 / 메모
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── store/
│   │
│   ├── assets/               # 파일 / 에셋 업로드
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/            # useAssetUpload, useAssetPolling
│   │   ├── types/
│   │   └── utils/
│   │
│   ├── storage/              # 파일 저장소
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── store/
│   │
│   ├── subscription/         # 구독 / 결제
│   │   ├── pages/
│   │   └── types/
│   │
│   ├── settings/             # 설정
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── types/
│   │
│   ├── search/               # 검색
│   │   └── components/
│   │
│   └── sidebar/              # 사이드바
│       ├── Sidebar.tsx
│       └── components/
│
├── pages/                    # 페이지 단위 컴포넌트
│   ├── HomePage.tsx
│   ├── LandingPage.tsx
│   ├── MockTestPage.tsx
│   ├── components/           # 페이지 공통 컴포넌트
│   └── hooks/                # 페이지 전용 훅
│
├── shared/                   # 전역 공통 모듈
│   ├── api/                  # API 클라이언트 설정
│   │   ├── client.ts         # Axios 인스턴스
│   │   └── shared_types.ts   # 공유 타입
│   ├── assets/               # 이미지, 폰트 등 정적 리소스
│   │   └── images/
│   ├── components/           # 재사용 가능한 UI 컴포넌트
│   │   ├── icons/            # SVG 아이콘
│   │   ├── loading-spinner/
│   │   └── pdf-preview/      # PDF 뷰어
│   ├── hooks/                # 공용 훅 (useFileUpload 등)
│   ├── layout/               # 레이아웃 컴포넌트
│   │   └── AppLayout.tsx
│   ├── lib/                  # 유틸리티 함수
│   │   └── utils.ts
│   └── config/               # 공용 설정
│
├── mocks/                    # MSW 모킹 설정 (개발용)
│   ├── browser.ts            # 브라우저 워커 설정
│   ├── handlers.ts           # 통합 핸들러
│   └── handlers/             # API 엔드포인트별 핸들러
│       ├── auth.ts
│       ├── editor.ts
│       ├── notes.ts
│       ├── assets.ts
│       └── user.ts
│
├── main.tsx                  # 앱 진입점
└── vite-env.d.ts             # Vite 타입 정의
```

### 구조 설계 원칙

- **Feature-based Structure**: 기능별로 폴더를 나누어 응집도를 높이고 의존성을 최소화합니다.
- **Feature 내부 구조**:
  - `api/`: TanStack Query 쿼리 및 무효화 로직
  - `components/`: 해당 기능의 UI 컴포넌트
  - `hooks/`: 해당 기능의 커스텀 훅
  - `store/`: Zustand로 관리하는 로컬 상태
  - `types/`: 도메인 모델 및 타입 정의
- **shared/**: 2개 이상의 feature에서 재사용되는 컴포넌트/훅만 배치합니다.
- **pages/**: 라우트 단위 페이지와 페이지 전용 로직만 포함합니다.

---

## 5️⃣ Git Workflow & Convention

### Branch Strategy

- `main`: 실제 배포용 (Production)
- `dev`: 개발 통합 브랜치
- `feat/*`: 기능 개발 브랜치

**브랜치 네이밍 규칙**

```
feat/이슈번호-기능명
fix/이슈번호-버그명
docs/이슈번호-문서명
```

**예시**

```
feat/128-note-delete-api
fix/45-chat-scroll-bug
docs/32-api-guide
```

---

### Commit Message Convention

**규칙**

```
타입: 커밋 내용 (#이슈번호)
```

**타입 종류**

- `feat`: 새로운 기능 추가
- `fix`: 버그 수정
- `refactor`: 코드 구조 개선 (기능 변경 없음)
- `style`: 스타일 정렬 (포매팅)
- `docs`: 문서 수정
- `test`: 테스트 추가/수정
- `chore`: 빌드/의존성 등 기타 변경

**예시**

```
feat: 노트 삭제 API 연동 (#128)
fix: 채팅 자동스크롤 버그 수정 (#45)
refactor: ChatMessage 컴포넌트 분리 (#67)
```

**필수 요구사항**

- 커밋 전 반드시 `pnpm run format` 실행
- 커밋 메시지는 **명령형** 기반 작성 (예: "Add", "Fix", 하지만 "Add한다" X)

---

### Pull Request Convention

**PR 제목 규칙**

```
타입(#이슈번호): PR 내용
```

**PR 체크리스트**

```markdown
## 📝 PR Description

- [ ] 기능 구현 완료
- [ ] 테스트 완료 (스크린샷 첨부)
- [ ] 코드 포매팅 완료 (`pnpm run format`)
- [ ] 타입 에러 없음 (`pnpm run build`)
- [ ] ESLint 검사 통과 (`pnpm run lint`)

## 🎯 Related Issue

Closes #이슈번호

## 📸 Screenshots

<!-- 변경 사항 스크린샷 첨부 -->
```

**머지 조건**

- `dev` 브랜치 머지: **2명 이상 Approve 필수**
- `main` 브랜치 머지: **3명 이상 Approve 필수**
- CI/CD 체크(포매팅, 빌드, 린트) **모두 통과**

---

## 6️⃣ Code Convention

### File Naming

| 구분            | 규칙       | 예시                                             |
| --------------- | ---------- | ------------------------------------------------ |
| 페이지          | PascalCase | `LoginPage.tsx`, `ChatPage.tsx`                  |
| 컴포넌트        | PascalCase | `ChatHeader.tsx`, `MessageInput.tsx`             |
| Hook            | camelCase  | `useAuth.ts`, `useChatMessages.ts`               |
| Utility / API   | snake_case | `auth_api.ts`, `math_utils.ts`, `file_validation.ts` |
| Store (Zustand) | snake_case | `auth_store.ts`, `chat_store.ts`                 |
| Type 정의 파일  | snake_case | `chat_types.ts`, `auth_types.ts`                 |

---

### Variable & Function Naming

#### Array (배열)

```typescript
// ✅ 좋음: 복수형
const users = [];
const messageList = [];
const chatMessages = [];

// ❌ 나쁜 예: 단수형
const user = [];
const message = [];
```

#### Object / Single Entity (객체/단일 항목)

```typescript
// ✅ 좋음: 단수형
const currentUser = { id: 1, name: "John" };
const selectedMessage = { id: 123, content: "Hello" };
const userData = {};

// ❌ 나쁜 예: 복수형
const users = { id: 1, name: "John" }; // 단일 객체는 복수로 표현하면 혼란
```

#### Boolean

```typescript
// ✅ 좋음: is / has / should 접두사
const isLoading = true;
const hasError = false;
const shouldRefresh = true;
const isAuthenticated = false;
const hasNewMessages = true;

// ❌ 나쁜 예: 접두사 없음
const loading = true; // 변수 타입이 불명확
const error = false; // boolean인지 Error 객체인지 불명확
const check = true; // 너무 모호함
```

#### Function

```typescript
// ✅ 좋음: 동사 + 명사
const getUserData = (id: string) => {};
const handleClick = () => {};
const fetchChatMessages = () => {};
const validatePhoneNumber = (phone: string) => boolean;
const updateNoteTitle = (noteId: string, title: string) => {};

// ❌ 나쁜 예: 명사만 또는 너무 일반적
const userData = () => {}; // 함수인지 변수인지 불명확
const process = () => {}; // 너무 일반적
const fn = () => {}; // 의미가 없음
```

#### React Component Props

```typescript
// ✅ 좋음: 명확한 의도
interface ChatHeaderProps {
  isLoading: boolean;
  onClose: () => void;
  messageCount: number;
}

// ❌ 나쁜 예: 모호한 이름
interface Props {
  loading: boolean;
  callback: () => void;
  count: number;
}
```

---

### Code Style Guide

#### Function Syntax

```typescript
// ✅ 좋음: Arrow Function 사용
const getUserData = async (id: string) => {
  const response = await fetchUser(id);
  return response.data;
};

// ❌ 나쁜 예: Function Declaration
function getUserData(id: string) {
  // ...
}
```

#### Implicit Return (단일 표현식)

```typescript
// ✅ 좋음: 짧은 함수는 암시적 반환
const add = (a: number, b: number) => a + b;
const isAdmin = (role: string) => role === "admin";
const formatDate = (date: Date) => date.toLocaleDateString();

// ✅ 좋음: 복잡한 함수는 명시적 return
const processUser = (user: User) => {
  const validated = validateUser(user);
  if (!validated) return null;
  return {
    ...user,
    processedAt: new Date(),
  };
};
```

#### Component Placement

```typescript
// ✅ 좋음: Main Component 상단에 배치
export const ChatPage = () => {
  // Main Component 로직
};

// ✅ Helper functions 또는 sub-components는 하단에 배치
const ChatMessage = ({ message }: ChatMessageProps) => {
  // ...
};

const formatTimestamp = (date: Date) => {
  // ...
};
```

#### Functional Components & Hooks

```typescript
// ✅ 좋음: Functional Component with Hooks
interface UserProfileProps {
  userId: string;
}

export const UserProfile = ({ userId }: UserProfileProps) => {
  const { data: user, isLoading } = useUser(userId);

  if (isLoading) return <LoadingSpinner />;

  return <div>{user?.name}</div>;
};

// ❌ 나쁜 예: Class Component는 사용하지 않음
class UserProfile extends React.Component {
  // ...
}
```

#### Type Definitions

```typescript
// ✅ 좋음: 명확한 Interface 정의
interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}

interface Message {
  id: string;
  content: string;
  sender: User;
  timestamp: Date;
}

// ❌ 나쁜 예: any 타입 사용
const chat: any = {};
```

---

## 7️⃣ 개발 전 필수 체크리스트

### 기능 개발 시작

- [ ] **Issue 생성**: 작업 내용을 명확히 기술하고 Assignee/Label 설정
- [ ] **브랜치 생성**: `dev` 브랜치 최신화 후 `feat/이슈번호-기능명` 브랜치 생성
- [ ] **TanStack Query / Zustand 활용**: 상태 관리를 올바르게 분리했는가?
- [ ] **타입 정의**: 모든 API 응답, Props에 TypeScript 타입 정의 완료

### 코드 작성 중

- [ ] **Feature-based 구조 준수**: 기능별 폴더에 `api`, `components`, `hooks` 등이 체계적으로 분리됨
- [ ] **네이밍 컨벤션**: 파일, 변수, 함수명이 모두 컨벤션을 따름
- [ ] **에러 처리**: API 호출 시 에러 케이스 처리 (TanStack Query의 `isError`)
- [ ] **로딩 상태**: 비동기 작업 시 `isLoading` 상태 표시

### 커밋 및 테스트

- [ ] **포매팅**: `pnpm run format` 실행
- [ ] **린트**: `pnpm run lint` 검사 통과
- [ ] **빌드**: `pnpm run build` 성공
- [ ] **기능 테스트**: 해당 기능이 의도대로 작동하는지 확인
- [ ] **스크린샷**: 주요 UI 변경사항 스크린샷 준비

### PR 생성 및 머지

- [ ] **PR 제목**: `타입(#이슈번호): 설명` 형식 준수
- [ ] **체크리스트**: PR 템플릿의 모든 항목 체크
- [ ] **리뷰 요청**: 최소 2명 이상의 리뷰어 지정
- [ ] **Approve 확보**: 2명 이상 Approve 후 머지

---

## 8️⃣ 자주 묻는 질문 (FAQ)

### Q. 언제 Zustand를 쓰고, 언제 TanStack Query를 쓰나요?

**A.** 다음과 같이 구분합니다:

| 상태의 출처       | 관리 도구      | 예시                                   |
| ----------------- | -------------- | -------------------------------------- |
| **서버** (권위적) | TanStack Query | 채팅 메시지, 노트 데이터, 사용자 정보  |
| **클라이언트**    | Zustand        | 로그인 유저, 선택된 탭, 모달 열림 상태 |

---

### Q. MSW는 언제 사용하나요?

**A.** 다음 상황에서 사용합니다:

- 백엔드 API가 아직 준비되지 않았을 때
- 특정 에러 시나리오를 테스트하고 싶을 때
- 프론트엔드 개발을 독립적으로 진행할 때

`src/mocks/handlers/` 에 엔드포인트별 핸들러를 추가합니다.

---

### Q. 새로운 기능을 추가할 때 어느 폴더에 파일을 만드나요?

**A.** Feature-based 구조를 따릅니다:

```
src/features/새로운기능/
├── api/           # TanStack Query 쿼리 / 무효화 로직
├── components/    # React 컴포넌트
├── hooks/         # 커스텀 훅
├── store/         # Zustand 스토어 (필요시)
├── types/         # TypeScript 타입 정의
└── utils/         # 유틸리티 함수 (필요시)
```

단, 2개 이상의 feature에서 재사용되는 컴포넌트는 `shared/components/` 에 배치합니다.

---

### Q. API 호출 시 에러 처리는 어떻게 하나요?

**A.** TanStack Query의 `isError`, `error`를 활용합니다:

```typescript
const { data, isLoading, isError, error } = useQuery({
  queryKey: ['messages'],
  queryFn: fetchMessages,
});

if (isError) {
  return <ErrorBanner message={error.message} />;
}
```

---

### Q. 컴포넌트에서 여러 API를 호출해야 해요. 어떻게 하나요?

**A.** `useQueries` 또는 순차적 쿼리를 활용합니다:

```typescript
// 여러 쿼리 동시 호출
const queries = useQueries({
  queries: [
    { queryKey: ["user"], queryFn: fetchUser },
    { queryKey: ["notes"], queryFn: fetchNotes },
  ],
});

// 또는 커스텀 훅으로 조합
export const useCombinedData = () => {
  const user = useQuery({ queryKey: ["user"], queryFn: fetchUser });
  const notes = useQuery({ queryKey: ["notes"], queryFn: fetchNotes });
  return { user, notes };
};
```
