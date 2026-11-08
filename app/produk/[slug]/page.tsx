import { createServerSupabase } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import AddToCartBlock from "./AddToCartBlock";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const supabase = createServerSupabase();
  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("slug", params.slug)
    .single();

  if (!product) return notFound();

  return (
    <div className="section" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }}>
      <div className="hero-card" style={{ fontSize: 120, height: 360, justifyContent: "center" }}>
        {product.emoji}
      </div>
      <div>
        <span className="muted">{product.category}</span>
        <h1 style={{ fontSize: 30, marginTop: 6 }}>{product.name}</h1>
        <p className="muted" style={{ maxWidth: "50ch", margin: "12px 0 20px" }}>{product.description}</p>
        <AddToCartBlock product={product} />
        <p className="muted" style={{ marginTop: 16, fontSize: 13 }}>Stok tersedia: {product.stock}</p>
      </div>
    </div>
  );
}
