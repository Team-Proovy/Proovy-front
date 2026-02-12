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

### Styling

- **TailwindCSS v4**

#### TailwindCSS 선택 이유

- 디자인 토큰을 유틸리티 클래스로 관리하여 **UI 일관성 유지**가 용이합니다.
- 빠른 UI 프로토타이핑이 가능하여 MVP 개발 속도를 크게 향상시킵니다.
- Prettier 플러그인과 함께 사용하여 **스타일 코드 정렬 자동화**가 가능합니다.

---

### Package / Tooling

- **pnpm**
- **Prettier**
- **ESLint**

#### pnpm 선택 이유

- 모노레포 및 대규모 의존성 환경에서 **디스크 사용량과 설치 속도**가 효율적입니다.
- lockfile 기반으로 팀원 간 **완전히 동일한 의존성 환경**을 보장합니다.

#### Prettier / ESLint 선택 이유

- 코드 스타일 논쟁을 제거하고, **리뷰 포인트를 로직에만 집중**하기 위함입니다.
- 커밋 전 포맷팅을 강제하여 코드 품질을 일정 수준 이상으로 유지합니다.

---

### Deployment

- **Vercel**

#### Vercel 선택 이유

- React 기반 SPA 배포에 최적화된 환경 제공
- `dev` / `main` 브랜치 기준 자동 CI/CD 구성 가능
- Preview Deployment를 통한 PR 단위 QA가 용이함

---

## 2️⃣ 프레임워크 선택에 대한 팀 합의 원칙

- 본 프로젝트의 기본 프레임워크는 **React**입니다.
- **React 외의 프레임워크(Next.js, Vue, Expo 등)** 를 도입할 경우:
  - 특정 개인의 판단이 아닌 **팀 전체 논의 및 합의가 선행**되어야 합니다.
  - 모든 팀원이 해당 기술을 **이해하고 함께 유지보수 가능**해야 합니다.
  - 합의된 내용은 반드시 **README 또는 문서로 기록**합니다.

---

## 3️⃣ 프레임워크별 추가 평가 요소

### Next.js 선택 시 (참고)

Next.js를 사용할 경우, 아래 항목들이 주요 평가 기준이 됩니다.

- SSR(Server Side Rendering)을 **상황에 맞게 적절히 활용**했는가?
- `use client`를 남용하지 않고 **서버/클라이언트 컴포넌트의 책임을 명확히 분리**했는가?
- 인증, 프록시 등에서 **Middleware를 필요한 경우에만 적절히 구현**했는가?

> 현재 Proovy FE는 React SPA 구조를 기반으로 설계되어 있습니다.

---

### Expo (React Native) 선택 시 (참고)

- 앱 빌드가 정상적으로 완료되는가?
- 네이티브 기능 사용 시 **권한(Permission) 처리**가 적절한가?
- 네이티브 컴포넌트를 **문제 해결 목적에 맞게 활용**했는가?

---

## 4️⃣ 프로젝트 구조 (Feature-based Structure)

```bash
src/
├── app/                      # 앱 전역 설정
│   ├── providers/            # 전역 Provider
│   ├── router/               # 라우터 설정
│   └── styles/               # 전역 스타일
│
├── features/                 # 핵심 비즈니스 기능
│   ├── auth/                 # 로그인 / 인증
│   ├── editor/               # 캔버스 / 수식 입력
│   ├── chat/                 # 채팅 / SSE
│   ├── viewer/               # PDF / 이미지 뷰어
│   └── workspace/            # 통합 작업공간
│
├── shared/                   # 전역 공통 모듈
│   ├── api/
│   ├── assets/
│   ├── config/
│   ├── hooks/
│   ├── layout/
│   ├── ui/
│   └── utils/
│
├── pages/                    # 페이지 단위 컴포넌트
│   ├── HomePage.tsx
│   ├── LoginPage.tsx
│
└── main.tsx                  # 앱 진입점
```

---

## 5️⃣ Git Workflow & Convention

### Branch Strategy

- `main`: 실제 배포용
- `dev`: 개발 통합 브랜치
- `feat/*`: 기능 개발 브랜치

**브랜치 네이밍 규칙**

```text
feat/이슈번호-기능명
fix/이슈번호-버그명
docs/이슈번호-문서명
```

---

### Commit Message Convention

**규칙**

```text
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

```text
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

```text
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

| 구분            | 규칙       | 예시                                                 |
| --------------- | ---------- | ---------------------------------------------------- |
| 페이지          | PascalCase | `LoginPage.tsx`, `ChatPage.tsx`                      |
| 컴포넌트        | PascalCase | `ChatHeader.tsx`, `MessageInput.tsx`                 |
| Hook            | camelCase  | `useAuth.ts`, `useChatMessages.ts`                   |
| Utility / API   | snake_case | `auth_api.ts`, `math_utils.ts`, `file_validation.ts` |
| Store (Zustand) | snake_case | `auth_store.ts`, `chat_store.ts`                     |
| Type 정의 파일  | snake_case | `chat_types.ts`, `auth_types.ts`                     |

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

## 7️⃣ 개발 전 필수 체크리스트

### 기능 개발 시작

- [ ] **Issue 생성**: 작업 내용을 명확히 기술하고 Assignee/Label 설정
- [ ] **브랜치 생성**: `dev` 브랜치 최신화 후 `feat/이슈번호-기능명` 브랜치 생성
- [ ] **코드 컨벤션 준수**: 파일명, 변수명, 함수명이 모두 가이드 따름
- [ ] **타입 정의**: 모든 API 응답, Props에 TypeScript 타입 정의 완료

### 코드 작성 중

- [ ] **포매팅**: 개발 중에도 자주 `pnpm run format` 실행
- [ ] **린트**: 린트 에러 없는 상태 유지 (`pnpm run lint`)
- [ ] **타입 체크**: 타입 에러 없음 (`pnpm run build` 성공)
- [ ] **로딩/에러 상태**: 비동기 작업 시 `isLoading`, `error` 상태 표시

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
