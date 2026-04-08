const express = require("express");
const router = express.Router();
const { Host, Hostel, Room } = require("../models");
const { protect, restrictTo, validate } = require("../middleware");
const { addHostelSchema } = require("../utils/validation");
const { uploadHostelImages, uploadDocuments } = require("../config/cloudinary");

router.use(protect, restrictTo("host"));

// GET /api/hosts/me
router.get("/me", async (req, res, next) => {
  try {
    const host = await Host.findById(req.user.id).populate("hostelIds", "name status viewsCount");
    if (!host) return res.status(404).json({ message: "Host not found." });
    res.json({ host });
  } catch (err) { next(err); }
});

// PUT /api/hosts/update-profile
router.put("/update-profile", async (req, res, next) => {
  try {
    const allowed = ["fullName", "phone"];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    const host = await Host.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true });
    res.json({ message: "Profile updated.", host });
  } catch (err) { next(err); }
});

// GET /api/hosts/my-hostels
router.get("/my-hostels", async (req, res, next) => {
  try {
    const hostels = await Hostel.find({ ownerId: req.user.id }).sort({ createdAt: -1 });
    res.json({ hostels });
  } catch (err) { next(err); }
});

// POST /api/hosts/add-hostel
// Handles: multipart/form-data with images[] and documents[]
router.post("/add-hostel", (req, res, next) => {
  // Run both upload middlewares sequentially
  uploadHostelImages(req, res, (imgErr) => {
    if (imgErr) return next(imgErr);
    uploadDocuments(req, res, async (docErr) => {
      if (docErr) return next(docErr);
      try {
        const {
          name, description, location, address, landmark,
          ghanaPost, campusDistance, gender, amenities,
          priceFrom, priceTo, rules,
        } = req.body;

        // Validate required fields
        if (!name || !description || !location) {
          return res.status(400).json({ message: "name, description, and location are required." });
        }

        const imageUrls = (req.files || [])
          .filter(f => f.fieldname === "images")
          .map(f => f.path);

        const docUrls = (req.files || [])
          .filter(f => f.fieldname === "documents")
          .map(f => f.path);

        const hostel = await Hostel.create({
          ownerId: req.user.id,
          name, description,
          location: location.includes("Umat") ? "Umat" : "Tarkwa",
          address, landmark, ghanaPost, campusDistance,
          gender: gender || "Mixed",
          amenities: Array.isArray(amenities) ? amenities : JSON.parse(amenities || "[]"),
          priceFrom: Number(priceFrom) || 0,
          priceTo: Number(priceTo) || 0,
          rules: Array.isArray(rules) ? rules : JSON.parse(rules || "[]"),
          images: imageUrls,
          ownershipDocs: docUrls,
          status: "pending",
        });

        // Link hostel to host
        await Host.findByIdAndUpdate(req.user.id, { $push: { hostelIds: hostel._id } });

        res.status(201).json({
          message: "Hostel submitted successfully. Pending admin review.",
          hostel,
        });
      } catch (err) { next(err); }
    });
  });
});

// PUT /api/hosts/update-hostel/:id
router.put("/update-hostel/:id", async (req, res, next) => {
  try {
    const hostel = await Hostel.findOne({ _id: req.params.id, ownerId: req.user.id });
    if (!hostel) return res.status(404).json({ message: "Hostel not found or not yours." });

    const allowed = ["name","description","amenities","priceFrom","priceTo","gender","isAvailable","rules"];
    allowed.forEach(f => { if (req.body[f] !== undefined) hostel[f] = req.body[f]; });
    await hostel.save();

    res.json({ message: "Hostel updated.", hostel });
  } catch (err) { next(err); }
});

// DELETE /api/hosts/delete-hostel/:id
router.delete("/delete-hostel/:id", async (req, res, next) => {
  try {
    const hostel = await Hostel.findOneAndDelete({ _id: req.params.id, ownerId: req.user.id });
    if (!hostel) return res.status(404).json({ message: "Hostel not found or not yours." });

    await Host.findByIdAndUpdate(req.user.id, { $pull: { hostelIds: hostel._id } });
    res.json({ message: "Hostel deleted." });
  } catch (err) { next(err); }
});

// POST /api/hosts/rooms — add a room type to a hostel
router.post("/rooms", async (req, res, next) => {
  try {
    const { hostelId, name, price, billing, capacity, bathroom } = req.body;

    const hostel = await Hostel.findOne({ _id: hostelId, ownerId: req.user.id });
    if (!hostel) return res.status(404).json({ message: "Hostel not found or not yours." });

    const room = await Room.create({ hostelId, name, price, billing, capacity, bathroom });
    res.status(201).json({ message: "Room added.", room });
  } catch (err) { next(err); }
});

// PUT /api/hosts/rooms/:id — update a room
router.put("/rooms/:id", async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id).populate("hostelId");
    if (!room) return res.status(404).json({ message: "Room not found." });
    if (room.hostelId.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not your room." });
    }

    const allowed = ["name","price","billing","capacity","currentOccupancy","bathroom","status"];
    allowed.forEach(f => { if (req.body[f] !== undefined) room[f] = req.body[f]; });
    await room.save();
    res.json({ message: "Room updated.", room });
  } catch (err) { next(err); }
});

module.exports = router;