import { createServerSupabase } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const ACTION_LABEL: Record<string, string> = {
  profile_update: "Update profil",
  site_content_update: "Update konten beranda",
  export_access: "Akses invoice",
  reset: "Reset konten",
  checkout: "Pesanan baru",
  login_success: "Login berhasil",
  login_failed: "Login gagal",
  logout: "Logout",
  register: "Registrasi akun baru",
  admin_access_denied: "Percobaan login admin ditolak",
};

export default async function IncidentsPage() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <p className="section panel">Silakan masuk dulu.</p>;
  }

  // Query ini tunduk pada RLS "audit_log_select_admin_only": kalau akun
  // yang login bukan admin, hasilnya otomatis kosong.
  const { data: logs, error } = await supabase
    .from("audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="section">
      <h2 style={{ marginBottom: 8 }}>Log Aktivitas &amp; Deteksi Anomali</h2>
      <p className="muted" style={{ marginBottom: 20, maxWidth: "60ch" }}>
        Riwayat aktivitas pada akun dan transaksi. Baris yang ditandai
        menunjukkan pola yang tidak biasa dan layak ditinjau lebih lanjut.
      </p>

      {error && <p className="muted">Gagal memuat log: {error.message}</p>}

      {!error && (!logs || logs.length === 0) && (
        <p className="muted">
          Belum ada aktivitas tercatat, atau akun kamu belum memiliki akses
          admin untuk melihat log ini.
        </p>
      )}

      {logs && logs.length > 0 && (
        <div className="panel" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Waktu</th>
                <th>Aktivitas</th>
                <th>Pengguna</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log: any) => (
                <tr key={log.id} style={log.is_suspicious ? { background: "#F3DAD4" } : undefined}>
                  <td>{new Date(log.created_at).toLocaleString("id-ID")}</td>
                  <td>
                    {ACTION_LABEL[log.action] ?? log.action}
                    {log.is_suspicious && <span className="badge badge-danger" style={{ marginLeft: 8 }}>perlu ditinjau</span>}
                  </td>
                  <td>{log.actor_email ?? log.actor_id ?? "anon"}</td>
                  <td style={{ fontFamily: "monospace", fontSize: 12 }}>
                    {JSON.stringify(log.detail)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
