import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface ToastProps {
  message: string;
  onClose?: () => void;
  variant?: "error" | "success" | "info";
  autoClose?: boolean;
  duration?: number;
  showCloseButton?: boolean;
  className?: string;
}

const TOAST_EXIT_DURATION_MS = 300;

export const Toast = ({
  message,
  onClose,
  variant = "info",
  autoClose = false,
  duration = 3000,
  showCloseButton = true,
  className,
}: ToastProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setIsVisible(true);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [message]);

  useEffect(() => {
    if (!autoClose || !onClose) return;

    const hideTimer = window.setTimeout(() => {
      setIsVisible(false);
    }, duration);

    const closeTimer = window.setTimeout(() => {
      onClose();
    }, duration + TOAST_EXIT_DURATION_MS);

    return () => {
      window.clearTimeout(hideTimer);
      window.clearTimeout(closeTimer);
    };
  }, [autoClose, duration, onClose, message]);

  const handleClose = () => {
    if (!onClose) return;

    setIsVisible(false);
    window.setTimeout(() => {
      onClose();
    }, TOAST_EXIT_DURATION_MS);
  };

  const variantClassName = {
    error: "border-red-200 bg-red-50 text-red-700",
    success: "border-green-200 bg-green-50 text-green-700",
    info: "border-[#D1D6DE] bg-white text-[#1F2937]",
  }[variant];

  return (
    <div className="pointer-events-none fixed top-4 right-4 z-50 w-full max-w-[420px] px-4">
      <div
        className={cn(
          "pointer-events-auto flex items-center justify-between gap-3 rounded-[12px] border px-4 py-3 shadow-sm transition-all duration-300",
          isVisible ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0",
          variantClassName,
          className,
        )}
        role="alert"
      >
        <span className="text-sm leading-5 font-medium">{message}</span>
        {onClose && showCloseButton && (
          <button
            type="button"
            onClick={handleClose}
            className="shrink-0 rounded-md p-1 opacity-80 transition-opacity hover:opacity-100"
            aria-label="토스트 닫기"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
};
