import { NextResponse } from "next/server";
import { createServerSupabase, createServiceSupabase } from "@/lib/supabase-server";
import { logAudit } from "@/lib/audit";

// POST /api/reset
// Mekanisme reset lab: kembalikan site_content ke isi asli dari
// site_content_defaults, supaya lab bisa diulang tanpa redeploy.
// Memakai service_role karena memang bagian "operasional lab", bukan
// bagian dari aplikasi yang sedang diuji.
export async function POST() {
  const authed = createServerSupabase();
  const {
    data: { user },
  } = await authed.auth.getUser();

  const service = createServiceSupabase();

  const { data: defaults, error: readError } = await service
    .from("site_content_defaults")
    .select("key, value");

  if (readError || !defaults) {
    return NextResponse.json({ error: "Gagal membaca default." }, { status: 500 });
  }

  for (const row of defaults) {
    await service
      .from("site_content")
      .update({ value: row.value, updated_by: null, updated_at: new Date().toISOString() })
      .eq("key", row.key);
  }

  await logAudit({
    actorId: user?.id ?? null,
    actorEmail: user?.email ?? null,
    action: "reset",
    detail: { keys_reset: defaults.map((d) => d.key) },
    isSuspicious: false,
  });

  return NextResponse.json({ ok: true, message: "Site content direset ke default." });
}
