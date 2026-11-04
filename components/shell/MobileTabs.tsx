"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  CreditCard,
  Compass,
  PiggyBank,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileTabsProps {
  onOpenChat: () => void;
}

export function MobileTabs({ onOpenChat }: MobileTabsProps) {
  const pathname = usePathname();

  const items = [
    { href: "/", label: "Overview", icon: LayoutDashboard },
    { href: "/cash-flow", label: "Cash Flow", icon: ArrowLeftRight },
    { href: "/decision", label: "Decision", icon: Compass, highlight: true },
    { href: "/obligations", label: "Debts", icon: CreditCard },
    { href: "/savings", label: "Savings", icon: PiggyBank },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E8EAF3] py-1.5 px-3 flex items-center justify-around shadow-lg">
      {items.map((item) => {
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);
        const Icon = item.icon;

        if (item.highlight) {
          return (
            <Link
              key={item.href}
              href="/decision/new"
              className="flex flex-col items-center justify-center -mt-5"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#2B2A6E] to-[#4F46E5] text-white flex items-center justify-center shadow-md shadow-indigo-300">
                <Icon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold text-[#2B2A6E] mt-1">Lab</span>
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-[10.5px] font-medium transition-colors",
              isActive ? "text-[#4F46E5] font-bold" : "text-slate-500 hover:text-slate-900"
            )}
          >
            <Icon className={cn("w-5 h-5 mb-0.5", isActive ? "text-[#4F46E5]" : "text-slate-400")} />
            <span>{item.label}</span>
          </Link>
        );
      })}

      <button
        onClick={onOpenChat}
        className="flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-[10.5px] font-medium text-slate-500 hover:text-slate-900"
      >
        <Sparkles className="w-5 h-5 mb-0.5 text-indigo-500" />
        <span>Ask</span>
      </button>
    </nav>
  );
}

