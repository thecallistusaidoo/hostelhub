// src/routes/reservation.routes.js
const express = require("express");
const router  = express.Router();
const { Reservation, Hostel, Room, Host, Student } = require("../models");
const { protect, restrictTo } = require("../middleware");
const { sendMeetupNotification } = require("../utils/notifications");

async function syncRoomSlotAfterRelease(roomId) {
  const room = await Room.findById(roomId);
  if (!room || room.status === "inactive") return;
  if (room.reservedRooms < 0) {
    room.reservedRooms = 0;
  }
  room.status = room.availableRooms === 0 ? "fully_reserved" : "available";
  await room.save();
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/reservations
// Student creates a reservation for a hostel + room type
// ─────────────────────────────────────────────────────────────────────────────
router.post("/", protect, restrictTo("student"), async (req, res, next) => {
  try {
    const { hostelId, roomId, numberOfPeople, message } = req.body;

    if (!hostelId || !roomId || !numberOfPeople) {
      return res.status(400).json({ message: "hostelId, roomId, and numberOfPeople are required." });
    }
    if (numberOfPeople < 1 || numberOfPeople > 10) {
      return res.status(400).json({ message: "numberOfPeople must be between 1 and 10." });
    }

    // Load hostel + room
    const hostel = await Hostel.findOne({ _id: hostelId, status: "approved" });
    if (!hostel) return res.status(404).json({ message: "Hostel not found or not approved." });

    const room = await Room.findOne({ _id: roomId, hostelId, status: { $ne: "inactive" } });
    if (!room) return res.status(404).json({ message: "Room type not found." });

    // Check available slots
    if (room.availableRooms < 1) {
      return res.status(400).json({ message: "No rooms available in this room type." });
    }

    // Prevent duplicate pending reservation from same student for same room
    const existing = await Reservation.findOne({
      studentId: req.user.id,
      roomId,
      status: { $in: ["pending", "scheduled"] },
    });
    if (existing) {
      return res.status(400).json({ message: "You already have an active reservation for this room type." });
    }

    const reservation = await Reservation.create({
      studentId:      req.user.id,
      hostelId,
      roomId,
      hostId:         hostel.ownerId,
      numberOfPeople: Number(numberOfPeople),
      message:        message || "",
      status:         "pending",
    });

    // Increment reservedRooms on the room (hold the spot)
    await Room.findByIdAndUpdate(roomId, { $inc: { reservedRooms: 1 } });

    // Update room status if fully reserved
    const updatedRoom = await Room.findById(roomId);
    if (updatedRoom.availableRooms === 0) {
      await Room.findByIdAndUpdate(roomId, { status: "fully_reserved" });
    }

    const populated = await Reservation.findById(reservation._id)
      .populate("hostelId", "name location city images")
      .populate("roomId",   "name price billing totalRooms reservedRooms")
      .populate("hostId",   "fullName email phone");

    res.status(201).json({ message: "Reservation submitted. Admin will schedule a meetup soon.", reservation: populated });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reservations/mine
// Student sees all their reservations
// ─────────────────────────────────────────────────────────────────────────────
router.get("/mine", protect, restrictTo("student"), async (req, res, next) => {
  try {
    const reservations = await Reservation.find({ studentId: req.user.id })
      .populate("hostelId", "name location city images address landmark")
      .populate("roomId",   "name price billing totalRooms reservedRooms")
      .populate("hostId",   "fullName email phone")
      .sort({ createdAt: -1 });
    res.json({ reservations });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reservations/host
// Host sees reservations for their hostels
// ─────────────────────────────────────────────────────────────────────────────
router.get("/host", protect, restrictTo("host"), async (req, res, next) => {
  try {
    const reservations = await Reservation.find({ hostId: req.user.id })
      .populate("studentId", "firstName lastName email phone umatId program year")
      .populate("hostelId",  "name location")
      .populate("roomId",    "name price billing")
      .sort({ createdAt: -1 });
    res.json({ reservations });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/reservations/:id
// Student cancels their own pending/scheduled reservation
// ─────────────────────────────────────────────────────────────────────────────
router.delete("/:id", protect, restrictTo("student"), async (req, res, next) => {
  try {
    const reservation = await Reservation.findOne({
      _id: req.params.id,
      studentId: req.user.id,
    });
    if (!reservation) return res.status(404).json({ message: "Reservation not found." });
    if (reservation.status === "confirmed") {
      return res.status(400).json({ message: "Confirmed reservations cannot be cancelled. Please contact HostelHub." });
    }

    reservation.status = "cancelled";
    await reservation.save();

    await Room.findByIdAndUpdate(reservation.roomId, { $inc: { reservedRooms: -1 } });
    await syncRoomSlotAfterRelease(reservation.roomId);

    res.json({ message: "Reservation cancelled." });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// ── ADMIN ROUTES ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/reservations/admin/all
// Admin sees all reservations across the platform
router.get("/admin/all", protect, restrictTo("admin"), async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = status && status !== "all" ? { status } : {};

    const reservations = await Reservation.find(query)
      .populate("studentId", "firstName lastName email phone umatId")
      .populate("hostId",    "fullName email phone")
      .populate("hostelId",  "name location city")
      .populate("roomId",    "name price billing")
      .sort({ createdAt: -1 });

    // Count by status
    const [pending, scheduled, confirmed, cancelled] = await Promise.all([
      Reservation.countDocuments({ status: "pending" }),
      Reservation.countDocuments({ status: "scheduled" }),
      Reservation.countDocuments({ status: "confirmed" }),
      Reservation.countDocuments({ status: "cancelled" }),
    ]);

    res.json({ reservations, counts: { pending, scheduled, confirmed, cancelled, total: reservations.length } });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/reservations/admin/:id/schedule
// Admin schedules a meetup — sends email + SMS to student and host
// ─────────────────────────────────────────────────────────────────────────────
router.put("/admin/:id/schedule", protect, restrictTo("admin"), async (req, res, next) => {
  try {
    const { scheduledAt, location, notes } = req.body;

    if (!scheduledAt) return res.status(400).json({ message: "scheduledAt (date/time) is required." });

    const meetupDate = new Date(scheduledAt);
    if (meetupDate <= new Date()) {
      return res.status(400).json({ message: "Meetup must be scheduled for a future date." });
    }

    const reservation = await Reservation.findById(req.params.id)
      .populate("studentId", "firstName lastName email phone umatId")
      .populate("hostId",    "fullName email phone")
      .populate("hostelId",  "name location city address landmark")
      .populate("roomId",    "name price billing");

    if (!reservation) return res.status(404).json({ message: "Reservation not found." });
    if (reservation.status === "cancelled") {
      return res.status(400).json({ message: "Cannot schedule a cancelled reservation." });
    }

    // Update the reservation with meetup details
    reservation.status           = "scheduled";
    reservation.meetup.scheduledAt = meetupDate;
    reservation.meetup.location    = location || reservation.hostelId.address || reservation.hostelId.name;
    reservation.meetup.notes       = notes || "";
    await reservation.save();

    // ── Send notifications ─────────────────────────────────────────────────
    let notified = false;
    try {
      notified = await sendMeetupNotification({
        reservation,
        student: reservation.studentId,
        host:    reservation.hostId,
        hostel:  reservation.hostelId,
        room:    reservation.roomId,
      });
      if (notified) {
        reservation.meetup.notificationSent = true;
        reservation.meetup.notifiedAt = new Date();
        await reservation.save();
      }
    } catch (notifErr) {
      console.error("Notification error (non-fatal):", notifErr.message);
    }

    res.json({
      message: `Meetup scheduled for ${meetupDate.toLocaleDateString()}. Notifications ${notified ? "sent" : "queued (check logs)"}.`,
      reservation,
      notificationsSent: notified,
    });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/reservations/admin/:id/confirm
// Admin confirms the reservation after the meetup happened
// ─────────────────────────────────────────────────────────────────────────────
router.put("/admin/:id/confirm", protect, restrictTo("admin"), async (req, res, next) => {
  try {
    const reservation = await Reservation.findByIdAndUpdate(
      req.params.id,
      { status: "confirmed" },
      { new: true }
    );
    if (!reservation) return res.status(404).json({ message: "Reservation not found." });
    res.json({ message: "Reservation confirmed.", reservation });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/reservations/admin/:id/cancel
// Admin cancels a reservation (frees room slot)
// ─────────────────────────────────────────────────────────────────────────────
router.put("/admin/:id/cancel", protect, restrictTo("admin"), async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.status(404).json({ message: "Reservation not found." });

    const wasActive = ["pending","scheduled"].includes(reservation.status);
    reservation.status = "cancelled";
    await reservation.save();

    // Free room slot if reservation was active
    if (wasActive) {
      await Room.findByIdAndUpdate(reservation.roomId, { $inc: { reservedRooms: -1 } });
      await syncRoomSlotAfterRelease(reservation.roomId);
    }

    res.json({ message: "Reservation cancelled.", reservation });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/reservations/admin/:id/resend-notification
// Admin resends meetup notifications if student/host didn't receive them
// ─────────────────────────────────────────────────────────────────────────────
router.post("/admin/:id/resend-notification", protect, restrictTo("admin"), async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate("studentId", "firstName lastName email phone")
      .populate("hostId",    "fullName email phone")
      .populate("hostelId",  "name address landmark")
      .populate("roomId",    "name price billing");

    if (!reservation) return res.status(404).json({ message: "Reservation not found." });
    if (!reservation.meetup?.scheduledAt) {
      return res.status(400).json({ message: "No meetup scheduled yet." });
    }

    const notified = await sendMeetupNotification({
      reservation,
      student: reservation.studentId,
      host:    reservation.hostId,
      hostel:  reservation.hostelId,
      room:    reservation.roomId,
    });

    if (notified) {
      reservation.meetup.notificationSent = true;
      reservation.meetup.notifiedAt = new Date();
      await reservation.save();
    }

    res.json({ message: `Notifications ${notified ? "resent successfully" : "failed — check server logs"}.` });
  } catch (err) { next(err); }
});

module.exports = router;