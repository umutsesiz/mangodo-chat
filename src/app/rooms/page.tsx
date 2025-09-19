import Link from "next/link";
import { cookies } from "next/headers";

type RoomLite = { _id: string; name: string; isPrivate?: boolean };

function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL!;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export default async function RoomsPage() {
  const cookieHeader = (await cookies()).toString();
  const base = getBaseUrl();

  let rooms: RoomLite[] = [];
  let loadError: string | null = null;

  try {
    const res = await fetch(`${base}/api/rooms`, {
      method: "GET",
      cache: "no-store",
      headers: { cookie: cookieHeader },
    });

    const j = await res.json().catch(() => ({}));
    if (res.ok) {
      const list: RoomLite[] = Array.isArray(j.items) ? j.items : [];
      rooms = list;
    } else {
      loadError = j?.error || `Hata: ${res.status}`;
      rooms = [];
    }
  } catch {
    loadError = "Oda listesi alınamadı";
  }

  return (
    <main className="page">
      <div className="mx-auto max-w-3xl flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="btn btn-ghost">&larr; Geri</Link>
          <h1 className="text-2xl font-semibold">Odalar</h1>
        </div>
        <Link href="/rooms/new" className="btn btn-primary">Yeni Oda</Link>
      </div>

      {loadError && (
        <div className="mx-auto max-w-3xl mb-4 text-sm text-red-400">
          {loadError === "unauthorized"
            ? "Oda listesini görmek için giriş yapmalısın."
            : loadError}
        </div>
      )}

      <ul className="mx-auto max-w-3xl space-y-3">
        {rooms.length === 0 ? (
          <li className="text-neutral-500">Görüntülenecek oda yok.</li>
        ) : (
          rooms.map((r) => (
            <li key={r._id} className="flex items-center gap-3">
              <Link href={`/rooms/${r._id}`} className="link text-lg">
                {r.name}
              </Link>
              {r.isPrivate && (
                <span className="text-xs px-2 py-0.5 rounded-full border border-neutral-700">
                  private
                </span>
              )}
            </li>
          ))
        )}
      </ul>
    </main>
  );
}
