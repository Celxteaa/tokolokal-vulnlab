import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const schema = z.object({
  action: z.enum(["login_success", "login_failed", "logout", "register", "admin_access_denied"]),
  email: z.string().email().optional(),
  detail: z.record(z.unknown()).optional(),
});

// POST /api/log-event
// Login, logout, dan registrasi terjadi langsung dari browser lewat
// Supabase Auth (bukan lewat API route kita), jadi tidak ada tempat alami
// di server untuk mencatatnya kecuali lewat endpoint kecil ini yang
// dipanggil dari halaman client setelah aksi tersebut selesai.
export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload tidak valid." }, { status: 400 });
  }

  // Untuk login_success/logout, ambil identitas dari sesi yang sedang aktif
  // (lebih bisa dipercaya daripada apa pun yang dikirim client).
  const authed = createServerSupabase();
  const {
    data: { user },
  } = await authed.auth.getUser();

  const isSuspicious = parsed.data.action === "admin_access_denied";

  await logAudit({
    actorId: user?.id ?? null,
    actorEmail: user?.email ?? parsed.data.email ?? null,
    action: parsed.data.action,
    detail: parsed.data.detail ?? {},
    isSuspicious,
    requestIp: req.headers.get("x-forwarded-for"),
  });

  return NextResponse.json({ ok: true });
}
