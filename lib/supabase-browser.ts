import { createBrowserClient } from "@supabase/ssr";

// Dipakai di komponen client. Hanya pakai anon key — ini benar dan aman,
// semua akses data tunduk pada RLS di database.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
