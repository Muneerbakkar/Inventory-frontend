import { useState } from "react";
import { Outlet, Navigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { Sidebar } from "./Sidebar";
import { User as UserIcon, Menu } from "lucide-react";
import { NotificationBell } from "../common/NotificationBell";

export const MainLayout = () => {
  const { user } = useSelector((state) => state.auth);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background print:bg-white print:h-auto print:max-w-none print:p-0 print:m-0 print:w-full print:overflow-visible">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="flex flex-1 flex-col overflow-hidden w-full print:overflow-visible">
        <header className="flex h-16 items-center justify-between border-b bg-card px-4 md:px-6 print:hidden">
          <div className="flex items-center gap-3">
            <button 
              className="md:hidden p-2 rounded-md hover:bg-accent text-foreground"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <h2 className="text-lg font-medium text-foreground">
              {/* Header Title Space */}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <Link to="/profile" className="flex items-center gap-3 rounded-lg p-1.5 transition-colors hover:bg-accent">
              <div className="flex flex-col items-end">
                <span className="text-sm font-semibold leading-tight text-foreground">{user.name}</span>
                <span className="text-xs text-muted-foreground leading-tight">{user.role}</span>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shadow">
                {user.name?.charAt(0).toUpperCase()}
              </div>
            </Link>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 print:p-0 print:m-0 print:overflow-visible">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
