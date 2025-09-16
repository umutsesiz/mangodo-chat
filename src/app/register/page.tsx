"use client";
import { useState } from "react";

export default function Register() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string|null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true); setMsg(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        email: fd.get("email"),
        password: fd.get("password"),
      }),
    });
    const data = await res.json();
    setLoading(false);
    setMsg(res.ok ? "Aktivasyon e-postası gönderildi." : (data.error ?? "Hata"));
  }

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-3 border p-6 rounded-2xl">
        <h1 className="text-2xl font-semibold">Kayıt ol</h1>
        <input name="name" placeholder="Ad" className="input" required />
        <input name="email" placeholder="E-posta" type="email" className="input" required />
        <input name="password" placeholder="Şifre" type="password" className="input" required />
        <button disabled={loading} className="btn w-full">{loading ? "Gönderiliyor…" : "Kayıt ol"}</button>
        {msg && <p className="text-sm">{msg}</p>}
      </form>
    </div>
  );
}
