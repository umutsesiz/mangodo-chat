import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;
if (!MONGODB_URI) throw new Error("Missing MONGODB_URI");

declare global { var _mongooseConn: Promise<typeof mongoose> | undefined; }

export function connectDB() {
  if (!global._mongooseConn) {
    global._mongooseConn = mongoose.connect(MONGODB_URI, { dbName: "mangodo_chat" });
  }
  return global._mongooseConn;
}
