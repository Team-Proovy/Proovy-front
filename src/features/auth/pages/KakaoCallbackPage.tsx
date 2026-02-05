import { useNavigate, useSearchParams } from "react-router-dom";
import { loginWithKakao } from "../api/auth_api";
import { useAuthStore } from "../store/auth_store";
import { tokenUtils } from "@/shared/api/client";
import { AxiosError } from "axios";
import { useEffect, useRef, useState } from "react";
import { SocialCallbackLayout } from "../components/SocialCallbackLayout";

export const KakaoCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const initialized = useRef(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(() => {
    const code = searchParams.get("code");
    return code ? null : "로그인 코드가 없습니다.";
  });

  useEffect(() => {
    if (initialized.current) {
      return;
    }
    initialized.current = true;

    const code = searchParams.get("code");

    if (!code) {
      return;
    }

    const processLogin = async () => {
      // code logging removed for security
      tokenUtils.clearTokens();

      try {
        const data = await loginWithKakao(code);

        if (data.isSuccess) {
          const result = data.result;
          login(result);

          if (result.loginType === "LOGIN" && result.token) {
            tokenUtils.setTokens(
              result.token.accessToken,
              result.token.refreshToken,
            );
            navigate("/app/home");
          } else if (result.loginType === "SIGNUP_REQUIRED") {
            navigate("/signup", {
              state: {
                kakaoInfo: result.kakaoInfo,
                signupToken: result.signupToken,
              },
            });
          }
        } else {
          setErrorMsg(`로그인 실패: ${data.message}`);
        }
      } catch (error) {
        // Safe typing for error handling
        const axiosError = error as AxiosError<{
          message?: string;
          code?: string;
        }>;
        console.error("[KakaoCallback] 로그인 에러:", axiosError.message);

        if (axiosError.response) {
          const errorData = axiosError.response.data;
          const msg =
            errorData?.message ||
            errorData?.code ||
            "서버에서 오류가 발생했습니다.";
          setErrorMsg(`로그인 실패 (${axiosError.response.status}): ${msg}`);
        } else {
          setErrorMsg("로그인 처리 중 오류가 발생했습니다.");
        }
      }
    };

    processLogin();
  }, [searchParams, navigate, login]);

  return <SocialCallbackLayout errorMsg={errorMsg} />;
};
