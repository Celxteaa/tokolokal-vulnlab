import { createServiceSupabase } from "@/lib/supabase-server";

type AuditAction =
  | "profile_update"
  | "site_content_update"
  | "export_access"
  | "reset"
  | "checkout"
  | "login_success"
  | "login_failed"
  | "logout"
  | "register"
  | "admin_access_denied";

// Dipanggil dari API route untuk mencatat jejak aktivitas.
// Pakai service_role supaya tetap tercatat walau RLS menolak aksi utamanya
// (misalnya percobaan yang gagal tetap mau dicatat sebagai percobaan).
export async function logAudit(params: {
  actorId: string | null;
  actorEmail: string | null;
  action: AuditAction;
  detail: Record<string, unknown>;
  isSuspicious?: boolean;
  requestIp?: string | null;
}) {
  try {
    const service = createServiceSupabase();
    await service.from("audit_log").insert({
      actor_id: params.actorId,
      actor_email: params.actorEmail,
      action: params.action,
      detail: params.detail,
      is_suspicious: params.isSuspicious ?? false,
      request_ip: params.requestIp ?? null,
    });
  } catch {
    // Logging tidak boleh menggagalkan request utama.
  }
}

// Heuristik sederhana: body yang menyertakan field 'role' di luar flow normal
// dianggap mencurigakan (indikasi percobaan mass assignment / privilege escalation).
export function looksLikePrivilegeEscalation(body: Record<string, unknown>) {
  return Object.prototype.hasOwnProperty.call(body, "role");
}
