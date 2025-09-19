import "server-only";
import jwt, { JwtPayload } from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET as string;

export function createSession(userId: string): string {
  return jwt.sign({ uid: userId }, JWT_SECRET, { expiresIn: "7d" });
}

export async function getUserIdFromCookie(): Promise<string | null> {
  try {
    const store = await cookies();
    const token = store.get("session")?.value;
    if (!token) return null;
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload & { uid: string };
    return payload.uid;
  } catch {
    return null;
  }
}
