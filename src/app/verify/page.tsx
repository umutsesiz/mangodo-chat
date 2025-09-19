"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function VerifyPage() {
  const sp = useSearchParams();
  const router = useRouter();

  const email  = sp?.get("email")  ?? "";
  const preview = sp?.get("p")     ?? "";
  const token  = sp?.get("token")  ?? "";

  const [status, setStatus] = useState<"idle"|"loading"|"ok"|"err">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!email && !token) router.replace("/register");
  }, [email, token, router]);

  useEffect(() => {
    if (!token) return;
    setStatus("loading");
    (async () => {
      try {
        const res = await fetch(`/api/auth/verify?token=${encodeURIComponent(token)}`, { method: "POST" });
        const j = await res.json().catch(() => ({}));
        if (res.ok && (j?.ok || j?.message)) {
          setStatus("ok");
          setMessage("E-posta doğrulandı. Giriş yapabilirsiniz.");
        } else {
          setStatus("err");
          setMessage(j?.error ?? "Doğrulama başarısız.");
        }
      } catch {
        setStatus("err");
        setMessage("Ağ hatası.");
      }
    })();
  }, [token]);

  if (email && !token) {
    return (
      <main className="page">
        <div className="mx-auto max-w-md card space-y-4">
          <h2 className="text-xl font-semibold">E-postanı doğrula</h2>
          <p className="text-sm text-neutral-300">
            <b>{email}</b> adresine bir doğrulama bağlantısı gönderdik. Lütfen e-postayı açıp bağlantıya tıkla.
          </p>

          {preview ? (
            <div className="space-y-2">
              <a href={preview} target="_blank" rel="noreferrer" className="btn btn-primary">Ethereal önizlemeyi aç</a>
              <div className="text-xs text-neutral-400">Açılmıyorsa linki kopyala:</div>
              <div className="flex gap-2">
                <input className="input flex-1" readOnly value={preview} onFocus={(e) => e.currentTarget.select()} />
                <button className="btn" type="button" onClick={() => navigator.clipboard.writeText(preview)}>Kopyala</button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-neutral-500">Geliştirmede <code>previewUrl</code> server loglarında da görünür.</p>
          )}

          <div className="border-t border-neutral-800 pt-4 space-y-2">
            <p className="text-sm text-neutral-300">Bağlantıya tıkladıktan sonra giriş yapabilirsin.</p>
            <Link href="/login" className="btn">Giriş yap</Link>
          </div>
        </div>
      </main>
    );
  }

  if (token) {
    return (
      <main className="page">
        <div className="mx-auto max-w-md card space-y-4">
          <h2 className="text-xl font-semibold">E-posta doğrulama</h2>
          {status === "loading" && <p className="text-sm text-neutral-300">Doğrulanıyor…</p>}
          {status === "ok" && (<><p className="text-sm text-green-400">{message || "Doğrulandı."}</p><Link href="/login" className="btn">Giriş yap</Link></>)}
          {status === "err" && (<><p className="text-sm text-red-400">{message || "Doğrulama başarısız."}</p><Link href="/register" className="btn">Kayıt sayfasına dön</Link></>)}
        </div>
      </main>
    );
  }
  return null;
}
