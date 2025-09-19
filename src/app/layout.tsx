import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mangodo Chat",
  description: "Realtime chat",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className="dark">
      <body className={`${inter.className} bg-neutral-950 text-neutral-100`}>
        <div className="mx-auto max-w-3xl px-4">
          <header className="py-6">
            <h1 className="text-center text-3xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Mangodo Chat
              </span>
            </h1>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
