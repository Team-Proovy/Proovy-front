export type ToastVariant = "error" | "success" | "info";

export interface ToastEventDetail {
  message: string;
  variant?: ToastVariant;
  duration?: number;
}

export const GLOBAL_TOAST_EVENT = "proovy:toast";

export const showToast = ({
  message,
  variant = "info",
  duration = 3000,
}: ToastEventDetail) => {
  window.dispatchEvent(
    new CustomEvent<ToastEventDetail>(GLOBAL_TOAST_EVENT, {
      detail: {
        message,
        variant,
        duration,
      },
    }),
  );
};

export const showErrorToast = (message: string, duration = 3000) => {
  showToast({ message, variant: "error", duration });
};

export const showSuccessToast = (message: string, duration = 3000) => {
  showToast({ message, variant: "success", duration });
};

export const showInfoToast = (message: string, duration = 3000) => {
  showToast({ message, variant: "info", duration });
};
