import TopNav from "@/components/TopNav";

export default function SettingsPage() {
  async function saveProfile(formData: FormData) {
    "use server";
    const name = String(formData.get("name") || "");
    const avatar = String(formData.get("avatar") || "");
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/settings/profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, avatar }),
    });
  }

  async function changePassword(formData: FormData) {
    "use server";
    const current = String(formData.get("current") || "");
    const next = String(formData.get("next") || "");
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/settings/password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current, next }),
    });
  }

  return (
    <main className="page">
      <TopNav />
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Profil</h2>
          <form action={saveProfile} className="grid-gap">
            <label className="grid gap-1">
              <span className="label">Ad Soyad</span>
              <input name="name" className="input" />
            </label>
            <label className="grid gap-1">
              <span className="label">Avatar URL</span>
              <input name="avatar" className="input" />
            </label>
            <button className="btn btn-primary mt-2" type="submit">Kaydet</button>
          </form>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Şifre</h2>
          <form action={changePassword} className="grid-gap">
            <label className="grid gap-1">
              <span className="label">Mevcut şifre</span>
              <input name="current" type="password" className="input" />
            </label>
            <label className="grid gap-1">
              <span className="label">Yeni şifre</span>
              <input name="next" type="password" className="input" />
            </label>
            <button className="btn btn-primary mt-2" type="submit">Değiştir</button>
          </form>
        </div>
      </div>
    </main>
  );
}
