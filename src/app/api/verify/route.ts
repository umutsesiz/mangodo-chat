import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { EmailVerificationToken, User } from "@/lib/models";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  await connectDB();
  const entry = await EmailVerificationToken.findOne({ token });
  if (!entry) return NextResponse.json({ error: "Invalid or used token" }, { status: 400 });

  if (entry.expiresAt.getTime() < Date.now()) {
    await EmailVerificationToken.deleteOne({ _id: entry._id });
    return NextResponse.json({ error: "Token expired" }, { status: 400 });
  }

  await User.updateOne({ _id: entry.userId }, { $set: { emailVerified: true } });
  await EmailVerificationToken.deleteOne({ _id: entry._id });

  return NextResponse.json({ ok: true });
}
