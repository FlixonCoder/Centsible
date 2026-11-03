import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Centsible — Borrow with clarity, not panic",
  description:
    "Interactive demo of Centsible, the financial emergency decision assistant (IDEATHON 2026 · Fintech).",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased selection:bg-indigo-100 selection:text-indigo-900">
        {children}
      </body>
    </html>
  );
}
