import { describe, expect, it } from "vitest";
import {
  baseReconnectDelay,
  RECONNECT_BACKOFF,
  reconnectDelay,
} from "./reconnect_backoff";

describe("reconnect backoff", () => {
  it("기본 지연은 1초에서 두 배씩 늘어 30초에서 멈춘다", () => {
    expect(
      Array.from({ length: RECONNECT_BACKOFF.maxAttempts }, (_, index) =>
        baseReconnectDelay(index + 1),
      ),
    ).toEqual([1_000, 2_000, 4_000, 8_000, 16_000, 30_000, 30_000, 30_000]);
  });

  it("equal jitter: 기본 지연의 절반 이상·이하 범위이고 0에 가깝지 않다", () => {
    for (let attempt = 1; attempt <= 10; attempt += 1) {
      const base = baseReconnectDelay(attempt);
      expect(reconnectDelay(attempt, () => 0)).toBe(base / 2);
      expect(reconnectDelay(attempt, () => 0.999999)).toBeLessThanOrEqual(base);
      expect(reconnectDelay(attempt, () => 0.999999)).toBeGreaterThan(
        base * 0.99,
      );
    }
  });

  it("상한 전에는 jitter 최악값으로도 다음 시도의 지연이 앞 시도의 최대 지연보다 짧지 않다", () => {
    // 상한(30초)에 닿기 전까지: 다음 최소(2·base/2 = base) ≥ 이전 최대(base)
    for (let attempt = 1; attempt < 5; attempt += 1)
      expect(reconnectDelay(attempt + 1, () => 0)).toBeGreaterThanOrEqual(
        reconnectDelay(attempt, () => 0.999999),
      );
  });
});
