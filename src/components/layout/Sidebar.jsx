import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  ShoppingCart, 
  Truck, 
  BarChart,
  LogOut,
  X,
  Tags,
  Settings,
  FileText,
  FileSpreadsheet,
  PackagePlus,
  ReceiptText,
  ShieldAlert,
  ChevronDown,
  Bell
} from "lucide-react";
import { cn } from "../../utils/cn";
import { useLogoutApiMutation } from "../../features/auth/authApi";
import { logout } from "../../features/auth/authSlice";
 
const navItems = [
  { name: "Dashboard", to: "/", icon: LayoutDashboard },
  { name: "Users", to: "/users", icon: Users },
  { name: "Suppliers", to: "/suppliers", icon: Truck },
  { name: "Categories", to: "/categories", icon: Tags },
  { name: "Products", to: "/products", icon: Package },
  { name: "Customers", to: "/customers", icon: Users },
  { name: "Quotations", to: "/quotations", icon: FileText },
  { name: "Sales", to: "/sales", icon: ShoppingCart },
  { name: "Referrals", to: "/referrals", icon: Users },
  {
    name: "Purchases",
    icon: PackagePlus,
    subItems: [
      { name: "Purchase Bills", to: "/purchases" },
      { name: "Purchase Returns", to: "/purchase-returns" },
      { name: "Debit Notes", to: "/debit-notes" }
    ]
  },
  { name: "Reports", to: "/reports", icon: BarChart },
  { name: "Notifications", to: "/notifications", icon: Bell },
  { 
    name: "Settings", 
    icon: Settings, 
    subItems: [
      { name: "Company", to: "/settings" },
      { name: "GST", to: "/settings/gst" }
    ]
  },
];

export const Sidebar = ({ isOpen, setIsOpen }) => {
  const [openSubMenus, setOpenSubMenus] = useState(() => {
    const initial = {};
    navItems.forEach(item => {
      if (item.subItems) {
        const hasActiveSub = item.subItems.some(sub => window.location.pathname.startsWith(sub.to));
        if (hasActiveSub) {
          initial[item.name] = true;
        }
      }
    });
    return initial;
  });

  const toggleSubMenu = (name) => {
    setOpenSubMenus(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [logoutApi] = useLogoutApiMutation();

  const handleLogout = async () => {
    try {
      await logoutApi().unwrap();
    } catch (err) {
      console.error("Logout API failed", err);
    }
    dispatch(logout());
    navigate("/login");
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar Container */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 flex h-screen w-64 flex-col border-r bg-card text-card-foreground transition-transform duration-300 ease-in-out md:static md:translate-x-0 print:hidden",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-16 items-center justify-between border-b px-6">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="INVENQ logo" className="h-10 w-10 dark:invert" />
            <h1 className="text-xl font-bold text-foreground tracking-tight">
              INVENQ
            </h1>
          </div>
          <button 
            className="md:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {navItems.map((item) => {
            if (item.subItems) {
              const isOpenMenu = !!openSubMenus[item.name];
              return (
                <div key={item.name} className="flex flex-col space-y-1">
                  <button
                    onClick={() => toggleSubMenu(item.name)}
                    className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="h-5 w-5" />
                      {item.name}
                    </div>
                    <ChevronDown className={cn("h-4 w-4 transition-transform", isOpenMenu && "rotate-180")} />
                  </button>
                  {isOpenMenu && (
                    <div className="ml-8 flex flex-col space-y-1 mt-1">
                      {item.subItems.map(subItem => (
                        <NavLink
                          key={subItem.name}
                          to={subItem.to}
                          end
                          className={({ isActive }) =>
                            cn(
                              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                              isActive
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            )
                          }
                          onClick={() => setIsOpen(false)}
                        >
                          {subItem.name}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <NavLink
                key={item.name}
                to={item.disabled ? "#" : item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    item.disabled 
                      ? "cursor-not-allowed opacity-50" 
                      : isActive && !item.disabled
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )
                }
                onClick={(e) => {
                  if (item.disabled) e.preventDefault();
                  else setIsOpen(false); // Close sidebar on mobile after clicking a link
                }}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
                {item.disabled && <span className="ml-auto text-[10px] uppercase tracking-wider">Soon</span>}
              </NavLink>
            );
          })}
          {user?.role === 'SuperAdmin' && (
            <NavLink
              to="/audit-logs"
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )
              }
              onClick={() => setIsOpen(false)}
            >
              <ShieldAlert className="h-5 w-5" />
              Audit Logs
            </NavLink>
          )}
        </nav>
        <div className="border-t p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-destructive px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-destructive/90"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </>
  );
};
