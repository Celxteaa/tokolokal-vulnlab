"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { logEvent } from "@/lib/log-client";

export default function AdminLoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setLoading(false);
      setError("Email atau kata sandi salah.");
      logEvent("login_failed", { email, detail: { portal: "admin" } });
      return;
    }

    // Pengecekan role di sini hanya "gerbang" di portal login admin.
    // Catatan penting: halaman-halaman admin yang sebenarnya TIDAK mengulang
    // pengecekan ini (lihat app/admin/layout.tsx) — jadi siapa pun yang
    // sudah mendapat sesi login (lewat /login biasa sekalipun) tetap bisa
    // mengakses /admin langsung lewat URL tanpa pernah lewat gerbang ini.
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user!.id)
      .single();

    if (profile?.role !== "admin") {
      await supabase.auth.signOut();
      setLoading(false);
      setError("Akun ini tidak memiliki akses admin.");
      logEvent("admin_access_denied", { email, detail: { portal: "admin-login" } });
      return;
    }

    logEvent("login_success", { email, detail: { portal: "admin" } });
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="admin-login-screen">
      <form className="admin-login-card" onSubmit={handleSubmit}>
        <h1>Dashboard Admin</h1>
        <p className="muted" style={{ marginBottom: 20 }}>Masuk dengan akun yang memiliki akses administrasi.</p>
        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label>Kata sandi</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop: 8 }}>
          {loading ? "Memeriksa..." : "Masuk ke Dashboard"}
        </button>
        {error && <p className="muted" style={{ color: "#F3B3A1", marginTop: 10 }}>{error}</p>}
      </form>
    </div>
  );
}
