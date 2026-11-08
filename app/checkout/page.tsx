"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { formatRupiah } from "@/lib/format";

export default function CheckoutPage() {
  const { items, totalPrice, clear } = useCart();
  const router = useRouter();
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((i) => ({ productId: i.productId, name: i.name, price: i.price, qty: i.qty })),
        address,
      }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Gagal membuat pesanan.");
      return;
    }

    clear();
    router.push(`/pesanan/${data.order.id}`);
  }

  if (items.length === 0) {
    return <p className="section panel">Keranjang kosong. <a href="/produk">Belanja dulu yuk.</a></p>;
  }

  return (
    <div className="section" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 32 }}>
      <form className="panel" onSubmit={handlePlaceOrder}>
        <h2>Alamat Pengiriman</h2>
        <label>Alamat lengkap</label>
        <textarea
          rows={4}
          required
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Nama jalan, nomor rumah, kelurahan, kecamatan, kota, kode pos"
        />
        <h3 style={{ marginTop: 20 }}>Metode Pembayaran</h3>
        <p className="muted" style={{ fontSize: 13 }}>
          Simulasi checkout — tidak ada pembayaran nyata yang diproses di lab ini.
        </p>
        <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: 16 }} disabled={submitting}>
          {submitting ? "Memproses..." : `Buat Pesanan — ${formatRupiah(totalPrice)}`}
        </button>
        {error && <p className="muted" style={{ color: "var(--brick)", marginTop: 10 }}>{error}</p>}
      </form>

      <div className="panel">
        <h3>Ringkasan</h3>
        {items.map((i) => (
          <div key={i.productId} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, margin: "8px 0" }}>
            <span>{i.name} × {i.qty}</span>
            <span>{formatRupiah(i.price * i.qty)}</span>
          </div>
        ))}
        <div style={{ borderTop: "1px solid var(--line)", marginTop: 12, paddingTop: 12, display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
          <span>Total</span>
          <span>{formatRupiah(totalPrice)}</span>
        </div>
      </div>
    </div>
  );
}
