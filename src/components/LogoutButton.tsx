"use client";
import { useState } from "react";

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);

  async function onLogout() {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <button onClick={onLogout} disabled={loading} className="btn">
      {loading ? "Çıkış yapılıyor…" : "Çıkış"}
    </button>
  );
}
