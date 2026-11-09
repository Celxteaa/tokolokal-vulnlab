import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// Client server-side yang tunduk pada sesi user (anon key + RLS).
// Ini jalur yang BENAR untuk sebagian besar endpoint.
export function createServerSupabase() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          // Next.js melarang penulisan cookie di luar Server Action /
          // Route Handler. Saat dipanggil dari Server Component biasa
          // (mis. app/page.tsx saat auto-refresh token Supabase berjalan),
          // panggilan ini akan melempar error — kita abaikan di sini
          // karena middleware.ts yang bertanggung jawab me-refresh
          // session dan menulis cookie yang sebenarnya.
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // no-op: aman diabaikan di dalam Server Component
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // no-op: aman diabaikan di dalam Server Component
          }
        },
      },
    }
  );
}

// Client dengan service_role key — BYPASS RLS sepenuhnya.
// Dipakai di /api/export dan /api/reset. Harus HANYA dipanggil di server,
// dan harus SELALU disertai pengecekan otorisasi manual di kode pemanggil.
// (Celah IDOR di lab ini terjadi karena /api/export lupa melakukan itu.)
export function createServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
