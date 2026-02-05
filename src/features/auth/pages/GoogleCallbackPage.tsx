import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { loginWithGoogle } from "../api/auth_api";
import { AxiosError } from "axios";
import { useAuthStore } from "../store/auth_store";
import { tokenUtils } from "@/shared/api/client";
import { SocialCallbackLayout } from "../components/SocialCallbackLayout";

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
    // 이미 API 요청을 보냈다면 중단
    if (initialized.current) return;

    const code = searchParams.get("code");

    if (!code) {
      // 코드가 없으면 아직 처리하지 않음 (혹은 에러 표시 유지)
      return;
    }

    // 코드가 있으면 처리 시작 및 중복 방지 설정
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
            // 로그인 성공 시 홈으로 이동
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
