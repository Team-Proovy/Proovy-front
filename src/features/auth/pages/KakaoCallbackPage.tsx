import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { loginWithKakao } from "../api/auth_api";
import { useAuthStore } from "../store/auth_store";

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
      try {
        const data = await loginWithKakao(code);

        if (data.isSuccess) {
          login(data.result);
          navigate("/signup", {
            state: { kakaoInfo: data.result.kakaoInfo },
          });
        } else {
          alert(`로그인 실패: ${data.message}`);
          navigate("/login");
        }
      } catch (error: any) {
        if (error.response) {
          alert(
            `로그인 실패 (${error.response.status}): ${error.response.data?.message || "서버에서 오류가 발생했습니다."}`,
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
