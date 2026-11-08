import { createServerSupabase } from "@/lib/supabase-server";
import { formatRupiah } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const supabase = createServerSupabase();

  const [{ count: userCount }, { data: orders }, { count: suspiciousCount }] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("total, status"),
    supabase.from("audit_log").select("*", { count: "exact", head: true }).eq("is_suspicious", true),
  ]);

  const totalOrders = orders?.length ?? 0;
  const totalRevenue = (orders ?? []).reduce((sum, o: any) => sum + Number(o.total), 0);

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>Dashboard</h1>
      <div className="stat-grid">
        <div className="stat-card">
          <span className="muted">Total Pendapatan</span>
          <strong>{formatRupiah(totalRevenue)}</strong>
        </div>
        <div className="stat-card">
          <span className="muted">Total Pesanan</span>
          <strong>{totalOrders}</strong>
        </div>
        <div className="stat-card">
          <span className="muted">Pengguna Terdaftar</span>
          <strong>{userCount ?? 0}</strong>
        </div>
        <div className="stat-card stat-card--alert">
          <span className="muted">Aktivitas Perlu Ditinjau</span>
          <strong>{suspiciousCount ?? 0}</strong>
        </div>
      </div>
      <p className="muted" style={{ marginTop: 24, fontSize: 13 }}>
        Data di dashboard ini hanya terlihat jika akun kamu punya baris di
        tabel <code>profiles</code> dengan <code>role = 'admin'</code> untuk
        tabel yang RLS-nya mengecek role (pesanan & log). Konten beranda ada
        di menu "Konten Beranda".
      </p>
    </div>
  );
}
