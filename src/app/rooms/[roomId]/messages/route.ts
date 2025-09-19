import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Message, User, Room } from "@/lib/models";

function parseCursor(cur?: string | null) {
  if (!cur) return null;
  const [msStr, id] = cur.split("_");
  const ms = Number(msStr);
  if (!Number.isFinite(ms) || !id || !mongoose.isValidObjectId(id)) return null;
  return { dt: new Date(ms), id: new mongoose.Types.ObjectId(id) };
}

export async function GET(
  req: Request,
  { params }: { params: { roomId: string } }
) {
  try {
    await connectDB();

    const { roomId } = params;
    if (!mongoose.isValidObjectId(roomId)) {
      return NextResponse.json({ error: "bad_room" }, { status: 400 });
    }

    const room = await Room.findById(roomId).lean();
    if (!room) return NextResponse.json({ error: "room_not_found" }, { status: 404 });

    const url = new URL(req.url);
    const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get("limit") || "20", 10)));
    const cursorRaw = url.searchParams.get("cursor");
    const cur = parseCursor(cursorRaw);

    const filter: any = { roomId: new mongoose.Types.ObjectId(roomId) };
    if (cur) {
      filter.$or = [
        { createdAt: { $lt: cur.dt } },
        { createdAt: cur.dt, _id: { $lt: cur.id } },
      ];
    }

    const docs = await Message.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .lean();

    const senderIds = Array.from(
      new Set(docs.map((d: any) => String(d.senderId)))
    );
    let userMap: Record<string, string> = {};
    if (senderIds.length) {
      const users = await User.find({ _id: { $in: senderIds } })
        .select({ name: 1 })
        .lean<{ _id: any; name: string }[]>();
      userMap = Object.fromEntries(users.map((u) => [String(u._id), u.name]));
    }

    let nextCursor: string | null = null;
    if (docs.length === limit) {
      const last = docs[docs.length - 1];
      nextCursor = `${+new Date(last.createdAt)}_${String(last._id)}`;
    }

    const items = docs.map((d: any) => ({
      _id: String(d._id),
      roomId: String(d.roomId),
      senderId: String(d.senderId),
      content: d.content,
      createdAt: d.createdAt,
    }));

    return NextResponse.json({ items, nextCursor, userMap });
  } catch (e) {
    console.error("[GET /api/rooms/:roomId/messages] error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
