"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { logEvent } from "@/lib/log-client";

export default function RegisterPage() {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    // Baris di tabel profiles TIDAK dibuat dari sini lagi — itu sumber race
    // condition sebelumnya. Sekarang dibuat otomatis oleh database trigger
    // (on_auth_user_created, lihat sql/schema.sql) begitu auth.users terisi.
    // username dikirim lewat options.data supaya trigger bisa membacanya
    // dari raw_user_meta_data.
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    if (signUpError || !data.user) {
      setError(signUpError?.message ?? "Gagal mendaftar.");
      return;
    }

    if (!data.session) {
      setError(
        "Akun dibuat, tapi 'Confirm email' masih aktif di project Supabase ini sehingga " +
          "kamu belum otomatis login. Cek email untuk link konfirmasi, atau matikan " +
          "'Confirm email' di Authentication > Providers > Email untuk lab ini."
      );
      return;
    }

    logEvent("register", { email, detail: { username } });
    router.push("/profile");
    router.refresh();
  }

  return (
    <div className="section" style={{ maxWidth: 380 }}>
      <div className="panel">
        <h2>Buat Akun Baru</h2>
        <form onSubmit={handleSubmit}>
          <label>Username</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} required />
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <label>Kata sandi</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: 8 }}>Daftar</button>
        </form>
        {error && <p className="muted" style={{ color: "var(--brick)", marginTop: 10 }}>{error}</p>}
        <p className="muted" style={{ marginTop: 16, fontSize: 13 }}>
          Sudah punya akun? <Link href="/login" style={{ color: "var(--brand)" }}>Masuk di sini</Link>
        </p>
      </div>
    </div>
  );
}
