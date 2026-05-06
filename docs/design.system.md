### 🎨 Colors (색상표)

| 카테고리      | 토큰 이름        | 색상 (Hex) | 설명 및 용도                         |
| ------------- | ---------------- | ---------- | ------------------------------------ |
| **Primary**   | `primary-main`   | `#2A6AFF`  | 브랜드 메인 컬러                     |
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

> **참고**: Tailwind v4 기본값(`md=6px`, `lg=8px`, `xl=12px`)과 다르므로 `@theme`에 명시적으로 재정의 필요.

---

### 🛠️ 2. Tailwind v4 `@theme` 설정 코드

> ⚠️ **이 프로젝트는 Tailwind CSS v4를 사용합니다.**  
> `tailwind.config.ts`에 `theme.extend`를 추가하는 **v3 방식은 동작하지 않습니다.**  
> 모든 토큰은 `src/app/styles/global.css`의 `@theme` 블록에 CSS 변수로 정의해야 합니다.

```css
/* src/app/styles/global.css — @theme 블록에 병합 */
@theme {
  /* ── 색상 (--color-* 네임스페이스) ─────────────────────────── */
  /* bg-primary-main / text-primary-main / border-primary-main 클래스 생성 */
  --color-primary-main: #2a6aff;
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
  /* ⚠️ --font-size-* 아님. v4 공식 네임스페이스는 --text-* */
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
  /* ⚠️ Tailwind v4 기본값(md=6px, lg=8px, xl=12px)을 덮어씁니다 */
  --radius-sm: 4px;
  --radius-md: 8px; /* 기본 6px → 덮어씀 */
  --radius-lg: 12px; /* 기본 8px → 덮어씀 */
  --radius-xl: 16px; /* 기본 12px → 덮어씀 */
  --radius-full: 9999px;

  /* ── 브레이크포인트 (--breakpoint-* 네임스페이스) ─────────── */
  /* Option B: 팀 컨벤션 외 prefix를 initial로 비활성화 */
  --breakpoint-sm: initial; /* 기본 640px 제거 — sm: prefix 사용 금지 */
  --breakpoint-xl: initial; /* 기본 1280px 제거 — xl: prefix 사용 금지 */
  --breakpoint-2xl: initial; /* 기본 1536px 제거 — 2xl: prefix 사용 금지 */

  --breakpoint-md: 48rem; /* 768px — Tablet */
  --breakpoint-lg: 64rem; /* 1024px — Desktop */
  --breakpoint-3xl: 85rem; /* 1360px — Wide */
}
```

**클래스 사용 예시**

| CSS 변수                 | 생성되는 Tailwind 클래스                                        |
| ------------------------ | --------------------------------------------------------------- |
| `--color-primary-main`   | `bg-primary-main` / `text-primary-main` / `border-primary-main` |
| `--color-semantic-error` | `bg-semantic-error` / `text-semantic-error`                     |
| `--text-h1`              | `text-h1` (size + line-height + font-weight 동시 적용)          |
| `--radius-lg`            | `rounded-lg`                                                    |
| `--radius-full`          | `rounded-full`                                                  |

**`--color-text-*` 네이밍 주의**  
`--color-text-main`으로 등록하면 클래스가 `text-text-main`이 됩니다(`text-` prefix 중복).  
기능상 동작하지만 어색합니다. 팀이 원한다면 `--color-foreground: #414141` 형태로 변경해 `text-foreground`로 쓸 수 있습니다. **현재는 `text-text-main` 형태를 유지합니다.**
