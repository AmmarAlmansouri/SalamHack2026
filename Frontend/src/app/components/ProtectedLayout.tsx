import { useEffect, useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { LayoutDashboard, User, LogOut, Link as LinkIcon } from "lucide-react";
import { isAuthenticated, logout } from "../api";

export function ProtectedLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  if (!isAuthenticated()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
  <img src="/logo.png" alt="Barq Transfer" className="h-8 w-auto md:h-18 lg:h-24" />
</div>

              <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
                <Link
                  to="/app"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 ${
                    isActive("/app") && location.pathname === "/app"
                      ? "border-indigo-500 text-gray-900"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </Link>
                <Link
                  to="/app/links"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 ${
                    isActive("/app/links")
                      ? "border-indigo-500 text-gray-900"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  }`}
                >
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Links
                </Link>
                <Link
                  to="/app/transactions"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 ${
                    isActive("/app/transactions")
                      ? "border-indigo-500 text-gray-900"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  }`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Transactions
                </Link>
                <Link
                  to="/app/account"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 ${
                    isActive("/app/account")
                      ? "border-indigo-500 text-gray-900"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  }`}
                >
                  <User className="w-4 h-4 mr-2" />
                  Account
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => setShowLogoutModal(true)}
                className="inline-flex items-center px-3 py-2 text-sm text-gray-700 hover:text-gray-900"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main>
        <Outlet />
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowLogoutModal(false)}
          />
          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4 flex flex-col items-center gap-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-100 mb-2">
              <LogOut className="w-7 h-7 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 text-center">Log out?</h2>
            <p className="text-sm text-gray-500 text-center">
              Are you sure you want to log out?
            </p>
            <div className="flex gap-3 w-full mt-2">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2 px-4 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-2 px-4 rounded-lg text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
