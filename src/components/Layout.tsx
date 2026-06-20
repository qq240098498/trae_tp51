import { useState, type ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  BedDouble,
  CalendarDays,
  ClipboardList,
  KeyRound,
  ScrollText,
  UtensilsCrossed,
  Mountain,
  Plus,
  RotateCcw,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/date";
import { todayStr } from "@/lib/date";
import { useStore } from "@/store/useStore";

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
}

const NAV: NavItem[] = [
  { to: "/", label: "工作台", icon: <LayoutDashboard size={18} /> },
  { to: "/rooms", label: "房型与包间", icon: <BedDouble size={18} /> },
  { to: "/calendar", label: "房态日历", icon: <CalendarDays size={18} /> },
  { to: "/bookings", label: "预订管理", icon: <ClipboardList size={18} /> },
  { to: "/frontdesk", label: "入住退房", icon: <KeyRound size={18} /> },
  { to: "/rules", label: "退改规则", icon: <ScrollText size={18} /> },
  { to: "/services", label: "特色服务", icon: <UtensilsCrossed size={18} /> },
];

function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-2 py-1">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest-500 text-paper shadow-sm">
        <Mountain size={20} />
      </div>
      <div className="hidden lg:block leading-tight">
        <div className="font-serif text-lg font-bold text-ink">山舍</div>
        <div className="text-[10px] text-muted">农家乐 · 民宿管理</div>
      </div>
    </div>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/"}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
              isActive
                ? "bg-forest-500 text-paper shadow-sm"
                : "text-ink/70 hover:bg-ink/5 hover:text-ink"
            )
          }
        >
          <span className="shrink-0">{item.icon}</span>
          <span className="hidden lg:block">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function SidebarFooter() {
  const resetData = useStore((s) => s.resetData);
  return (
    <div className="hidden lg:block border-t border-ink/10 p-3">
      <button
        onClick={() => {
          if (confirm("将清空所有数据并恢复示例数据，确定继续吗？")) resetData();
        }}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted transition hover:bg-ink/5 hover:text-ink"
      >
        <RotateCcw size={14} />
        重置示例数据
      </button>
    </div>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const current = NAV.find((n) =>
    n.to === "/" ? location.pathname === "/" : location.pathname.startsWith(n.to)
  );

  return (
    <div className="min-h-screen">
      {/* sidebar (desktop) */}
      <aside className="fixed left-0 top-0 z-30 hidden h-full w-16 flex-col border-r border-ink/10 bg-card/80 backdrop-blur lg:flex lg:w-60">
        <div className="px-3 py-4">
          <Brand />
        </div>
        <div className="flex-1 overflow-y-auto px-3">
          <NavLinks />
        </div>
        <SidebarFooter />
      </aside>

      {/* mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-64 animate-slide-in bg-card p-3 shadow-lift">
            <div className="mb-4 flex items-center justify-between">
              <Brand />
              <button onClick={() => setMobileOpen(false)} className="rounded-lg p-1.5 hover:bg-ink/5">
                <X size={18} />
              </button>
            </div>
            <NavLinks onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* main */}
      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-ink/10 bg-paper/80 px-4 backdrop-blur lg:px-8">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 hover:bg-ink/5 lg:hidden"
          >
            <Menu size={20} />
          </button>
          <div className="flex-1">
            <h2 className="font-serif text-lg font-semibold text-ink">
              {current?.label ?? "工作台"}
            </h2>
            <p className="text-xs text-muted">{formatDate(todayStr())}</p>
          </div>
          <NavLink
            to="/bookings/new"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-forest-500 px-4 text-sm font-medium text-paper shadow-sm transition hover:bg-forest-600"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">新建预订</span>
          </NavLink>
        </header>
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
