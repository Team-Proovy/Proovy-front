import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { loginWithKakao } from "../api/auth_api";
import { useAuthStore } from "../store/auth_store";

export const KakaoCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  // React Strict Mode에서 두 번 호출 방지
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const code = searchParams.get("code");

    if (!code) {
      alert("로그인 코드가 없습니다.");
      navigate("/login");
      return;
    }

    const processLogin = async () => {
      try {
        const data = await loginWithKakao(code);

        if (data.isSuccess) {
          login(data.result);
          // 회원가입 정보 입력 페이지로 이동 (정보 전달)
          navigate("/signup", {
            state: {
              kakaoInfo: data.result.kakaoInfo,
            },
          });
        } else {
          alert(`로그인 실패: ${data.message}`);
          navigate("/login");
        }
      } catch (error) {
        console.error("Login Error:", error);
        alert("로그인 처리 중 오류가 발생했습니다.");
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
