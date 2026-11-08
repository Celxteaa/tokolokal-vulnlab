import { createServerSupabase } from "@/lib/supabase-server";
import AdminForm from "../AdminForm";

export const dynamic = "force-dynamic";

export default async function AdminContentPage() {
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("site_content")
    .select("key, value")
    .in("key", ["homepage_title", "homepage_banner"]);

  const content: Record<string, string> = {};
  data?.forEach((row) => (content[row.key] = row.value));

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 20 }}>Konten Beranda</h1>
      <div className="panel" style={{ maxWidth: 520 }}>
        <p className="muted" style={{ marginBottom: 16, fontSize: 13 }}>
          Ubah judul dan teks promosi yang tampil di halaman utama toko.
        </p>
        <AdminForm initialTitle={content.homepage_title ?? ""} initialBanner={content.homepage_banner ?? ""} />
      </div>
    </div>
  );
}
