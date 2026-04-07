import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CSE471 Inventory Desk",
  description: "Retro-style auth starter for an inventory and order management system.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
