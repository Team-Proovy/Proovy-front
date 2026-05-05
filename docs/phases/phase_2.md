# Phase 2: 공통 UI 컴포넌트 추상화

> **목표**: 버튼, 입력창 등 반복되는 UI 요소를 단일 공용 컴포넌트로 통합하고, 아이콘 시스템을 lucide-react 기반으로 정비한다.  
> **예상 소요**: 2~3일  
> **병렬 가능 작업**: 2-A(Button) / 2-B(Input)은 동일 파일 아니므로 동시 진행 가능. 2-C(Icon)는 독립적으로 진행 가능.

---

## 전제 조건

- **Phase 1-A 완료 필수**: `@theme`에 디자인 토큰(`--color-primary-main` 등)이 등록되어 있어야 한다.  
  토큰 없이 Button을 만들면 색상을 또 하드코딩하게 된다.
- **`--color-text-*` 네이밍 결정 필수**: Phase 1에서 `--color-text-main` 유지 vs 시맨틱 변경(`--color-foreground` 등)을 결정해야 한다.  
  이 문서의 Button/Input 예시는 `--color-text-*` 유지를 가정하여 `text-text-white`, `text-text-main`을 사용한다.  
  **Phase 1에서 네이밍을 변경한 경우, 이 문서의 `text-text-*` 클래스를 확정된 토큰명으로 치환한 뒤 구현한다.**
- CVA 패키지 설치 필요 (아래 설치 명령 참고)

---

## 작업 목록 (체크리스트)

- [ ] **2-A** CVA Button 컴포넌트 — `src/shared/components/ui/Button.tsx` 생성
- [ ] **2-B** CVA Input 컴포넌트 — `src/shared/components/ui/Input.tsx` 생성
- [ ] **2-C** Icon 시스템 — lucide-react 기반으로 기존 인라인 SVG 단계적 대체

---

## 사전 작업 — CVA 패키지 설치

```bash
npm install class-variance-authority
```

설치 후 `package.json`의 `dependencies`에 `class-variance-authority`가 추가되었는지 확인한다.

---

## 2-A. CVA 기반 공용 Button 컴포넌트

### 작업 대상 파일

`src/shared/components/ui/Button.tsx` (신규 생성)

### 현재 상태

공용 Button 컴포넌트가 없다. 각 feature에서 `<button className="...">` 형태로 직접 작성한다.  
버튼 색상, hover 상태, disabled 스타일이 컴포넌트마다 제각각이다.

### 구현 스펙

**Variant 정의**

| variant     | 배경                | 텍스트              | 테두리                | hover             |
| ----------- | ------------------- | ------------------- | --------------------- | ----------------- |
| `primary`   | `bg-primary-main`   | `text-text-white`   | 없음                  | `bg-primary-dark` |
| `secondary` | `bg-white`          | `text-primary-main` | `border-primary-main` | `bg-gray-50`      |
| `ghost`     | 없음                | `text-gray-600`     | 없음                  | `bg-gray-50`      |
| `danger`    | `bg-semantic-error` | `text-text-white`   | 없음                  | opacity 낮춤      |

**Size 정의**

| size | padding       | font                   | height |
| ---- | ------------- | ---------------------- | ------ |
| `sm` | `px-3 py-1.5` | `text-body-2-medium`   | `h-8`  |
| `md` | `px-4 py-2`   | `text-body-1-semibold` | `h-10` |
| `lg` | `px-6 py-3`   | `text-body-1-bold`     | `h-12` |

### 구현 코드

```tsx
// src/shared/components/ui/Button.tsx
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/lib/utils";
import type { ButtonHTMLAttributes } from "react";

const buttonVariants = cva(
  // 공통 기본 클래스
  "inline-flex items-center justify-center rounded-md font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary-main text-text-white hover:bg-primary-dark",
        secondary:
          "border border-primary-main bg-white text-primary-main hover:bg-gray-50",
        ghost: "text-gray-600 hover:bg-gray-50",
        danger: "bg-semantic-error text-text-white hover:opacity-90",
      },
      size: {
        sm: "h-8 px-3 py-1.5 text-body-2-medium",
        md: "h-10 px-4 py-2 text-body-1-semibold",
        lg: "h-12 px-6 py-3 text-body-1-bold",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

interface ButtonProps
  extends
    ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

// type 기본값을 "button"으로 명시 — form 안에서 의도치 않은 submit 방지
// form submit 버튼에는 반드시 type="submit"을 명시해야 한다
export function Button({
  className,
  variant,
  size,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
```

