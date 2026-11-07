const mongoose = require("mongoose");

const otpVerificationSchema = new mongoose.Schema(
  {
    regNo: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    contact: {
      type: String,
      required: true,
      trim: true,
    },
    contactType: {
      type: String,
      enum: ["phone", "email"],
      default: "phone",
    },
    attempts: {
      type: Number,
      default: 0,
    },
    resendCount: {
      type: Number,
      default: 0,
    },
    lastSentAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 600 }, // Auto-delete after 10 mins via MongoDB TTL index
    },
    verified: {
      type: Boolean,
      default: false,
    },
    verifySessionToken: {
      type: String,
      default: null,
      index: true,
    },
    sessionExpiresAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("OtpVerification", otpVerificationSchema);

