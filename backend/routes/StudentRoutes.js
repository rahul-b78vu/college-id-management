const express = require("express");
const mongoose = require("mongoose");
const crypto = require("crypto");
const router = express.Router();
const Student = require("../models/StudentTemp");
const VerificationLog = require("../models/VerificationLog");
const { requireAdminAuth } = require("./AdminRoutes");

// Add student (Admin only)
router.post("/", requireAdminAuth, async (req, res) => {
  try {
    const regNoUpper = String(req.body.regNo || "").trim().toUpperCase();
    const qrToken = crypto.randomBytes(16).toString("hex");

    const student = new Student({
      name: req.body.name,
      regNo: regNoUpper,
      phone: req.body.phone,
      email: req.body.email || `${regNoUpper.toLowerCase()}@vignan.ac.in`,
      section: req.body.section,
      dob: req.body.dob,
      department: req.body.department,
      course: req.body.course || "B.Tech",
      academicYear: req.body.academicYear || "2024-2028",
      validTill: req.body.validTill || "2028-06-30",
      college: req.body.college || "Vignan's Foundation for Science, Technology & Research",
      qrToken,
      photo: req.body.photo || "",
    });

    await student.save();

    res.status(201).json({
      message: "Student added successfully!",
      student,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "This registration number already exists.",
      });
    }

    res.status(400).json({
      message: error.message,
    });
  }
});

// Get all students (Admin only, auto-backfills qrToken for legacy records if needed)
router.get("/", requireAdminAuth, async (req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });

    // Migrate any legacy records that don't have a qrToken or email
    for (const s of students) {
      let needsSave = false;
      if (!s.qrToken) {
        s.qrToken = crypto.randomBytes(16).toString("hex");
        needsSave = true;
      }
      if (!s.email) {
        s.email = `${s.regNo.toLowerCase()}@vignan.ac.in`;
        needsSave = true;
      }
      if (!s.course) {
        s.course = "B.Tech";
        needsSave = true;
      }
      if (!s.academicYear) {
        s.academicYear = "2024-2028";
        needsSave = true;
      }
      if (!s.validTill) {
        s.validTill = "2028-06-30";
        needsSave = true;
      }
      if (needsSave) {
        await s.save();
      }
    }

    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

// Get one student by ID
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid student ID." });
    }

    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        message: "Student not found.",
      });
    }

    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update student (Admin only)
router.put("/:id", requireAdminAuth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid student ID." });
    }

    const allowedFields = [
      "name",
      "regNo",
      "phone",
      "email",
      "section",
      "dob",
      "department",
      "course",
      "academicYear",
      "validTill",
      "college",
      "photo",
    ];

    const updates = {};
    allowedFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    });

    if (updates.regNo) {
      updates.regNo = String(updates.regNo).trim().toUpperCase();
    }

    const student = await Student.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!student) {
      return res.status(404).json({
        message: "Student not found.",
      });
    }

    res.json({
      message: "Student updated successfully!",
      student,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "This registration number already exists.",
      });
    }

    res.status(400).json({
      message: error.message,
    });
  }
});

// Delete student (Admin only)
router.delete("/:id", requireAdminAuth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid student ID." });
    }

    const student = await Student.findByIdAndDelete(req.params.id);

    if (!student) {
      return res.status(404).json({
        message: "Student not found.",
      });
    }

    res.json({
      message: "Student deleted successfully!",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

// Get verification audit logs for Admin dashboard (Admin only)
router.get("/verification/logs", requireAdminAuth, async (req, res) => {
  try {
    const logs = await VerificationLog.find().sort({ createdAt: -1 }).limit(100);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
