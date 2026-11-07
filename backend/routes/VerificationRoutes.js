const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const Student = require("../models/StudentTemp");
const OtpVerification = require("../models/OtpVerification");
const VerificationLog = require("../models/VerificationLog");
const { sendSmsOtp } = require("../services/smsService");
const { sendEmailOtp } = require("../services/emailService");

// Helper to hash OTP with SHA-256
function hashOtp(otp) {
  return crypto.createHash("sha256").update(String(otp).trim()).digest("hex");
}

// Mask phone: 9876543210 -> 98******10
function maskPhone(phone) {
  const p = String(phone || "").replace(/\D/g, "");
  if (p.length >= 6) {
    return `${p.slice(0, 2)}******${p.slice(-2)}`;
  }
  return p;
}

// Mask email: student@vignan.ac.in -> st***@vignan.ac.in
function maskEmail(email) {
  if (!email || !email.includes("@")) return "";
  const [local, domain] = email.split("@");
  if (local.length <= 2) return `${local}***@${domain}`;
  return `${local.slice(0, 2)}****@${domain}`;
}

/**
 * 1. QR Code Token Lookup
 * Validates the qrToken embedded in a student's ID card QR code.
 */
router.get("/lookup-token/:token", async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).json({ valid: false, message: "Token missing" });
    }

    const student = await Student.findOne({ qrToken: token });
    if (!student) {
      return res.status(404).json({
        valid: false,
        message: "Invalid or expired QR verification token.",
      });
    }

    res.json({
      valid: true,
      regNo: student.regNo,
      studentName: student.name,
      college: student.college || "Vignan University",
      department: student.department,
      course: student.course || "B.Tech",
      maskedPhone: maskPhone(student.phone),
      maskedEmail: maskEmail(student.email || `${student.regNo.toLowerCase()}@vignan.ac.in`),
    });
  } catch (error) {
    res.status(500).json({ valid: false, message: error.message });
  }
});

/**
 * 2. Request OTP
 * Checks student existence & matching contact info.
 * Enforces rate limiting, resend limits, and secure hashing.
 */
