const express = require("express");
const router = express.Router();
const { Hostel, Room } = require("../models");
const mongoose = require("mongoose");
const { protect } = require("../middleware");

// GET /api/hostels — browse all approved hostels with filtering
router.get("/", async (req, res, next) => {
  try {
    const {
      location, gender, minPrice, maxPrice,
      amenities, sort, page = 1, limit = 12,
      search,
    } = req.query;

    const query = { status: "approved" };

    if (location && location !== "All") query.location = location;
    if (gender && gender !== "All") query.gender = gender;

    if (minPrice || maxPrice) {
      query.priceFrom = {};
      if (minPrice) query.priceFrom.$gte = Number(minPrice);
      if (maxPrice) query.priceFrom.$lte = Number(maxPrice);
    }

    if (amenities) {
      const arr = amenities.split(",");
      query.amenities = { $all: arr };
    }

    if (search) {
      const re = new RegExp(search, "i");
      query.$or = [{ name: re }, { location: re }, { description: re }, { landmark: re }];
    }

    let sortOpt = { createdAt: -1 };
    if (sort === "Lowest Price") sortOpt = { priceFrom: 1 };
    else if (sort === "Highest Price") sortOpt = { priceFrom: -1 };
    else if (sort === "Highest Rated") sortOpt = { hostRating: -1 };
    else if (sort === "Most Viewed") sortOpt = { viewsCount: -1 };

    const skip = (Number(page) - 1) * Number(limit);
    const [hostels, total] = await Promise.all([
      Hostel.find(query).sort(sortOpt).skip(skip).limit(Number(limit))
        .populate("ownerId", "fullName phone email"),
      Hostel.countDocuments(query),
    ]);

    // Add availableRooms to each hostel
    for (const h of hostels) {
      const availableCount = await Room.countDocuments({ hostelId: h._id, status: "available" });
      h.availableRooms = availableCount;
    }

    res.json({
      hostels,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) { next(err); }
});

// GET /api/hostels/:id — single hostel detail
router.get("/:id", async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: "Hostel not found." });
    }
    const hostel = await Hostel.findOne({ _id: req.params.id, status: "approved" })
      .populate("ownerId", "fullName phone email hostRating");
    if (!hostel) return res.status(404).json({ message: "Hostel not found." });

    const rooms = await Room.find({ hostelId: hostel._id });
    res.json({ hostel, rooms });
  } catch (err) { next(err); }
});

// GET /api/hostels/:id/rooms
router.get("/:id/rooms", async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: "Hostel not found." });
    }
    const rooms = await Room.find({ hostelId: req.params.id });
    res.json({ rooms });
  } catch (err) { next(err); }
});

// POST /api/hostels/increment-views
router.post("/increment-views", async (req, res, next) => {
  try {
    const { hostelId } = req.body;
    await Hostel.findByIdAndUpdate(hostelId, { $inc: { viewsCount: 1 } });
    res.json({ message: "View counted." });
  } catch (err) { next(err); }
});

module.exports = router;