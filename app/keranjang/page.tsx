"use client";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { formatRupiah } from "@/lib/format";

export default function CartPage() {
  const { items, updateQty, removeItem, totalPrice } = useCart();

  if (items.length === 0) {
    return (
      <div className="section panel" style={{ textAlign: "center" }}>
        <h2>Keranjang kamu masih kosong</h2>
        <p className="muted">Yuk mulai belanja produk lokal pilihan.</p>
        <Link href="/produk" className="btn btn-primary" style={{ marginTop: 12 }}>
          Jelajahi Produk
        </Link>
      </div>
    );
  }

  return (
    <div className="section" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 32 }}>
      <div className="panel">
        <h2>Keranjang Belanja</h2>
        {items.map((item) => (
          <div className="cart-row" key={item.productId}>
            <div className="cart-row__media">{item.emoji}</div>
            <div>
              <div style={{ fontWeight: 600 }}>{item.name}</div>
              <div className="muted">{formatRupiah(item.price)}</div>
            </div>
            <div className="qty-control">
              <button onClick={() => updateQty(item.productId, item.qty - 1)}>−</button>
              <span>{item.qty}</span>
              <button onClick={() => updateQty(item.productId, item.qty + 1)}>+</button>
            </div>
            <div style={{ textAlign: "right" }}>
              <div>{formatRupiah(item.price * item.qty)}</div>
              <button
                onClick={() => removeItem(item.productId)}
                style={{ background: "none", border: "none", color: "var(--brick)", fontSize: 12, cursor: "pointer", width: "auto", padding: 0, marginTop: 4 }}
              >
                Hapus
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="panel">
        <h3>Ringkasan Belanja</h3>
        <div style={{ display: "flex", justifyContent: "space-between", margin: "12px 0" }}>
          <span className="muted">Subtotal</span>
          <span>{formatRupiah(totalPrice)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", margin: "12px 0", fontWeight: 700 }}>
          <span>Total</span>
          <span>{formatRupiah(totalPrice)}</span>
        </div>
        <Link href="/checkout" className="btn btn-primary btn-full" style={{ marginTop: 8 }}>
          Lanjut ke Checkout
        </Link>
      </div>
    </div>
  );
}
