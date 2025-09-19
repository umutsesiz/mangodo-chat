"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => {
      setCooldown((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (cooldown > 0) {
      setErr(`Çok fazla deneme. ${cooldown} sn sonra tekrar deneyebilirsin.`);
      return;
    }

    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        if (res.status === 429) {
          const retryAfter =
            parseInt(res.headers.get("retry-after") || "", 10) ||
            parseInt(res.headers.get("x-ratelimit-reset") || "", 10) ||
            0;
          if (Number.isFinite(retryAfter) && retryAfter > 0) {
            setCooldown(retryAfter);
          }
          const j = await res.json().catch(() => ({}));
          setErr(j?.error ?? "Çok fazla deneme. Lütfen biraz bekleyin.");
        } else {
          const j = await res.json().catch(() => ({}));
          setErr(j?.error ?? "Giriş başarısız");
        }
      } else {
        router.replace("/");
      }
    } catch {
      setErr("Bağlantı hatası");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <div className="mx-auto max-w-md card">
        <h2 className="text-xl font-semibold mb-4">Giriş yap</h2>

        <form onSubmit={onSubmit} className="grid-gap">
          <label className="grid gap-1">
            <span className="label">E-posta</span>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>

          <label className="grid gap-1">
            <span className="label">Şifre</span>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>

          {err && <div className="text-sm text-red-400">{err}</div>}
          {cooldown > 0 && (
            <div className="text-xs text-neutral-400">
              Tekrar denemek için {cooldown} saniye bekleyin.
            </div>
          )}

          <button
            className="btn btn-primary mt-2"
            type="submit"
            disabled={loading || cooldown > 0}
          >
            {loading ? "Giriş yapılıyor…" : cooldown > 0 ? `Bekleyin (${cooldown})` : "Giriş yap"}
          </button>
        </form>

        <p className="mt-4 text-sm text-neutral-400">
          Hesabın yok mu?{" "}
          <Link className="link" href="/register">
            Kayıt ol
          </Link>
        </p>
      </div>
    </main>
  );
}
