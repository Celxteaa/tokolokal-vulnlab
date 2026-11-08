import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const schema = z.object({
  key: z.enum(["homepage_title", "homepage_banner"]),
  value: z.string().min(1).max(500),
});

// PATCH /api/site-content
// Dipanggil dari panel /admin. Kode di sini sebenarnya rapi: validasi input
// dengan zod, pakai client yang tunduk RLS (anon key + sesi), tidak ada
// pengecekan role tambahan di level API — karena developer mengira
// "RLS di database sudah cukup menjaga siapa yang boleh update".
// Itu benar SECARA PRINSIP, tapi policy "site_content_update_authenticated"
// di database hanya mengecek status login, bukan role admin. Jadi siapa pun
// yang authenticated (termasuk user yang baru menaikkan role-nya sendiri
// lewat celah /api/profile) bisa lolos sampai sini.
export async function PATCH(req: NextRequest) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Belum masuk." }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Input tidak valid." }, { status: 400 });
  }

  const { error } = await supabase
    .from("site_content")
    .update({ value: parsed.data.value, updated_by: user.id, updated_at: new Date().toISOString() })
    .eq("key", parsed.data.key);

  // Setiap perubahan konten homepage dicatat dan DITANDAI SUSPICIOUS,
  // karena ini jalur yang seharusnya hanya boleh dipakai admin (Celah #2
  // membuatnya terbuka untuk siapa pun yang sekadar login).
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  await logAudit({
    actorId: user.id,
    actorEmail: user.email ?? null,
    action: "site_content_update",
    detail: { key: parsed.data.key, new_value: parsed.data.value, actor_role: profile?.role ?? "unknown" },
    isSuspicious: profile?.role !== "admin",
    requestIp: req.headers.get("x-forwarded-for"),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
