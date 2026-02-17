import { useEffect, useState } from "react";
import { Toast } from "./Toast";
import { GLOBAL_TOAST_EVENT, type ToastEventDetail } from "@/shared/lib/toast";

interface ToastState extends Required<ToastEventDetail> {
  id: number;
}

export const ToastHost = () => {
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    const handleToast = (event: Event) => {
      const customEvent = event as CustomEvent<ToastEventDetail>;
      if (!customEvent.detail?.message) return;

      const { message, variant = "info", duration = 3000 } = customEvent.detail;
      setToast({
        id: Date.now(),
        message,
        variant,
        duration,
      });
    };

    window.addEventListener(GLOBAL_TOAST_EVENT, handleToast);
    return () => {
      window.removeEventListener(GLOBAL_TOAST_EVENT, handleToast);
    };
  }, []);

  if (!toast) return null;

  return (
    <Toast
      key={toast.id}
      message={toast.message}
      variant={toast.variant}
      duration={toast.duration}
      onClose={() => setToast(null)}
    />
  );
};
