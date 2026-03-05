import { useLocation, useNavigate } from "react-router-dom";
import { Home, Wrench, ShoppingCart, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/service", label: "Services", icon: Wrench },
  { path: "/sales", label: "Sales", icon: ShoppingCart },
  { path: "/reports", label: "Reports", icon: BarChart3 },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-nav-border bg-nav pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around px-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2.5 px-3 touch-target transition-colors",
                isActive ? "text-nav-active" : "text-nav-inactive"
              )}
            >
              <item.icon className="h-6 w-6" strokeWidth={isActive ? 2.2 : 1.5} />
              <span className="text-[11px] font-semibold">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
