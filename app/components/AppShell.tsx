"use client";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function AppShell({
  username,
  isAdmin,
  children,
}: {
  username: string | null;
  isAdmin: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isAdminArea = pathname?.startsWith("/admin");

  if (isAdminArea) {
    // Area admin punya shell-nya sendiri (lihat app/admin/layout.tsx),
    // jadi navbar & footer toko tidak ikut dirender di sini.
    return <>{children}</>;
  }

  return (
    <>
      <Navbar username={username} isAdmin={isAdmin} />
      <main>{children}</main>
      <Footer />
    </>
  );
}
