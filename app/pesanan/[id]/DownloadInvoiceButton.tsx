"use client";
import { useState } from "react";

export default function DownloadInvoiceButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleDownload() {
    setLoading(true);
    setResult(null);
    const res = await fetch(`/api/export/${orderId}`);
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setResult(data.error ?? "Gagal mengunduh invoice.");
      return;
    }

    // Untuk kesederhanaan lab, invoice ditampilkan sebagai JSON yang bisa
    // dilihat langsung, bukan file PDF sungguhan.
    const blob = new Blob([JSON.stringify(data.order, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice-${orderId.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setResult("Invoice berhasil diunduh.");
  }

  return (
    <div style={{ marginTop: 20 }}>
      <button className="btn btn-outline" onClick={handleDownload} disabled={loading}>
        {loading ? "Memuat..." : "Unduh Invoice"}
      </button>
      {result && <p className="muted" style={{ marginTop: 8, fontSize: 13 }}>{result}</p>}
    </div>
  );
}
