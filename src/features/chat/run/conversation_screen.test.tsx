import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
import { http, HttpResponse } from "msw";
import type { RequestHandler } from "msw";
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
import type { RunStreamEnd, RunStreamOptions } from "@/features/run/api";
import type {
  BrowserFrame,
  ConversationRunRequest,
  RunCreatedFrame,
  TerminalFrame,
} from "@/shared/contracts/browser_run_v1";
import { useStorageStore } from "@/features/storage/store/useStorageStore";
import { getStreamFixture } from "@/test/contracts/browser_run_fixtures";
import { createBrowserRunMockServer } from "@/features/run/session/mocks";
import type { BrowserRunMockServerOptions } from "@/features/run/session/mocks";
import { extractInputContent } from "@/features/editor/utils/extract_input_content";
import { ChatPage } from "@/pages/ChatPage";
import { HomePage } from "@/pages/HomePage";
import type {
  ReconnectBackoff,
  RunSessionOptions,
} from "@/features/run/session";
import { RunSessionRegistryProvider } from "./RunSessionRegistryProvider";
import { useRunSessionRegistry } from "./run_session_registry";
import type { RunSessionRegistry } from "./run_session_registry";

// mathlive는 jsdom에서 custom element를 등록하지 못한다. 수식 입력은 이 테스트 범위가 아니다.
vi.mock("mathlive", () => ({ MathfieldElement: class {} }));
// pdfjs-dist는 jsdom에 없는 DOMMatrix가 필요하다. 테스트용 2페이지 PDF 문서를 제공한다.
vi.mock("pdfjs-dist", () => ({
  GlobalWorkerOptions: {},
  getDocument: vi.fn(() => {
    const doc = {
      numPages: 2,
      getPage: vi.fn(async () => ({
        getViewport: ({ scale }: { scale: number }) => ({
          width: 400 * scale,
          height: 600 * scale,
        }),
        render: () => ({ promise: Promise.resolve(), cancel: () => {} }),
      })),
      destroy: vi.fn(async () => {}),
    };
    return {
      promise: Promise.resolve(doc),
      destroy: vi.fn(),
    };
  }),
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

const originalResizeObserver = globalThis.ResizeObserver;
const originalCreateObjectURL = URL.createObjectURL;
const originalRevokeObjectURL = URL.revokeObjectURL;
const originalGetContext = HTMLCanvasElement.prototype.getContext;

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
  HTMLCanvasElement.prototype.getContext = (() =>
    ({}) as unknown as CanvasRenderingContext2D) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  if (typeof globalThis.ResizeObserver === "undefined") {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
  if (typeof URL.createObjectURL !== "function") {
    URL.createObjectURL = () => "blob:mock-preview";
  }
  if (typeof URL.revokeObjectURL !== "function") {
    URL.revokeObjectURL = () => {};
  }
});
afterEach(() => {
  vi.unstubAllEnvs();
  server.resetHandlers();
  useStorageStore.getState().setViewerFileId(null);
  useStorageStore.getState().setViewerReady(false);
});
afterAll(() => {
  server.close();
  HTMLCanvasElement.prototype.getContext = originalGetContext;
  globalThis.ResizeObserver = originalResizeObserver;
  URL.createObjectURL = originalCreateObjectURL;
  URL.revokeObjectURL = originalRevokeObjectURL;
});

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

/** 화면이 쓰는 registry를 테스트에서 본다(handOff 횟수 확인). */
const RegistryProbe = ({
  onRegistry,
}: {
  onRegistry: (registry: RunSessionRegistry) => void;
}) => {
  onRegistry(useRunSessionRegistry());
  return null;
};

interface LayoutProps {
  sessionOptions: Omit<RunSessionOptions, "noteId">;
  onRegistry: (registry: RunSessionRegistry) => void;
}

const Layout = ({ sessionOptions, onRegistry }: LayoutProps) => (
  <RunSessionRegistryProvider
    sessionOptions={sessionOptions}
    api={api}
  >
    <RegistryProbe onRegistry={onRegistry} />
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
    backoff = fastBackoff ? FAST_BACKOFF : undefined,
    sessionApi = api,
    extraHandlers = [],
  }: {
    strict?: boolean;
    fastBackoff?: boolean;
    backoff?: ReconnectBackoff;
    sessionApi?: RunSessionOptions["api"];
    extraHandlers?: RequestHandler[];
  } = {},
) => {
  let registry: RunSessionRegistry | null = null;
  const mock = createBrowserRunMockServer({
    baseUrl: BASE_URL,
    ...mockOptions,
  });
  const legacy = createLegacyApi();
  server.use(...extraHandlers, ...mock.handlers, legacy.handler);
  const router = createMemoryRouter(
    [
      {
        element: (
          <Layout
            sessionOptions={{ api: sessionApi, ...(backoff && { backoff }) }}
            onRegistry={(value) => {
              registry = value;
            }}
          />
        ),
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
  const getRegistry = () => {
    if (!registry) throw new Error("registry 없음");
    return registry;
  };
  return {
    mock,
    legacy,
    view,
    user,
    router,
    queryClient,
    getRegistry,
    posts,
    cancels,
    events,
  };
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

  it("접수 전에 홈을 떠나면 사용자가 간 화면을 바꾸지 않고, 접수 뒤 한 번만 맡기고 노트 목록을 다시 읽는다", async () => {
    const { user, mock, posts, router, queryClient, getRegistry } = renderApp(
      "/app/home",
      {},
      {
        backoff: {
          initialDelayMs: 300,
          maxDelayMs: 300,
          multiplier: 1,
          maxAttempts: 3,
        },
      },
    );
    const handOff = vi.spyOn(getRegistry(), "handOff");
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    // 첫 POST는 run.created 전에 끊긴다 → 300ms 뒤 같은 requestId로 다시 보낸다.
    mock.injectFault("conversation", { kind: "disconnect", afterFrames: 0 });

    await typeQuestion(user, "떠나기 전 질문");
    await user.click(sendButton());
    await waitFor(() => expect(posts()).toHaveLength(1));

    // 재접속 대기 중 사이드바로 다른 노트에 간다.
    await act(() => router.navigate("/app/chat/1"));
    expect(await screen.findByText("대화를 시작해보세요")).toBeInTheDocument();

    await waitFor(() => expect(posts()).toHaveLength(2));
    const [runId] = mock.listRunIds();
    await waitFor(() => expect(mock.getRun(runId)?.status).toBe("COMPLETED"));
    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({
        queryKey: ["notes", "list"],
      }),
    );
    // 이동 없음, handOff 1회(detached).
    expect(location()).toBe("/app/chat/1");
    expect(handOff).toHaveBeenCalledTimes(1);
    expect(handOff).toHaveBeenCalledWith("9001", expect.anything(), {
      detached: true,
    });
    // 아무도 이어 받지 않은 채 run이 끝났으므로 registry에서 정리됐다.
    await waitFor(() => expect(getRegistry().peek("9001")).toBeUndefined());

    // 나중에 그 Note에 들어가면 대화 조회로 완료 응답을 본다(새 전송 없음).
    await act(() => router.navigate("/app/chat/9001"));
    expect(await screen.findByText(COMPLETED_BODY)).toBeInTheDocument();
    expect(screen.getByText("떠나기 전 질문")).toBeInTheDocument();
    expect(posts()).toHaveLength(2);
    expect(mock.listRunIds()).toHaveLength(1);
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
      expect(extractInputContent(getInput()).text).toBe(
        "검증 실패할 질문\n새 초안",
      ),
    );
    expect(getInput().querySelector("br")).not.toBeNull();
    expect(posts()).toHaveLength(1);
  });

  it("Note에서 접수 전에 재접속이 멈추면 질문 자리를 남기고 새 전송을 막으며, '다시 연결'로 같은 요청을 잇는다", async () => {
    const { user, mock, posts } = renderApp(
      "/app/chat/11",
      {},
      { fastBackoff: true },
    );
    expect(await screen.findByText("대화를 시작해보세요")).toBeInTheDocument();
    mock.injectFault("conversation", { kind: "disconnect", afterFrames: 0 });
    mock.injectFault("conversation", { kind: "disconnect", afterFrames: 0 });

    await typeQuestion(user, "Note 끊기는 질문");
    await user.click(sendButton());

    expect(await screen.findByText("답변 연결이 끊겼어요")).toBeInTheDocument();
    // 질문 자리는 남고 입력창으로 돌려주지 않는다(접수됐을 수 있다).
    expect(screen.getByText("Note 끊기는 질문")).toBeInTheDocument();
    expect(getInput().textContent).toBe("");
    // 정지할 run이 없으니 전송 버튼이지만 막혀 있다.
    expect(sendButton()).toHaveAttribute("aria-disabled", "true");
    await typeQuestion(user, "새 질문");
    await user.click(sendButton());
    expect(posts()).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: "다시 연결" }));
    expect(await screen.findByText(COMPLETED_BODY)).toBeInTheDocument();
    expect(mock.listRunIds()).toHaveLength(1);
    expect(new Set(posts().map((entry) => entry.requestId)).size).toBe(1);
    expect(screen.getAllByText("Note 끊기는 질문")).toHaveLength(1);
  });

  it("접수 전 계약 밖 오류(unexpected)는 입력창을 막아 두지 않고 질문을 돌려준다", async () => {
    const streamConversation = vi
      .fn<typeof api.streamConversation>()
      .mockRejectedValueOnce(new Error("계약 밖 오류"))
      .mockImplementation(api.streamConversation);
    const { user, posts } = renderApp(
      "/app/chat/12",
      {},
      { sessionApi: { ...api, streamConversation } },
    );
    expect(await screen.findByText("대화를 시작해보세요")).toBeInTheDocument();

    await typeQuestion(user, "오류 날 질문");
    await user.click(sendButton());

    expect(
      await screen.findByText("답변을 표시하지 못했어요"),
    ).toBeInTheDocument();
    await waitFor(() => expect(getInput().textContent).toBe("오류 날 질문"));
    expect(screen.queryByRole("button", { name: "답변 중단" })).toBeNull();
    expect(sendButton()).not.toHaveAttribute("aria-disabled", "true");
    expect(posts()).toHaveLength(0);
    // 사용자가 직접 다시 보내면 보낸다.
    await user.click(sendButton());
    await waitFor(() => expect(posts()).toHaveLength(1));
  });

  it("#파일 멘션이 있는 질문은 말없이 빼고 보내지 않고 안내한다", async () => {
    const { user, posts } = renderApp("/app/chat/13");
    expect(await screen.findByText("대화를 시작해보세요")).toBeInTheDocument();
    const input = getInput();
    input.innerHTML = '<span data-asset-id="3">#문제.pdf</span>';
    await typeQuestion(user, " 이 파일 풀어줘");
    await user.click(sendButton());

    expect(
      await screen.findByText(/#파일 멘션·@도구 선택은 아직 질문과 함께/),
    ).toBeInTheDocument();
    expect(getInput().textContent).toContain("이 파일 풀어줘");
    expect(posts()).toHaveLength(0);
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

describe("재설명 실시간 스트리밍", () => {
  it("re_explanation.delta 도착 직후 canonical 완료 전부터 SafeMarkdown·KaTeX와 추가 설명 배지를 표시하고 완료 시 교체한다", async () => {
    const { user, mock } = renderApp("/app/chat/2", {
      template: "re-explanation-streaming",
      frameIntervalMs: 5000,
    });
    try {
      expect(
        await screen.findByText("대화를 시작해보세요"),
      ).toBeInTheDocument();

      await typeQuestion(user, "방금 풀이 왜 그렇게 되나요?");
      await user.click(sendButton());

      await waitFor(() => expect(mock.listRunIds()).toHaveLength(1));
      const [runId] = mock.listRunIds();

      // 첫 delta(seq 5, deltaIndex=0)까지 반영 — 아직 run.completed 전이다.
      act(() => mock.commit(runId, 4));
      const liveArticle = await screen.findByRole("article", {
        name: "재설명 실시간 응답",
      });
      expect(liveArticle).toHaveAttribute("data-re-explanation-stream", "live");
      expect(within(liveArticle).getByText("추가 설명")).toBeInTheDocument();
      expect(
        within(liveArticle).getByText("검증 대상 아님"),
      ).toBeInTheDocument();
      expect(liveArticle).toHaveTextContent("양변에 같은 연산을");
      expect(screen.queryByRole("article", { name: "AI 응답" })).toBeNull();

      // 두 번째 delta(seq 6, $x = 2$) 도착 시 완료 전에도 KaTeX가 렌더된다.
      act(() => mock.commit(runId, 1));
      await waitFor(() => {
        expect(liveArticle).toHaveTextContent(
          "양변에 같은 연산을 적용하기 때문입니다.",
        );
        expect(liveArticle.querySelector(".katex")).not.toBeNull();
      });
      expect(screen.queryByRole("article", { name: "AI 응답" })).toBeNull();

      // run.completed 도착 시 canonical 본문으로 교체되고 live 영역은 제거된다.
      act(() => mock.commit(runId));
      const canonicalArticle = await screen.findByRole("article", {
        name: "AI 응답",
      });
      expect(canonicalArticle).toHaveTextContent(
        "양변에 같은 연산을 적용하는 이유를 설명합니다.",
      );
      expect(within(canonicalArticle).getByText("추가 설명")).toBeInTheDocument();
      expect(
        screen.queryByRole("article", { name: "재설명 실시간 응답" }),
      ).toBeNull();
    } finally {
      mock.reset();
    }
  });

  it("delta 스트리밍 중 중단되면 부분 설명을 partial 배너와 함께 유지하고 VerifiedSolution으로 승격하지 않는다", async () => {
    const { user, mock } = renderApp("/app/chat/7", {
      template: "canceled-during-re-explanation",
      frameIntervalMs: 5000,
      holdCancelConfirmation: true,
    });
    try {
      expect(
        await screen.findByText("대화를 시작해보세요"),
      ).toBeInTheDocument();

      await typeQuestion(user, "중간에 멈출 재설명");
      await user.click(sendButton());

      await waitFor(() => expect(mock.listRunIds()).toHaveLength(1));
      const [runId] = mock.listRunIds();
      act(() => mock.commit(runId, 4));

      const streamingArticle = await screen.findByRole("article", {
        name: "재설명 실시간 응답",
      });
      expect(streamingArticle).toHaveTextContent("먼저 양변에서 3을");

      await user.click(stopButton());
      await screen.findByRole("button", { name: "중단 중" });
      act(() => mock.commit(runId));

      await waitFor(() => {
        expect(
          document.querySelector('[data-outcome="canceled"]'),
        ).toBeInTheDocument();
      });
      expect(streamingArticle).toHaveAttribute(
        "data-re-explanation-stream",
        "partial",
      );
      expect(streamingArticle).toHaveTextContent("먼저 양변에서 3을");
      expect(streamingArticle).toHaveTextContent(
        "완료 전에 중단된 일부 설명입니다. 검증된 풀이로 저장되지 않았습니다.",
      );
      expect(screen.queryByRole("article", { name: "AI 응답" })).toBeNull();
    } finally {
      mock.reset();
    }
  });

  it("수식($...$)이 여러 delta로 갈려 도착해도 깨지지 않고 닫히는 순간 SafeMarkdown·KaTeX로 완성된다", async () => {
    const fixture = getStreamFixture("re-explanation-streaming");
    const splitFrames = structuredClone(fixture.frames);
    const delta0 = splitFrames[4];
    const delta1 = splitFrames[5];
    const completed = splitFrames.at(-1);
    if (
      delta0.type !== "re_explanation.delta" ||
      delta1.type !== "re_explanation.delta" ||
      completed?.type !== "run.completed"
    ) {
      throw new Error("fixture shape mismatch");
    }
    delta0.payload.delta = "설명: $x^2 ";
    delta1.payload.delta = "- 5x + 6 = 0$";
    completed.payload.assistantResponse.responsePages[0].resultBlocks[0].body =
      "설명: $x^2 - 5x + 6 = 0$";
    completed.payload.assistantResponse.plainText = "설명: $x^2 - 5x + 6 = 0$";

    let streamOptions: RunStreamOptions | null = null;
    let finishStream: (end: RunStreamEnd) => void = () => {};
    const customApi: RunSessionOptions["api"] = {
      streamConversation: (request, options) => {
        (splitFrames[0] as RunCreatedFrame).payload.noteId =
          request.noteId ?? "2";
        streamOptions = options;
        options.onOpen?.();
        return new Promise((resolve) => {
          finishStream = resolve;
        });
      },
      streamRunEvents: () => new Promise(() => {}),
      cancelRun: () => Promise.reject(new Error("unused")),
      getConversationMessages: () => Promise.reject(new Error("unused")),
    };

    const { user, mock } = renderApp(
      "/app/chat/2",
      {},
      { sessionApi: customApi },
    );
    try {
      expect(
        await screen.findByText("대화를 시작해보세요"),
      ).toBeInTheDocument();

      await typeQuestion(user, "수식 스트리밍 테스트");
      await user.click(sendButton());
      await waitFor(() => expect(streamOptions).not.toBeNull());

      // 여는 $만 온 첫 delta
      act(() => {
        for (const frame of splitFrames.slice(0, 5)) {
          streamOptions?.onFrame(frame as BrowserFrame);
        }
      });
      const liveArticle = await screen.findByRole("article", {
        name: "재설명 실시간 응답",
      });
      expect(liveArticle).toHaveTextContent("설명:");
      expect(liveArticle.querySelector(".katex")).toBeNull();

      // 닫는 $가 온 두 번째 delta (여전히 run.completed 전)
      act(() => {
        streamOptions?.onFrame(splitFrames[5] as BrowserFrame);
      });
      await waitFor(() => {
        expect(liveArticle.querySelector(".katex")).not.toBeNull();
      });
      expect(screen.queryByRole("article", { name: "AI 응답" })).toBeNull();

      // terminal 완료 후 canonical 교체
      await act(async () => {
        for (const frame of splitFrames.slice(6)) {
          streamOptions?.onFrame(frame as BrowserFrame);
        }
        finishStream({
          reason: "terminal",
          terminalFrame: completed as TerminalFrame,
          lastEventId: `${completed.runId}:${completed.seq}`,
        });
      });
      const canonicalArticle = await screen.findByRole("article", {
        name: "AI 응답",
      });
      expect(canonicalArticle.querySelector(".katex")).not.toBeNull();
      expect(
        screen.queryByRole("article", { name: "재설명 실시간 응답" }),
      ).toBeNull();
    } finally {
      mock.reset();
    }
  });
});

describe("사진 첨부·뷰어 포커스 전송", () => {
  it("이미지 픽셀 로드 전에는 viewerFocus를 생략하고, onLoad 완료 및 파일 전환 뒤에는 반영한다", async () => {
    const sentBodies: ConversationRunRequest[] = [];
    const spyingApi: RunSessionOptions["api"] = {
      ...api,
      streamConversation: (request, options) => {
        sentBodies.push(request);
        return api.streamConversation(request, options);
      },
    };

    const withViewer = renderApp(
      "/app/chat/2?panel=viewer&file=2",
      {},
      {
        sessionApi: spyingApi,
        extraHandlers: [
          http.get("*/api/assets/:assetId/download", ({ params }) =>
            ok({
              downloadUrl: `http://mock.test/assets/${params.assetId}.png`,
              fileName: params.assetId === "5" ? "second.png" : "problem.png",
              mimeType: "image/png",
            }),
          ),
        ],
      },
    );
    expect(await screen.findByText("대화를 시작해보세요")).toBeInTheDocument();
    const img1 = await screen.findByAltText("problem.png");

    // <img>가 onLoad되기 전(픽셀 미준비)에는 viewerFocus를 보내지 않는다.
    await typeQuestion(withViewer.user, "이미지 로딩 중 질문");
    await withViewer.user.click(sendButton());
    await waitFor(() => expect(sentBodies).toHaveLength(1));
    expect(sentBodies[0].viewerFocus).toBeUndefined();
    expect(
      await screen.findByText(COMPLETED_BODY, undefined, { timeout: 3000 }),
    ).toBeInTheDocument();

    // onLoad 완료 후 1페이지 viewerFocus를 보낸다.
    fireEvent.load(img1);
    await waitFor(() => expect(useStorageStore.getState().viewerReady).toBe(true));
    await typeQuestion(withViewer.user, "이 사진 1번 풀어줘");
    await withViewer.user.click(sendButton());
    await waitFor(() => expect(sentBodies).toHaveLength(2));
    expect(sentBodies[1].viewerFocus).toEqual({
      noteAssetId: "2",
      page: 1,
    });
    await waitFor(() =>
      expect(screen.getAllByText(COMPLETED_BODY)).toHaveLength(2),
    );

    // 다른 파일로 전환하면 새 이미지의 onLoad 전까지는 대기하고 onLoad 뒤에 새 ID로 보낸다.
    await act(async () => {
      await withViewer.router.navigate("/app/chat/2?panel=viewer&file=5");
    });
    const img5 = await screen.findByAltText("second.png");
    expect(useStorageStore.getState().viewerReady).toBe(false);
    fireEvent.load(img5);
    await waitFor(() => expect(useStorageStore.getState().viewerReady).toBe(true));
    await typeQuestion(withViewer.user, "새 파일 풀어줘");
    await withViewer.user.click(sendButton());
    await waitFor(() => expect(sentBodies).toHaveLength(3));
    expect(sentBodies[2].viewerFocus).toEqual({
      noteAssetId: "5",
      page: 1,
    });
  });

  it("PDF 뷰어는 캔버스 렌더와 페이지 이동(2페이지)을 거쳐 viewerFocus에 반영한다", async () => {
    const sentBodies: ConversationRunRequest[] = [];
    const spyingApi: RunSessionOptions["api"] = {
      ...api,
      streamConversation: (request, options) => {
        sentBodies.push(request);
        return api.streamConversation(request, options);
      },
    };

    const withPdf = renderApp(
      "/app/chat/2?panel=viewer&file=6",
      {},
      {
        sessionApi: spyingApi,
        extraHandlers: [
          http.get("*/api/assets/6/download", () =>
            ok({
              downloadUrl: "http://mock.test/assets/6.pdf",
              fileName: "workbook.pdf",
              mimeType: "application/pdf",
            }),
          ),
        ],
      },
    );
    expect(await screen.findByText("workbook.pdf")).toBeInTheDocument();
    await waitFor(() => expect(useStorageStore.getState().viewerReady).toBe(true));

    await withPdf.user.click(screen.getByRole("button", { name: "다음 페이지" }));
    await waitFor(() => expect(useStorageStore.getState().viewerPage).toBe(2));
    await waitFor(() => expect(useStorageStore.getState().viewerReady).toBe(true));

    await typeQuestion(withPdf.user, "PDF 2페이지 풀어줘");
    await withPdf.user.click(sendButton());
    await waitFor(() => expect(sentBodies).toHaveLength(1));
    expect(sentBodies[0].viewerFocus).toEqual({
      noteAssetId: "6",
      page: 2,
    });
  });

  it("스토리지 탭 전환과 이미지 로드 실패(onError)·다운로드 실패에서는 viewerFocus를 생략한다", async () => {
    const sentBodies: ConversationRunRequest[] = [];
    const spyingApi: RunSessionOptions["api"] = {
      ...api,
      streamConversation: (request, options) => {
        sentBodies.push(request);
        return api.streamConversation(request, options);
      },
    };

    const withViewer = renderApp(
      "/app/chat/2?panel=viewer&file=2",
      {},
      {
        sessionApi: spyingApi,
        extraHandlers: [
          http.get("*/api/assets/:assetId/download", ({ params }) =>
            ok({
              downloadUrl: `http://mock.test/assets/${params.assetId}.png`,
              fileName: "problem.png",
              mimeType: "image/png",
            }),
          ),
        ],
      },
    );
    expect(await screen.findByText("대화를 시작해보세요")).toBeInTheDocument();
    const img = await screen.findByAltText("problem.png");
    fireEvent.load(img);
    await waitFor(() => expect(useStorageStore.getState().viewerReady).toBe(true));

    // Storage 탭으로 전환하면 viewerFocus를 보내지 않는다.
    await withViewer.user.click(
      screen.getByRole("button", { name: "Storage" }),
    );
    await typeQuestion(withViewer.user, "스토리지 탭 질문");
    await withViewer.user.click(sendButton());
    await waitFor(() => expect(sentBodies).toHaveLength(1));
    expect(sentBodies[0].viewerFocus).toBeUndefined();
    await waitFor(() =>
      expect(screen.getAllByText(COMPLETED_BODY)).toHaveLength(1),
    );

    // 다시 Viewer 탭으로 돌아와 이미지 로드 오류(onError)가 발생하면 viewerFocus를 보내지 않는다.
    await withViewer.user.click(screen.getByRole("button", { name: "Viewer" }));
    const brokenImg = await screen.findByAltText("problem.png");
    fireEvent.error(brokenImg);
    expect(
      await screen.findByText(/이미지를 불러오는 중 오류가 발생했습니다/),
    ).toBeInTheDocument();
    await typeQuestion(withViewer.user, "깨진 이미지 질문");
    await withViewer.user.click(sendButton());
    await waitFor(() => expect(sentBodies).toHaveLength(2));
    expect(sentBodies[1].viewerFocus).toBeUndefined();

    withViewer.view.unmount();
    useStorageStore.getState().setViewerFileId(null);
    useStorageStore.getState().setViewerReady(false);
    server.resetHandlers();

    // 뷰어 파일 다운로드에 실패하면 viewerFocus를 보내지 않는다.
    const failedViewer = renderApp(
      "/app/chat/3?panel=viewer&file=2",
      {},
      {
        sessionApi: spyingApi,
        extraHandlers: [
          http.get("*/api/assets/2/download", () =>
            HttpResponse.json(
              { isSuccess: false, code: "COMMON500", message: "error" },
              { status: 500 },
            ),
          ),
        ],
      },
    );
    expect(await screen.findByText("대화를 시작해보세요")).toBeInTheDocument();
    expect(
      await screen.findByText(/파일을 불러오는 데 실패했습니다/),
    ).toBeInTheDocument();

    await typeQuestion(failedViewer.user, "실패한 뷰어에서 질문");
    await failedViewer.user.click(sendButton());
    await waitFor(() => expect(sentBodies).toHaveLength(3));
    expect(sentBodies[2].viewerFocus).toBeUndefined();

    failedViewer.view.unmount();
    useStorageStore.getState().setViewerFileId(null);
    useStorageStore.getState().setViewerReady(false);
    server.resetHandlers();

    // PDF 문서 로드가 signed URL 포함 오류로 실패하면 viewerFocus를 생략하고 signed URL을 콘솔에 남기지 않는다.
    const pdfjs = await import("pdfjs-dist");
    const signedPdfUrl =
      "https://storage.test/bucket/problem.pdf?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Signature=SECRET_PDF_SIG";
    const pdfLoadError = Object.assign(
      new Error(`Unexpected server response (403) while retrieving PDF "${signedPdfUrl}".`),
      { name: "UnexpectedResponseException", status: 403 },
    );
    vi.mocked(pdfjs.getDocument).mockImplementationOnce(() => ({
      promise: Promise.reject(pdfLoadError),
      destroy: vi.fn(),
    }) as unknown as ReturnType<typeof pdfjs.getDocument>);

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    try {
      const failedPdfViewer = renderApp(
        "/app/chat/3?panel=viewer&file=2",
        {},
        {
          sessionApi: spyingApi,
          extraHandlers: [
            http.get("*/api/notes/3", () =>
              ok({
                noteId: 3,
                title: "노트 3",
                assets: [
                  {
                    assetId: 2,
                    fileName: "problem.pdf",
                    fileType: "PDF",
                    fileSize: 2048,
                    ocrStatus: "completed",
                  },
                ],
              }),
            ),
            http.get("*/api/assets/2/download", () =>
              ok({
                assetId: 2,
                fileName: "problem.pdf",
                downloadUrl: signedPdfUrl,
                expiresAt: "2026-11-18T23:59:59Z",
              }),
            ),
          ],
        },
      );
      expect(
        await screen.findByText(/PDF를 불러오는 중 오류가 발생했습니다/),
      ).toBeInTheDocument();

      await typeQuestion(failedPdfViewer.user, "깨진 PDF 질문");
      await failedPdfViewer.user.click(sendButton());
      await waitFor(() => expect(sentBodies).toHaveLength(4));
      expect(sentBodies[3].viewerFocus).toBeUndefined();

      const loggedText = consoleErrorSpy.mock.calls
        .map((call) => JSON.stringify(call))
        .join("\n");
      expect(loggedText).not.toContain("SECRET_PDF_SIG");
      expect(loggedText).not.toContain("X-Goog-Signature");
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });

  it("로컬 fallback 비활성 시 단일 사진 첨부도 Note Asset으로 업로드하지 않는다", async () => {
    vi.stubEnv("VITE_ENABLE_LOCAL_PHOTO_FALLBACK", "false");
    let uploadUrlCalled = false;
    const { user, posts } = renderApp(
      "/app/chat/2",
      {},
      {
        extraHandlers: [
          http.post("*/api/assets/upload-url", () => {
            uploadUrlCalled = true;
            return ok({
              assetId: 42,
              uploadUrl: "http://upload.test/42",
              expiresAt: "2026-11-18T23:59:59Z",
            });
          }),
        ],
      },
    );
    expect(await screen.findByText("대화를 시작해보세요")).toBeInTheDocument();

    const fileInput = document.querySelector<HTMLInputElement>(
      'input[type="file"]',
    );
    if (!fileInput) throw new Error("파일 input 없음");
    await user.upload(
      fileInput,
      new File([new Uint8Array(128)], "photo.png", { type: "image/png" }),
    );
    await typeQuestion(user, "fallback off 사진 질문");
    await user.click(sendButton());

    expect(
      await screen.findByText(/#파일 멘션·@도구 선택은 아직 질문과 함께/),
    ).toBeInTheDocument();
    expect(uploadUrlCalled).toBe(false);
    expect(posts()).toHaveLength(0);
  });

  it("단일 사진 첨부 전송 시 현재 turn에만 viewerFocus를 보내고 다음 텍스트 질문엔 남기지 않는다", async () => {
    vi.stubEnv("VITE_ENABLE_LOCAL_PHOTO_FALLBACK", "true");
    const sentBodies: ConversationRunRequest[] = [];
    const uploadSteps: string[] = [];
    const spyingApi: RunSessionOptions["api"] = {
      ...api,
      streamConversation: (request, options) => {
        sentBodies.push(request);
        return api.streamConversation(request, options);
      },
    };

    const { user, router } = renderApp(
      "/app/chat/2",
      {},
      {
        sessionApi: spyingApi,
        extraHandlers: [
          http.post("*/api/assets/upload-url", () => {
            uploadSteps.push("upload-url");
            return ok({
              assetId: 42,
              uploadUrl: "http://upload.test/42",
              expiresAt: "2026-11-18T23:59:59Z",
            });
          }),
          http.put("http://upload.test/42", () => {
            uploadSteps.push("put");
            return new HttpResponse(null, { status: 200 });
          }),
          http.post("*/api/assets/42/confirm", () => {
            uploadSteps.push("confirm");
            return ok({
              assetId: 42,
              noteId: 2,
              source: "upload",
              fileName: "photo.png",
              fileSize: 128,
              mimeType: "image/png",
              ocrStatus: "completed",
              createdAt: "2026-11-18T14:00:00Z",
            });
          }),
          http.get("*/api/notes/2", () =>
            ok({ noteId: 2, title: "노트 2", assets: [] }),
          ),
          http.get("*/api/storage", () =>
            ok({ totalUsed: 0, limit: 1000000, notes: [] }),
          ),
        ],
      },
    );

    expect(await screen.findByText("대화를 시작해보세요")).toBeInTheDocument();

    const fileInput = document.querySelector<HTMLInputElement>(
      'input[type="file"]',
    );
    if (!fileInput) throw new Error("파일 input 없음");
    await user.upload(
      fileInput,
      new File([new Uint8Array(128)], "photo.png", { type: "image/png" }),
    );
    expect(await screen.findByAltText("photo.png")).toBeInTheDocument();

    await typeQuestion(user, "사진 문제 풀어줘");
    await user.click(sendButton());

    await waitFor(() => expect(sentBodies).toHaveLength(1));
    expect(uploadSteps).toEqual(["upload-url", "put", "confirm"]);
    expect(sentBodies[0].viewerFocus).toEqual({
      noteAssetId: "42",
      page: 1,
    });
    expect(router.state.location.search).not.toContain("file=42");
    expect(
      await screen.findByText(COMPLETED_BODY, undefined, { timeout: 3000 }),
    ).toBeInTheDocument();

    // 다음 일반 텍스트 질문에는 방금 첨부한 사진이 viewerFocus로 따라가지 않는다.
    await typeQuestion(user, "후속 일반 질문");
    await user.click(sendButton());
    await waitFor(() => expect(sentBodies).toHaveLength(2));
    expect(sentBodies[1].viewerFocus).toBeUndefined();
  });

  it("confirm 단계에서 검증 거부되면 /api/conversations를 호출하지 않고 입력·첨부를 남기며 민감 헤더를 로깅하지 않는다", async () => {
    vi.stubEnv("VITE_ENABLE_LOCAL_PHOTO_FALLBACK", "true");
    let confirmRejected = false;
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const { user, posts } = renderApp(
        "/app/chat/2",
        {},
        {
          extraHandlers: [
            http.post("*/api/assets/upload-url", () =>
              ok({
                assetId: 42,
                uploadUrl: "http://upload.test/42?X-Goog-Signature=secret-sig",
                expiresAt: "2026-11-18T23:59:59Z",
              }),
            ),
            http.put("http://upload.test/42", () =>
              new HttpResponse(null, { status: 200 }),
            ),
            http.post("*/api/assets/42/confirm", () => {
              confirmRejected = true;
              return HttpResponse.json(
                { isSuccess: false, code: "ASSET4001", message: "손상된 이미지" },
                { status: 400 },
              );
            }),
          ],
        },
      );

      expect(await screen.findByText("대화를 시작해보세요")).toBeInTheDocument();

      const fileInput = document.querySelector<HTMLInputElement>(
        'input[type="file"]',
      );
      if (!fileInput) throw new Error("파일 input 없음");
      await user.upload(
        fileInput,
        new File([new Uint8Array(128)], "photo.png", { type: "image/png" }),
      );
      await typeQuestion(user, "거부될 질문");
      await user.click(sendButton());

      await waitFor(() => expect(confirmRejected).toBe(true));
      expect(posts()).toHaveLength(0);
      expect(getInput().textContent).toBe("거부될 질문");
      expect(screen.getByAltText("photo.png")).toBeInTheDocument();

      const loggedText = errorSpy.mock.calls
        .map((args) => JSON.stringify(args))
        .join(" ");
      expect(loggedText).not.toContain("test-token");
      expect(loggedText).not.toContain("X-Goog-Signature");
    } finally {
      errorSpy.mockRestore();
    }
  });

  it("업로드 완료 전 다른 노트로 이동하면 늦게 끝난 confirm이 run을 보내지 않고, 업로드 중 입력·수식 필드는 잠긴다", async () => {
    vi.stubEnv("VITE_ENABLE_LOCAL_PHOTO_FALLBACK", "true");
    let releaseConfirm!: () => void;
    let resolveStarted!: () => void;
    const confirmStarted = new Promise<void>((resolve) => {
      resolveStarted = resolve;
    });
    let resolveConfirmHttpDone!: () => void;
    const confirmHttpDone = new Promise<void>((resolve) => {
      resolveConfirmHttpDone = resolve;
    });
    const onResponseMocked = ({ request }: { request: Request }) => {
      if (new URL(request.url).pathname.endsWith("/api/assets/42/confirm")) {
        queueMicrotask(resolveConfirmHttpDone);
      }
    };
    server.events.on("response:mocked", onResponseMocked);

    try {
      const { user, posts, router, queryClient } = renderApp(
        "/app/chat/2",
        {},
        {
          extraHandlers: [
            http.post("*/api/assets/upload-url", () =>
              ok({
                assetId: 42,
                uploadUrl: "http://upload.test/42",
                expiresAt: "2026-11-18T23:59:59Z",
              }),
            ),
            http.put("http://upload.test/42", () =>
              new HttpResponse(null, { status: 200 }),
            ),
            http.post("*/api/assets/42/confirm", async () => {
              resolveStarted();
              await new Promise<void>((resolveRelease) => {
                releaseConfirm = resolveRelease;
              });
              return ok({
                assetId: 42,
                noteId: 2,
                source: "upload",
                fileName: "photo.png",
                fileSize: 128,
                mimeType: "image/png",
                ocrStatus: "completed",
                createdAt: "2026-11-18T14:00:00Z",
              });
            }),
            http.get("*/api/notes/:noteId", ({ params }) =>
              ok({
                noteId: Number(params.noteId),
                title: params.noteId === "3" ? "노트 3" : "노트",
                assets: [],
              }),
            ),
            http.get("*/api/storage", () =>
              ok({ totalUsed: 0, limit: 1000000, notes: [] }),
            ),
          ],
        },
      );
      const refetchSpy = vi.spyOn(queryClient, "refetchQueries");
      expect(await screen.findByText("대화를 시작해보세요")).toBeInTheDocument();

      const fileInput = document.querySelector<HTMLInputElement>(
        'input[type="file"]',
      );
      if (!fileInput) throw new Error("파일 input 없음");
      await user.upload(
        fileInput,
        new File([new Uint8Array(128)], "photo.png", { type: "image/png" }),
      );
      const input = getInput();
      const mathField = document.createElement("math-field");
      mathField.setAttribute("id", "mf-lock-test");
      input.appendChild(mathField);
      await typeQuestion(user, "이동 전 질문");
      await user.click(sendButton());

      await confirmStarted;
      expect(document.querySelector('[contenteditable="false"]')).not.toBeNull();
      expect(fileInput).toBeDisabled();
      expect(mathField.getAttribute("read-only")).toBe("true");

      await act(async () => {
        await router.navigate("/app/chat/3");
      });
      expect(await screen.findByText("노트 3")).toBeInTheDocument();

      releaseConfirm();
      await confirmHttpDone;
      await waitFor(() => {
        expect(refetchSpy).toHaveBeenCalledTimes(2);
      });
      await act(async () => {
        await Promise.all(refetchSpy.mock.results.map((r) => r.value));
        await Promise.resolve();
      });
      await waitFor(() => {
        const currentFileInput = document.querySelector<HTMLInputElement>(
          'input[type="file"]',
        );
        expect(currentFileInput).toBeEnabled();
        expect(document.querySelector('[contenteditable="true"]')).not.toBeNull();
      });
      expect(router.state.location.pathname).toBe("/app/chat/3");
      expect(posts()).toHaveLength(0);
    } finally {
      server.events.removeListener("response:mocked", onResponseMocked);
    }
  });

  it("파일을 2개 이상 첨부한 질문은 보내지 않고 안내한다", async () => {
    const { user, posts } = renderApp("/app/chat/2");
    expect(await screen.findByText("대화를 시작해보세요")).toBeInTheDocument();

    const fileInput = document.querySelector<HTMLInputElement>(
      'input[type="file"]',
    );
    if (!fileInput) throw new Error("파일 input 없음");
    await user.upload(fileInput, [
      new File([new Uint8Array(64)], "a.png", { type: "image/png" }),
      new File([new Uint8Array(64)], "b.png", { type: "image/png" }),
    ]);
    await typeQuestion(user, "둘 다 풀어줘");
    await user.click(sendButton());

    expect(
      await screen.findByText(/#파일 멘션·@도구 선택은 아직 질문과 함께/),
    ).toBeInTheDocument();
    expect(posts()).toHaveLength(0);
  });
});
