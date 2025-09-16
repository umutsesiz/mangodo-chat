import { Schema, model, models } from "mongoose";

const UserSchema = new Schema({
  email: { type: String, unique: true, required: true, index: true },
  name: { type: String, required: true },
  passwordHash: { type: String, required: true },
  emailVerified: { type: Boolean, default: false },
  avatarUrl: { type: String },
}, { timestamps: true });

const EmailVerificationTokenSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  token: { type: String, required: true, unique: true, index: true },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

export const User = models.User || model("User", UserSchema);
export const EmailVerificationToken =
  models.EmailVerificationToken || model("EmailVerificationToken", EmailVerificationTokenSchema);
