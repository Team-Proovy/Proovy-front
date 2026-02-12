import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { loginWithNaver } from "../api/auth_api";
import { AxiosError } from "axios";
import { useAuthStore } from "../store/auth_store";
import { tokenUtils } from "@/shared/api/client";
import { SocialCallbackLayout } from "../components/SocialCallbackLayout";

export const NaverCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const initialized = useRef(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    if (!code || !state) return "네이버 로그인 정보가 올바르지 않습니다.";

    const savedState = sessionStorage.getItem("naver_oauth_state");
    if (!savedState || savedState !== state) {
      sessionStorage.removeItem("naver_oauth_state");
      return "로그인 실패: state 값이 일치하지 않습니다. (CSRF 공격 방지)";
    }
    return null;
  });

  useEffect(() => {
    if (initialized.current) return;

    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code || !state) return;

    const savedState = sessionStorage.getItem("naver_oauth_state");
    if (!savedState || savedState !== state) return;

    initialized.current = true;
    sessionStorage.removeItem("naver_oauth_state");

    const processLogin = async () => {
      tokenUtils.clearTokens();
      try {
        const data = await loginWithNaver(code, state);

        if (data.isSuccess && data.result) {
          console.log("Naver login success, result:", data.result);
          login(data.result);

          if (data.result.loginType === "SIGNUP_REQUIRED") {
            console.log("Signup required, navigating to /signup");
            navigate("/signup", {
              state: {
                naverInfo: data.result.naverInfo,
                signupToken: data.result.signupToken,
              },
            });
          } else {
            console.log("Login complete, navigating to /app/home");
            navigate("/app/home");
          }
        } else {
          console.error("Naver login failed message:", data.message);
          setErrorMsg(`로그인 실패: ${data.message}`);
        }
      } catch (error) {
        const axiosError = error as AxiosError<{ message?: string }>;
        const msg =
          axiosError.response?.data?.message ||
          axiosError.message ||
          "서버에서 오류가 발생했습니다.";
        setErrorMsg(`로그인 실패 (${axiosError.response?.status}): ${msg}`);
      }
    };

    processLogin();
  }, [searchParams, navigate, login]);

  return <SocialCallbackLayout errorMsg={errorMsg} />;
};
