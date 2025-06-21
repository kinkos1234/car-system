import type { Metadata } from "next";
import "./globals.css";
import GlobalNav from "@/components/GlobalNav";

export const metadata: Metadata = {
  title: "삼송 CAR 시스템",
  description: "Customer Action Request Management System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className="dark">
      <body className="bg-zinc-950 text-zinc-100 antialiased">
        <GlobalNav />
        <main>{children}</main>
      </body>
    </html>
  );
}
