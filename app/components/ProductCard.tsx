"use client";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { formatRupiah } from "@/lib/format";

type Product = {
  id: string;
  slug: string;
  name: string;
  price: number;
  category: string;
  emoji: string;
};

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();

  return (
    <div className="product-card">
      <Link href={`/produk/${product.slug}`}>
        <div className="product-card__media">{product.emoji}</div>
      </Link>
      <div className="product-card__body">
        <span className="product-card__cat">{product.category}</span>
        <Link href={`/produk/${product.slug}`} className="product-card__name">
          {product.name}
        </Link>
        <span className="product-card__price">{formatRupiah(product.price)}</span>
        <button
          className="btn btn-primary btn-full"
          onClick={() =>
            addItem({
              productId: product.id,
              slug: product.slug,
              name: product.name,
              price: product.price,
              emoji: product.emoji,
            })
          }
        >
          Tambah ke Keranjang
        </button>
      </div>
    </div>
  );
}
