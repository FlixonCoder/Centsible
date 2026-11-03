import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Centsible — Financial Emergency Decision Assistant (IDEATHON 2026)",
  description:
    "Interactive demo showing how Centsible guides users through sudden financial emergencies with mathematical clarity.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-indigo-100 selection:text-indigo-900 overflow-hidden font-sans bg-background text-slate-900">
        {children}
      </body>
    </html>
  );
}