### 사용 예시

```tsx
// 기본 (primary, md)
<Button onClick={handleSubmit}>저장</Button>

// variant + size 지정
<Button variant="secondary" size="sm">취소</Button>
<Button variant="danger" size="lg">삭제</Button>

// 추가 클래스 병합
<Button variant="ghost" className="w-full">전체 너비 버튼</Button>

// disabled
<Button disabled>비활성화</Button>
```

### ❌ 하지 말 것

```tsx
// 직접 button 태그 + 하드코딩 금지
<button className="bg-[#2046FF] text-white px-4 py-2 rounded">저장</button>

// 토큰 없이 임의 색상 금지
<Button className="bg-blue-500">저장</Button>
```

### 완료 기준

- `Button` 컴포넌트가 4가지 variant × 3가지 size 조합 모두 정상 렌더링
- `disabled` 상태에서 클릭 불가 + 시각적 비활성화 확인
- `className` prop으로 추가 클래스 병합 동작 확인

---

## 2-B. CVA 기반 공용 Input 컴포넌트

### 작업 대상 파일

`src/shared/components/ui/Input.tsx` (신규 생성)

### 현재 상태

`features/auth/components/PhoneVerificationForm.tsx` 등에서 `<input className="...">` 직접 작성.  
포커스 링, 에러 상태, disabled 상태가 파일마다 다르게 구현된다.

### 구현 스펙

**State(variant) 정의**

| state      | 테두리                  | 포커스 링                     | 배경         |
| ---------- | ----------------------- | ----------------------------- | ------------ |
| `default`  | `border-gray-200`       | `focus:border-primary-main`   | `bg-white`   |
| `error`    | `border-semantic-error` | `focus:border-semantic-error` | `bg-white`   |
| `disabled` | `border-gray-100`       | 없음                          | `bg-gray-50` |

### 구현 코드

```tsx
// src/shared/components/ui/Input.tsx
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/lib/utils";
import type { InputHTMLAttributes } from "react";

const inputVariants = cva(
  "w-full rounded-md border px-3 py-2 text-body-2-medium text-text-main outline-none transition-colors placeholder:text-gray-400",
  {
    variants: {
      state: {
        default: "border-gray-200 bg-white focus:border-primary-main",
        error: "border-semantic-error bg-white focus:border-semantic-error",
        disabled: "border-gray-100 bg-gray-50 cursor-not-allowed",
      },
    },
    defaultVariants: {
      state: "default",
    },
  },
);

interface InputProps
  extends
    Omit<InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  errorMessage?: string;
}

export function Input({
  className,
  state,
  errorMessage,
  disabled,
  ...props
}: InputProps) {
  const resolvedState = disabled ? "disabled" : state;

  return (
    <div className="flex flex-col gap-1">
      <input
        className={cn(inputVariants({ state: resolvedState }), className)}
        disabled={disabled}
        {...props}
      />
      {state === "error" && errorMessage && (
        <span className="text-body-2-regular text-semantic-error">
          {errorMessage}
        </span>
      )}
    </div>
  );
}
```

### 사용 예시

```tsx
// 기본
<Input placeholder="이메일 입력" />

// 에러 상태
<Input
  state="error"
  errorMessage="이메일 형식이 올바르지 않습니다."
  value={email}
  onChange={handleChange}
/>

// disabled
<Input disabled placeholder="수정 불가" />
```

### 완료 기준

- `default`, `error`, `disabled` 상태 모두 정상 렌더링
- 에러 메시지 표시 동작 확인
- `PhoneVerificationForm.tsx` 등 기존 컴포넌트 중 하나에 시범 적용하여 동작 검증

---

## 2-C. Icon 시스템 구축

### 작업 대상

`src/shared/components/icons/` 하위 14개 파일 정비

### 현재 상태

```
ChatInputIcons.tsx, ChattingPageIcons.tsx, DividerIcons.tsx,
HomepageInputIcons.tsx, LoginIcons.tsx, LoginProviderIcons.tsx,
NotesIcons.tsx, PanelToggleIcons.tsx, ProovyLogo.tsx,
SettingsIcons.tsx, SidebarIcons.tsx, SparkleIcon.tsx,
StorageActionIcons.tsx, StorageIcons.tsx
```

