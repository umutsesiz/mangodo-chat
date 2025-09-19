"use client";
import Link from "next/link";

export default function TopNav() {
  return (
    <nav className="nav mb-6 justify-between">
      <div className="flex items-center gap-2">
        <Link href="/" className="chip">Anasayfa</Link>
        <Link href="/rooms" className="chip">Odalar</Link>
        <Link href="/settings" className="chip">Ayarlar</Link>
      </div>
      <form action="/api/auth/logout" method="post">
        <button className="btn btn-ghost" type="submit">Çıkış</button>
      </form>
    </nav>
  );
}
