import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { loginWithKakao } from "../api/auth_api";
import { useAuthStore } from "../store/auth_store";
import { tokenUtils } from "@/shared/api/client";

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
      console.log("[KakaoCallback] 로그인 시도 - code:", code);
      
      // 기존 토큰 클리어 (새 로그인 시도이므로)
      tokenUtils.clearTokens();
      
      try {
        const data = await loginWithKakao(code);
        console.log("[KakaoCallback] 응답:", data);

        if (data.isSuccess) {
          const result = data.result;
          login(result);

          // 기존 회원 (LOGIN) - 토큰 저장 후 홈으로 이동
          if (result.loginType === "LOGIN" && result.token) {
            tokenUtils.setTokens(result.token.accessToken, result.token.refreshToken);
            navigate("/app/home");
          } 
          // 신규 회원 (SIGNUP_REQUIRED) - 회원가입 페이지로 이동
          else if (result.loginType === "SIGNUP_REQUIRED") {
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
      } catch (error: any) {
        console.error("[KakaoCallback] 에러 발생:", error);
        console.error("[KakaoCallback] 에러 응답:", error.response?.data);
        
        if (error.response) {
          const errorData = error.response.data;
          alert(
            `로그인 실패 (${error.response.status}): ${errorData?.message || errorData?.code || "서버에서 오류가 발생했습니다."}`,
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