각 파일에 인라인 SVG가 JSX에 직접 작성되어 있고, 색상·크기가 하드코딩되어 외부 prop으로 제어 불가.

### 핵심 방향

**`lucide-react`가 이미 설치되어 있다** (`^0.562.0`).  
별도 설치 없이 바로 활용 가능하다.

```
전략:
  lucide-react에 동일 아이콘 있음 → lucide 컴포넌트로 직접 교체
  lucide-react에 없음 (브랜드 고유) → 커스텀 컴포넌트로 리팩토링
```

### 단계별 작업 절차

**Step 1. 현재 아이콘 인벤토리 작성**  
14개 파일에서 사용 중인 아이콘 목록을 추출하고 lucide 대응 여부를 확인한다.

| 현재 파일        | 아이콘 이름 | lucide 대응 | 처리 방법     |
| ---------------- | ----------- | ----------- | ------------- |
| SidebarIcons.tsx | 검색 아이콘 | `Search`    | lucide로 교체 |
| SidebarIcons.tsx | 홈 아이콘   | `Home`      | lucide로 교체 |
| ProovyLogo.tsx   | Proovy 로고 | 없음        | 커스텀 유지   |
| ...              | ...         | ...         | ...           |

(이 표는 실제 파일 확인 후 채워 넣는다)

**Step 2. lucide 교체 가능한 아이콘부터 대체**

```tsx
// Before (SidebarIcons.tsx 내 인라인 SVG)
export const SearchIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
  >
    <path
      d="..."
      stroke="#6B7280"
      strokeWidth="2"
    />
  </svg>
);

// After (lucide-react 사용)
import { Search } from "lucide-react";
// 사용하는 컴포넌트에서
<Search
  size={20}
  className="text-gray-600"
/>;
```

**Step 3. 브랜드 고유 아이콘 — prop 제어 가능하게 리팩토링**  
lucide에 없는 아이콘은 `size`, `className` prop을 받도록 수정한다.

```tsx
// Before
export const ProovyLogoIcon = () => (
  <svg width="120" height="32" ...>...</svg>
);

// After
interface IconProps {
  size?: number;
  className?: string;
}

export const ProovyLogoIcon = ({ size = 32, className }: IconProps) => (
  <svg
    width={size * (120 / 32)}
    height={size}
    className={className}
    ...
  >
    ...
  </svg>
);
```

**Step 4. 사용처 import 경로 정리**  
파일 분류를 "페이지 기준"에서 "아이콘 카테고리 기준"으로 점진적으로 정리한다.  
단, 한 번에 전부 리네임하면 충돌이 크므로 사용하는 곳부터 하나씩 교체한다.

### ❌ 하지 말 것

```tsx
// SVG에 색상 하드코딩 금지
<svg>
  <path stroke="#6B7280" />
</svg>

// 새 아이콘 파일을 또 페이지 기준으로 생성 금지
// (NotesIcons2.tsx 같은 파일 추가 금지)
```

### 완료 기준

- lucide-react로 대체 가능한 아이콘 전량 교체 완료
- 커스텀 아이콘은 `size`, `className` prop으로 외부 제어 가능
- 기존 인라인 SVG에 하드코딩된 색상(hex) 코드가 남아있지 않음  
  (단, `ProovyLogo.tsx` 등 브랜드 고유 SVG는 디자이너 확인 후 예외 허용 가능)

---

## 완료 기준 (Phase 2 전체)

- [ ] `Button` 컴포넌트 — 4 variant × 3 size, disabled, className 병합 동작
- [ ] `Input` 컴포넌트 — default/error/disabled 상태, 에러 메시지 표시
- [ ] 기존 컴포넌트 중 최소 1곳에 Button/Input 시범 적용 및 동작 확인
- [ ] lucide-react 교체 가능 아이콘 전량 교체
- [ ] 커스텀 아이콘 prop 제어 가능하도록 리팩토링

## Phase 2 완료 후 다음 단계

→ **Phase 4** (LoginPage에 Button/Input 적용) 진행 가능  
→ **Phase 3** (pages 폴더 정리, ProtectedRoute 강화)는 Phase 2와 무관하게 병렬 진행 가능
