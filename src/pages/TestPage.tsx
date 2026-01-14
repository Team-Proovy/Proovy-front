import { useLocation } from "react-router-dom";
import { AppLayout } from "../shared/layout/AppLayout";

export function TestPage() {
  const location = useLocation();
  const initialInput = location.state?.initialInput || "";

  return (
    <AppLayout>
    <div className="flex h-screen w-full items-center justify-center bg-gray-50 p-10">
      <input
        type="text"
        defaultValue={initialInput}
        className="w-96 rounded-lg border border-gray-300 p-3 shadow-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      />
    </div>
    </AppLayout>
    
  );
}
