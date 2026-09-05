import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BottomNav, Mark } from "./components";

export const metadata: Metadata = {
  title: "TheLineAudit Tracker",
  description: "Every official play. Every result. No selective tracking.",
};

export const viewport: Viewport = { themeColor: "#080b12", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <header>
            <Mark />
            <div><strong>@TheLineAudit</strong><span>Verified betting ledger</span></div>
            <span className="live"><i /> Live</span>
          </header>
          {children}
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
