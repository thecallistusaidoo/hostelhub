const express = require("express");
const router = express.Router();
const { Hostel, Student, Host, Booking } = require("../models");
const { protect, restrictTo } = require("../middleware");

// All admin routes require admin role
// NOTE: To create your first admin, manually set role:"admin" in MongoDB Atlas
// or run: db.students.updateOne({email:"you@email.com"},{$set:{role:"admin"}})
router.use(protect, restrictTo("admin"));

// GET /api/admin/dashboard — overview stats
router.get("/dashboard", async (req, res, next) => {
  try {
    const [students, hosts, hostels, pending, bookings] = await Promise.all([
      Student.countDocuments(),
      Host.countDocuments(),
      Hostel.countDocuments({ status: "approved" }),
      Hostel.countDocuments({ status: "pending" }),
      Booking.countDocuments(),
    ]);
    res.json({ stats: { students, hosts, hostels, pending, bookings } });
  } catch (err) { next(err); }
});

// GET /api/admin/hostels/pending — all hostels awaiting approval
router.get("/hostels/pending", async (req, res, next) => {
  try {
    const hostels = await Hostel.find({ status: "pending" })
      .populate("ownerId", "fullName email phone")
      .sort({ createdAt: -1 });
    res.json({ hostels });
  } catch (err) { next(err); }
});

// GET /api/admin/hostels — all hostels (any status)
router.get("/hostels", async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    const hostels = await Hostel.find(query)
      .populate("ownerId", "fullName email")
      .sort({ createdAt: -1 });
    res.json({ hostels });
  } catch (err) { next(err); }
});

// PUT /api/admin/hostels/:id/approve
router.put("/hostels/:id/approve", async (req, res, next) => {
  try {
    const hostel = await Hostel.findByIdAndUpdate(
      req.params.id,
      { status: "approved" },
      { new: true }
    ).populate("ownerId", "fullName email");

    if (!hostel) return res.status(404).json({ message: "Hostel not found." });

    // TODO: Send approval email to host
    // await sendEmail({ to: hostel.ownerId.email, subject: "Your hostel is approved!", ... })

    res.json({ message: "Hostel approved and now live.", hostel });
  } catch (err) { next(err); }
});

// PUT /api/admin/hostels/:id/reject
router.put("/hostels/:id/reject", async (req, res, next) => {
  try {
    const { reason } = req.body;
    const hostel = await Hostel.findByIdAndUpdate(
      req.params.id,
      { status: "rejected" },
      { new: true }
    );
    if (!hostel) return res.status(404).json({ message: "Hostel not found." });

    // TODO: Send rejection email with reason
    res.json({ message: "Hostel rejected.", reason, hostel });
  } catch (err) { next(err); }
});

// PUT /api/admin/hostels/:id/feature — toggle featured
router.put("/hostels/:id/feature", async (req, res, next) => {
  try {
    const hostel = await Hostel.findById(req.params.id);
    if (!hostel) return res.status(404).json({ message: "Hostel not found." });
    hostel.featured = !hostel.featured;
    await hostel.save();
    res.json({ message: `Hostel ${hostel.featured ? "featured" : "unfeatured"}.`, hostel });
  } catch (err) { next(err); }
});

// GET /api/admin/students — list all students
router.get("/students", async (req, res, next) => {
  try {
    const students = await Student.find().select("-password -refreshToken").sort({ createdAt: -1 });
    res.json({ students });
  } catch (err) { next(err); }
});

// GET /api/admin/hosts — list all hosts
router.get("/hosts", async (req, res, next) => {
  try {
    const hosts = await Host.find().select("-password -refreshToken").sort({ createdAt: -1 });
    res.json({ hosts });
  } catch (err) { next(err); }
});

// DELETE /api/admin/users/:role/:id — remove a user
router.delete("/users/:role/:id", async (req, res, next) => {
  try {
    const Model = req.params.role === "student" ? Student : Host;
    await Model.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted." });
  } catch (err) { next(err); }
});

module.exports = router;