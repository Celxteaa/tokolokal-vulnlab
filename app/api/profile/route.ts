import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { logAudit, looksLikePrivilegeEscalation } from "@/lib/audit";

// PATCH /api/profile
// Endpoint ini terlihat wajar: ambil body, update baris milik user yang login.
// RLS policy "profiles_update_own" memang membatasi baris (auth.uid() = id),
// jadi secara sekilas sudah "aman". Masalahnya: body diteruskan MENTAH-MENTAH
// ke .update(), tanpa whitelist kolom. Kalau body berisi { "role": "admin" },
// RLS tetap mengizinkan karena baris yang diubah tetap milik user itu sendiri —
// hanya kolomnya yang seharusnya tidak boleh diubah lewat jalur ini.
export async function PATCH(req: NextRequest) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Belum masuk." }, { status: 401 });
  }

  const body = await req.json();

  // Perbaikan yang seharusnya ada di sini:
  //   const { username, bio } = body;
  //   const updatePayload = { username, bio };
  // Tapi versi lab ini meneruskan body apa adanya:
  const { error } = await supabase
    .from("profiles")
    .update(body)
    .eq("id", user.id);

  // Catat ke audit log — termasuk menandai kalau body mengandung field "role",
  // yang menjadi indikasi percobaan privilege escalation (Celah #1).
  await logAudit({
    actorId: user.id,
    actorEmail: user.email ?? null,
    action: "profile_update",
    detail: { fields_sent: Object.keys(body) },
    isSuspicious: looksLikePrivilegeEscalation(body),
    requestIp: req.headers.get("x-forwarded-for"),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
