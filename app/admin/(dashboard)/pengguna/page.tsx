import { createServiceSupabase } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

// Catatan desain: halaman ini memakai service_role (lewat createServiceSupabase)
// untuk mengambil daftar email dari auth.users — sama seperti /api/export dan
// /api/reset. Karena layout admin hanya mengecek "sudah login" (bukan role),
// dan di sini tidak ada pengecekan role tambahan, siapa pun yang berhasil
// masuk ke /admin lewat URL langsung (lihat catatan di admin/layout.tsx)
// otomatis juga bisa melihat daftar ini. Ini perpanjangan dari Celah #2.
export default async function AdminUsersPage() {
  const service = createServiceSupabase();

  const [{ data: authUsers }, { data: profiles }] = await Promise.all([
    service.auth.admin.listUsers(),
    service.from("profiles").select("id, username, role, created_at"),
  ]);

  const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));

  const rows = (authUsers?.users ?? []).map((u) => ({
    id: u.id,
    email: u.email,
    username: profileMap.get(u.id)?.username ?? "-",
    role: profileMap.get(u.id)?.role ?? "user",
    createdAt: u.created_at,
  }));

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 20 }}>Pengguna Terdaftar</h1>
      <div className="panel" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Terdaftar</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.username}</td>
                <td>{r.email}</td>
                <td><span className={`badge ${r.role === "admin" ? "badge-success" : ""}`}>{r.role}</span></td>
                <td>{new Date(r.createdAt).toLocaleDateString("id-ID")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
