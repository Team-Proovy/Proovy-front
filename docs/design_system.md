### 🎨 Colors (색상표)

| 카테고리      | 토큰 이름        | 색상 (Hex) | 설명 및 용도                         |
| ------------- | ---------------- | ---------- | ------------------------------------ |
| **Primary**   | `primary-main`   | `#2046FF`  | 브랜드 메인 컬러                     |
|               | `primary-dark`   | `#1428A0`  | 메인 컬러 어두운 변형 (Hover/Active) |
|               | `primary-darker` | `#002F6C`  | 메인 컬러 가장 어두운 변형           |
| **Point**     | `point-light`    | `#2549C6`  | 밝은 포인트 컬러                     |
|               | `point-main`     | `#122D8B`  | 기본 포인트 컬러                     |
| **Grayscale** | `gray-50`        | `#F1F4F8`  | 아주 밝은 회색 (배경 등)             |
|               | `gray-100`       | `#E3E7ED`  | 밝은 회색 (비활성화 상태 등)         |
|               | `gray-200`       | `#D1D6DE`  | 옅은 회색 (테두리, 와이어프레임)     |
|               | `gray-400`       | `#9CA4B0`  | 중간 회색 (스크롤바 등)              |
|               | `gray-600`       | `#6B7280`  | 어두운 회색 (보조 텍스트)            |
|               | `gray-800`       | `#2F3440`  | 매우 어두운 회색                     |
| **Text**      | `text-main`      | `#414141`  | 기본 텍스트                          |
|               | `text-body`      | `#4D4D4D`  | 본문 텍스트                          |
|               | `text-white`     | `#FFFFFF`  | 밝은 텍스트                          |
|               | `wireframe`      | `#D0D0D0`  | 와이어프레임 선/텍스트 용도          |
| **Semantic**  | `success`        | `#0AA63E`  | 성공 상태 (Green)                    |
|               | `warning`        | `#E2A242`  | 경고 상태 (Yellow)                   |
|               | `error`          | `#DC3545`  | 에러 상태 (Red)                      |

### 🔠 Typography (타이포그래피)

- **Font Family:** `Pretendard`, sans-serif

| 종류 (Style)  | 폰트 사이즈 (Size) | 행간 (Line-height) | 굵기 (Weight)                | 용도 예시                |
| ------------- | ------------------ | ------------------ | ---------------------------- | ------------------------ |
| **Display 1** | `64px`             | `74px`             | Bold (700)                   | 메인 타이틀, 히어로 섹션 |
| **Display 2** | `48px`             | `58px`             | Bold (700)                   | 서브 타이틀              |
| **Heading 1** | `36px`             | `46px`             | Bold (700)                   | 페이지 제목              |
| **Heading 2** | `32px`             | `42px`             | SemiBold (600), Medium (500) | 섹션 제목                |
| **Heading 3** | `28px`             | `40px`             | SemiBold (600)               | 작은 서브 섹션 제목      |
| **Heading 4** | `24px`             | `32px`             | Bold (700)                   | 컴포넌트 타이틀          |
| **Body 1**    | `20px`             | `24px`             | Bold (700), SemiBold (600)   | 강조 본문, 메뉴          |
| **Body 2**    | `20px`             | `24px`             | Medium (500), Regular (400)  | 기본 본문 텍스트         |

### 📏 Spacing & Radius (여백 및 곡률)

_(피그마에 명시된 토큰은 없으나 버튼/UI 등에서 보편적으로 사용될 시스템 제안)_

- **Spacing:** Tailwind 기본 `spacing` 시스템 (`4px` 배수) 사용.
- **Border Radius:**
  - `sm`: `4px`
  - `md`: `8px`
  - `lg`: `12px` (모달, 카드 요소)
  - `xl`: `16px`
  - `full`: `9999px` (원형 버튼, 뱃지)

---

### 🛠️ 2. tailwind.config.ts 세팅 코드

추출한 디자인 시스템 명세서를 Tailwind CSS 환경에서 바로 사용할 수 있도록 `tailwind.config.ts` 형식으로 작성한 코드입니다. (Tailwind CSS v3 기준 작성되었으며, 프로젝트 구조에 맞게 `theme.extend` 영역에 병합하여 사용하시면 됩니다.)

```tsx
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Pretendard", "sans-serif"],
      },
      colors: {
        primary: {
          main: "#2046FF",
          dark: "#1428A0",
          darker: "#002F6C",
        },
        point: {
          light: "#2549C6",
          main: "#122D8B",
        },
        gray: {
          50: "#F1F4F8",
          100: "#E3E7ED",
          200: "#D1D6DE",
          400: "#9CA4B0",
          600: "#6B7280",
          800: "#2F3440",
        },
        text: {
          main: "#414141",
          body: "#4D4D4D",
          white: "#FFFFFF",
        },
        wireframe: "#D0D0D0",
        semantic: {
          success: "#0AA63E",
          warning: "#E2A242",
          error: "#DC3545",
        },
      },
      fontSize: {
        "display-1": ["64px", { lineHeight: "74px", fontWeight: "700" }],
        "display-2": ["48px", { lineHeight: "58px", fontWeight: "700" }],
        h1: ["36px", { lineHeight: "46px", fontWeight: "700" }],
        "h2-semibold": ["32px", { lineHeight: "42px", fontWeight: "600" }],
        "h2-medium": ["32px", { lineHeight: "42px", fontWeight: "500" }],
        h3: ["28px", { lineHeight: "40px", fontWeight: "600" }],
        h4: ["24px", { lineHeight: "32px", fontWeight: "700" }],
        "body-1-bold": ["20px", { lineHeight: "24px", fontWeight: "700" }],
        "body-1-semibold": ["20px", { lineHeight: "24px", fontWeight: "600" }],
        "body-2-medium": ["20px", { lineHeight: "24px", fontWeight: "500" }],
        "body-2-regular": ["20px", { lineHeight: "24px", fontWeight: "400" }],
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
      },
    },
  },
  plugins: [],
};

export default config;
```

> 향후 UI 코드 리팩토링 시 `text-display-1`, `bg-primary-main`, `text-text-main` 등의 클래스로 즉시 맵핑하여 사용할 수 있는 환경 설정용 기준 데이터입니다.
