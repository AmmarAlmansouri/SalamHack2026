import { Outlet, Link, useLocation } from "react-router";
import { LayoutDashboard, User, LogOut, Link as LinkIcon } from "lucide-react";

export function ProtectedLayout() {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-indigo-600">Barq Transfer</h1>
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
              <Link
                to="/"
                className="inline-flex items-center px-3 py-2 text-sm text-gray-700 hover:text-gray-900"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
