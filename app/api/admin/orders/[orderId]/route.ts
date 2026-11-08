import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { z } from "zod";

const schema = z.object({ status: z.enum(["diproses", "selesai", "dibatalkan"]) });

// PATCH /api/admin/orders/[orderId]
// Tidak ada pengecekan role manual di sini — endpoint ini SEPENUHNYA
// mengandalkan policy "orders_update_admin" di database (yang memang sudah
// benar, mengecek role = 'admin'). Pola ini konsisten dengan filosofi app
// lain di proyek ini: percaya ke RLS. Karena policy-nya di tabel ini benar,
// endpoint ini AMAN — kecuali attacker sudah menaikkan role-nya sendiri
// lewat Celah #1 di /api/profile.
export async function PATCH(req: NextRequest, { params }: { params: { orderId: string } }) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Belum masuk." }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Status tidak valid." }, { status: 400 });
  }

  const { error } = await supabase
    .from("orders")
    .update({ status: parsed.data.status })
    .eq("id", params.orderId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  return NextResponse.json({ ok: true });
}
