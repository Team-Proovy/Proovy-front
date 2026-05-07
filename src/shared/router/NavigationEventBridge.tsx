import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

type NavigationEventDetail = {
  route: string;
};

export function NavigationEventBridge() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleNavigate = (event: CustomEvent<NavigationEventDetail>) => {
      navigate(event.detail.route, { replace: true });
    };

    window.addEventListener("proovy:navigate", handleNavigate as EventListener);

    return () => {
      window.removeEventListener(
        "proovy:navigate",
        handleNavigate as EventListener,
      );
    };
  }, [navigate]);

  return null;
}
