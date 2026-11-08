"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { logEvent } from "@/lib/log-client";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message);
      logEvent("login_failed", { email, detail: { reason: signInError.message } });
      return;
    }
    logEvent("login_success", { email });
    router.push("/profile");
    router.refresh();
  }

  return (
    <div className="section" style={{ maxWidth: 380 }}>
      <div className="panel">
        <h2>Masuk ke Akun</h2>
        <form onSubmit={handleSubmit}>
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <label>Kata sandi</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: 8 }}>Masuk</button>
        </form>
        {error && <p className="muted" style={{ color: "var(--brick)", marginTop: 10 }}>{error}</p>}
        <p className="muted" style={{ marginTop: 16, fontSize: 13 }}>
          Belum punya akun? <Link href="/register" style={{ color: "var(--brand)" }}>Daftar di sini</Link>
        </p>
      </div>
    </div>
  );
}
