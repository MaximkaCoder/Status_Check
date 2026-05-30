import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { ThemeProvider } from "next-themes";

export const metadata: Metadata = {
  title: "Status Check — Shared Commitment Tracker",
  description:
    "A shared workspace for tracking commitments and deadlines. See what everyone is working on, when it's due, and whether it's on track.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <LanguageProvider>
          <ToastProvider>
            <div className="min-h-screen flex flex-col bg-background dark:bg-[#0a0b1a] relative">
              {/* Geometric mesh background - light mode (very faint) */}
              <div className="fixed inset-0 pointer-events-none block dark:hidden" aria-hidden="true">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="mesh-light" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                      <path d="M 80 0 L 0 0 0 80" fill="none" stroke="rgba(99,102,241,0.05)" strokeWidth="0.5"/>
                      <path d="M 40 0 L 80 80" fill="none" stroke="rgba(99,102,241,0.04)" strokeWidth="0.5"/>
                      <path d="M 0 40 L 80 40" fill="none" stroke="rgba(99,102,241,0.03)" strokeWidth="0.5"/>
                    </pattern>
                    <radialGradient id="glow-light" cx="0%" cy="0%" r="50%">
                      <stop offset="0%" stopColor="rgba(99,102,241,0.06)"/>
                      <stop offset="100%" stopColor="transparent"/>
                    </radialGradient>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#mesh-light)"/>
                  <rect width="100%" height="100%" fill="url(#glow-light)"/>
                </svg>
              </div>
              {/* Geometric mesh background - dark mode */}
              <div className="fixed inset-0 pointer-events-none hidden dark:block" aria-hidden="true">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="mesh-dark" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                      <path d="M 80 0 L 0 0 0 80" fill="none" stroke="rgba(99,102,241,0.07)" strokeWidth="0.5"/>
                      <path d="M 40 0 L 80 80" fill="none" stroke="rgba(99,102,241,0.04)" strokeWidth="0.5"/>
                      <path d="M 0 40 L 80 40" fill="none" stroke="rgba(99,102,241,0.03)" strokeWidth="0.5"/>
                    </pattern>
                    <radialGradient id="glow1-dark" cx="20%" cy="30%" r="40%">
                      <stop offset="0%" stopColor="rgba(99,102,241,0.08)"/>
                      <stop offset="100%" stopColor="transparent"/>
                    </radialGradient>
                    <radialGradient id="glow2-dark" cx="80%" cy="70%" r="35%">
                      <stop offset="0%" stopColor="rgba(139,92,246,0.06)"/>
                      <stop offset="100%" stopColor="transparent"/>
                    </radialGradient>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#mesh-dark)"/>
                  <rect width="100%" height="100%" fill="url(#glow1-dark)"/>
                  <rect width="100%" height="100%" fill="url(#glow2-dark)"/>
                </svg>
              </div>
              <Header />
              <main className="flex-1">{children}</main>
            </div>
          </ToastProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
