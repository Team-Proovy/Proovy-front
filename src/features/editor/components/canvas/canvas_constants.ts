export const TOOL_BUTTON_BASE =
  "rounded-md border px-2 py-1 text-xs font-medium transition-colors";

// Viewport zoom constraints
export const MIN_SCALE = 0.35;
export const MAX_SCALE = 4;
export const ZOOM_FACTOR = 1.08;

// ↓ 이 값들을 조정하면 필기감·지우개 크기가 변합니다
export const DEFAULT_PEN_SIZE = 5.8;
export const DEFAULT_ERASER_SIZE = 22;
export const MIN_PEN_SIZE = 2;
export const MAX_PEN_SIZE = 14;
export const MIN_ERASER_SIZE = 8;
export const MAX_ERASER_SIZE = 44;

// 이 값보다 짧은 거리의 포인트는 병합됩니다 (낮을수록 곡선이 부드럽지만 연산량 증가)
export const MIN_POINT_DISTANCE = 2.0;
