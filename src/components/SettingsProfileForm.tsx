"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SettingsProfileForm({
  initialName,
  initialAvatarUrl,
}: {
  initialName: string;
  initialAvatarUrl?: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl ?? "");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    setErr(null);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, avatarUrl }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(j?.error ?? "Kaydedilemedi");
        return;
      }
      setMsg("Kaydedildi ✓");
      router.refresh();
    } catch {
      setErr("Ağ hatası");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      <label className="grid gap-1">
        <span className="label">Ad Soyad</span>
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ad Soyad"
          required
        />
      </label>

      <label className="grid gap-1">
        <span className="label">Avatar URL</span>
        <input
          className="input"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          placeholder="https://…"
        />
      </label>

      {err && <div className="text-sm text-red-400">{err}</div>}
      {msg && <div className="text-sm text-green-400">{msg}</div>}

      <button className="btn btn-primary mt-2" type="submit" disabled={loading}>
        {loading ? "Kaydediliyor…" : "Kaydet"}
      </button>
    </form>
  );
}
