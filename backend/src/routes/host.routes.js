const express = require("express");
const router = express.Router();
const { Host, Hostel, Room, Booking, Message } = require("../models");
const { protect, restrictTo } = require("../middleware");
const { uploadHostelSubmission } = require("../config/cloudinary");

router.use(protect, restrictTo("host"));

// GET /api/hosts/me
router.get("/me", async (req, res, next) => {
  try {
    const host = await Host.findById(req.user.id).select("-password -refreshToken")
      .populate("hostelIds", "name status viewsCount priceFrom images location");
    if (!host) return res.status(404).json({ message: "Host not found." });
    res.json({ host });
  } catch (err) { next(err); }
});

// PUT /api/hosts/update-profile
router.put("/update-profile", async (req, res, next) => {
  try {
    const allowed = ["fullName","phone","payoutMethod","bankName","accountNumber","accountName","momoNetwork","momoNumber"];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    const host = await Host.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true }).select("-password -refreshToken");
    res.json({ message: "Profile updated.", host });
  } catch (err) { next(err); }
});

// PUT /api/hosts/change-password
router.put("/change-password", async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ message: "Both passwords required." });
    if (newPassword.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters." });
    const host = await Host.findById(req.user.id).select("+password");
    const valid = await host.comparePassword(currentPassword);
    if (!valid) return res.status(401).json({ message: "Current password is incorrect." });
    host.password = newPassword;
    await host.save();
    res.json({ message: "Password updated." });
  } catch (err) { next(err); }
});

// GET /api/hosts/my-hostels — all hostels owned by this host
router.get("/my-hostels", async (req, res, next) => {
  try {
    const hostels = await Hostel.find({ ownerId: req.user.id }).sort({ createdAt: -1 });
    const hostelIds = hostels.map(h => h._id);
    const rooms = await Room.find({ hostelId: { $in: hostelIds } });
    const bookings = await Booking.find({ hostelId: { $in: hostelIds } })
      .populate("studentId", "firstName lastName email phone")
      .populate("hostelId", "name")
      .populate("roomId", "name price")
      .sort({ createdAt: -1 });
    const messages = await Message.find({ receiverId: req.user.id, receiverModel: "Host" })
      .populate("senderId", "firstName lastName")
      .sort({ createdAt: -1 });
    res.json({ hostels, rooms, bookings, messages });
  } catch (err) { next(err); }
});

// POST /api/hosts/add-hostel — submit hostel for review
router.post("/add-hostel", (req, res, next) => {
  uploadHostelSubmission(req, res, async (upErr) => {
    if (upErr) return next(upErr);
    try {
      const { name, description, location, address, landmark, ghanaPost, campusDistance, gender, amenities, priceFrom, priceTo, rules } = req.body;
      if (!name || !description || !location) return res.status(400).json({ message: "name, description, and location are required." });

      const imageUrls = (req.files?.images || []).map(f => f.path);
      const docUrls   = (req.files?.documents || []).map(f => f.path);

      let parsedAmenities = [];
      let parsedRules = [];
      try { parsedAmenities = Array.isArray(amenities) ? amenities : JSON.parse(amenities || "[]"); } catch {}
      try { parsedRules = Array.isArray(rules) ? rules : JSON.parse(rules || "[]"); } catch {}

      const hostel = await Hostel.create({
        ownerId: req.user.id,
        name, description,
        location: location.toLowerCase().includes("umat") ? "Umat" : "Tarkwa",
        address, landmark, ghanaPost, campusDistance,
        gender: gender || "Mixed",
        amenities: parsedAmenities,
        priceFrom: Number(priceFrom) || 0,
        priceTo:   Number(priceTo) || 0,
        rules: parsedRules,
        images: imageUrls,
        ownershipDocs: docUrls,
        status: "pending",
      });

      await Host.findByIdAndUpdate(req.user.id, { $push: { hostelIds: hostel._id } });
      res.status(201).json({ message: "Hostel submitted. Pending admin approval.", hostel });
    } catch (err) { next(err); }
  });
});

