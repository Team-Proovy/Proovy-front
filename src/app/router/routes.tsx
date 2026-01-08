import { createBrowserRouter } from "react-router-dom";
import HomePage from "../../pages/home_page";
import { LoginPage } from "../../pages/LoginPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
]);
