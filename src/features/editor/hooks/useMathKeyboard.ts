import { useRef, useEffect, useCallback, useState } from "react";

interface UseMathKeyboardOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
}

interface UseMathKeyboardReturn {
  isMathOpen: boolean;
  keyboardContainerRef: React.RefObject<HTMLDivElement | null>;
  handleMathToggle: () => void;
  positionKeyboardContainer: () => void;
}

/**
 * MathLive 가상 키보드 관리 훅
 * - 키보드 컨테이너 생성 및 위치 계산
 * - show/hide 토글
 * - 스크롤/리사이즈 시 위치 업데이트
 */
export const useMathKeyboard = ({
  containerRef,
}: UseMathKeyboardOptions): UseMathKeyboardReturn => {
  const [isMathOpen, setIsMathOpen] = useState(false);
  const keyboardContainerRef = useRef<HTMLDivElement | null>(null);

  // Position the keyboard container relative to the input
  const positionKeyboardContainer = useCallback(() => {
    if (!containerRef.current || !keyboardContainerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - rect.bottom;
    const keyboardHeight = 220;
    const keyboardWidth = 660;
    const margin = 16; // 화면 가장자리 여백

    const kbdContainer = keyboardContainerRef.current;

    // 수평 위치 계산 - 화면을 넘어가지 않도록 조정
    let left = rect.left;
    if (left + keyboardWidth > viewportWidth - margin) {
      left = viewportWidth - keyboardWidth - margin;
    }
    if (left < margin) {
      left = margin;
    }

    kbdContainer.style.left = `${left}px`;
    kbdContainer.style.width = `${keyboardWidth}px`;

    if (spaceBelow >= keyboardHeight + 16) {
      // Show below input
      kbdContainer.style.top = `${rect.bottom + 8}px`;
      kbdContainer.style.bottom = "auto";
    } else {
      // Show above input
      kbdContainer.style.top = "auto";
      kbdContainer.style.bottom = `${viewportHeight - rect.top + 8}px`;
    }
  }, [containerRef]);

  // Setup keyboard container and attach virtual keyboard to it
  useEffect(() => {
    // Create keyboard container if it doesn't exist
    let kbdContainer = document.getElementById(
      "math-keyboard-container",
    ) as HTMLDivElement | null;

    if (!kbdContainer) {
      kbdContainer = document.createElement("div");
      kbdContainer.id = "math-keyboard-container";
      kbdContainer.style.cssText = `
        position: fixed;
        z-index: 9999;
        display: none;
        width: 660px;
      `;
      document.body.appendChild(kbdContainer);
    }

    keyboardContainerRef.current = kbdContainer;

    // Set the container for the virtual keyboard
    if (window.mathVirtualKeyboard) {
      window.mathVirtualKeyboard.container = kbdContainer;
    }

    return () => {
      // Hide keyboard when component unmounts (e.g., page navigation)
      if (window.mathVirtualKeyboard?.visible) {
        window.mathVirtualKeyboard.hide();
      }
      // Hide the container as well
      if (kbdContainer) {
        kbdContainer.style.display = "none";
      }
    };
  }, []);

  // Handle keyboard visibility and positioning
  useEffect(() => {
    const handleGeometryChange = () => {
      const kbdContainer = keyboardContainerRef.current;
      if (!kbdContainer) return;

      // Prevent MathLive from adding padding to body
      document.body.style.paddingBottom = "";

      // Update container height based on keyboard height
      if (window.mathVirtualKeyboard?.visible) {
        const height = window.mathVirtualKeyboard.boundingRect.height;
        kbdContainer.style.height = `${height}px`;
        kbdContainer.style.display = "block";
        positionKeyboardContainer();
      }
    };

    const handleKeyboardToggle = () => {
      const kbdContainer = keyboardContainerRef.current;
      if (!kbdContainer) return;

      if (window.mathVirtualKeyboard?.visible) {
        kbdContainer.style.display = "block";
        positionKeyboardContainer();
        setIsMathOpen(true);
      } else {
        kbdContainer.style.display = "none";
        setIsMathOpen(false);
      }
    };

    // 바깥 영역 클릭 시 키보드 닫기
    const handleClickOutside = (e: MouseEvent) => {
      const kbdContainer = keyboardContainerRef.current;
      if (!kbdContainer) return;

      // 키보드가 열려있고, 클릭한 위치가 키보드 컨테이너 외부인 경우
      if (
        window.mathVirtualKeyboard?.visible &&
        !kbdContainer.contains(e.target as Node)
      ) {
        // 수식 입력기 토글 버튼 클릭은 제외 (handleMathToggle에서 처리)
        const target = e.target as HTMLElement;
        if (target.closest('[title="수식 입력기"]')) {
          return;
        }
        window.mathVirtualKeyboard.hide();
      }
    };

    if (window.mathVirtualKeyboard) {
      window.mathVirtualKeyboard.addEventListener(
        "geometrychange",
        handleGeometryChange,
      );
      window.mathVirtualKeyboard.addEventListener(
        "virtual-keyboard-toggle",
        handleKeyboardToggle,
      );
    }

    // Update keyboard position on scroll and resize
    const handleScrollOrResize = () => {
      if (window.mathVirtualKeyboard?.visible) {
        positionKeyboardContainer();
      }
    };

    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      if (window.mathVirtualKeyboard) {
        window.mathVirtualKeyboard.removeEventListener(
          "geometrychange",
          handleGeometryChange,
        );
        window.mathVirtualKeyboard.removeEventListener(
          "virtual-keyboard-toggle",
          handleKeyboardToggle,
        );
      }
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [positionKeyboardContainer]);

  // Toggle Math keyboard visibility
  const handleMathToggle = useCallback(() => {
    if (window.mathVirtualKeyboard) {
      if (window.mathVirtualKeyboard.visible) {
        window.mathVirtualKeyboard.hide();
      } else {
        window.mathVirtualKeyboard.show();
      }
    }
  }, []);

  return {
    isMathOpen,
    keyboardContainerRef,
    handleMathToggle,
    positionKeyboardContainer,
  };
};
