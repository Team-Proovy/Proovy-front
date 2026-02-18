import "axios";

declare module "axios" {
  interface AxiosRequestConfig {
    skipErrorRedirect?: boolean;
    meta?: {
      suppressRedirect?: boolean;
      [key: string]: unknown;
    };
  }
}
