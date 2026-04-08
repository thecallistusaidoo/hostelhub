const express = require("express");
const router = express.Router();
const { Student, Hostel } = require("../models");
const { protect, restrictTo } = require("../middleware");

// All student routes require authentication
router.use(protect, restrictTo("student"));

// GET /api/students/me
router.get("/me", async (req, res, next) => {
  try {
    const student = await Student.findById(req.user.id).populate("savedHostels", "name location price images status");
    if (!student) return res.status(404).json({ message: "Student not found." });
    res.json({ student });
  } catch (err) { next(err); }
});

// PUT /api/students/update-profile
router.put("/update-profile", async (req, res, next) => {
  try {
    const allowed = ["firstName", "lastName", "phone", "program", "year"];
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
    res.json({ message: "Password updated successfully." });
  } catch (err) { next(err); }
});

// GET /api/students/saved-hostels
router.get("/saved-hostels", async (req, res, next) => {
  try {
    const student = await Student.findById(req.user.id).populate({
      path: "savedHostels",
      match: { status: "approved" },
      select: "name location city price images availableRooms hostRating gender",
    });
    res.json({ savedHostels: student.savedHostels });
  } catch (err) { next(err); }
});

// POST /api/students/save-hostel
router.post("/save-hostel", async (req, res, next) => {
  try {
    const { hostelId } = req.body;
    if (!hostelId) return res.status(400).json({ message: "hostelId required." });

    const hostel = await Hostel.findById(hostelId);
    if (!hostel) return res.status(404).json({ message: "Hostel not found." });

    const student = await Student.findById(req.user.id);
    const alreadySaved = student.savedHostels.includes(hostelId);

    if (alreadySaved) {
      student.savedHostels = student.savedHostels.filter(id => id.toString() !== hostelId);
      await student.save();
      return res.json({ message: "Hostel removed from saved.", saved: false });
    }

    student.savedHostels.push(hostelId);
    await student.save();
    res.json({ message: "Hostel saved.", saved: true });
  } catch (err) { next(err); }
});

module.exports = router;