// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { TodoProvider } from "@/contexts/todocontext";
import { ScheduleProvider } from "@/contexts/schedulecontext";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sports Arbitrage Finder",
  description: "Real gambling is bad",
  keywords: "James Scanga"
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
            {children}
      </body>
    </html>
  );
}