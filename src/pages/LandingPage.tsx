/**
 * LandingPage - 마케팅 랜딩 페이지
 *
 * URL: /
 * 인증: 불필요
 *
 * 기능:
 * - Proovy 서비스 소개
 * - 로그인/회원가입 CTA
 */

import { Link } from "react-router-dom";

export const LandingPage = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white">
      {/*임시 페이지*/}
      <h1 className="mb-6 text-5xl font-medium text-gray-900">
        임시 랜딩 페이지
      </h1>

      {/* 로고 */}
      <h1 className="mb-6 text-5xl font-bold text-gray-900">Proovy</h1>

      {/* 서브 타이틀 */}
      <p className="mb-10 text-lg text-gray-600">AI 기반 학습 도우미</p>

      {/* CTA 버튼 */}
      <div className="flex gap-4">
        <Link
          to="/login"
          className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
        >
          로그인
        </Link>
        <Link
          to="/login"
          className="rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 hover:bg-gray-50"
        >
          시작하기
        </Link>
      </div>
    </div>
  );
};
