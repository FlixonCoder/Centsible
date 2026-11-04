import type { Metadata } from "next";
import "./globals.css";
import { AppLayout } from "@/components/shell/AppLayout";

export const metadata: Metadata = {
  title: "Centsible — Borrow with clarity, not panic",
  description:
    "Financial Emergency Decision Assistant (IDEATHON 2026 · Fintech) — Real-time Safe-to-Borrow capacity, stress testing, and lender-neutral comparison.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased selection:bg-indigo-100 selection:text-indigo-900 bg-[#F7F8FC]">
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
