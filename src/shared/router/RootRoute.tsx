import { Outlet } from "react-router-dom";
import { NavigationEventBridge } from "./NavigationEventBridge";

export function RootRoute() {
  return (
    <>
      <NavigationEventBridge />
      <Outlet />
    </>
  );
}
