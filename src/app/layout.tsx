import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Finance Manager",
  description:
    "Personal finance dashboard with CSV import, MongoDB, and AI-powered insights.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="min-h-screen bg-zinc-950 text-zinc-50">
          <header className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur">
            <div className="flex w-full items-center justify-between px-8 py-4">
              <a href="/" className="text-sm font-semibold tracking-tight">
                <span className="bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">
                  AI Finance
                </span>{" "}
                Manager
              </a>
              <nav className="flex gap-4 text-xs text-zinc-400">
                <a href="/dashboard" className="hover:text-zinc-100">
                  Dashboard
                </a>
                <a href="/transactions" className="hover:text-zinc-100">
                  Transactions
                </a>
              </nav>
            </div>
          </header>
          <main>{children}</main>
          <footer className="border-t border-zinc-900 bg-zinc-950/80">
            <div className="flex w-full items-center justify-between px-8 py-4 text-xs text-zinc-500">
              <p>Built with Next.js, TypeScript, MongoDB and AI.</p>
              <p>Portfolio project by Sahil.</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
