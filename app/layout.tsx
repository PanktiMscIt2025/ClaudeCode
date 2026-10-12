import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AssignAI",
  description: "AI-assisted assignment management for faculty and students",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
