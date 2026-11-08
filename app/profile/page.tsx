import { createServerSupabase } from "@/lib/supabase-server";
import ProfileForm from "./ProfileForm";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <p className="section panel">Silakan masuk dulu.</p>;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, bio, role")
    .eq("id", user.id)
    .single();

  return (
    <div className="section" style={{ maxWidth: 480 }}>
      <div className="panel">
        <h2>Profil Saya</h2>
        <p className="muted" style={{ marginBottom: 16 }}>
          Jenis akun: <span className="badge badge-success">{profile?.role ?? "user"}</span>
        </p>
        <ProfileForm initialUsername={profile?.username ?? ""} initialBio={profile?.bio ?? ""} />
      </div>
    </div>
  );
}
