// Dipanggil dari komponen client setelah aksi auth selesai (login, logout,
// register, atau percobaan akses admin yang ditolak). Dibuat "fire and
// forget" — kalau gagal, tidak boleh mengganggu alur utama pengguna.
export function logEvent(
  action: "login_success" | "login_failed" | "logout" | "register" | "admin_access_denied",
  payload: { email?: string; detail?: Record<string, unknown> } = {}
) {
  fetch("/api/log-event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload }),
  }).catch(() => {
    // abaikan
  });
}
