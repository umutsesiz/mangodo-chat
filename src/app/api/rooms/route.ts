import { NextResponse } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import { Room, User } from "@/lib/models";

function getUserIdFromCookie(req: Request): string | null {
  const cookie = req.headers.get("cookie") || "";
  const m = cookie.match(/(?:^|;\s*)session=([^;]+)/);
  if (!m) return null;
  try {
    const token = decodeURIComponent(m[1]);
    const secret = process.env.JWT_SECRET as string;
    const p = jwt.verify(token, secret) as JwtPayload & { uid?: string };
    return p?.uid || null;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  try {
    await connectDB();

    const count = await Room.countDocuments();
    if (count === 0) {
      await Room.create({ name: "Genel", isPrivate: false, members: [] });
    }

    const uid = getUserIdFromCookie(req);

    const query: any = uid
      ? { $or: [{ isPrivate: false }, { isPrivate: true, members: uid }] }
      : { isPrivate: false };

    const rooms = await Room.find(query).sort({ createdAt: 1 }).lean();

    return NextResponse.json({
      ok: true,
      items: rooms.map((r: any) => ({
        _id: String(r._id),
        name: r.name,
        isPrivate: !!r.isPrivate,
      })),
    });
  } catch (e) {
    console.error("[GET /api/rooms] error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const uid = getUserIdFromCookie(req);
    if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { name, isPrivate = false } = await req.json().catch(() => ({}));
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json({ error: "invalid_name" }, { status: 400 });
    }

    const room = await Room.create({
      name: name.trim(),
      isPrivate: !!isPrivate,
      members: isPrivate ? [uid] : [],
    });

    return NextResponse.json({
      ok: true,
      room: { _id: String(room._id), name: room.name, isPrivate: room.isPrivate },
    });
  } catch (e) {
    console.error("[POST /api/rooms] error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
