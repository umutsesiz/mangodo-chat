import "server-only";
import mongoose from "mongoose";
import { getUserIdFromCookie } from "./session";
import { connectDB } from "./db";
import { User } from "./models";

export async function requireUser() {
  const uid = await getUserIdFromCookie();   // <-- await EKLENDİ
  if (!uid) return null;
  if (!mongoose.isValidObjectId(uid)) return null;

  await connectDB();
  const user = await User.findById(uid).lean();
  if (!user) return null;

  const { passwordHash, ...rest } = user as any;
  return { ...rest, _id: String((user as any)._id) };
}
