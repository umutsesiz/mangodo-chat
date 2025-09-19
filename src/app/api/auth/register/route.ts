import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import { User, EmailVerificationToken } from "@/lib/models";
import { sendVerificationEmail } from "@/lib/email";
import { rateLimitKey } from "@/lib/rateLimit";

const RegisterSchema = z.object({
  name: z.string().min(2).max(60),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

function baseUrl() {
  return (
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}

export async function POST(req: Request) {
  const ip = (req.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim();
  if (!rateLimitKey(`register:${ip}`, { limit: 5, window: "10m" })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }
  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { name, email, password } = parsed.data;

  try {
    await connectDB();
    const exists = await User.findOne({ email }).lean();
    if (exists) return NextResponse.json({ error: "Email already in use" }, { status: 409 });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash, emailVerified: false });

    await EmailVerificationToken.deleteMany({ userId: user._id });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await EmailVerificationToken.create({ userId: user._id, token, expiresAt });

    const verifyUrl = `${baseUrl()}/verify?token=${token}`;
    const mail = await sendVerificationEmail(email, verifyUrl);
    const previewUrl = (mail as any)?.previewUrl ?? null;

    return NextResponse.json({ ok: true, message: "Aktivasyon e-postası gönderildi", previewUrl }, { status: 201 });
  } catch (e) {
    console.error("[REGISTER]", e);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
