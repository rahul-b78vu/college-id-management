const mongoose = require("mongoose");
const crypto = require("crypto");

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    regNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    section: {
      type: String,
      required: true,
      trim: true,
    },
    dob: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    course: {
      type: String,
      default: "B.Tech",
      trim: true,
    },
    academicYear: {
      type: String,
      default: "2024-2028",
      trim: true,
    },
    validTill: {
      type: String,
      default: "2028-06-30",
    },
    college: {
      type: String,
      default: "Vignan's Foundation for Science, Technology & Research",
    },
    // Unique secure token for QR verification (prevents leaking private info in QR codes)
    qrToken: {
      type: String,
      unique: true,
      sparse: true,
      default: () => crypto.randomBytes(16).toString("hex"),
    },
    photo: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", studentSchema);
