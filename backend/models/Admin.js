const mongoose = require("mongoose");
const crypto = require("crypto");

const AdminSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      default: "System Administrator",
      trim: true,
    },
    salt: {
      type: String,
      required: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["superadmin", "admin"],
      default: "admin",
    },
    token: {
      type: String,
      default: null,
    },
    tokenExpires: {
      type: Date,
      default: null,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Method to set password with secure salt & PBKDF2 hash
AdminSchema.methods.setPassword = function (password) {
  this.salt = crypto.randomBytes(16).toString("hex");
  this.passwordHash = crypto
    .pbkdf2Sync(password, this.salt, 10000, 64, "sha512")
    .toString("hex");
};

// Method to verify password
AdminSchema.methods.verifyPassword = function (password) {
  const hash = crypto
    .pbkdf2Sync(password, this.salt, 10000, 64, "sha512")
    .toString("hex");
  return this.passwordHash === hash;
};

// Method to generate session token (valid for 24 hours)
AdminSchema.methods.generateSessionToken = function () {
  this.token = crypto.randomBytes(32).toString("hex");
  this.tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  this.lastLogin = new Date();
  return this.token;
};

module.exports = mongoose.model("Admin", AdminSchema);

