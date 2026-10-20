/**
 * terminal 없이 끊긴 연결의 재접속 지연 (browser-run-sse "브라우저(S08) 사용 메모": 지수 backoff).
 *
 * 수치 근거
 * - 초기 1초: 끊김 대부분(네트워크 순간 단절·30분 최대 유지 시간 종료)은 곧바로 다시 붙어도 되지만,
 *   같은 seq에서 서버 복원 오류가 반복되면 즉시 재접속은 루프가 된다. 그래서 첫 재시도에도 지연을 둔다.
 * - 배수 2·최대 30초: 서버 재시작·배포(수십 초)를 넘길 만큼 늘리되, 복구 뒤 사용자가 30초 넘게 기다리지 않게 한다.
 *   서버 catch-up 주기(5초)·heartbeat(15초)보다 길어 같은 실패를 짧은 간격으로 두드리지 않는다.
 * - equal jitter(기본 지연의 절반 + 0..절반 난수): 서버 재시작 뒤 여러 탭·사용자가 같은 순간에 몰리지 않게 흩되,
 *   지연이 0에 가까워지지 않아 "반복 오류에서 지연이 늘어난다"가 항상 성립한다.
 * - 상한 8회: 진행(새 frame) 없이 연속 8번 실패하면(기본 지연 합 1+2+4+8+16+30+30+30 ≈ 2분) 멈추고 알린다.
 *   진행이 있던 연결 뒤에는 횟수를 처음부터 센다. 사용자가 다시 시도하면(`reconnect()`) 처음부터 센다.
 */
export interface ReconnectBackoff {
  initialDelayMs: number;
  maxDelayMs: number;
  multiplier: number;
  /** 진행 없이 연속 실패할 수 있는 횟수. 넘으면 재접속을 멈춘다. */
  maxAttempts: number;
}

export const RECONNECT_BACKOFF: ReconnectBackoff = {
  initialDelayMs: 1_000,
  maxDelayMs: 30_000,
  multiplier: 2,
  maxAttempts: 8,
};

/** jitter 전 기본 지연. `attempt`는 1부터(첫 재시도 = 1). */
export const baseReconnectDelay = (
  attempt: number,
  backoff: ReconnectBackoff = RECONNECT_BACKOFF,
) =>
  Math.min(
    backoff.maxDelayMs,
    backoff.initialDelayMs * backoff.multiplier ** (attempt - 1),
  );

/** equal jitter: `[base/2, base]`. `random`은 `[0, 1)` (테스트에서 고정한다). */
export const reconnectDelay = (
  attempt: number,
  random: () => number = Math.random,
  backoff: ReconnectBackoff = RECONNECT_BACKOFF,
) => {
  const base = baseReconnectDelay(attempt, backoff);
  return Math.round(base / 2 + (base / 2) * random());
};
