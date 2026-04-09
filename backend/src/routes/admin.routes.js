const express = require("express");
const router = express.Router();
const { Hostel, Student, Host, Booking, Payment, Room } = require("../models");
const { protect, restrictTo } = require("../middleware");

router.use(protect, restrictTo("admin"));

// GET /api/admin/dashboard
router.get("/dashboard", async (req, res, next) => {
  try {
    const [students, hosts, approvedHostels, pendingHostels, bookings, payments] = await Promise.all([
      Student.countDocuments(),
      Host.countDocuments(),
      Hostel.countDocuments({ status: "approved" }),
      Hostel.countDocuments({ status: "pending" }),
      Booking.countDocuments(),
      Payment.find({ paystackStatus: "success" }),
    ]);
    const totalRevenue = payments.reduce((s, p) => s + p.platformFee, 0);
    const totalPaidOut = payments.reduce((s, p) => s + p.hostPayout, 0);
    res.json({ stats: { students, hosts, approvedHostels, pendingHostels, bookings, totalRevenue, totalPaidOut } });
  } catch (err) { next(err); }
});

// GET /api/admin/hostels/pending
router.get("/hostels/pending", async (req, res, next) => {
  try {
    const hostels = await Hostel.find({ status: "pending" })
      .populate("ownerId", "fullName email phone")
      .sort({ createdAt: -1 });
    res.json({ hostels });
  } catch (err) { next(err); }
});

// GET /api/admin/hostels?status=approved|rejected|pending
router.get("/hostels", async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const query = {};
    if (status) query.status = status;
    if (search) query.$or = [{ name: new RegExp(search, "i") }];
    const hostels = await Hostel.find(query)
      .populate("ownerId", "fullName email")
      .sort({ createdAt: -1 });
    res.json({ hostels });
  } catch (err) { next(err); }
});

// GET /api/admin/hostels/:id — detail for any status (admin preview)
router.get("/hostels/:id", async (req, res, next) => {
  try {
    const hostel = await Hostel.findById(req.params.id)
      .populate("ownerId", "fullName phone email hostRating");
    if (!hostel) return res.status(404).json({ message: "Hostel not found." });
    const rooms = await Room.find({ hostelId: hostel._id });
    res.json({ hostel, rooms });
  } catch (err) { next(err); }
});

// PUT /api/admin/hostels/:id/approve
router.put("/hostels/:id/approve", async (req, res, next) => {
  try {
    const hostel = await Hostel.findByIdAndUpdate(
      req.params.id,
      { status: "approved", rejectionReason: "" },
      { new: true }
    ).populate("ownerId", "fullName email");
    if (!hostel) return res.status(404).json({ message: "Hostel not found." });
    res.json({ message: "Hostel approved and live.", hostel });
  } catch (err) { next(err); }
});

// PUT /api/admin/hostels/:id/reject
router.put("/hostels/:id/reject", async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason?.trim()) return res.status(400).json({ message: "Rejection reason required." });
    const hostel = await Hostel.findByIdAndUpdate(
      req.params.id,
      { status: "rejected", rejectionReason: reason },
      { new: true }
    );
    if (!hostel) return res.status(404).json({ message: "Hostel not found." });
    res.json({ message: "Hostel rejected.", hostel });
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

// PUT /api/admin/hostels/:id/rating — set hostel rating
router.put("/hostels/:id/rating", async (req, res, next) => {
  try {
    const { rating } = req.body;
    if (rating === undefined || rating === null) return res.status(400).json({ message: "Rating is required." });
    if (typeof rating !== "number" || rating < 0 || rating > 5) return res.status(400).json({ message: "Rating must be a number between 0 and 5." });
    const hostel = await Hostel.findByIdAndUpdate(
      req.params.id,
      { hostRating: rating },
      { new: true }
    ).populate("ownerId", "fullName email");
    if (!hostel) return res.status(404).json({ message: "Hostel not found." });
    res.json({ message: `Rating set to ${rating}.`, hostel });
  } catch (err) { next(err); }
});

// DELETE /api/admin/hostels/:id — remove hostel
router.delete("/hostels/:id", async (req, res, next) => {
  try {
    const hostel = await Hostel.findByIdAndDelete(req.params.id);
    if (!hostel) return res.status(404).json({ message: "Hostel not found." });
    await Host.findByIdAndUpdate(hostel.ownerId, { $pull: { hostelIds: hostel._id } });
    res.json({ message: "Hostel removed." });
  } catch (err) { next(err); }
});

// GET /api/admin/students
router.get("/students", async (req, res, next) => {
  try {
    const { search } = req.query;
    const query = search ? { $or: [{ firstName: new RegExp(search,"i") }, { lastName: new RegExp(search,"i") }, { email: new RegExp(search,"i") }] } : {};
    const students = await Student.find(query).select("-password -refreshToken").sort({ createdAt: -1 });
    res.json({ students });
  } catch (err) { next(err); }
});

// DELETE /api/admin/students/:id
router.delete("/students/:id", async (req, res, next) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    res.json({ message: "Student removed." });
  } catch (err) { next(err); }
});

// GET /api/admin/hosts
router.get("/hosts", async (req, res, next) => {
  try {
    const { search } = req.query;
    const query = search ? { $or: [{ fullName: new RegExp(search,"i") }, { email: new RegExp(search,"i") }] } : {};
    const hosts = await Host.find(query).select("-password -refreshToken").sort({ createdAt: -1 });
    res.json({ hosts });
  } catch (err) { next(err); }
});

// PUT /api/admin/hosts/:id/verify
router.put("/hosts/:id/verify", async (req, res, next) => {
  try {
    const host = await Host.findById(req.params.id);
    if (!host) return res.status(404).json({ message: "Host not found." });
    host.verified = !host.verified;
    await host.save();
    res.json({ message: `Host ${host.verified ? "verified" : "unverified"}.`, host });
  } catch (err) { next(err); }
});

// DELETE /api/admin/hosts/:id
router.delete("/hosts/:id", async (req, res, next) => {
  try {
    await Host.findByIdAndDelete(req.params.id);
    res.json({ message: "Host removed." });
  } catch (err) { next(err); }
});

// GET /api/admin/payments
router.get("/payments", async (req, res, next) => {
  try {
    const payments = await Payment.find({ paystackStatus: "success" })
      .populate("studentId", "firstName lastName email")
      .populate("hostelId", "name")
      .sort({ createdAt: -1 });
    res.json({ payments });
  } catch (err) { next(err); }
});

module.exports = router;