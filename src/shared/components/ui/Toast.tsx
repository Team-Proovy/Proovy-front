import { useEffect, useRef, useState } from "react";
import type { ToastVariant } from "@/shared/lib/toast";
import { cn } from "@/shared/lib/utils";

interface ToastProps {
  message: string;
  onClose?: () => void;
  variant?: ToastVariant;
  duration?: number;
  className?: string;
}

const TOAST_EXIT_DURATION_MS = 200;

export const Toast = ({
  message,
  onClose,
  variant = "info",
  duration = 3000,
  className,
}: ToastProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const onCloseRef = useRef(onClose);

  onCloseRef.current = onClose;

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setIsVisible(true);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [message]);

  useEffect(() => {
    const hideTimer = window.setTimeout(() => {
      setIsVisible(false);
    }, duration);

    const closeTimer = window.setTimeout(() => {
      onCloseRef.current?.();
    }, duration + TOAST_EXIT_DURATION_MS);

    return () => {
      window.clearTimeout(hideTimer);
      window.clearTimeout(closeTimer);
    };
  }, [duration, message]);

  const variantClassName = {
    error: "border-red-200 bg-red-50 text-red-700",
    success: "border-green-200 bg-green-50 text-green-700",
    info: "border-[#D1D6DE] bg-white text-[#1F2937]",
  }[variant];

  return (
    <div className="pointer-events-none fixed top-5 right-7 z-[10010] max-w-[660px] px-4">
      <div
        className={cn(
          "pointer-events-auto flex items-center justify-between gap-3 rounded-[12px] border p-5 shadow-sm transition-all duration-200",
          isVisible ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0",
          variantClassName,
          className,
        )}
        role="alert"
      >
        <span className="text-lg leading-5 font-medium">{message}</span>
      </div>
    </div>
  );
};
