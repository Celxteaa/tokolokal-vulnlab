import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase, createServiceSupabase } from "@/lib/supabase-server";
import { logAudit } from "@/lib/audit";

// GET /api/export/[orderId]
// Fitur "unduh invoice" ditambahkan belakangan oleh developer yang berbeda.
// Supaya generate PDF/ringkasan invoice tidak dibatasi RLS (misal perlu join
// data lain), dia pakai service_role key yang membypass RLS sepenuhnya.
// Dia sudah mengecek user harus login — tapi LUPA memverifikasi bahwa
// order_id yang diminta benar milik user yang login. Endpoint lain di app
// ini (yang pakai anon key biasa) tidak kena masalah ini karena RLS
// otomatis membatasi, tapi endpoint khusus ini melewati RLS sama sekali.
export async function GET(req: NextRequest, { params }: { params: { orderId: string } }) {
  const authed = createServerSupabase();
  const {
    data: { user },
  } = await authed.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Belum masuk." }, { status: 401 });
  }

  const service = createServiceSupabase();
  // CELAH: tidak ada .eq("user_id", user.id) di sini.
  const { data: order, error } = await service
    .from("orders")
    .select("id, items, total, status, created_at, user_id")
    .eq("id", params.orderId)
    .single();

  if (error || !order) {
    await logAudit({
      actorId: user.id,
      actorEmail: user.email ?? null,
      action: "export_access",
      detail: { order_id: params.orderId, found: false },
      isSuspicious: false,
      requestIp: req.headers.get("x-forwarded-for"),
    });
    return NextResponse.json({ error: "Order tidak ditemukan." }, { status: 404 });
  }

  // Ditandai SUSPICIOUS kalau order yang diakses bukan milik user yang login —
  // ini jejak langsung dari percobaan IDOR (Celah #3).
  await logAudit({
    actorId: user.id,
    actorEmail: user.email ?? null,
    action: "export_access",
    detail: { order_id: order.id, order_owner_id: order.user_id, found: true },
    isSuspicious: order.user_id !== user.id,
    requestIp: req.headers.get("x-forwarded-for"),
  });

  return NextResponse.json({ order });
}
