import "./globals.css";
import { Fraunces, Inter } from "next/font/google";
import { CartProvider } from "@/lib/cart-context";
import { createServerSupabase } from "@/lib/supabase-server";
import AppShell from "./components/AppShell";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600"],
});
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "Tokolokal — Produk Lokal Pilihan",
  description: "Belanja kerajinan, fashion, dan makanan khas dari pengrajin lokal Indonesia.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let username: string | null = null;
  let isAdmin = false;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, role")
      .eq("id", user.id)
      .single();
    username = profile?.username ?? null;
    isAdmin = profile?.role === "admin";
  }

  return (
    <html lang="id" className={`${fraunces.variable} ${inter.variable}`}>
      <body>
        <CartProvider>
          <AppShell username={username} isAdmin={isAdmin}>
            {children}
          </AppShell>
        </CartProvider>
      </body>
    </html>
  );
}
