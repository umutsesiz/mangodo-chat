"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import useSWRInfinite from "swr/infinite";
import { format, isToday, isYesterday } from "date-fns";
import { tr } from "date-fns/locale";
import { io, Socket } from "socket.io-client";

type Message = {
  _id: string;
  roomId: string;
  senderId: string;
  content: string;
  createdAt: string | Date;
  tempId?: string;
  pending?: boolean;
};

type Member = { id: string; name: string };
type Row =
  | { _type: "sep"; key: string; label: string }
  | (Message & { _type: "msg" });

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ChatRoom({
  roomId,
  me,
}: {
  roomId: string;
  me: { id: string; name: string };
}) {
  const PAGE = 20;

  const getKey = (index: number, prev: any) => {
    const base = `/api/rooms/${roomId}/messages`;
    if (index === 0) return `${base}?limit=${PAGE}`;
    if (prev && !prev.nextCursor) return null;
    return `${base}?cursor=${prev.nextCursor}&limit=${PAGE}`;
  };

  const { data, size, setSize, mutate, isLoading } = useSWRInfinite(getKey, fetcher, {
    revalidateOnFocus: false,
  });

  const list: Message[] = (data ?? []).flatMap((d: any) => d.items as Message[]);
  const userMap = Object.assign({}, ...(data ?? []).map((d: any) => d.userMap || {}));

  const bottomRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [list.length]);

  const [text, setText] = useState("");
  const socketRef = useRef<Socket | null>(null);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [pending, setPending] = useState<Message[]>([]);
  const [toast, setToast] = useState<{ msg: string; kind: "ok" | "err" } | null>(null);

  const merged = useMemo(() => {
    const all = [...list, ...pending];
    return all.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
  }, [list, pending]);

  const dateLabel = (d: Date) => {
    if (isToday(d)) return "Bugün";
    if (isYesterday(d)) return "Dün";
    return format(d, "d MMMM yyyy", { locale: tr });
  };

  const rows: Row[] = useMemo(() => {
    const out: Row[] = [];
    let last = "";
    for (const m of merged) {
      const dt = new Date(m.createdAt);
      const lbl = dateLabel(dt);
      if (lbl !== last) {
        out.push({ _type: "sep", key: `sep_${lbl}_${dt.toDateString()}`, label: lbl });
        last = lbl;
      }
      out.push({ _type: "msg", ...m });
    }
    return out;
  }, [merged]);

  useEffect(() => {
    let mounted = true;

    fetch("/api/socketio").catch(() => {}).finally(() => {
      if (!mounted) return;

      const s = io({
        path: "/api/socketio",
        transports: ["websocket", "polling"],
      });
      socketRef.current = s;

      s.emit("join_room", roomId);

      s.on("message_created", async (payload: Message) => {
        if (payload?.roomId !== roomId) return;
        if (payload.tempId) {
          setPending((curr) => {
            const i = curr.findIndex((m) => m.tempId === payload.tempId);
            if (i === -1) return curr;
            const next = curr.slice();
            next[i] = { ...next[i], ...payload, pending: false, tempId: undefined };
            return next;
          });
          bottomRef.current?.scrollIntoView({ behavior: "smooth" });
          return;
        }
        await mutate();
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      });

      s.on("typing", (p: { roomId: string; user: string; senderId?: string }) => {
        if (p.roomId !== roomId) return;
        if (p.senderId === me.id) return;
        setTypingUser(p.user);
        setTimeout(() => setTypingUser((u) => (u === p.user ? null : u)), 1500);
      });

      s.on("room_members", (p: { roomId: string; members: Member[] }) => {
        if (p.roomId !== roomId) return;
        setMembers(p.members);
      });
    });

    return () => {
      mounted = false;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [roomId, mutate, me.id]);

  function newTempId() {
    return `tmp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  async function send() {
    const content = text.trim();
    if (!content) return;
    setText("");

    const tid = newTempId();
    const optimistic: Message = {
      _id: tid,
      tempId: tid,
      roomId,
      senderId: me.id,
      content,
      createdAt: new Date().toISOString(),
      pending: true,
    };
    setPending((curr) => [...curr, optimistic]);
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });

    socketRef.current?.emit(
      "send_message",
      { roomId, content, tempId: tid },
      (ack: { ok: boolean; id?: string; error?: string }) => {
        if (!ack?.ok) {
          setPending((curr) => curr.filter((m) => m.tempId !== tid));
          setToast({ msg: "Mesaj gönderilemedi", kind: "err" });
          setTimeout(() => setToast(null), 1500);
        }
      }
    );
  }

  return (
    <div className="card relative">
      <div className="mb-3 flex items-center gap-2 text-sm text-neutral-400">
        <span className="font-medium text-neutral-200">Online:</span>
        <span>{members.length}</span>
        <span className="mx-2">•</span>
        <div className="flex flex-wrap gap-2">
          {members.map((m) => (
            <span
              key={m.id}
              className={`chip ${m.id === me.id ? "bg-black text-white" : ""}`}
              title={m.name}
            >
              {m.name}
            </span>
          ))}
        </div>
      </div>

      <div className="h-[56vh] overflow-y-auto space-y-3 pr-2">
        {isLoading && list.length === 0 && pending.length === 0 ? (
          <div className="space-y-3">
            <div className="h-6 w-24 bg-neutral-800 rounded" />
            <div className="h-16 w-2/3 bg-neutral-900 rounded-xl border" />
            <div className="h-16 w-1/2 bg-neutral-900 rounded-xl border ml-auto" />
            <div className="h-6 w-28 bg-neutral-800 rounded" />
            <div className="h-16 w-3/4 bg-neutral-900 rounded-xl border" />
          </div>
        ) : null}

        {!isLoading && rows.length === 0 ? (
          <div className="text-center text-neutral-500 py-12">Henüz mesaj yok</div>
        ) : null}

        {rows.map((row) => {
          if (row._type === "sep") {
            return (
              <div key={row.key} className="date-sep">
                {row.label}
              </div>
            );
          }
          const m = row as Message;
          const mine = m.senderId === me.id;
          const name = userMap[m.senderId] || (mine ? me.name : "Bilinmeyen");
          return (
            <div key={m._id} className={`max-w-[80%] ${mine ? "ml-auto text-right" : ""}`}>
              <div className="text-xs text-neutral-400">
                {name} • {format(new Date(m.createdAt), "PPPp", { locale: tr })}
              </div>
              <div
                className={`bubble ${mine ? "bubble-me" : ""} ${m.pending ? "opacity-60" : ""}`}
                title={m.pending ? "Gönderiliyor…" : undefined}
              >
                {m.content}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {typingUser && <div className="text-xs text-neutral-500 pl-1 pt-2">{typingUser} yazıyor…</div>}

      <div className="mt-2 flex gap-2">
        <input
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            socketRef.current?.emit("typing", { roomId, user: me.name, senderId: me.id });
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Mesaj yazın…"
          className="input flex-1"
        />
        <button onClick={send} disabled={!text.trim()} className="btn">
          Gönder
        </button>
      </div>

      {toast && (
        <div
          className={`fixed bottom-5 right-5 px-3 py-2 rounded-lg shadow-lg text-sm ${
            toast.kind === "ok" ? "bg-green-600 text-white" : "bg-red-600 text-white"
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
