import { useEffect, useState } from "react";

const remainingSeconds = (until: number, now: number) =>
  Math.max(0, Math.ceil((until - now) / 1000));

/**
 * 요청 한도(`Retry-After`)까지 남은 초. 시각이 없거나 지났으면 0이다.
 * 1초마다 다시 그리고 0이 되면 멈춘다.
 */
export const useRetryCountdown = (until: number | null | undefined) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (until == null) return;
    const tick = () => setNow(Date.now());
    const timer = setInterval(() => {
      tick();
      if (Date.now() >= until) clearInterval(timer);
    }, 1000);
    const first = setTimeout(tick, 0);
    return () => {
      clearInterval(timer);
      clearTimeout(first);
    };
  }, [until]);

  return until == null ? 0 : remainingSeconds(until, now);
};
