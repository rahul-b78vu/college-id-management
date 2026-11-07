const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const app = express();

// Trust proxy for rate limiting if behind reverse proxy
app.set("trust proxy", 1);

// Middleware
app.use(cors());
app.use(express.json({ limit: "30mb" }));

// Rate limiter for OTP requests to prevent abuse
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 OTP requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many verification attempts from this network. Please try again after 15 minutes.",
  },
});

// Verification routes (with rate limiting on OTP request)
app.use("/api/verification/request-otp", otpLimiter);
app.use("/api/verification", require("./routes/VerificationRoutes"));

// Admin authentication & management routes
const { router: adminRouter, ensureDefaultAdmin } = require("./routes/AdminRoutes");
app.use("/api/admin", adminRouter);

// Student administration routes
app.use("/api/students", require("./routes/StudentRoutes"));

// API health route
app.get("/api/health", (req, res) => {
  res.json({
    name: "Vignan University Student ID Management & Verification Backend",
    status: "Online",
    version: "2.0.0",
    timestamp: new Date().toISOString(),
  });
});

// Serve frontend build in production full-stack mode
const frontendDist = path.join(__dirname, "../frontend/dist");
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    res.sendFile(path.join(frontendDist, "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.json({
      name: "Vignan University Student ID Management Backend",
      status: "Online (Build frontend for full web UI)",
      timestamp: new Date().toISOString(),
    });
  });
}

// Connect MongoDB and start server
async function startServer() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing from .env file");
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected Successfully!");

    // Ensure default admin account is seeded
    await ensureDefaultAdmin();

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running at http://localhost:${PORT}`);
      console.log(`Verification API active at http://localhost:${PORT}/api/verification`);
      console.log(`Admin Auth API active at http://localhost:${PORT}/api/admin`);
    });
  } catch (error) {
    console.error("Server Startup Failed:", error.message);
    process.exit(1);
  }
}

startServer();
