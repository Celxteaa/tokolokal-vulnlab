"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { logEvent } from "@/lib/log-client";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/pesanan", label: "Pesanan" },
  { href: "/admin/pengguna", label: "Pengguna" },
  { href: "/admin/konten", label: "Konten Beranda" },
  { href: "/admin/incidents", label: "Log Aktivitas" },
];

export default function AdminSidebar({ username }: { username: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    logEvent("logout", { detail: { portal: "admin" } });
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar__brand">Tokolokal <span>Admin</span></div>
      <nav className="admin-sidebar__nav">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={pathname === item.href ? "active" : ""}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="admin-sidebar__footer">
        <div className="muted" style={{ fontSize: 13, marginBottom: 10 }}>{username}</div>
        <Link href="/" className="muted" style={{ fontSize: 13, display: "block", marginBottom: 10 }}>
          ← Kembali ke Toko
        </Link>
        <button onClick={handleLogout} className="btn btn-outline" style={{ width: "100%", borderColor: "rgba(255,255,255,0.3)", color: "#fff" }}>
          Keluar
        </button>
      </div>
    </aside>
  );
}
