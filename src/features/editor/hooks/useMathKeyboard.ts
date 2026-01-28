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
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - rect.bottom;
    const keyboardHeight = 220;

    const kbdContainer = keyboardContainerRef.current;

    // Position horizontally aligned with input
    kbdContainer.style.left = `${rect.left}px`;
    kbdContainer.style.width = "660px";

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
