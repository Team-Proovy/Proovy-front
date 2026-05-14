import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { loginWithGoogle } from "@/features/auth/api/auth_api";
import { AxiosError } from "axios";
import { useAuthStore } from "@/features/auth/store/auth_store";
import { tokenUtils } from "@/shared/api/client";
import { SocialCallbackLayout } from "@/features/auth/components/SocialCallbackLayout";

export const GoogleCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const initialized = useRef(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(() => {
    const code = searchParams.get("code");
    return code ? null : "구글 로그인 정보(code)가 없습니다.";
  });

  useEffect(() => {
    if (initialized.current) return;

    const code = searchParams.get("code");

    if (!code) {
      return;
    }

    initialized.current = true;

    const processLogin = async () => {
      try {
        const data = await loginWithGoogle(code);

        if (data.isSuccess && data.result) {
          login(data.result);

          if (data.result.loginType === "SIGNUP_REQUIRED") {
            navigate("/signup", {
              state: {
                googleInfo: data.result.googleInfo,
                signupToken: data.result.signupToken,
              },
            });
          } else {
            if (data.result.token) {
              tokenUtils.setTokens(
                data.result.token.accessToken,
                data.result.token.refreshToken,
              );
              navigate("/app/home");
            } else {
              setErrorMsg("로그인 성공했으나 토큰이 없습니다.");
            }
          }
        } else {
          setErrorMsg(`로그인 실패: ${data.message}`);
        }
      } catch (error) {
        const axiosError = error as AxiosError<{ message?: string }>;
        const msg =
          axiosError.response?.data?.message ||
          axiosError.message ||
          "로그인 처리 중 오류가 발생했습니다.";
        setErrorMsg(
          `오류 발생: ${msg} (Status: ${axiosError.response?.status})`,
        );
      }
    };

    processLogin();
  }, [searchParams, navigate, login]);

  return <SocialCallbackLayout errorMsg={errorMsg} />;
};
