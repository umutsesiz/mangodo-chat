"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

type Me = { id: string; name: string; avatarUrl?: string } | null;

export default function TopNav() {
  const [me, setMe] = useState<Me>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/me");
        const j = await res.json().catch(() => ({}));
        if (!alive || !res.ok) return;
        const avatarUrl = j?.avatarUrl ?? j?.user?.avatarUrl ?? "";
        setMe({ id: j?.id, name: j?.name, avatarUrl });
      } catch {
      }
    })();
    return () => { alive = false; };
  }, []);

  const initial = (me?.name || "K")[0]?.toUpperCase();

  return (
    <nav className="nav mb-6 justify-between">
      <div className="flex items-center gap-2">
        <Link href="/" className="chip">Anasayfa</Link>
        <Link href="/rooms" className="chip">Odalar</Link>
        <Link href="/settings" className="chip">Ayarlar</Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full overflow-hidden bg-neutral-800 grid place-items-center" title={me?.name || "Kullanıcı"}>
          {me?.avatarUrl ? (
            <img
              src={me.avatarUrl}
              alt={me.name || "avatar"}
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="text-sm font-semibold">{initial}</span>
          )}
        </div>
        <form action="/api/auth/logout" method="post">
          <button className="btn btn-ghost" type="submit">Çıkış</button>
        </form>
      </div>
    </nav>
  );
}
