// src/routes/hostel.routes.js
const express = require("express");
const router  = express.Router();
const { Hostel, Room } = require("../models");

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/hostels — browse approved hostels with real available room counts
// ─────────────────────────────────────────────────────────────────────────────
router.get("/", async (req, res, next) => {
  try {
    const { location, gender, minPrice, maxPrice, amenities, sort, page = 1, limit = 20, search } = req.query;

    const query = { status: "approved" };
    if (location && location !== "All") query.location = location;
    if (gender   && gender   !== "All") query.gender   = gender;
    if (minPrice || maxPrice) {
      query.priceFrom = {};
      if (minPrice) query.priceFrom.$gte = Number(minPrice);
      if (maxPrice) query.priceFrom.$lte = Number(maxPrice);
    }
    if (amenities) query.amenities = { $all: amenities.split(",") };
    if (search) {
      const re = new RegExp(search, "i");
      query.$or = [{ name: re }, { location: re }, { description: re }, { landmark: re }];
    }

    let sortOpt = { createdAt: -1 };
    if (sort === "Lowest Price")  sortOpt = { priceFrom: 1 };
    if (sort === "Highest Price") sortOpt = { priceFrom: -1 };
    if (sort === "Highest Rated") sortOpt = { hostRating: -1 };
    if (sort === "Most Viewed")   sortOpt = { viewsCount: -1 };

    const skip = (Number(page) - 1) * Number(limit);

    const [hostels, total] = await Promise.all([
      Hostel.find(query).sort(sortOpt).skip(skip).limit(Number(limit))
        .populate("ownerId", "fullName phone email"),
      Hostel.countDocuments(query),
    ]);

    // ── Attach real available room counts from the Room collection ──────────
    // For each hostel, sum (totalRooms - reservedRooms) across all active room types
    const hostelIds = hostels.map(h => h._id);
    const rooms = await Room.find({
      hostelId: { $in: hostelIds },
      status: { $ne: "inactive" },
    }).select("hostelId totalRooms reservedRooms");

    // Build a map: hostelId → totalAvailableRooms
    const availableMap = {};
    for (const room of rooms) {
      const hid = room.hostelId.toString();
      const avail = Math.max(0, (room.totalRooms || 0) - (room.reservedRooms || 0));
      availableMap[hid] = (availableMap[hid] || 0) + avail;
    }

    // Attach to each hostel in the response
    const enriched = hostels.map(h => ({
      ...h.toObject(),
      totalAvailableRooms: availableMap[h._id.toString()] ?? null, // null = no rooms added yet
    }));

    res.json({ hostels: enriched, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/hostels/:id — single hostel with all room types + availability
// ─────────────────────────────────────────────────────────────────────────────
router.get("/:id", async (req, res, next) => {
  try {
    const hostel = await Hostel.findOne({ _id: req.params.id, status: "approved" })
      .populate("ownerId", "fullName phone email");
    if (!hostel) return res.status(404).json({ message: "Hostel not found." });

    const rooms = await Room.find({ hostelId: hostel._id, status: { $ne: "inactive" } });

    // Attach totalAvailableRooms to hostel too
    const totalAvailableRooms = rooms.reduce((s, r) => s + Math.max(0, r.totalRooms - r.reservedRooms), 0);

    res.json({ hostel: { ...hostel.toObject(), totalAvailableRooms }, rooms });
  } catch (err) { next(err); }
});

// POST /api/hostels/increment-views
router.post("/increment-views", async (req, res, next) => {
  try {
    const { hostelId } = req.body;
    if (hostelId) await Hostel.findByIdAndUpdate(hostelId, { $inc: { viewsCount: 1 } });
    res.json({ message: "ok" });
  } catch (err) { next(err); }
});

module.exports = router;