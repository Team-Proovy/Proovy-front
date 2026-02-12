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

- **React**
- **TypeScript**

#### React 선택 이유

- 컴포넌트 단위 설계에 최적화되어 있어 **채팅, 뷰어, 캔버스, 워크스페이스**와 같이  
  UI 복잡도가 높은 화면을 **명확한 책임 단위로 분리**할 수 있습니다.
- 대화형 UI, 실시간 스트리밍(SSE), 상태 변화가 잦은 화면에 적합합니다.
- 팀원 전원이 React 사용 경험이 있으며, **공통 이해 수준을 기반으로 빠른 협업**이 가능합니다.

#### TypeScript 선택 이유

- 채팅 메시지, 파일 메타데이터, API 응답 등 **구조가 복잡한 데이터 흐름**에서  
  타입 안정성을 확보하여 런타임 에러를 사전에 방지할 수 있습니다.
- 협업 시 타입 자체가 **문서 역할**을 하여, 커뮤니케이션 비용을 줄여줍니다.

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

- `feat/이슈번호-기능명`

---

### Commit Message Convention

**규칙**

- `타입: 커밋 내용 (#이슈번호)`

**예시**

- `feat: 로그인 UI 구현 (#6)`
- `fix: 채팅 스크롤 버그 수정 (#12)`

**필수**

- 커밋 전 반드시 `pnpm run format` 실행

---

### Pull Request Convention

**PR 제목 규칙**

- `타입(#이슈번호): PR 내용`

**머지 조건**

- `dev` 브랜치 머지: **2명 이상 Approve 필수**

**필수 첨부**

- 테스트 결과 **스크린샷 첨부 필수**

---

## 6️⃣ Code Convention

### File Naming

| 구분              | 규칙       |
| ----------------- | ---------- |
| 페이지 / 컴포넌트 | PascalCase |
| Hook              | camelCase  |
| 그 외 파일        | snake_case |

---

### Variable & Function Naming

- **배열(Array)**: 복수형 (예: `users`, `messageList`)
- **객체(Object)**: 단수형 (예: `currentUser`)
- **Boolean**: `is` / `has` / `should` 접두사 사용 (예: `isLoading`, `hasError`)
- **함수(Function)**: 동사 + 명사 (예: `getUserData`, `handleSubmit`)

---

## 7️⃣ 개발 전 필수 체크리스트

- [ ] Issue 생성 및 Assignee/Label 설정
- [ ] `dev` 최신화 후 브랜치 생성
- [ ] 기능 단위 개발 (1 Issue = 1 Feature)
- [ ] Prettier 적용
- [ ] 테스트 후 PR 생성 및 스크린샷 첨부
