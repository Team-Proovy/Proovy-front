import { createBrowserRunMockServer } from "./browser_run_mock_server";

export { createBrowserRunMockServer } from "./browser_run_mock_server";
export type {
  BrowserRunMockServer,
  BrowserRunMockServerOptions,
  MockAdmissionRejection,
  MockConnectionFault,
  MockConnectionKind,
  MockRequestLog,
  MockRunSeed,
} from "./browser_run_mock_server";
export {
  getStreamTemplate,
  STREAM_TEMPLATE_NAMES,
} from "./browser_run_stream_templates";
export type {
  StreamTemplate,
  StreamTemplateName,
} from "./browser_run_stream_templates";

/** fixture 모드(브라우저 MSW)용 기본 server: frame을 400ms 간격으로 commit하고 15초 heartbeat를 보낸다. */
export const createBrowserRunFixtureServer = () =>
  createBrowserRunMockServer({ frameIntervalMs: 400, heartbeatMs: 15_000 });
