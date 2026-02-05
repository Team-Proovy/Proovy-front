import { useNavigate, useSearchParams } from "react-router-dom";
import { loginWithKakao } from "../api/auth_api";
import { useAuthStore } from "../store/auth_store";
import { tokenUtils } from "@/shared/api/client";
import { AxiosError } from "axios";
import { useEffect, useRef } from "react";

export const KakaoCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) {
      console.log("KaKaoCallback: Already initialized, skipping.");
      return;
    }
    initialized.current = true;

    const code = searchParams.get("code");

    if (!code) {
      alert("로그인 코드가 없습니다.");
      navigate("/login");
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
          alert(`로그인 실패: ${data.message}`);
          navigate("/login");
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
          alert(
            `로그인 실패 (${axiosError.response.status}): ${
              errorData?.message ||
              errorData?.code ||
              "서버에서 오류가 발생했습니다."
            }`,
          );
        } else {
          alert("로그인 처리 중 오류가 발생했습니다.");
        }
        navigate("/login");
      }
    };

    processLogin();
  }, [searchParams, navigate, login]);

  return (
    <div className="flex h-screen items-center justify-center">
      <p>로그인 처리 중...</p>
    </div>
  );
};
