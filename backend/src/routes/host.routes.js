const express = require("express");
const router = express.Router();
const { Host, Hostel, Room, Message } = require("../models");
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
    const allowed = ["fullName","phone"];
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
    const messages = await Message.find({ receiverId: req.user.id, receiverModel: "Host" })
      .populate("senderId", "firstName lastName")
      .sort({ createdAt: -1 });
    res.json({ hostels, rooms, messages });
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
    const allowed = ["name","description","location","amenities","priceFrom","priceTo","gender","isAvailable","rules","campusDistance","landmark","address"];
    allowed.forEach(f => { if (req.body[f] !== undefined) hostel[f] = req.body[f]; });
    await hostel.save();
    res.json({ message: "Hostel updated.", hostel });
  } catch (err) { next(err); }
});

// POST /api/hosts/rooms — add room type + how many physical rooms exist in that category
router.post("/rooms", async (req, res, next) => {
  try {
    const { hostelId, name, price, billing, bathroom } = req.body;
    const rawTotal = req.body.totalRooms ?? req.body.capacity ?? 1;
    const totalRooms = Math.max(1, Math.floor(Number(rawTotal)) || 1);
    const hostel = await Hostel.findOne({ _id: hostelId, ownerId: req.user.id });
    if (!hostel) return res.status(404).json({ message: "Hostel not found or not yours." });
    const room = await Room.create({
      hostelId,
      name,
      price: Number(price),
      billing: billing || "Yearly",
      totalRooms,
      reservedRooms: 0,
      bathroom: bathroom || "Shared",
      status: "available",
    });
    res.status(201).json({ message: "Room added.", room });
  } catch (err) { next(err); }
});

// PUT /api/hosts/rooms/:id
router.put("/rooms/:id", async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id).populate("hostelId");
    if (!room || room.hostelId.ownerId.toString() !== req.user.id) return res.status(403).json({ message: "Not your room." });

    const { name, price, billing, bathroom, status } = req.body;

    if (name !== undefined) room.name = name;
    if (price !== undefined) room.price = Number(price);
    if (billing !== undefined) room.billing = billing;
    if (bathroom !== undefined) room.bathroom = bathroom;
    if (status !== undefined) room.status = status;

    const totalFromBody = req.body.totalRooms !== undefined ? req.body.totalRooms : req.body.capacity;
    if (totalFromBody !== undefined) {
      const tr = Math.max(1, Math.floor(Number(totalFromBody)) || 1);
      if (tr < room.reservedRooms) {
        return res.status(400).json({
          message: `This room type has ${room.reservedRooms} active reservation(s). Set total rooms to at least ${room.reservedRooms}.`,
        });
      }
      room.totalRooms = tr;
    }

    if (room.status !== "inactive") {
      room.status = room.availableRooms === 0 ? "fully_reserved" : "available";
    }

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