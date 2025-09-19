"use client";

import TopNav from "@/components/TopNav";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SettingsPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [pLoading, setPLoading] = useState(false);
  const [pErr, setPErr] = useState<string | null>(null);
  const [pMsg, setPMsg] = useState<string | null>(null);

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [sLoading, setSLoading] = useState(false);
  const [sErr, setSErr] = useState<string | null>(null);
  const [sMsg, setSMsg] = useState<string | null>(null);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setPLoading(true); setPErr(null); setPMsg(null);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, avatarUrl: avatar }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) { setPErr(j?.error ?? "Kaydedilemedi"); return; }
      setPMsg("Kaydedildi ✓");
      router.refresh();
    } catch {
      setPErr("Ağ hatası");
    } finally {
      setPLoading(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setSLoading(true); setSErr(null); setSMsg(null);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) { setSErr(j?.error ?? "Şifre değiştirilemedi"); return; }
      setSMsg("Şifre güncellendi ✓");
      setCurrent(""); setNext("");
    } catch {
      setSErr("Ağ hatası");
    } finally {
      setSLoading(false);
    }
  }

  return (
    <main className="page">
      <TopNav />

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Profil</h2>

          <form onSubmit={saveProfile} className="grid-gap">
            <label className="grid gap-1">
              <span className="label">Ad Soyad</span>
              <input
                name="name"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ad Soyad"
              />
            </label>

            <label className="grid gap-1">
              <span className="label">Avatar URL</span>
              <input
                name="avatar"
                className="input"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="https://…"
              />
            </label>

            {pErr && <div className="text-sm text-red-400">{pErr}</div>}
            {pMsg && <div className="text-sm text-green-400">{pMsg}</div>}

            <button className="btn btn-primary mt-2" type="submit" disabled={pLoading}>
              {pLoading ? "Kaydediliyor…" : "Kaydet"}
            </button>
          </form>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Şifre</h2>

          <form onSubmit={changePassword} className="grid-gap">
            <label className="grid gap-1">
              <span className="label">Mevcut şifre</span>
              <input
                name="current"
                type="password"
                className="input"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
              />
            </label>

            <label className="grid gap-1">
              <span className="label">Yeni şifre</span>
              <input
                name="next"
                type="password"
                className="input"
                value={next}
                onChange={(e) => setNext(e.target.value)}
              />
            </label>

            {sErr && <div className="text-sm text-red-400">{sErr}</div>}
            {sMsg && <div className="text-sm text-green-400">{sMsg}</div>}

            <button className="btn btn-primary mt-2" type="submit" disabled={sLoading}>
              {sLoading ? "Değiştiriliyor…" : "Değiştir"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
