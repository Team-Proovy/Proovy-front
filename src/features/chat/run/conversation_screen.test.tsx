import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import {
  Outlet,
  RouterProvider,
  createMemoryRouter,
  useLocation,
} from "react-router-dom";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { createRunApiClient } from "@/features/run/api";
import { createBrowserRunMockServer } from "@/features/run/session/mocks";
import type { BrowserRunMockServerOptions } from "@/features/run/session/mocks";
import { ChatPage } from "@/pages/ChatPage";
import { HomePage } from "@/pages/HomePage";
import { RunSessionRegistryProvider } from "./RunSessionRegistryProvider";

// mathlive는 jsdom에서 custom element를 등록하지 못한다. 수식 입력은 이 테스트 범위가 아니다.
vi.mock("mathlive", () => ({ MathfieldElement: class {} }));
// pdfjs-dist는 jsdom에 없는 DOMMatrix가 필요하다. 뷰어는 이 테스트 범위가 아니다.
vi.mock("pdfjs-dist", () => ({
  GlobalWorkerOptions: {},
  getDocument: vi.fn(),
  version: "test",
}));

/**
 * 대화 화면 통합 (S08 1.94) — 실제 HomePage·ChatPage·ChatInput을 browser-run-v1 fixture MSW Server에 연결한다.
 * run API는 fixture Server, 그 밖의 구형 API(노트·사용자·도구·크레딧)는 기록만 하는 handler가 받는다.
 */

const BASE_URL = "http://mock.test";
const server = setupServer();
const api = createRunApiClient({
  baseUrl: BASE_URL,
  auth: { getAccessToken: () => "test-token" },
});

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const ok = (result: unknown) =>
  HttpResponse.json({
    isSuccess: true,
    code: "COMMON200",
    message: "",
    result,
  });

/** 구형 API 호출 기록. Note 선생성·제목 생성·직접 차감이 없어야 한다. */
const createLegacyApi = () => {
  const calls: string[] = [];
  const handler = http.all("*", ({ request }) => {
    const { pathname } = new URL(request.url);
    calls.push(`${request.method} ${pathname}`);
    if (request.method === "GET" && pathname === "/api/notes")
      return ok({
        notes: [],
        pageInfo: {
          page: 0,
          size: 1,
          totalElements: 0,
          totalPages: 0,
          hasNext: false,
          hasPrevious: false,
        },
      });
    if (pathname === "/api/notes/tools") return ok({ tools: [] });
    if (pathname === "/api/users/me") return ok({});
    return HttpResponse.json(
      { isSuccess: false, code: "COMMON404", message: "not found" },
      { status: 404 },
    );
  });
  return { calls, handler };
};

const LocationProbe = () => (
  <output data-testid="location">{useLocation().pathname}</output>
);

/** 재접속 소진을 빨리 보려는 테스트용 backoff(1ms, 한 번만 재시도) */
const FAST_BACKOFF = {
  initialDelayMs: 1,
  maxDelayMs: 1,
  multiplier: 1,
  maxAttempts: 1,
};

const Layout = ({ fastBackoff }: { fastBackoff: boolean }) => (
  <RunSessionRegistryProvider
    sessionOptions={{ api, ...(fastBackoff && { backoff: FAST_BACKOFF }) }}
    api={api}
  >
    <Outlet />
    <LocationProbe />
  </RunSessionRegistryProvider>
);

