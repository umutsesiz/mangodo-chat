import { NextResponse } from "next/server";

export function apiOk<T extends Record<string, any>>(data?: T, status = 200) {
  return NextResponse.json({ ok: true, ...(data ?? {}) }, { status });
}

export function apiError(message: string, status = 400, extra?: Record<string, any>) {
  return NextResponse.json({ ok: false, error: message, ...(extra ?? {}) }, { status });
}
