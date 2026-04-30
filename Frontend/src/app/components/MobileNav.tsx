import { useLocation, Link } from "react-router";
import { LayoutDashboard, Link as LinkIcon, User, LogOut } from "lucide-react";

interface MobileNavProps {
  onLogout: () => void;
}

const NAV_ITEMS = [
  { to: "/app", icon: LayoutDashboard, label: "Dashboard", key: "dashboard" },
  { to: "/app/links", icon: LinkIcon, label: "Links", key: "links" },
  {
    to: "/app/transactions",
    icon: () => (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    label: "Transfers",
    key: "transactions",
  },
  { to: "/app/account", icon: User, label: "Account", key: "account" },
];

// Position of the follow circle center for each tab (in %)
const POSITIONS = ["10%", "30%", "50%", "70%"];

export function MobileNav({ onLogout }: MobileNavProps) {
  const location = useLocation();

  // Determine active index
  const activeIndex = NAV_ITEMS.findIndex((item) => {
    if (item.to === "/app") return location.pathname === "/app";
    return location.pathname.startsWith(item.to);
  });

  const safeIndex = activeIndex === -1 ? 0 : activeIndex;

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40">
      <div
        className="relative h-[72px] transition-colors duration-300"
        style={{ background: "#e8f0fe" }}
      >
        <div className="absolute bottom-0 left-0 right-0 h-[54px] bg-white flex items-center shadow-[0_-2px_12px_rgba(0,0,0,0.08)]">
          {NAV_ITEMS.map((item, index) => {
            const isActive =
              item.to === "/app"
                ? location.pathname === "/app"
                : location.pathname.startsWith(item.to);
            const Icon = item.icon;

            return (
              <Link
                key={item.key}
                to={item.to}
                className="flex-1 flex flex-col items-center justify-center group"
                aria-label={item.label}
              >
                <span
                  className={`flex items-center justify-center transition-all duration-300 ${
                    isActive
                      ? "w-11 h-11 rounded-full bg-white shadow-lg text-indigo-600 -translate-y-[25px] z-100"
                      : "text-gray-400 group-hover:text-indigo-400"
                  }`}
                >
                  <Icon />
                </span>
                {!isActive && (
                  <span className="text-[10px] text-gray-400 group-hover:text-indigo-400 leading-none mt-0.5">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}

          <button
            onClick={onLogout}
            className="flex-1 flex flex-col items-center justify-center text-gray-400 hover:text-red-400 group"
            aria-label="Logout"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-[10px] leading-none mt-0.5">Logout</span>
          </button>

          <div
            className="absolute top-0 pointer-events-none transition-all duration-300"
            style={{
              left: `calc(${POSITIONS[safeIndex]} - 25px)`,
              transform: "translateX(0)",
            }}
          >
            <div
              className="w-[50px] h-[44px] rounded-full bg-indigo-50 border-[10px] border-[#e8f0fe] -mt-[18px]"
              style={{ boxShadow: "0 4px 12px rgba(99,102,241,0.15)" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