router.post("/request-otp", async (req, res) => {
  const ipAddress = req.ip || req.headers["x-forwarded-for"] || "127.0.0.1";
  const userAgent = req.headers["user-agent"] || "";

  try {
    const { regNo, contact, method, token } = req.body;

    if (!regNo || !contact) {
      return res.status(400).json({
        message: "Both Registration Number and Mobile Number / Email are required.",
      });
    }

    const cleanRegNo = String(regNo).trim().toUpperCase();
    const cleanContact = String(contact).trim();
    const isEmail = method === "email" || cleanContact.includes("@");

    // Look up student by Registration Number (case-insensitive)
    const student = await Student.findOne({
      regNo: { $regex: new RegExp(`^${cleanRegNo}$`, "i") },
    });

    // Validate existence & contact matching
    let isMatched = false;
    if (student) {
      if (isEmail) {
        const studentEmail = (student.email || `${student.regNo.toLowerCase()}@vignan.ac.in`).toLowerCase();
        isMatched = studentEmail === cleanContact.toLowerCase();
      } else {
        const cleanInputPhone = cleanContact.replace(/\D/g, "").slice(-10);
        const cleanStudentPhone = String(student.phone || "").replace(/\D/g, "").slice(-10);
        isMatched = cleanInputPhone && cleanStudentPhone && cleanInputPhone === cleanStudentPhone;
      }
    }

    // Security requirement 3: Do not reveal whether details belong to someone else
    if (!student || !isMatched) {
      await VerificationLog.create({
        studentId: student ? student._id : null,
        regNo: cleanRegNo,
        studentName: student ? student.name : "Unknown",
        method: isEmail ? "email" : "phone",
        contactMasked: isEmail ? maskEmail(cleanContact) : maskPhone(cleanContact),
        status: "FAILED",
        failureReason: !student ? "Student record not found" : "Contact details mismatch",
        ipAddress,
        userAgent,
      });

      return res.status(400).json({
        message: "The provided credentials could not be verified. Please check your Registration Number and registered contact info.",
      });
    }

    // Check resend cooldown limit (must wait at least 45 seconds between requests)
    const existingOtp = await OtpVerification.findOne({ regNo: cleanRegNo });
    if (existingOtp && Date.now() - new Date(existingOtp.lastSentAt).getTime() < 45 * 1000) {
      const waitSec = Math.ceil(
        (45 * 1000 - (Date.now() - new Date(existingOtp.lastSentAt).getTime())) / 1000
      );
      return res.status(429).json({
        message: `Please wait ${waitSec} seconds before requesting a new OTP.`,
      });
    }

    // Check hourly resend threshold (max 5 resends per hour)
    if (existingOtp && existingOtp.resendCount >= 5 && Date.now() - new Date(existingOtp.createdAt).getTime() < 3600 * 1000) {
      return res.status(429).json({
        message: "Hourly OTP request limit reached for this student. Please try again later or contact the administrator.",
      });
    }

    // Generate cryptographically secure 6-digit OTP
    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpHashed = hashOtp(otp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

    // Store in OtpVerification
    await OtpVerification.findOneAndUpdate(
      { regNo: cleanRegNo },
      {
        regNo: cleanRegNo,
        otpHash: otpHashed,
        contact: cleanContact,
        contactType: isEmail ? "email" : "phone",
        attempts: 0,
        $inc: { resendCount: 1 },
        lastSentAt: new Date(),
        expiresAt,
        verified: false,
        verifySessionToken: null,
      },
      { upsert: true, new: true }
    );

    // Send OTP via chosen delivery service
    let deliveryResult;
    const targetEmail = student.email || `${student.regNo.toLowerCase()}@vignan.ac.in`;
    const targetPhone = student.phone;

    if (isEmail) {
      deliveryResult = await sendEmailOtp({
        email: targetEmail,
        otp,
        studentName: student.name,
        regNo: student.regNo,
      });
    } else {
      deliveryResult = await sendSmsOtp({
        phone: targetPhone,
        otp,
        studentName: student.name,
        regNo: student.regNo,
      });
    }

    const maskedTarget = isEmail ? maskEmail(targetEmail) : maskPhone(targetPhone);
    const isLive = deliveryResult && deliveryResult.simulated !== true;

    res.json({
      success: true,
      message: `A secure 6-digit OTP has been dispatched to ${isEmail ? "registered email" : "mobile number"} (${maskedTarget}).`,
      regNo: student.regNo,
      method: isEmail ? "email" : "phone",
      maskedTarget,
      expiresInSeconds: 300,
      // Provide simulated fallback only if external gateway is not configured
      simulatedNotice: !isLive
        ? `[Dev/Demo Notice] Gateway credentials not set in .env. OTP: ${otp}`
        : null,
      demoOtp: !isLive ? otp : null,
    });
  } catch (error) {
    console.error("Error in request-otp:", error);
    res.status(500).json({ message: "Internal server error while generating OTP." });
  }
});

/**
 * 3. Verify OTP
 * Enforces attempt limits (max 5) and creates a secure session token upon success.
 */
router.post("/verify-otp", async (req, res) => {
  const ipAddress = req.ip || req.headers["x-forwarded-for"] || "127.0.0.1";
  const userAgent = req.headers["user-agent"] || "";

  try {
    const { regNo, otp } = req.body;

    if (!regNo || !otp) {
      return res.status(400).json({ message: "Registration Number and OTP are required." });
    }

    const cleanRegNo = String(regNo).trim().toUpperCase();
    const cleanOtp = String(otp).trim();

    const record = await OtpVerification.findOne({ regNo: cleanRegNo });

    if (!record) {
      return res.status(400).json({
        message: "No active verification request found. Please request an OTP first.",
      });
    }

    // Check expiration
    if (new Date() > new Date(record.expiresAt)) {
      await OtpVerification.deleteOne({ _id: record._id });
      return res.status(400).json({
        message: "OTP has expired (validity is 5 minutes). Please generate a new OTP.",
      });
    }

    // Check maximum attempt limits
    if (record.attempts >= 5) {
      await OtpVerification.deleteOne({ _id: record._id });
      await VerificationLog.create({
        regNo: cleanRegNo,
        status: "FAILED",
        failureReason: "Max attempts exceeded (5 failed tries)",
        ipAddress,
        userAgent,
      });

      return res.status(429).json({
        message: "Too many failed attempts. For security reasons, this OTP has been invalidated. Please request a new one.",
      });
    }

    // Compare hash
    const inputHash = hashOtp(cleanOtp);
    if (inputHash !== record.otpHash) {
      record.attempts += 1;
      await record.save();

      const remainingAttempts = 5 - record.attempts;
      return res.status(400).json({
        message: `Invalid OTP. Please check the code and try again. (${remainingAttempts} attempts remaining)`,
      });
    }

    // OTP Verified Successfully!
    const student = await Student.findOne({
      regNo: { $regex: new RegExp(`^${cleanRegNo}$`, "i") },
    });
    if (!student) {
      return res.status(404).json({ message: "Student record could not be found." });
    }

    // Generate single-use secure session token (15 mins validity)
    const sessionToken = crypto.randomBytes(24).toString("hex");
    record.verified = true;
    record.verifySessionToken = sessionToken;
    record.sessionExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await record.save();

    // Log successful verification in audit log
    await VerificationLog.create({
      studentId: student._id,
      regNo: student.regNo,
      studentName: student.name,
      method: record.contactType,
      contactMasked: record.contactType === "email" ? maskEmail(student.email) : maskPhone(student.phone),
      status: "SUCCESS",
      ipAddress,
      userAgent,
    });

    res.json({
      success: true,
      message: "Identity verified successfully!",
      sessionToken,
      verifiedAt: new Date().toISOString(),
      student: {
        _id: student._id,
        name: student.name,
        regNo: student.regNo,
        department: student.department,
        course: student.course || "B.Tech",
        academicYear: student.academicYear || "2024-2028",
        section: student.section,
        dob: student.dob,
        phone: student.phone,
        email: student.email || `${student.regNo.toLowerCase()}@vignan.ac.in`,
        validTill: student.validTill || "2028-06-30",
        college: student.college || "Vignan's Foundation for Science, Technology & Research",
        photo: student.photo,
        qrToken: student.qrToken,
      },
    });
  } catch (error) {
    console.error("Error in verify-otp:", error);
    res.status(500).json({ message: "Internal server error during verification." });
  }
});

/**
 * 4. Get Verification Audit Logs (For Admin)
 */
router.get("/logs", async (req, res) => {
  try {
    const logs = await VerificationLog.find().sort({ createdAt: -1 }).limit(100);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
