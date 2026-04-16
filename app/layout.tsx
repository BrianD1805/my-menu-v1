import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "My Menu V1",
  description: "Multi-tenant online ordering demo"
};

const LIVE_VERSION = "Ver: 0.037";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <div className="pointer-events-none fixed bottom-3 right-3 z-50 rounded-full border border-black/10 bg-white/90 px-3 py-1.5 text-xs font-semibold tracking-wide text-gray-600 shadow-sm backdrop-blur">
          {LIVE_VERSION}
        </div>
      </body>
    </html>
  );
}
