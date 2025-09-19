import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-guard";
import LogoutButton from "@/components/LogoutButton";

export default async function Home() {
  const me = await requireUser();
  if (!me) { redirect("/login"); }
  const user = me!;

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="relative w-full max-w-xl">
        <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-r from-indigo-500/20 via-fuchsia-500/20 to-purple-500/20 blur-2xl opacity-70" />
        <div className="rounded-3xl p-px bg-gradient-to-r from-indigo-500/40 via-fuchsia-500/40 to-purple-500/40 shadow-2xl">
          <div className="rounded-3xl border border-white/10 bg-neutral-900/60 backdrop-blur-md px-6 py-7 sm:px-8 sm:py-9">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 shrink-0 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 grid place-items-center text-white font-semibold">
                {user.name?.[0]?.toUpperCase() ?? "K"}
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  Hoş geldin,{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-fuchsia-400">
                    {user.name}
                  </span>{" "}
                  👋
                </h1>
                <p className="text-sm text-neutral-400">{user.email}</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <a href="/settings" className="btn w-full transition hover:-translate-y-0.5">
                Profil / Şifre
              </a>
              <a href="/rooms" className="btn btn-primary w-full transition hover:-translate-y-0.5">
                Sohbet Odaları
              </a>
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
