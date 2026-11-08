"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfileForm({
  initialUsername,
  initialBio,
}: {
  initialUsername: string;
  initialBio: string;
}) {
  const router = useRouter();
  const [username, setUsername] = useState(initialUsername);
  const [bio, setBio] = useState(initialBio);
  const [status, setStatus] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, bio }),
    });
    if (res.ok) {
      setStatus("Perubahan tersimpan.");
      router.refresh();
    } else {
      const data = await res.json();
      setStatus(data.error ?? "Gagal menyimpan.");
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>Username</label>
      <input value={username} onChange={(e) => setUsername(e.target.value)} />
      <label>Bio singkat</label>
      <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />
      <button type="submit" className="btn btn-primary">Simpan Perubahan</button>
      {status && <p className="muted" style={{ marginTop: 10 }}>{status}</p>}
    </form>
  );
}
