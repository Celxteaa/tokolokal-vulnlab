import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-server";
import AdminSidebar from "../AdminSidebar";

// Catatan desain: layout ini HANYA mengecek apakah ada sesi login aktif,
// bukan apakah role-nya "admin". Developer menganggap itu cukup karena
// setiap query sensitif di dalam halaman admin "pasti" dijaga RLS masing-
// masing tabel. Itu benar untuk tabel orders & audit_log (policy-nya sudah
// mengecek role dengan benar), tapi TIDAK benar untuk site_content (lihat
// Celah #2 di schema.sql) — sehingga user biasa yang nekat membuka URL
// /admin secara langsung tetap bisa masuk ke dashboard ini, walau mereka
// tidak pernah lolos dari gerbang /admin/login.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  return (
    <div className="admin-shell">
      <AdminSidebar username={profile?.username ?? user.email ?? "Admin"} />
      <div className="admin-content">{children}</div>
    </div>
  );
}
