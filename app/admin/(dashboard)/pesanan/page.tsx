import { createServerSupabase } from "@/lib/supabase-server";
import { formatRupiah } from "@/lib/format";
import OrderStatusSelect from "./OrderStatusSelect";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const supabase = createServerSupabase();

  // Query ini tunduk policy "orders_select_admin" — hanya mengembalikan
  // baris kalau akun yang login benar-benar role 'admin' di tabel profiles.
  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, user_id, items, total, status, created_at")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 20 }}>Semua Pesanan</h1>

      {error && <p className="muted">Tidak bisa memuat pesanan: akun kamu mungkin belum berrole admin.</p>}

      {orders && orders.length === 0 && <p className="muted">Belum ada pesanan masuk.</p>}

      {orders && orders.length > 0 && (
        <div className="panel" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Tanggal</th>
                <th>Item</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o: any) => (
                <tr key={o.id}>
                  <td>{o.id.slice(0, 8)}</td>
                  <td>{new Date(o.created_at).toLocaleDateString("id-ID")}</td>
                  <td>{(o.items ?? []).length} produk</td>
                  <td>{formatRupiah(o.total)}</td>
                  <td><OrderStatusSelect orderId={o.id} currentStatus={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
