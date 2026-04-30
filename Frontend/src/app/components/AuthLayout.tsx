import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router";
import { isAuthenticated } from "../api";

export function AuthLayout() {
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/app", { replace: true });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Outlet />
    </div>
  );
}
