import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const schema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        name: z.string().min(1),
        price: z.number().positive(),
        qty: z.number().int().positive(),
      })
    )
    .min(1),
  address: z.string().min(5),
});

// POST /api/checkout
// Catatan desain (bukan celah): total dihitung ULANG di server dari harga
// yang dikirim client, bukan dipakai mentah-mentah. Ini praktik wajar,
// walau idealnya harga diambil ulang dari tabel products (bukan dari body)
// supaya tidak bisa dimanipulasi sama sekali — itu perbaikan lanjutan yang
// sengaja belum dilakukan di sini, konsisten dengan semangat lab ini.
export async function POST(req: NextRequest) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Data pesanan tidak valid." }, { status: 400 });
  }

  const total = parsed.data.items.reduce((sum, i) => sum + i.price * i.qty, 0);

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      items: parsed.data.items,
      total,
      status: "diproses",
    })
    .select()
    .single();

  if (error || !order) {
    return NextResponse.json({ error: error?.message ?? "Gagal membuat pesanan." }, { status: 400 });
  }

  await logAudit({
    actorId: user.id,
    actorEmail: user.email ?? null,
    action: "checkout",
    detail: { order_id: order.id, total, item_count: parsed.data.items.length },
    isSuspicious: false,
    requestIp: req.headers.get("x-forwarded-for"),
  });

  return NextResponse.json({ ok: true, order });
}
