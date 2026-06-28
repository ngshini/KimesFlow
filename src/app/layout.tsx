import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kimes Flow",
  description: "Project and task management for small teams.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
