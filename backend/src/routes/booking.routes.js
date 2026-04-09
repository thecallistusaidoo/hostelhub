const express = require("express");
const router = express.Router();
const { Booking, Hostel, Room } = require("../models");
const { protect, restrictTo, validate } = require("../middleware");
const { bookingSchema } = require("../utils/validation");

// POST /api/bookings — student creates a booking request
router.post("/", protect, restrictTo("student"), validate(bookingSchema), async (req, res, next) => {
  try {
    const { hostelId, roomId, message } = req.body;

    const hostel = await Hostel.findOne({ _id: hostelId, status: "approved" });
    if (!hostel) return res.status(404).json({ message: "Hostel not found." });

    const room = await Room.findOne({ _id: roomId, hostelId });
    if (!room) return res.status(404).json({ message: "Selected room not found for this hostel." });

    // Prevent duplicate pending booking
    const existing = await Booking.findOne({
      studentId: req.user.id, hostelId, status: "pending",
    });
    if (existing) return res.status(400).json({ message: "You already have a pending booking for this hostel." });

    const booking = await Booking.create({
      studentId: req.user.id,
      hostelId,
      roomId,
      message,
      amount: room.price,
      currency: "GHS",
      paymentStatus: "pending",
    });

    res.status(201).json({ message: "Booking request sent.", booking });
  } catch (err) { next(err); }
});

// GET /api/bookings/student/me — student sees their own bookings
router.get("/student/me", protect, restrictTo("student"), async (req, res, next) => {
  try {
    const bookings = await Booking.find({ studentId: req.user.id })
      .populate("hostelId", "name location images")
      .populate("roomId", "name price")
      .sort({ createdAt: -1 });
    res.json({ bookings });
  } catch (err) { next(err); }
});

// GET /api/bookings/host/me — host sees bookings for their hostels
router.get("/host/me", protect, restrictTo("host"), async (req, res, next) => {
  try {
    const hostHostels = await Hostel.find({ ownerId: req.user.id }).select("_id");
    const hostelIds = hostHostels.map(h => h._id);

    const bookings = await Booking.find({ hostelId: { $in: hostelIds } })
      .populate("studentId", "firstName lastName email phone")
      .populate("hostelId", "name")
      .populate("roomId", "name price")
      .sort({ createdAt: -1 });
    res.json({ bookings });
  } catch (err) { next(err); }
});

// PUT /api/bookings/:id/status — host approves or rejects a booking
router.put("/:id/status", protect, restrictTo("host"), async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Status must be 'approved' or 'rejected'." });
    }

    const booking = await Booking.findById(req.params.id).populate("hostelId");
    if (!booking) return res.status(404).json({ message: "Booking not found." });

    // Confirm this booking belongs to host's hostel
    if (booking.hostelId.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not your booking." });
    }

    booking.status = status;
    await booking.save();

    // If approved, increment room occupancy
    if (status === "approved" && booking.roomId) {
      await Room.findByIdAndUpdate(booking.roomId, { $inc: { currentOccupancy: 1 } });
    }

    res.json({ message: `Booking ${status}.`, booking });
  } catch (err) { next(err); }
});

module.exports = router;