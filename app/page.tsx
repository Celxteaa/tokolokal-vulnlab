import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase-server";
import ProductCard from "./components/ProductCard";

export const dynamic = "force-dynamic";

const CATEGORIES = [
  { name: "Kerajinan Tangan", emoji: "🏺" },
  { name: "Fashion & Tekstil", emoji: "🧵" },
  { name: "Makanan & Minuman", emoji: "☕" },
  { name: "Dekorasi Rumah", emoji: "💡" },
];

export default async function HomePage() {
  const supabase = createServerSupabase();

  const [{ data: content }, { data: products }] = await Promise.all([
    supabase.from("site_content").select("key, value").in("key", ["homepage_title", "homepage_banner"]),
    supabase.from("products").select("*").limit(8),
  ]);

  const site: Record<string, string> = {};
  content?.forEach((row) => (site[row.key] = row.value));

  return (
    <div>
      <section className="hero">
        <div>
          <h1>{site.homepage_title ?? "Produk lokal, langsung dari pengrajinnya"}</h1>
          <p>{site.homepage_banner ?? "Temukan kerajinan tangan, kain tenun, dan makanan khas dari berbagai daerah di Indonesia."}</p>
          <div className="hero-actions">
            <Link href="/produk" className="btn btn-primary">Belanja Sekarang</Link>
            <Link href="/tentang" className="btn btn-outline">Tentang Kami</Link>
          </div>
        </div>
        <div className="hero-visual">
          {(products ?? []).slice(0, 4).map((p) => (
            <div className="hero-card" key={p.id}>
              <span>{p.emoji}</span>
              <small>{p.name}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Kategori Pilihan</h2>
        </div>
        <div className="category-grid">
          {CATEGORIES.map((c) => (
            <Link key={c.name} href={`/produk?kategori=${encodeURIComponent(c.name)}`} className="category-tile">
              <span className="emoji">{c.emoji}</span>
              <strong>{c.name}</strong>
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Produk Unggulan</h2>
          <Link href="/produk" className="muted">Lihat semua →</Link>
        </div>
        <div className="product-grid">
          {(products ?? []).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
