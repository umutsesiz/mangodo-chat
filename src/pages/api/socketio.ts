import type { NextApiRequest, NextApiResponse } from "next";
import { Server as IOServer, Socket } from "socket.io";
import jwt, { JwtPayload } from "jsonwebtoken";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Message, Room, User } from "@/lib/models";

export const config = { api: { bodyParser: false } };

type AuthedSocket = Socket & { data: { userId?: string; name?: string } };

function parseCookies(header?: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  header.split(";").forEach((p) => {
    const [k, ...rest] = p.trim().split("=");
    out[k] = decodeURIComponent(rest.join("=") || "");
  });
  return out;
}

type PresenceMap = Map<string, Map<string, { name: string; count: number }>>;

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  const anyRes = res as any;

  if (!anyRes.socket.server.io) {
    const io = new IOServer(anyRes.socket.server, {
      path: "/api/socketio",
      cors: { origin: "*" },
    });

    (global as any)._io = io;
    const presence: PresenceMap = (global as any)._presence || new Map();
    (global as any)._presence = presence;

    const emitMembers = (roomId: string) => {
      const m = presence.get(roomId);
      const members = m ? Array.from(m.entries()).map(([id, v]) => ({ id, name: v.name })) : [];
      io.to(roomId).emit("room_members", { roomId, members });
    };

    io.use(async (socket: AuthedSocket, next) => {
      try {
        const cookies = parseCookies(socket.request.headers.cookie);
        const token = cookies["session"];
        if (!token) return next(new Error("no-session"));
        const secret = process.env.JWT_SECRET as string;
        const payload = jwt.verify(token, secret) as JwtPayload & { uid: string };
        socket.data.userId = payload.uid;
        await connectDB();
        const u = await User.findById(payload.uid).select({ name: 1 }).lean<{ name: string } | null>();
        if (u?.name) socket.data.name = u.name;
        next();
      } catch {
        next(new Error("unauthorized"));
      }
    });

    io.on("connection", (socket: AuthedSocket) => {
      socket.on("join_room", async (roomId: string) => {
        if (!roomId || !mongoose.isValidObjectId(roomId)) return;

        await connectDB();
        const room = await Room.findById(roomId)
          .select({ isPrivate: 1, members: 1 })
          .lean<{ isPrivate: boolean; members: any[] } | null>();
        if (!room) return;

        if (room.isPrivate) {
          const uid = socket.data.userId!;
          const ok = room.members?.some?.((m: any) => String(m) === String(uid));
          if (!ok) {
            socket.emit("error", { message: "Access denied" });
            return;
          }
        }

        socket.join(roomId);

        const uid = socket.data.userId!;
        const name = socket.data.name ?? "Kullanıcı";
        if (!presence.has(roomId)) presence.set(roomId, new Map());
        const roomMap = presence.get(roomId)!;
        const entry = roomMap.get(uid);
        if (entry) entry.count += 1;
        else roomMap.set(uid, { name, count: 1 });
        emitMembers(roomId);
      });

      socket.on("typing", (p: { roomId: string }) => {
        const rid = p?.roomId;
        if (!rid || !mongoose.isValidObjectId(rid)) return;
        socket.to(rid).emit("typing", {
          roomId: rid,
          user: socket.data.name ?? "Biri",
          senderId: socket.data.userId,
        });
      });

      socket.on(
        "send_message",
        async (
          p: { roomId: string; content: string; tempId?: string },
          cb?: (ack: { ok: boolean; id?: string; error?: string }) => void
        ) => {
          try {
            const userId = socket.data.userId;
            if (!userId) return cb?.({ ok: false, error: "unauthorized" });

            const roomId = p?.roomId;
            const content = (p?.content ?? "").toString().trim();
            if (!roomId || !mongoose.isValidObjectId(roomId)) return cb?.({ ok: false, error: "bad_room" });
            if (content.length < 1 || content.length > 2000) return cb?.({ ok: false, error: "bad_content" });

            await connectDB();
            const room = await Room.findById(roomId)
              .select({ isPrivate: 1, members: 1 })
              .lean<{ isPrivate: boolean; members: any[] } | null>();
            if (!room) return cb?.({ ok: false, error: "room_not_found" });

            if (room.isPrivate) {
              const ok = room.members?.some?.((m: any) => String(m) === String(userId));
              if (!ok) return cb?.({ ok: false, error: "access_denied" });
            }

            const msg = await Message.create({ roomId, senderId: userId, content });

            const payload = {
              _id: String(msg._id),
              roomId: String(msg.roomId),
              senderId: String(msg.senderId),
              content: msg.content,
              createdAt: msg.createdAt,
              tempId: p?.tempId,
            };

            io.to(roomId).emit("message_created", payload);
            cb?.({ ok: true, id: String(msg._id) });
          } catch {
            cb?.({ ok: false, error: "server_error" });
          }
        }
      );

      socket.on("disconnecting", () => {
        const uid = socket.data.userId;
        if (!uid) return;
        for (const roomId of socket.rooms) {
          if (roomId === socket.id) continue;
          const roomMap = presence.get(roomId);
          if (!roomMap) continue;
          const e = roomMap.get(uid);
          if (!e) continue;
          e.count -= 1;
          if (e.count <= 0) roomMap.delete(uid);
          if (roomMap.size === 0) presence.delete(roomId);
          emitMembers(roomId);
        }
      });
    });

    anyRes.socket.server.io = io;
  }
  res.end();
}
