const express = require("express");
const router = express.Router();
const { Message } = require("../models");
const { protect } = require("../middleware");

// POST /api/messages
router.post("/", protect, async (req, res, next) => {
  try {
    const { receiverId, receiverModel, hostelId, body } = req.body;
    if (!body?.trim()) return res.status(400).json({ message: "Message cannot be empty." });
    if (!receiverId || !receiverModel) return res.status(400).json({ message: "receiverId and receiverModel required." });
    const senderModel = req.user.role === "student" ? "Student" : "Host";
    const message = await Message.create({
      senderId: req.user.id, senderModel,
      receiverId, receiverModel,
      hostelId: hostelId || undefined,
      body: body.trim(),
    });
    res.status(201).json({ message: "Sent.", data: message });
  } catch (err) { next(err); }
});

// GET /api/messages/conversation/:userId
router.get("/conversation/:userId", protect, async (req, res, next) => {
  try {
    const me = req.user.id;
    const other = req.params.userId;
    const messages = await Message.find({
      $or: [
        { senderId: me, receiverId: other },
        { senderId: other, receiverId: me },
      ],
    }).sort({ createdAt: 1 });
    // Mark their messages to me as read
    await Message.updateMany({ senderId: other, receiverId: me, read: false }, { read: true });
    res.json({ messages });
  } catch (err) { next(err); }
});

// GET /api/messages/inbox — list all conversation partners with latest message
router.get("/inbox", protect, async (req, res, next) => {
  try {
    const me = req.user.id.toString();
    const all = await Message.find({
      $or: [{ senderId: me }, { receiverId: me }],
    })
      .populate("senderId", "firstName lastName fullName")
      .populate("receiverId", "firstName lastName fullName")
      .populate("hostelId", "name")
      .sort({ createdAt: -1 });

    // Group into conversations by partner ID
    const seen = new Set();
    const conversations = [];
    for (const msg of all) {
      const partner = msg.senderId._id.toString() === me ? msg.receiverId : msg.senderId;
      if (!partner) continue; // Skip if partner is null (user deleted)
      const partnerId = partner._id.toString();
      if (!seen.has(partnerId)) {
        seen.add(partnerId);
        const unread = all.filter(m => {
          if (!m.senderId || !m.receiverId) return false;
          return m.senderId._id.toString() === partnerId &&
            m.receiverId._id.toString() === me &&
            !m.read;
        }).length;
        conversations.push({
          partnerId,
          partnerName: partner.firstName
            ? `${partner.firstName} ${partner.lastName}`
            : partner.fullName,
          hostelName: msg.hostelId?.name || "",
          hostelId: msg.hostelId?._id,
          latestMessage: msg.body,
          latestTime: msg.createdAt,
          unread,
        });
      }
    }
    res.json({ conversations });
  } catch (err) { next(err); }
});

// GET /api/messages/unread-count
router.get("/unread-count", protect, async (req, res, next) => {
  try {
    const count = await Message.countDocuments({ receiverId: req.user.id, read: false });
    res.json({ unreadCount: count });
  } catch (err) { next(err); }
});

module.exports = router;