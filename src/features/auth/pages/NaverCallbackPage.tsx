import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { loginWithNaver } from "../api/auth_api";
import { AxiosError } from "axios";
import { useAuthStore } from "../store/auth_store";

export const NaverCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code || !state) {
      alert("네이버 로그인 정보가 올바르지 않습니다.");
      navigate("/login");
      return;
    }

    const processLogin = async () => {
      try {
        const data = await loginWithNaver(code, state);

        if (data.isSuccess && data.result) {
          login(data.result);

          if (data.result.loginType === "SIGNUP_REQUIRED") {
            navigate("/signup", {
              state: {
                naverInfo: data.result.naverInfo,
                signupToken: data.result.signupToken,
              },
            });
          } else {
            navigate("/");
          }
        } else {
          alert(`로그인 실패: ${data.message}`);
          navigate("/login");
        }
      } catch (error) {
        const axiosError = error as AxiosError<{ message?: string }>;

        if (axiosError.response) {
          alert(
            `로그인 실패 (${axiosError.response.status}): ${
              axiosError.response.data?.message ||
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
    <div className="flex h-screen items-center justify-center bg-white">
      <div className="text-center">
        <h2 className="mb-4 text-xl font-bold text-gray-800">
          네이버 로그인 처리 중...
        </h2>
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-green-500"></div>
      </div>
    </div>
  );
};
