import { getStroke } from "perfect-freehand";
import type { KonvaStage, StrokePoint } from "./canvas_types";

export const createId = () =>
  `canvas_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

export const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(value, max));

export const getPointerPressure = (evt: unknown): number => {
  if (evt && typeof evt === "object" && "pressure" in evt) {
    const pressure = Number((evt as { pressure: number }).pressure);
    if (Number.isFinite(pressure) && pressure >= 0 && pressure <= 1) {
      return clamp(pressure, 0.12, 1);
    }
  }
  return 0.62;
};

export const getStrokePolygon = (
  points: StrokePoint[],
  size: number,
  eraser: boolean,
): number[][] => {
  if (points.length === 0) return [];

  const normalizedPoints =
    points.length === 1
      ? [points[0], { ...points[0], x: points[0].x + 0.01 }]
      : points;
  // A single point needs this tiny x-offset so getStroke can emit a minimal
  // polygon; StrokeShape guards linePoints.length < 6 and renders DotShape instead.

  const options = eraser
    ? {
        size,
        thinning: 0.05,
        smoothing: 0.6,
        streamline: 0.4,
        simulatePressure: false,
        last: true,
      }
    : {
        size,
        thinning: 0.15,
        smoothing: 0.72,
        streamline: 0.38, // 너무 높으면 커밋 시 선이 수축해 보임
        simulatePressure: false,
        last: true,
      };

  return getStroke(
    normalizedPoints.map((p) => [p.x, p.y, p.pressure] as const),
    options,
  );
};

export const getScenePointFromStage = (
  stage: KonvaStage,
  pointer: { x: number; y: number },
) => {
  const scale = stage.scaleX() || 1;
  return {
    x: (pointer.x - stage.x()) / scale,
    y: (pointer.y - stage.y()) / scale,
  };
};

export const getTouchPoint = (stage: KonvaStage, touch: Touch) => {
  const rect = stage.container().getBoundingClientRect();
  return {
    x: touch.clientX - rect.left,
    y: touch.clientY - rect.top,
  };
};