// PUT /api/hosts/hostels/:id — update own hostel
router.put("/hostels/:id", async (req, res, next) => {
  try {
    const hostel = await Hostel.findOne({ _id: req.params.id, ownerId: req.user.id });
    if (!hostel) return res.status(404).json({ message: "Hostel not found or not yours." });
    const allowed = ["name","description","amenities","priceFrom","priceTo","gender","isAvailable","rules","campusDistance","landmark","address"];
    allowed.forEach(f => { if (req.body[f] !== undefined) hostel[f] = req.body[f]; });
    await hostel.save();
    res.json({ message: "Hostel updated.", hostel });
  } catch (err) { next(err); }
});

// GET /api/hosts/bookings — bookings for all my hostels
router.get("/bookings", async (req, res, next) => {
  try {
    const myHostels = await Hostel.find({ ownerId: req.user.id }).select("_id");
    const ids = myHostels.map(h => h._id);
    const bookings = await Booking.find({ hostelId: { $in: ids } })
      .populate("studentId", "firstName lastName email phone umatId program year")
      .populate("hostelId", "name location")
      .populate("roomId", "name price billing")
      .sort({ createdAt: -1 });
    res.json({ bookings });
  } catch (err) { next(err); }
});

// PUT /api/hosts/bookings/:id — approve or reject
router.put("/bookings/:id", async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["approved","rejected"].includes(status)) return res.status(400).json({ message: "Status must be approved or rejected." });
    const booking = await Booking.findById(req.params.id).populate("hostelId");
    if (!booking) return res.status(404).json({ message: "Booking not found." });
    if (booking.hostelId.ownerId.toString() !== req.user.id) return res.status(403).json({ message: "Not your booking." });
    booking.status = status;
    await booking.save();
    res.json({ message: `Booking ${status}.`, booking });
  } catch (err) { next(err); }
});

// POST /api/hosts/rooms — add room to hostel
router.post("/rooms", async (req, res, next) => {
  try {
    const { hostelId, name, price, billing, capacity, bathroom } = req.body;
    const hostel = await Hostel.findOne({ _id: hostelId, ownerId: req.user.id });
    if (!hostel) return res.status(404).json({ message: "Hostel not found or not yours." });
    const room = await Room.create({ hostelId, name, price: Number(price), billing, capacity: Number(capacity), bathroom });
    res.status(201).json({ message: "Room added.", room });
  } catch (err) { next(err); }
});

// PUT /api/hosts/rooms/:id
router.put("/rooms/:id", async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id).populate("hostelId");
    if (!room || room.hostelId.ownerId.toString() !== req.user.id) return res.status(403).json({ message: "Not your room." });
    const allowed = ["name","price","billing","capacity","currentOccupancy","bathroom","status"];
    allowed.forEach(f => { if (req.body[f] !== undefined) room[f] = req.body[f]; });
    await room.save();
    res.json({ message: "Room updated.", room });
  } catch (err) { next(err); }
});

// GET /api/hosts/messages — conversations
router.get("/messages", async (req, res, next) => {
  try {
    const messages = await Message.find({
      $or: [{ senderId: req.user.id }, { receiverId: req.user.id }],
    })
      .populate("senderId", "firstName lastName fullName")
      .populate("receiverId", "firstName lastName fullName")
      .populate("hostelId", "name")
      .sort({ createdAt: -1 });
    res.json({ messages });
  } catch (err) { next(err); }
});

// POST /api/hosts/messages — send message
router.post("/messages", async (req, res, next) => {
  try {
    const { receiverId, receiverModel, hostelId, body } = req.body;
    if (!body?.trim()) return res.status(400).json({ message: "Message body required." });
    const message = await Message.create({
      senderId: req.user.id, senderModel: "Host",
      receiverId, receiverModel, hostelId, body,
    });
    res.status(201).json({ message: "Sent.", data: message });
  } catch (err) { next(err); }
});

module.exports = router;