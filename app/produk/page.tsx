import { createServerSupabase } from "@/lib/supabase-server";
import ProductCard from "../components/ProductCard";

export const dynamic = "force-dynamic";

const CATEGORIES = ["Kerajinan Tangan", "Fashion & Tekstil", "Makanan & Minuman", "Dekorasi Rumah"];

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { kategori?: string; q?: string };
}) {
  const supabase = createServerSupabase();
  let query = supabase.from("products").select("*").order("name");

  if (searchParams.kategori) {
    query = query.eq("category", searchParams.kategori);
  }
  if (searchParams.q) {
    query = query.ilike("name", `%${searchParams.q}%`);
  }

  const { data: products } = await query;

  return (
    <div className="section">
      <div className="section-head">
        <h2>{searchParams.kategori ?? "Semua Produk"}</h2>
      </div>

      <form method="get" style={{ maxWidth: 360, marginBottom: 24 }}>
        <input type="text" name="q" placeholder="Cari produk..." defaultValue={searchParams.q ?? ""} />
      </form>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 28 }}>
        <a href="/produk" className={`badge ${!searchParams.kategori ? "badge-success" : ""}`}>Semua</a>
        {CATEGORIES.map((c) => (
          <a
            key={c}
            href={`/produk?kategori=${encodeURIComponent(c)}`}
            className={`badge ${searchParams.kategori === c ? "badge-success" : ""}`}
          >
            {c}
          </a>
        ))}
      </div>

      {products && products.length > 0 ? (
        <div className="product-grid">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <p className="muted">Produk tidak ditemukan.</p>
      )}
    </div>
  );
}
