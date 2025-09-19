"use client";

import { useState } from "react";

export default function SettingsPasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
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
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(j?.error ?? "Şifre değiştirilemedi");
        return;
      }
      setMsg("Şifre güncellendi ✓");
      setCurrentPassword("");
      setNewPassword("");
    } catch {
      setErr("Ağ hatası");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      <label className="grid gap-1">
        <span className="label">Mevcut şifre</span>
        <input
          className="input"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
      </label>

      <label className="grid gap-1">
        <span className="label">Yeni şifre</span>
        <input
          className="input"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
      </label>

      {err && <div className="text-sm text-red-400">{err}</div>}
      {msg && <div className="text-sm text-green-400">{msg}</div>}

      <button className="btn btn-primary mt-2" type="submit" disabled={loading}>
        {loading ? "Değiştiriliyor…" : "Değiştir"}
      </button>
    </form>
  );
}
