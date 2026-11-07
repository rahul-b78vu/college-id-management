const express = require("express");
const router = express.Router();
const Admin = require("../models/Admin");

// Helper: Seed default superadmin if no admin exists
async function ensureDefaultAdmin() {
  const count = await Admin.countDocuments();
  if (count === 0) {
    const defaultAdmin = new Admin({
      username: "admin",
      name: "Chief Administrator",
      role: "superadmin",
    });
    defaultAdmin.setPassword("admin123");
    await defaultAdmin.save();
    console.log("Seeded default admin account: username='admin', password='admin123'");
  }
}

// Middleware: Authenticate Admin via Bearer token
async function requireAdminAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Admin authentication required." });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Invalid authorization token format." });
    }

    const admin = await Admin.findOne({
      token,
      tokenExpires: { $gt: new Date() },
    });

    if (!admin) {
      return res.status(401).json({ message: "Session expired or invalid. Please log in again." });
    }

    req.admin = admin;
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// ─── 1. Admin Login ───
router.post("/login", async (req, res) => {
  try {
    await ensureDefaultAdmin();

    const username = String(req.body.username || "").trim().toLowerCase();
    const password = String(req.body.password || "").trim();

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required." });
    }

    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({ message: "Invalid admin username or password." });
    }

    const isValid = admin.verifyPassword(password);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid admin username or password." });
    }

    const token = admin.generateSessionToken();
    await admin.save();

    res.json({
      success: true,
      message: "Admin authenticated successfully!",
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        name: admin.name,
        role: admin.role,
        lastLogin: admin.lastLogin,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── 2. Get Current Admin Profile ───
router.get("/me", requireAdminAuth, async (req, res) => {
  res.json({
    id: req.admin._id,
    username: req.admin.username,
    name: req.admin.name,
    role: req.admin.role,
    lastLogin: req.admin.lastLogin,
  });
});

// ─── 3. Admin Logout ───
router.post("/logout", requireAdminAuth, async (req, res) => {
  try {
    req.admin.token = null;
    req.admin.tokenExpires = null;
    await req.admin.save();
    res.json({ success: true, message: "Logged out successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── 4. Change Password ───
router.post("/change-password", requireAdminAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new passwords are required." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters long." });
    }

    if (!req.admin.verifyPassword(currentPassword)) {
      return res.status(400).json({ message: "Current password does not match." });
    }

    req.admin.setPassword(newPassword);
    // Refresh session token
    const token = req.admin.generateSessionToken();
    await req.admin.save();

    res.json({
      success: true,
      message: "Password changed successfully!",
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── 5. Create New Admin (Superadmin or existing Admin) ───
router.post("/create", requireAdminAuth, async (req, res) => {
  try {
    const username = String(req.body.username || "").trim().toLowerCase();
    const password = String(req.body.password || "").trim();
    const name = String(req.body.name || "Administrator").trim();
    const role = req.body.role === "superadmin" ? "superadmin" : "admin";

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required." });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long." });
    }

    const existing = await Admin.findOne({ username });
    if (existing) {
      return res.status(409).json({ message: `Admin with username '${username}' already exists.` });
    }

    const newAdmin = new Admin({ username, name, role });
    newAdmin.setPassword(password);
    await newAdmin.save();

    res.status(201).json({
      success: true,
      message: `Admin '${username}' created successfully!`,
      admin: {
        id: newAdmin._id,
        username: newAdmin.username,
        name: newAdmin.name,
        role: newAdmin.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── 6. List All Admins ───
router.get("/list", requireAdminAuth, async (req, res) => {
  try {
    const admins = await Admin.find().select("username name role lastLogin createdAt").sort({ createdAt: -1 });
    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = {
  router,
  requireAdminAuth,
  ensureDefaultAdmin,
};

