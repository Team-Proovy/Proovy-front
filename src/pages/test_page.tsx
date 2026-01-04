import { AppLayout } from "../shared/layout/app_layout";

export default function TestPage() {
  return (
    <AppLayout>
      <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-100">
        <div className="rounded-xl bg-white p-10 shadow-xl">
          <h1 className="mb-4 text-4xl font-bold text-indigo-600">
            노트목록 임시 페이지 🚀
          </h1>
          <p className="text-lg text-slate-600">
            Tailwind CSS v4 & Router Setup Complete!
          </p>
          <div className="mt-6 flex gap-3">
            <span className="rounded-full bg-indigo-100 px-4 py-1 text-sm font-semibold text-indigo-600">
              #React
            </span>
            <span className="rounded-full bg-blue-100 px-4 py-1 text-sm font-semibold text-blue-600">
              #TypeScript
            </span>
            <span className="rounded-full bg-teal-100 px-4 py-1 text-sm font-semibold text-teal-600">
              #Tailwind
            </span>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
