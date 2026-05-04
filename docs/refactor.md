**1. 개요 및 리팩토링 목표**

- **현황**: React, Tailwind CSS, Zustand, TanStack Query 등 모던 프론트엔드 스택을 도입하였으나, 각 프레임워크의 설계 원칙을 위반한 강결합(Tight Coupling) 및 우회(Hack) 코드가 다수 존재함.
- **핵심 목표**: 모든 하드코딩 수치(Magic Number) 및 인라인 스타일 제거, 비즈니스 로직(Hook)과 뷰(View)의 완벽한 분리를 통한 **단일 진실 공급원(SSOT, Single Source of Truth)** 구축.

**2. 주요 구조적 결함 (개선 대상)**

1. **상태와 UI의 강결합**: API 호출 로직 내에 부수 효과(스토리지 직접 조작)가 포함되어 있으며, 컴포넌트 생명주기(`useEffect`) 안에서 라우팅과 비동기 로직이 파편화되어 동작함.
2. **이중 진실의 근원 (Dual Source of Truth)**: Zustand 내 인증 상태와 실제 스토리지의 Token 존재 여부가 동기화되지 않아 좀비 세션 및 무한 루프 라우팅 버그를 유발할 위험이 높음.
3. **데이터 패칭 병목**: 다중 쿼리 동시 호출, `while`문을 이용한 전체 데이터 동기적 풀링(Pooling), 벌크(Bulk) 처리 시 프론트엔드발 N+1 HTTP 요청 문제 발생.
4. **디자인 시스템 파편화**: 전역 테마 토큰 부재, 헥스코드 및 인라인 스타일 남용, 하드코딩된 SVG 사용으로 인해 UI 컴포넌트의 재사용성 및 유지보수성 저하.

**3. 반응형 디자인 표준화 가이드**

파편화를 방지하기 위해 모바일 퍼스트(Mobile-First) 원칙을 고수하며, 아래 3단계 브레이크포인트(Breakpoint)를

```
tailwind.config.ts
```

에 강제함.

- **Mobile (기본 클래스, 0px ~ 767px)** \* 최소 폭(375px 디바이스)을 기준으로 작성.적용 예시: `w-full px-4 text-base`
- **Tablet (md, 768px ~ 1023px)**태블릿 세로 모드 대응. 레이아웃의 그리드 변화(1단 → 2단) 및 여백 확장 적용.적용 예시: `md:px-8 md:grid-cols-2`
- **Desktop (lg, 1024px 이상)**PC 환경 대응. 컨테이너의 최대 너비를 제한하고 중앙 정렬하여 시각적 안정성 확보.적용 예시: `lg:max-w-[1200px] mx-auto`

**4. 단계별 리팩토링 로드맵 (Action Plan)**

**🚀 Phase 1: 글로벌 인프라 및 디자인 시스템 구축**

- **Design Token 통합**: `tailwind.config.ts`에 프로젝트 공통 시맨틱 컬러(Primary, Surface 등), Spacing, Font Size 등록.
- **Type 중앙화**: 각 Feature 하위에 파편화된 핵심 엔티티 타입(`types`)들을 `src/shared/types`로 재배치하여 순환 참조 방지.
- **Network 계층 정비**: `client.ts` (Axios) 인터셉터에 존재하는 순수 DOM 라우팅 제어 로직 제거 및 XSS 공격 방어를 위한 Token 취약점 방어 로직 재설계.

**🚀 Phase 2: 공통 UI 컴포넌트 추상화**

- **인터랙티브 요소 규격화**: 하드코딩된 스타일을 가진 Button, Input 등을 CVA(Class Variance Authority) 라이브러리 기반의 공용 컴포넌트로 통합.
- **Icon 시스템 구축**: `SidebarIcons` 등 복잡한 인라인 SVG 태그를 제거하고, 외부에서 속성 제어가 가능한 범용 `<Icon>` Wrapper 컴포넌트 도입.

**🚀 Phase 3: 아키텍처 및 라우팅 정상화**

- **관심사 분리 (SoC)**: `features` 디렉토리 내부에 위치한 `pages` 컴포넌트들을 모두 `src/pages` 하위로 이동.
- **Guard 로직 개선**: `ProtectedRoute`의 인증 방어 로직을 Zustand 파생 상태 혹은 실제 Token 기반으로 변경하여 상태 불일치 차단.
- **선언적 렌더링**: `AppLayout` 내에서 `document.querySelector`를 직접 호출하는 안티패턴을 `useRef` 기반으로 마이그레이션.

**🚀 Phase 4: Auth 도메인 로직 완전 분리**

- **Side-Effect 캡슐화**: 비동기 API 훅 내부에 혼재된 `tokenUtils` 조작 로직 등 부수 효과를 분리.
- **비즈니스 로직 추출**: UI 컴포넌트 내부에 작성된 OAuth URL 빌드 로직 등을 커스텀 훅(`useOAuthLogin`)으로 분리하여 뷰 컴포넌트를 경량화(Dumb Component).
- **View 마이그레이션**: `LoginPage` 등 화면 컴포넌트에 Phase 2에서 제작한 공용 UI 컴포넌트(Button/Input)를 적용하고 인라인 스타일 전면 철거.

**🚀 Phase 5: 비즈니스 도메인(Notes) 성능 구조조정**

- **Pagination 최적화**: 화면 렌더링을 위한 3중 쿼리 동시 호출을 단일 `useInfiniteQuery` 기반의 표준 무한 스크롤 아키텍처로 개편.
- **Data Fetching 병목 해소**: `while`문을 활용하여 전체 채팅 데이터를 무조건 불러와 렌더링을 블로킹하는 로직 삭제 및 지연 로딩(Lazy Loading) 적용.
- **N+1 문제 해결**: 프론트엔드에서 Loop를 돌며 호출하는 Chunk 단위 삭제 API를 백엔드 1회 벌크 호출(Bulk API) 방식으로 개선.
- **Style 정비 마무리**: Notes 모달 및 비즈니스 컴포넌트에 잔존하는 수십 줄의 인라인 스타일을 Tailwind 유틸리티 클래스로 최종 마이그레이션.
