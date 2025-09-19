import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { Room } from "@/lib/models";
import ChatRoom from "@/components/ChatRoom";

type RoomLean = { _id: string; name: string; isPrivate?: boolean };

export default async function RoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;

  await connectDB();
  const room = await Room.findById(roomId).lean<RoomLean>();
  if (!room) return notFound();

  const me = { id: "", name: "" };

  return (
    <main className="page">
      <div className="mx-auto max-w-3xl flex items-center justify-between gap-3 mb-6">
        <Link
          href="/"
          className="btn btn-ghost text-sm px-3 py-1.5 rounded-xl border border-neutral-800 hover:bg-neutral-900"
        >
          ← Odalara dön
        </Link>
        <h1 className="text-2xl font-semibold text-center flex-1">
          {room.name}
        </h1>
        <div className="w-[110px]" />
      </div>

      <div className="mx-auto max-w-3xl">
        <ChatRoom roomId={roomId} me={me} /> {/* Büyük harf ve roomId değişkeni */}
      </div>
    </main>
  );
}
