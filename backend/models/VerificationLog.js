const mongoose = require("mongoose");

const verificationLogSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      default: null,
    },
    regNo: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    studentName: {
      type: String,
      default: "Unknown",
    },
    method: {
      type: String,
      enum: ["phone", "email"],
      default: "phone",
    },
    contactMasked: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["SUCCESS", "FAILED"],
      required: true,
      index: true,
    },
    failureReason: {
      type: String,
      default: "",
    },
    ipAddress: {
      type: String,
      default: "",
    },
    userAgent: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("VerificationLog", verificationLogSchema);