const renderApp = (
  path: string,
  mockOptions: Omit<BrowserRunMockServerOptions, "baseUrl"> = {},
  {
    strict = false,
    fastBackoff = false,
  }: { strict?: boolean; fastBackoff?: boolean } = {},
) => {
  const mock = createBrowserRunMockServer({
    baseUrl: BASE_URL,
    ...mockOptions,
  });
  const legacy = createLegacyApi();
  server.use(...mock.handlers, legacy.handler);
  const router = createMemoryRouter(
    [
      {
        element: <Layout fastBackoff={fastBackoff} />,
        children: [
          { path: "/app/home", element: <HomePage /> },
          { path: "/app/chat/:noteId", element: <ChatPage /> },
          { path: "/pricing", element: <p>pricing</p> },
        ],
      },
    ],
    { initialEntries: [path] },
  );
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const app = (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
  const view = render(strict ? <StrictMode>{app}</StrictMode> : app);
  const user = userEvent.setup();
  const requests = (method: string, pathPattern: RegExp) =>
    mock
      .getRequests()
      .filter(
        (entry) => entry.method === method && pathPattern.test(entry.path),
      );
  const posts = () => requests("POST", /^\/api\/conversations$/);
  const cancels = () => requests("POST", /\/cancel$/);
  const events = () => requests("GET", /\/events$/);
  return { mock, legacy, view, user, router, posts, cancels, events };
};

const getInput = () => {
  const input = document.querySelector<HTMLDivElement>(
    '[contenteditable="true"]',
  );
  if (!input) throw new Error("입력창 없음");
  return input;
};

const sendButton = () => screen.getByRole("button", { name: "전송" });
const stopButton = () => screen.getByRole("button", { name: "답변 중단" });

const typeQuestion = async (
  user: ReturnType<typeof userEvent.setup>,
  text: string,
) => {
  const input = getInput();
  await user.click(input);
  await user.type(input, text);
};

const location = () => screen.getByTestId("location").textContent;

/** fixture 응답 본문(`substantive-completed` run.completed). 검증 전에는 화면에 없어야 한다. */
const COMPLETED_BODY = "본문 풀이가 여기 있다.";

describe("홈 첫 질문", () => {
  it("Note를 먼저 만들지 않고 POST 한 번으로 보내고, run.created의 noteId로 이동해 같은 stream을 이어 받는다", async () => {
    const { user, posts, events, legacy, mock } = renderApp("/app/home", {
      frameIntervalMs: 40,
    });

    await typeQuestion(user, "이 문제를 풀어줘");
    await user.click(sendButton());

    await waitFor(() => expect(location()).toBe("/app/chat/9001"));
    // 이동 직후에도 같은 질문과 진행 박스가 보인다(검증 전 본문은 없다).
    expect(await screen.findByText("이 문제를 풀어줘")).toBeInTheDocument();
    expect(
      await screen.findByRole("button", { name: /진행 상황/ }),
    ).toBeInTheDocument();
    expect(screen.queryByText(COMPLETED_BODY)).not.toBeInTheDocument();

    expect(
      await screen.findByText(COMPLETED_BODY, undefined, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("article", { name: "AI 응답" }),
    ).toBeInTheDocument();

    // POST 한 번(같은 stream을 이어 받았으므로 재접속도 없다). 구형 Note 생성·제목·차감 호출이 없다.
    expect(posts()).toHaveLength(1);
    expect(events()).toHaveLength(0);
    expect(mock.listRunIds()).toHaveLength(1);
    expect(legacy.calls).not.toContain("POST /api/notes");
    expect(
      legacy.calls.filter(
        (call) =>
          call.includes("/generate-title") ||
          call.includes("/api/credits/use") ||
          call.startsWith("POST /api/conversations"),
      ),
    ).toEqual([]);

    // 이후 질문은 그 noteId로 보낸다.
    await typeQuestion(user, "다음 질문");
    await user.click(sendButton());
    await waitFor(() => expect(posts()).toHaveLength(2));
    const runs = mock.listRunIds().map((runId) => mock.getRun(runId));
    expect(runs.map((run) => run?.noteId)).toEqual(["9001", "9001"]);
    expect(legacy.calls).not.toContain("POST /api/notes");
  });

  it("StrictMode 재마운트(연결 끊김)에도 같은 run에 cursor로 다시 붙어 이어 받는다", async () => {
    const { user, posts, events, mock } = renderApp(
      "/app/home",
      { frameIntervalMs: 40 },
      { strict: true },
    );

    await typeQuestion(user, "이 문제를 풀어줘");
    await user.click(sendButton());

    await waitFor(() => expect(location()).toBe("/app/chat/9001"));
    expect(
      await screen.findByText(COMPLETED_BODY, undefined, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(posts()).toHaveLength(1);
    expect(mock.listRunIds()).toHaveLength(1);
    // 첫 마운트 정리(dispose)로 끊긴 POST stream을 같은 run의 GET /events로 이어 받았다.
    const [runId] = mock.listRunIds();
    expect(events().length).toBeGreaterThan(0);
    for (const entry of events()) {
      expect(entry.path).toBe(`/api/ai-runs/${runId}/events`);
      expect(entry.lastEventId).toMatch(new RegExp(`^${runId}:\\d+$`));
    }
    // 같은 질문 bubble이 하나만 보인다(중복 turn 없음).
    expect(screen.getAllByText("이 문제를 풀어줘")).toHaveLength(1);
  });

  it("접수 전에 재접속이 멈추면 새 전송을 막고, '다시 연결'로 같은 요청을 이어 Note로 간다", async () => {
    const { user, mock, posts, legacy } = renderApp(
      "/app/home",
      {},
      { fastBackoff: true },
    );
    // Server는 받았지만 run.created 전에 두 번 끊긴다(재시도 1회 → 소진).
    mock.injectFault("conversation", { kind: "disconnect", afterFrames: 0 });
    mock.injectFault("conversation", { kind: "disconnect", afterFrames: 0 });

    await typeQuestion(user, "끊기는 질문");
    await user.click(sendButton());

    expect(
      await screen.findByText("질문 전송 연결이 끊겼어요"),
    ).toBeInTheDocument();
    expect(location()).toBe("/app/home");
    expect(getInput().textContent).toBe("끊기는 질문");
    // 새 requestId로 다시 보내지 않는다(중복 Note·run 방지).
    expect(sendButton()).toHaveAttribute("aria-disabled", "true");
    await user.click(sendButton());
    expect(posts()).toHaveLength(2);
    expect(screen.queryByRole("button", { name: "안내 닫기" })).toBeNull();

    await user.click(screen.getByRole("button", { name: "다시 연결" }));
    await waitFor(() => expect(location()).toBe("/app/chat/9001"));
    expect(await screen.findByText(COMPLETED_BODY)).toBeInTheDocument();
    expect(mock.listRunIds()).toHaveLength(1);
    expect(new Set(posts().map((entry) => entry.requestId)).size).toBe(1);
    expect(legacy.calls).not.toContain("POST /api/notes");
  });

  it("이력 조회가 실패해도 '다시 불러오기'가 진행 중 stream을 끊지 않는다", async () => {
    const { user, posts, events } = renderApp("/app/home", {
      frameIntervalMs: 40,
    });
    let failed = 0;
    server.use(
      http.get(
        `${BASE_URL}/api/conversations/:noteId/messages`,
        () => {
          failed += 1;
          return HttpResponse.json(
            { isSuccess: false, code: "COMMON500", message: "오류" },
            { status: 500 },
          );
        },
        { once: true },
      ),
    );

    await typeQuestion(user, "이력 실패 질문");
    await user.click(sendButton());
    await waitFor(() => expect(location()).toBe("/app/chat/9001"));
    expect(
      await screen.findByText("대화를 불러오지 못했어요"),
    ).toBeInTheDocument();
    expect(failed).toBe(1);

    await user.click(screen.getByRole("button", { name: "다시 불러오기" }));
    expect(
      await screen.findByText(COMPLETED_BODY, undefined, { timeout: 3000 }),
    ).toBeInTheDocument();
    // 같은 POST stream으로 끝까지 받았다(재접속 없음).
    expect(posts()).toHaveLength(1);
    expect(events()).toHaveLength(0);
    expect(screen.getAllByText("이력 실패 질문")).toHaveLength(1);
  });

  it("접수가 거부되면 이동하지 않고 안내하며 입력을 남긴다", async () => {
    const { user, mock, posts, legacy } = renderApp("/app/home");
    mock.rejectNextConversation({ code: "RUN4021" });

    await typeQuestion(user, "잔액 없는 질문");
    await user.click(sendButton());

    expect(
      await screen.findByText("사용 가능한 잔여 사용량이 부족해요"),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "요금제 보기" })).toHaveAttribute(
      "href",
      "/pricing",
    );
    expect(location()).toBe("/app/home");
    expect(getInput().textContent).toBe("잔액 없는 질문");
    expect(posts()).toHaveLength(1);
    expect(legacy.calls).not.toContain("POST /api/notes");
  });
});

describe("Note 진입·새로고침 복원", () => {
  it("이력을 그리고 진행 중 run에 seq 1부터 붙어 Activity를 복원한 뒤 완료 응답을 보인다", async () => {
    const { mock, events, posts, legacy } = renderApp("/app/chat/5");
    // 렌더 직후 대화 조회 전에 run을 둔다(새로고침 전 상태).
    mock.seedRun({
      noteId: "5",
      template: "unsupported-only-completed",
      text: "지난 질문",
    });
    const activeRunId = mock.seedRun({
      noteId: "5",
      committed: 6,
      text: "진행 중 질문",
    });

    expect(await screen.findByText("지난 질문")).toBeInTheDocument();
    expect(screen.getByText("지원하지 않는 요청입니다")).toBeInTheDocument();
    expect(await screen.findByText("진행 중 질문")).toBeInTheDocument();
    const box = await screen.findByRole("list", { name: "진행 상황" });
    await waitFor(() =>
      expect(within(box).getAllByRole("listitem").length).toBeGreaterThan(0),
    );
    expect(screen.queryByText(COMPLETED_BODY)).not.toBeInTheDocument();
    // 정지 버튼이 보이고 draft만 쓸 수 있다.
    expect(stopButton()).toBeEnabled();
    expect(screen.queryByRole("button", { name: "전송" })).toBeNull();

    // cursor 없이(seq 1부터) 붙었다.
    expect(events()).toHaveLength(1);
    expect(events()[0].lastEventId).toBeNull();

    const detailReads = () =>
      legacy.calls.filter((call) => call === "GET /api/notes/5").length;
    await waitFor(() => expect(detailReads()).toBeGreaterThan(0));
    const beforeTerminal = detailReads();
    act(() => mock.commit(activeRunId));
    expect(await screen.findByText(COMPLETED_BODY)).toBeInTheDocument();
    expect(sendButton()).toBeInTheDocument();
    expect(posts()).toHaveLength(0);
    // terminal 뒤 노트 상세(제목)를 다시 읽는다(잔액·프로필·목록도 invalidate).
    await waitFor(() => expect(detailReads()).toBeGreaterThan(beforeTerminal));
  });

  it("409면 진행 중 run에 붙고 보낸 질문은 입력창에 남긴다(자동 재전송 없음)", async () => {
    const { mock, user, posts, events } = renderApp("/app/chat/8");
    expect(await screen.findByText("대화를 시작해보세요")).toBeInTheDocument();

    // 다른 탭이 이 Note에 질문을 보냈다.
    const otherRunId = mock.seedRun({
      noteId: "8",
      committed: 4,
      text: "다른 탭 질문",
    });

    await typeQuestion(user, "내 질문");
    await user.click(sendButton());

    expect(
      await screen.findByText("이 노트에서 진행 중인 답변이 있어요"),
    ).toBeInTheDocument();
    await waitFor(() => expect(getInput().textContent).toBe("내 질문"));
    expect(await screen.findByText("다른 탭 질문")).toBeInTheDocument();
    expect(stopButton()).toBeInTheDocument();
    expect(events()[0].path).toContain(otherRunId);
    expect(events()[0].lastEventId).toBeNull();

    act(() => mock.commit(otherRunId));
    expect(await screen.findByText(COMPLETED_BODY)).toBeInTheDocument();
    expect(posts()).toHaveLength(1);
    expect(mock.listRunIds()).toEqual([otherRunId]);
    expect(getInput().textContent).toBe("내 질문");
  });
});

describe("정지", () => {
  it("CANCELING 동안 '중단 중'으로 전송을 막고, 중단 뒤 draft를 유지하며 직접 보낼 때만 보낸다", async () => {
    const { mock, user, posts, cancels } = renderApp("/app/chat/7", {
      template: "canceled-running",
      frameIntervalMs: 10,
      holdCancelConfirmation: true,
    });
    expect(await screen.findByText("대화를 시작해보세요")).toBeInTheDocument();

    await typeQuestion(user, "긴 풀이 질문");
    await user.click(sendButton());
    await waitFor(() => expect(stopButton()).toBeEnabled());

    // Active Run 동안 다음 질문을 draft로만 쓴다. Enter로도 보내지 않는다.
    await typeQuestion(user, "다음 질문 초안");
    await user.keyboard("{Enter}");
    expect(posts()).toHaveLength(1);

    await user.click(stopButton());
    const canceling = await screen.findByRole("button", { name: "중단 중" });
    expect(canceling).toBeDisabled();
    expect(screen.queryByRole("button", { name: "전송" })).toBeNull();
    await user.keyboard("{Enter}");
    expect(posts()).toHaveLength(1);

    const [runId] = mock.listRunIds();
    act(() => mock.commit(runId));
    // run 결과는 "중단됨"(Activity 하나의 취소는 "취소됨")이다.
    const outcome = await waitFor(() => {
      const element = document.querySelector('[data-outcome="canceled"]');
      if (!element) throw new Error("중단 결과 없음");
      return element as HTMLElement;
    });
    expect(outcome).toHaveTextContent("중단됨 · 답변 생성을 중단했습니다.");
    // 앞서 끝난 Activity는 완료로 남고 열린 것은 취소됨이다.
    const box = screen.getByRole("list", { name: "진행 상황" });
    expect(within(box).getByText("완료")).toBeInTheDocument();
    expect(within(box).getByText("취소됨")).toBeInTheDocument();

    expect(getInput().textContent).toContain("다음 질문 초안");
    expect(posts()).toHaveLength(1);
    expect(cancels()).toHaveLength(1);

    await user.click(sendButton());
    await waitFor(() => expect(posts()).toHaveLength(2));
  });
});

describe("실패·접수 거부 안내", () => {
  it("요청 한도는 Retry-After 남은 시간 동안 전송을 막고 질문을 입력창에 돌려준다", async () => {
    const { mock, user, posts } = renderApp("/app/chat/3");
    expect(await screen.findByText("대화를 시작해보세요")).toBeInTheDocument();
    mock.rejectNextConversation({ code: "RUN4291", retryAfterSeconds: 30 });

    await typeQuestion(user, "급한 질문");
    await user.click(sendButton());

    expect(
      await screen.findByText("요청이 많아 잠시 기다려야 해요"),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/^(30|29)초 뒤에 다시 보낼 수 있어요\.$/),
    ).toBeInTheDocument();
    await waitFor(() => expect(getInput().textContent).toBe("급한 질문"));
    expect(sendButton()).toHaveAttribute("aria-disabled", "true");
    await user.click(sendButton());
    expect(posts()).toHaveLength(1);

    // 안내를 닫아도 남은 시간 동안은 계속 막는다.
    await user.click(screen.getByRole("button", { name: "안내 닫기" }));
    expect(screen.queryByText("요청이 많아 잠시 기다려야 해요")).toBeNull();
    expect(sendButton()).toHaveAttribute("aria-disabled", "true");
    await user.click(sendButton());
    await user.keyboard("{Enter}");
    expect(posts()).toHaveLength(1);
  });

  it("미지원 요청 거부와 잔액 부족을 구분해 안내한다", async () => {
    const { mock, user } = renderApp("/app/chat/4");
    expect(await screen.findByText("대화를 시작해보세요")).toBeInTheDocument();

    mock.rejectNextConversation({ code: "RUN4002" });
    await typeQuestion(user, "영상으로 만들어줘");
    await user.click(sendButton());
    expect(
      await screen.findByText("지원하지 않는 요청이에요"),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(getInput().textContent).toBe("영상으로 만들어줘"),
    );

    mock.rejectNextConversation({ code: "RUN4021" });
    await user.click(sendButton());
    expect(
      await screen.findByText("사용 가능한 잔여 사용량이 부족해요"),
    ).toBeInTheDocument();
    expect(screen.queryByText("지원하지 않는 요청이에요")).toBeNull();
  });

  it("recoverable 실패는 다시 보낼 수 있다고 안내하고, 질문을 입력창에 넣기만 한다", async () => {
    const { user, posts } = renderApp("/app/chat/6", {
      template: "failed-verification",
    });
    expect(await screen.findByText("대화를 시작해보세요")).toBeInTheDocument();

    await typeQuestion(user, "검증 실패할 질문");
    await user.click(sendButton());

    expect(
      await screen.findByText("답변을 완성하지 못했어요"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/풀이의 오류를 수정하지 못했습니다/),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "질문 다시 쓰기" }));
    await waitFor(() =>
      expect(getInput().textContent).toBe("검증 실패할 질문"),
    );
    expect(posts()).toHaveLength(1);

    // 입력창에 써 둔 내용이 있으면 덮어쓰지 않고 질문을 앞에 붙인다.
    getInput().textContent = "";
    await typeQuestion(user, "새 초안");
    await user.click(screen.getByRole("button", { name: "질문 다시 쓰기" }));
    await waitFor(() =>
      expect(getInput().textContent).toBe("검증 실패할 질문\n새 초안"),
    );
    expect(posts()).toHaveLength(1);
  });

  it("unsupported_only 응답은 미지원 안내로 보인다", async () => {
    const { user } = renderApp("/app/chat/2", {
      template: "unsupported-only-completed",
    });
    expect(await screen.findByText("대화를 시작해보세요")).toBeInTheDocument();
    await typeQuestion(user, "동영상 만들어줘");
    await user.click(sendButton());
    expect(
      await screen.findByText("지원하지 않는 요청입니다"),
    ).toBeInTheDocument();
  });
});
