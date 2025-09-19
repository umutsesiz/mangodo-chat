import mongoose, { Schema, models, model } from "mongoose";

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    passwordHash: { type: String, required: true },
    emailVerified: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

const RoomSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    isPrivate: { type: Boolean, default: false, index: true },
    members: [{ type: Schema.Types.ObjectId, ref: "User", index: true }],
  },
  { timestamps: true, collection: "rooms" }
);

const EmailVerificationTokenSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    token: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true, collection: "emailverificationtokens" }
);

const MessageSchema = new Schema(
  {
    roomId: { type: Schema.Types.ObjectId, ref: "Room", required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    content: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: "messages" }
);
MessageSchema.index({ roomId: 1, createdAt: -1, _id: -1 });

export const User =
  (models.User as mongoose.Model<any>) || model("User", UserSchema);

export const Room =
  (models.Room as mongoose.Model<any>) || model("Room", RoomSchema);

export const EmailVerificationToken =
  (models.EmailVerificationToken as mongoose.Model<any>) ||
  model("EmailVerificationToken", EmailVerificationTokenSchema);

export const Message =
  (models.Message as mongoose.Model<any>) || model("Message", MessageSchema);
