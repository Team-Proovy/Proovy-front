import { http, HttpResponse, delay } from "msw";
import type { ApiResponse } from "../../shared/api/shared_types";
import type {
  ToolDto,
  ToolListResult,
} from "../../features/editor/types/editor_types";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ============================================================
// 목 데이터
// ============================================================

const mockTools: ToolDto[] = [
  {
    toolId: 1,
    toolCode: "GRAPH",
    name: "그래프 그리기",
    description: "수학 함수나 데이터를 시각적으로 그래프로 표현합니다.",
    iconType: "chart_line",
    isActive: true,
    displayOrder: 1,
  },
  {
    toolId: 2,
    toolCode: "SOLUTION",
    name: "해설지 생성하기",
    description: "문제에 대한 상세한 풀이 해설을 생성합니다.",
    iconType: "file_text",
    isActive: true,
    displayOrder: 2,
  },
  {
    toolId: 3,
    toolCode: "CANVAS",
    name: "캔버스 열기",
    description: "자유롭게 그릴 수 있는 캔버스를 엽니다.",
    iconType: "copy_plus",
    isActive: true,
    displayOrder: 3,
  },
  {
    toolId: 4,
    toolCode: "CODE_CHECK",
    name: "코드 검산 진행하기",
    description: "코드를 실행하여 계산을 검증합니다.",
    iconType: "code",
    isActive: true,
    displayOrder: 4,
  },
];

// ============================================================
// 핸들러
// ============================================================

export const editorHandlers = [
  /** GET /api/notes/tools - 도구 목록 조회 */
  http.get(`${BASE_URL}/api/notes/tools`, async ({ request }) => {
    await delay(200);

    const url = new URL(request.url);
    const query = url.searchParams.get("query");

    let filteredTools = mockTools.filter((t) => t.isActive);

    if (query) {
      filteredTools = filteredTools.filter((t) =>
        t.name.toLowerCase().includes(query.toLowerCase()),
      );
    }

    return HttpResponse.json<ApiResponse<ToolListResult>>({
      isSuccess: true,
      code: "200",
      message: "도구 목록 조회 성공",
      result: { tools: filteredTools },
    });
  }),
];
