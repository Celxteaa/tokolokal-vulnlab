import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase-server";
import { formatRupiah } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<string, string> = {
  selesai: "badge-success",
  diproses: "badge-warning",
  dibatalkan: "badge-danger",
};

export default async function OrdersPage() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <p className="section panel">Silakan <Link href="/login">masuk</Link> untuk melihat pesanan kamu.</p>;
  }

  const { data: orders } = await supabase
    .from("orders")
    .select("id, items, total, status, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="section">
      <h2 style={{ marginBottom: 20 }}>Pesanan Saya</h2>
      {!orders || orders.length === 0 ? (
        <p className="muted">Belum ada pesanan. <Link href="/produk">Mulai belanja</Link>.</p>
      ) : (
        <div className="panel" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Item</th>
                <th>Total</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o: any) => (
                <tr key={o.id}>
                  <td>{new Date(o.created_at).toLocaleDateString("id-ID")}</td>
                  <td>{(o.items ?? []).length} produk</td>
                  <td>{formatRupiah(o.total)}</td>
                  <td><span className={`badge ${STATUS_BADGE[o.status] ?? ""}`}>{o.status}</span></td>
                  <td><Link href={`/pesanan/${o.id}`} className="muted">Detail →</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
