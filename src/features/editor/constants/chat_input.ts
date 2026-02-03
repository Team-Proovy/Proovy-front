/**
 * ChatInput 컴포넌트 상수
 */

// Fixed style classes based on Figma design
// W: 100% (max 660px, min 270px), Min-H: 160px, Border, Shadow etc.
export const CHAT_INPUT_CLASSES =
  "w-full min-w-[270px] max-w-[660px] min-h-[160px] max-h-[270px] shrink-0 rounded-[12px] border-[0.5px] border-[#D1D6DE] bg-[rgba(255,255,255,0.40)] shadow-[4px_4px_20px_0px_rgba(0,0,0,0.05)] flex flex-col gap-[10px] p-[20px] relative";

// MathLive keyboard container styles
export const MATH_KEYBOARD_CONTAINER_STYLES = `
  position: fixed;
  z-index: 9999;
  display: none;
  width: 660px;
`;

// Canvas image styles
export const CANVAS_IMAGE_STYLES =
  "max-width: 200px; max-height: 150px; border-radius: 8px; margin: 4px 0;";
