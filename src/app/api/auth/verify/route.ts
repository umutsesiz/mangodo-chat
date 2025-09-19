import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { User, EmailVerificationToken } from "@/lib/models";

const Schema = z.object({ token: z.string().min(10) });

export async function POST(req: Request) {
  await connectDB();

  const url = new URL(req.url);
  const qToken = url.searchParams.get("token") || "";
  const parsed = Schema.safeParse(qToken ? { token: qToken } : await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Geçersiz token" }, { status: 400 });

  const token = parsed.data.token.trim();

  const rec = await EmailVerificationToken.findOne({ token }).lean<{ _id: string; userId: string; expiresAt: Date } | null>();
  if (!rec) return NextResponse.json({ error: "Token bulunamadı veya kullanıldı" }, { status: 404 });

  if (new Date(rec.expiresAt).getTime() < Date.now()) {
    await EmailVerificationToken.deleteOne({ _id: rec._id }).catch(() => {});
    return NextResponse.json({ error: "Token süresi dolmuş" }, { status: 410 });
  }

  const user = await User.findById(rec.userId);
  if (!user) {
    await EmailVerificationToken.deleteOne({ _id: rec._id }).catch(() => {});
    return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
  }

  if (!user.emailVerified) {
    user.emailVerified = true;
    await user.save();
  }

  await EmailVerificationToken.deleteMany({ userId: user._id }).catch(() => {});
  return NextResponse.json({ ok: true, message: "Email verified" });
}
