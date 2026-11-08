"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminForm({
  initialTitle,
  initialBanner,
}: {
  initialTitle: string;
  initialBanner: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [banner, setBanner] = useState(initialBanner);
  const [status, setStatus] = useState<string | null>(null);

  async function save(key: string, value: string) {
    const res = await fetch("/api/site-content", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
    return res.ok;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const okTitle = await save("homepage_title", title);
    const okBanner = await save("homepage_banner", banner);
    setStatus(okTitle && okBanner ? "Konten beranda diperbarui." : "Gagal menyimpan — cek izin akses akun kamu.");
    router.refresh();
  }

  async function handleReset() {
    const res = await fetch("/api/reset", { method: "POST" });
    setStatus(res.ok ? "Konten dikembalikan ke default." : "Gagal mereset.");
    router.refresh();
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <label>Judul Beranda</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
        <label>Teks Promosi</label>
        <textarea value={banner} onChange={(e) => setBanner(e.target.value)} rows={3} />
        <button type="submit" className="btn btn-primary">Simpan Perubahan</button>
      </form>
      {status && <p className="muted" style={{ marginTop: 10 }}>{status}</p>}
      <hr style={{ borderColor: "var(--line)", margin: "20px 0" }} />
      <button onClick={handleReset} className="btn btn-outline">
        Kembalikan ke Konten Default
      </button>
    </div>
  );
}
