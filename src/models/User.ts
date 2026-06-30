import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  password: string;
  refreshToken?: string;
  resetPasswordTokenHash?: string;
  resetPasswordExpires?: Date;
  isVerified: Boolean;
  verifyEmailTokenHash?: string;
  verifyEmailExpires?: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    refreshToken: {
      type: String,
    },

    resetPasswordExpires: {
      type: Date,
    },
    resetPasswordTokenHash: {
      type: String,
    },
    isVerified: { type: Boolean, default: false },
    verifyEmailTokenHash: { type: String },
    verifyEmailExpires: { type: Date },
  },
  { timestamps: true },
);

// Decide for yourself: hash via a pre('save') hook here, or hash inside
// authController.ts before calling User.create(). Both work — pick one.

const User = mongoose.model<IUser>("User", userSchema);

export default User;
