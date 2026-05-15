import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import type { KonvaEvent, PinchState, ViewportState } from "./canvas_types";
import { clamp, getTouchPoint } from "./canvas_utils";
import { MAX_SCALE, MIN_SCALE, ZOOM_FACTOR } from "./canvas_constants";

interface UseCanvasViewportOptions {
  containerRef: RefObject<HTMLDivElement | null>;
}

export interface UseCanvasViewportReturn {
  stageSize: { width: number; height: number };
  viewport: ViewportState;
  viewportRef: RefObject<ViewportState>;
  applyZoomAt: (
    screenPoint: { x: number; y: number },
    nextScale: number,
  ) => void;
  updateViewportPosition: (x: number, y: number) => void;
  resetView: () => void;
  handleWheel: (event: KonvaEvent<WheelEvent>) => void;
  startPinch: (event: KonvaEvent<TouchEvent>) => void;
  movePinch: (event: KonvaEvent<TouchEvent>) => void;
  endPinch: () => void;
}

export const useCanvasViewport = ({
  containerRef,
}: UseCanvasViewportOptions): UseCanvasViewportReturn => {
  const [stageSize, setStageSize] = useState({ width: 1, height: 1 });
  const [viewport, setViewport] = useState<ViewportState>({
    x: 0,
    y: 0,
    scale: 1,
  });
  const viewportRef = useRef<ViewportState>(viewport);
  const pinchStateRef = useRef<PinchState | null>(null);

  useEffect(() => {
    viewportRef.current = viewport;
  }, [viewport]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      setStageSize({
        width: Math.max(1, container.clientWidth),
        height: Math.max(1, container.clientHeight),
      });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    return () => observer.disconnect();
  }, [containerRef]);

  const applyZoomAt = useCallback(
    (screenPoint: { x: number; y: number }, nextScale: number) => {
      setViewport((prev) => {
        const clampedScale = clamp(nextScale, MIN_SCALE, MAX_SCALE);
        const sceneX = (screenPoint.x - prev.x) / prev.scale;
        const sceneY = (screenPoint.y - prev.y) / prev.scale;
        return {
          x: screenPoint.x - sceneX * clampedScale,
          y: screenPoint.y - sceneY * clampedScale,
          scale: clampedScale,
        };
      });
    },
    [],
  );

  const updateViewportPosition = useCallback((x: number, y: number) => {
    setViewport((prev) => ({ ...prev, x, y }));
  }, []);

  const resetView = useCallback(() => {
    setViewport({ x: 0, y: 0, scale: 1 });
  }, []);

  const handleWheel = useCallback(
    (event: KonvaEvent<WheelEvent>) => {
      event.evt.preventDefault();
      const stage = event.target.getStage();
      if (!stage) return;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      const isZoomIn = event.evt.deltaY < 0;
      const nextScale =
        viewportRef.current.scale * (isZoomIn ? ZOOM_FACTOR : 1 / ZOOM_FACTOR);
      applyZoomAt(pointer, nextScale);
    },
    [applyZoomAt],
  );

  const startPinch = useCallback((event: KonvaEvent<TouchEvent>) => {
    const stage = event.target.getStage();
    if (!stage) return;
    const touches = event.evt.touches;
    if (touches.length !== 2) return;

    if (event.evt.cancelable) event.evt.preventDefault();

    const pointA = getTouchPoint(stage, touches[0]);
    const pointB = getTouchPoint(stage, touches[1]);
    const center = {
      x: (pointA.x + pointB.x) / 2,
      y: (pointA.y + pointB.y) / 2,
    };
    const distance = Math.hypot(pointB.x - pointA.x, pointB.y - pointA.y);
    const currentViewport = viewportRef.current;

    pinchStateRef.current = {
      startDistance: distance,
      scenePoint: {
        x: (center.x - currentViewport.x) / currentViewport.scale,
        y: (center.y - currentViewport.y) / currentViewport.scale,
      },
    };
  }, []);

  const movePinch = useCallback((event: KonvaEvent<TouchEvent>) => {
    const stage = event.target.getStage();
    if (!stage) return;
    const touches = event.evt.touches;
    const pinchState = pinchStateRef.current;
    if (touches.length !== 2 || !pinchState) return;

    if (event.evt.cancelable) event.evt.preventDefault();

    const pointA = getTouchPoint(stage, touches[0]);
    const pointB = getTouchPoint(stage, touches[1]);
    const center = {
      x: (pointA.x + pointB.x) / 2,
      y: (pointA.y + pointB.y) / 2,
    };
    const distance = Math.hypot(pointB.x - pointA.x, pointB.y - pointA.y);
    if (pinchState.startDistance < 1) return;
    const ratio = distance / pinchState.startDistance;
    const nextScale = clamp(
      viewportRef.current.scale * ratio,
      MIN_SCALE,
      MAX_SCALE,
    );

    setViewport(() => ({
      x: center.x - pinchState.scenePoint.x * nextScale,
      y: center.y - pinchState.scenePoint.y * nextScale,
      scale: nextScale,
    }));

    pinchStateRef.current = {
      startDistance: distance,
      scenePoint: pinchState.scenePoint,
    };
  }, []);

  const endPinch = useCallback(() => {
    pinchStateRef.current = null;
  }, []);

  return {
    stageSize,
    viewport,
    viewportRef,
    applyZoomAt,
    updateViewportPosition,
    resetView,
    handleWheel,
    startPinch,
    movePinch,
    endPinch,
  };
};
