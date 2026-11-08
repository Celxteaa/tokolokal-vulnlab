import { createServerSupabase } from "@/lib/supabase-server";
import { formatRupiah } from "@/lib/format";
import { notFound } from "next/navigation";
import DownloadInvoiceButton from "./DownloadInvoiceButton";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <p className="section panel">Silakan masuk untuk melihat pesanan ini.</p>;
  }

  // Query ini tunduk RLS (orders_select_own), jadi aman — hanya pemilik
  // order yang bisa melihat detailnya di halaman ini.
  const { data: order } = await supabase
    .from("orders")
    .select("id, items, total, status, created_at")
    .eq("id", params.id)
    .single();

  if (!order) return notFound();

  return (
    <div className="section" style={{ maxWidth: 680 }}>
      <div className="panel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h2>Pesanan #{order.id.slice(0, 8)}</h2>
          <span className="badge badge-success">{order.status}</span>
        </div>
        <p className="muted">{new Date(order.created_at).toLocaleString("id-ID")}</p>

        <table style={{ marginTop: 16 }}>
          <thead>
            <tr><th>Produk</th><th>Qty</th><th>Harga</th></tr>
          </thead>
          <tbody>
            {(order.items ?? []).map((item: any, idx: number) => (
              <tr key={idx}>
                <td>{item.name}</td>
                <td>{item.qty}</td>
                <td>{formatRupiah(item.price * item.qty)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, marginTop: 12 }}>
          <span>Total</span>
          <span>{formatRupiah(order.total)}</span>
        </div>

        <DownloadInvoiceButton orderId={order.id} />
      </div>
    </div>
  );
}
