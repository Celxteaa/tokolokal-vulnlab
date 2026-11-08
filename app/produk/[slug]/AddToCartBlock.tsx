"use client";
import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { formatRupiah } from "@/lib/format";
import { useRouter } from "next/navigation";

export default function AddToCartBlock({
  product,
}: {
  product: { id: string; slug: string; name: string; price: number; emoji: string };
}) {
  const { addItem } = useCart();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addItem(
      { productId: product.id, slug: product.slug, name: product.name, price: product.price, emoji: product.emoji },
      qty
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  return (
    <div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 28, marginBottom: 16 }}>
        {formatRupiah(product.price)}
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
        <div className="qty-control">
          <button onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
          <span>{qty}</span>
          <button onClick={() => setQty((q) => q + 1)}>+</button>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button className="btn btn-primary" onClick={handleAdd}>
          {added ? "Ditambahkan ✓" : "Tambah ke Keranjang"}
        </button>
        <button
          className="btn btn-outline"
          onClick={() => {
            handleAdd();
            router.push("/keranjang");
          }}
        >
          Beli Sekarang
        </button>
      </div>
    </div>
  );
}
