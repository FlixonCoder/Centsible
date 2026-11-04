"use client";

import { ReactNode, useState, useEffect, createContext, useContext } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { MobileTabs } from "./MobileTabs";
import { ChatDrawer } from "@/components/chat/ChatDrawer";
import { useRouter } from "next/navigation";

interface AppContextType {
  user: any;
  calmMode: boolean;
  toggleCalmMode: () => void;
  openChat: () => void;
  closeChat: () => void;
  switchPersona: (userId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppLayout");
  return ctx;
}

export function AppLayout({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [calmMode, setCalmMode] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  // Keyboard shortcut listener ('c' opens chat drawer)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === "c" || e.key === "C") &&
        !["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)
      ) {
        setIsChatOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const switchPersona = async (userId: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        window.location.reload();
      }
    } catch (err) {
      console.error("Failed to switch persona", err);
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        calmMode,
        toggleCalmMode: () => setCalmMode((prev) => !prev),
        openChat: () => setIsChatOpen(true),
        closeChat: () => setIsChatOpen(false),
        switchPersona,
      }}
    >
      <div className={`min-h-screen bg-[#F7F8FC] flex text-[#1E1B4B] ${calmMode ? "calm-theme" : ""}`}>
        {/* Desktop Sidebar */}
        <Sidebar
          user={user}
          calmMode={calmMode}
          onToggleCalm={() => setCalmMode((prev) => !prev)}
          onOpenChat={() => setIsChatOpen(true)}
          onSwitchPersona={switchPersona}
        />

        {/* Main Stage */}
        <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-8">
          <TopBar
            user={user}
            calmMode={calmMode}
            onToggleCalm={() => setCalmMode((prev) => !prev)}
            onOpenChat={() => setIsChatOpen(true)}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>

        {/* Mobile Navigation Tabs */}
        <MobileTabs onOpenChat={() => setIsChatOpen(true)} />

        {/* Slide-over Assistant Drawer */}
        <ChatDrawer isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      </div>
    </AppContext.Provider>
  );
}

