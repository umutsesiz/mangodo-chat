import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Message, Room, User } from "@/lib/models";
import { requireUser } from "@/lib/auth-guard";

const PAGE_SIZE_DEFAULT = 20;

export async function GET(req: Request, { params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  if (!mongoose.isValidObjectId(roomId)) {
    return NextResponse.json({ error: "Invalid room id" }, { status: 400 });
  }

  const url = new URL(req.url);
  const cursor = url.searchParams.get("cursor");
  const limit = Math.min(Number(url.searchParams.get("limit") || PAGE_SIZE_DEFAULT), 50);

  await connectDB();
  const room = await Room.findById(roomId).lean();
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  const filter: any = { roomId };
  if (cursor) {
    const before = new Date(isNaN(Number(cursor)) ? cursor : Number(cursor));
    filter.createdAt = { $lt: before };
  }

  const docs = await Message.find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit)
    .lean();

  const items = docs.map((d: any) => ({
    _id: String(d._id),
    roomId: String(d.roomId),
    senderId: String(d.senderId),
    content: d.content,
    createdAt: d.createdAt,
  }));

  const nextCursor =
    items.length === limit ? String(new Date(items[items.length - 1].createdAt).getTime()) : null;

  const senderIds = [...new Set(items.map(i => i.senderId))];
  const users = await User.find({ _id: { $in: senderIds } }, { name: 1 }).lean();
  const userMap = Object.fromEntries(users.map(u => [String(u._id), u.name]));

  return NextResponse.json({ ok: true, items, nextCursor, userMap });
}

export async function POST(req: Request, { params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  if (!mongoose.isValidObjectId(roomId)) {
    return NextResponse.json({ error: "Invalid room id" }, { status: 400 });
  }

  const me = await requireUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({} as any));
  const content = (body?.content ?? "").toString().trim();
  if (content.length < 1 || content.length > 2000) {
    return NextResponse.json({ error: "Invalid content" }, { status: 400 });
  }

  await connectDB();
  const room = await Room.findById(roomId).lean();
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  const msg = await Message.create({
    roomId,
    senderId: me._id,
    content,
  });

  const messagePayload = {
    _id: String(msg._id),
    roomId: String(msg.roomId),
    senderId: String(msg.senderId),
    content: msg.content,
    createdAt: msg.createdAt,
  };

  try {
    const io = (global as any)._io;
    if (io) io.to(roomId).emit("new_message", messagePayload);
  } catch {
  }

  return NextResponse.json({ ok: true, message: messagePayload });
}
