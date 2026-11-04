"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  CreditCard,
  Compass,
  PiggyBank,
  ShieldCheck,
  Sliders,
  ChevronRight,
  Sparkles,
  UserCheck,
  Layers,
  Leaf,
  LogOut,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatINR } from "@/lib/format";

interface SidebarProps {
  user: {
    id: string;
    name: string;
    incomeType?: string;
    occupation?: string;
  } | null;
  calmMode: boolean;
  onToggleCalm: () => void;
  onOpenChat: () => void;
  onSwitchPersona: (userId: string) => void;
}

export function Sidebar({
  user,
  calmMode,
  onToggleCalm,
  onOpenChat,
  onSwitchPersona,
}: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Overview", icon: LayoutDashboard },
    { href: "/cash-flow", label: "Cash Flow", icon: ArrowLeftRight },
    { href: "/obligations", label: "Obligations", icon: CreditCard },
    { href: "/decision", label: "Decision Lab", icon: Compass, badge: "Core" },
    { href: "/stress-test", label: "Stress Testing", icon: Activity },
    { href: "/savings", label: "Savings Finder", icon: PiggyBank },
    { href: "/data", label: "Data & Consent", icon: ShieldCheck },
    { href: "/settings", label: "Settings", icon: Sliders },
  ];

  const isPriya = user?.id === "priya" || !user;

  return (
    <aside className="hidden lg:flex w-64 flex-col border-r border-[#E8EAF3] bg-white h-screen sticky top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#F0F2F8]">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2B2A6E] to-[#4F46E5] flex items-center justify-center text-white shadow-md shadow-indigo-100 group-hover:scale-105 transition-transform">
            <span className="font-extrabold text-base tracking-tighter">C₹</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[17px] text-[#1E1B4B] tracking-tight">Centsible</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-50 text-[#4F46E5] border border-indigo-100">
                MVP
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Borrow with clarity</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3.5 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 pt-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Navigation
        </div>

        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13.5px] font-medium transition-all group",
                isActive
                  ? "bg-[#2B2A6E] text-white font-semibold shadow-sm shadow-indigo-200"
                  : "text-slate-600 hover:text-[#1E1B4B] hover:bg-slate-50"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "w-4 h-4 transition-colors",
                    isActive ? "text-indigo-200" : "text-slate-400 group-hover:text-[#4F46E5]"
                  )}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded-md",
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-indigo-50 text-[#4F46E5]"
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        {/* AI Assistant Callout */}
        <div className="pt-4">
          <button
            onClick={onOpenChat}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-indigo-50/80 via-purple-50/60 to-indigo-50/80 border border-indigo-100/80 text-left hover:border-indigo-300 transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-[12.5px] font-semibold text-[#1E1B4B]">Ask Centsible</p>
                <p className="text-[10.5px] text-slate-500">Decision assistant</p>
              </div>
            </div>
            <kbd className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-400 font-mono shadow-xs">
              C
            </kbd>
          </button>
        </div>
      </nav>

      {/* Footer / Persona Selector & Calm Mode */}
      <div className="p-3.5 border-t border-[#F0F2F8] space-y-2 bg-[#FAFBFC]">
        {/* Calm Mode Switch */}
        <button
          onClick={onToggleCalm}
          className={cn(
            "w-full flex items-center justify-between px-3 py-2 rounded-xl text-[12px] font-medium border transition-all",
            calmMode
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50"
          )}
        >
          <div className="flex items-center gap-2">
            <Leaf className={cn("w-3.5 h-3.5", calmMode ? "text-emerald-600" : "text-slate-400")} />
            <span>Calm Mode</span>
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-wider">
            {calmMode ? "Active" : "Off"}
          </span>
        </button>

        {/* Persona quick switch */}
        <div className="bg-white rounded-xl p-2.5 border border-slate-200/80">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10.5px] uppercase font-bold tracking-wider text-slate-400">
              Active Persona
            </span>
            <span className="text-[10px] text-indigo-600 font-medium">Demo Data</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => onSwitchPersona("priya")}
              className={cn(
                "px-2 py-1.5 rounded-lg text-left text-[11.5px] font-medium transition-all",
                isPriya
                  ? "bg-indigo-600 text-white shadow-xs font-semibold"
                  : "bg-slate-100/80 text-slate-700 hover:bg-slate-200/70"
              )}
            >
              <div className="truncate">Priya, 26</div>
              <div className={cn("text-[9.5px]", isPriya ? "text-indigo-200" : "text-slate-500")}>
                Salaried · ₹45k
              </div>
            </button>

            <button
              onClick={() => onSwitchPersona("arjun")}
              className={cn(
                "px-2 py-1.5 rounded-lg text-left text-[11.5px] font-medium transition-all",
                !isPriya
                  ? "bg-indigo-600 text-white shadow-xs font-semibold"
                  : "bg-slate-100/80 text-slate-700 hover:bg-slate-200/70"
              )}
            >
              <div className="truncate">Arjun, 29</div>
              <div className={cn("text-[9.5px]", !isPriya ? "text-indigo-200" : "text-slate-500")}>
                Gig · ₹30k
              </div>
            </button>
          </div>
        </div>

        {/* Small note */}
        <p className="text-[10px] text-center text-slate-400">
          Illustrative figures · Sample data
        </p>
      </div>
    </aside>
  );
}

