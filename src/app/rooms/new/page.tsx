"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewRoomPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [emails, setEmails] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function createRoom(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const memberEmails = emails
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, isPrivate, memberEmails }),
      });

      const j = await res.json();
      if (!res.ok) {
        setErr(j?.error || "Oda oluşturulamadı");
      } else {
        router.replace(`/rooms/${j.room._id}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <div className="mx-auto max-w-md card">
        <h2 className="text-xl font-semibold mb-4">Yeni Oda</h2>

        <form onSubmit={createRoom} className="grid-gap">
          <label className="grid gap-1">
            <span className="label">Oda adı</span>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </label>

          <label className="flex items-center gap-2">
            <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />
            <span>Özel oda (sadece üyeler erişebilir)</span>
          </label>

          {isPrivate && (
            <label className="grid gap-1">
              <span className="label">Üye e-postaları (virgülle)</span>
              <input
                className="input"
                placeholder="ali@x.com, ayse@y.com"
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
              />
            </label>
          )}

          {err && <div className="text-sm text-red-400">{err}</div>}

          <button className="btn btn-primary mt-2" type="submit" disabled={loading}>
            {loading ? "Oluşturuluyor…" : "Oluştur"}
          </button>
        </form>
      </div>
    </main>
  );
}
