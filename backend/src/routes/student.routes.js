const express = require("express");
const router = express.Router();
const { Student, Hostel, Message } = require("../models");
const { protect, restrictTo } = require("../middleware");

router.use(protect, restrictTo("student"));

// GET /api/students/me — full profile
router.get("/me", async (req, res, next) => {
  try {
    const student = await Student.findById(req.user.id)
      .populate({ path: "savedHostels", select: "name location city priceFrom images status gender campusDistance viewsCount hostRating" })
      .populate({ path: "recentViews", select: "name location city priceFrom images status" });
    if (!student) return res.status(404).json({ message: "Student not found." });
    res.json({ student });
  } catch (err) { next(err); }
});

// PUT /api/students/update-profile
router.put("/update-profile", async (req, res, next) => {
  try {
    const allowed = ["firstName","lastName","phone","program","year"];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    const student = await Student.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true });
    res.json({ message: "Profile updated.", student });
  } catch (err) { next(err); }
});

// PUT /api/students/change-password
router.put("/change-password", async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ message: "Both passwords required." });
    if (newPassword.length < 8) return res.status(400).json({ message: "New password must be at least 8 characters." });
    const student = await Student.findById(req.user.id).select("+password");
    const valid = await student.comparePassword(currentPassword);
    if (!valid) return res.status(401).json({ message: "Current password is incorrect." });
    student.password = newPassword;
    await student.save();
    res.json({ message: "Password updated." });
  } catch (err) { next(err); }
});

// POST /api/students/save-hostel — toggle save
router.post("/save-hostel", async (req, res, next) => {
  try {
    const { hostelId } = req.body;
    if (!hostelId) return res.status(400).json({ message: "hostelId required." });
    const hostel = await Hostel.findById(hostelId);
    if (!hostel) return res.status(404).json({ message: "Hostel not found." });
    const student = await Student.findById(req.user.id);
    const alreadySaved = student.savedHostels.map(id => id.toString()).includes(hostelId);
    if (alreadySaved) {
      student.savedHostels = student.savedHostels.filter(id => id.toString() !== hostelId);
    } else {
      student.savedHostels.push(hostelId);
    }
    await student.save();
    res.json({ saved: !alreadySaved, savedHostels: student.savedHostels });
  } catch (err) { next(err); }
});

// POST /api/students/track-view/:hostelId — record recently viewed
router.post("/track-view/:hostelId", async (req, res, next) => {
  try {
    const { hostelId } = req.params;
    const student = await Student.findById(req.user.id);
    // Remove if already present, then prepend
    student.recentViews = student.recentViews.filter(id => id.toString() !== hostelId);
    student.recentViews.unshift(hostelId);
    // Keep only last 10
    if (student.recentViews.length > 10) student.recentViews = student.recentViews.slice(0, 10);
    await student.save();
    // Also increment hostel view count
    await Hostel.findByIdAndUpdate(hostelId, { $inc: { viewsCount: 1 } });
    res.json({ message: "View tracked." });
  } catch (err) { next(err); }
});

module.exports = router;