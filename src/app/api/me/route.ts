import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-guard";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { User } from "@/lib/models";

export async function GET() {
  const me = await requireUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { passwordHash, ...safe } = me as any;

  return NextResponse.json({
    ok: true,
    id: String(me._id),
    name: me.name,
    user: { ...safe, _id: String(me._id) },
  });
}

const PatchSchema = z.object({
  name: z.string().min(2).max(60).optional(),
  avatarUrl: z.string().url().optional(),
  currentPassword: z.string().min(8).optional(),
  newPassword: z.string().min(8).optional(),
}).refine(
  (v) =>
    !(v.currentPassword && !v.newPassword) &&
    !(v.newPassword && !v.currentPassword),
  { message: "Şifre değişimi için mevcut ve yeni şifre birlikte gönderilmelidir." }
);

export async function PATCH(req: Request) {
  const me = await requireUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const updates: any = {};
  if (parsed.data.name) updates.name = parsed.data.name;
  if (parsed.data.avatarUrl) updates.avatarUrl = parsed.data.avatarUrl;

  if (parsed.data.currentPassword && parsed.data.newPassword) {
    const user = await User.findById(me._id);
    const ok = await bcrypt.compare(parsed.data.currentPassword, user!.passwordHash);
    if (!ok) return NextResponse.json({ error: "Mevcut şifre yanlış" }, { status: 400 });
    updates.passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  }

  await User.updateOne({ _id: me._id }, { $set: updates });
  return NextResponse.json({ ok: true });
}
