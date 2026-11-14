import { createBrowserRunMockServer } from "./browser_run_mock_server";
import { FIXTURE_MODE_TEMPLATE_ROTATION } from "./browser_run_stream_templates";

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
  FIXTURE_MODE_TEMPLATE_ROTATION,
  getStreamTemplate,
  STREAM_TEMPLATE_NAMES,
} from "./browser_run_stream_templates";
export type {
  StreamTemplate,
  StreamTemplateName,
} from "./browser_run_stream_templates";

/**
 * fixture 모드(브라우저 MSW)용 기본 server: frame을 400ms 간격으로 commit하고 15초 heartbeat를 보낸다.
 * 새 run은 v1.1 template(객관식·단답형·검증 대상 아님·재설명)을 차례로 돈다.
 */
export const createBrowserRunFixtureServer = () =>
  createBrowserRunMockServer({
    frameIntervalMs: 400,
    heartbeatMs: 15_000,
    templateRotation: FIXTURE_MODE_TEMPLATE_ROTATION,
  });
