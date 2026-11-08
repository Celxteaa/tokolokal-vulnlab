import { createServerClient } from "@supabase/ssr";
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
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: "", ...options });
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
  const { createClient } = require("@supabase/supabase-js");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
