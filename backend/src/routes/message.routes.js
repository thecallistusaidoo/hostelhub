const express = require("express");
const router = express.Router();
const { Message, Student, Host } = require("../models");
const { protect, validate } = require("../middleware");
const { messageSchema } = require("../utils/validation");

// POST /api/messages — send a message
router.post("/", protect, validate(messageSchema), async (req, res, next) => {
  try {
    const { receiverId, receiverModel, hostelId, body } = req.body;

    // Determine sender model from JWT role
    const senderModel = req.user.role === "student" ? "Student" : "Host";

    const message = await Message.create({
      senderId: req.user.id,
      senderModel,
      receiverId,
      receiverModel,
      hostelId,
      body,
    });

    res.status(201).json({ message: "Message sent.", data: message });
  } catch (err) { next(err); }
});

// GET /api/messages/conversation/:userId
// Returns full conversation thread between current user and :userId
router.get("/conversation/:userId", protect, async (req, res, next) => {
  try {
    const me = req.user.id;
    const other = req.params.userId;

    const messages = await Message.find({
      $or: [
        { senderId: me,    receiverId: other },
        { senderId: other, receiverId: me },
      ],
    }).sort({ createdAt: 1 });

    // Mark messages from other party as read
    await Message.updateMany(
      { senderId: other, receiverId: me, read: false },
      { read: true }
    );

    res.json({ messages });
  } catch (err) { next(err); }
});

// GET /api/messages/inbox — list all conversations (grouped by other party)
router.get("/inbox", protect, async (req, res, next) => {
  try {
    const me = req.user.id.toString();

    // Get all messages involving me
    const all = await Message.find({
      $or: [{ senderId: me }, { receiverId: me }],
    }).sort({ createdAt: -1 });

    // Group by conversation partner
    const conversations = {};
    all.forEach(msg => {
      const otherId = msg.senderId.toString() === me
        ? msg.receiverId.toString()
        : msg.senderId.toString();
      if (!conversations[otherId]) {
        conversations[otherId] = { latestMessage: msg, unreadCount: 0 };
      }
      if (msg.receiverId.toString() === me && !msg.read) {
        conversations[otherId].unreadCount++;
      }
    });

    const partnerIds = Object.keys(conversations);
    const [students, hosts] = await Promise.all([
      Student.find({ _id: { $in: partnerIds } }).select("firstName lastName"),
      Host.find({ _id: { $in: partnerIds } }).select("fullName"),
    ]);
    const studentMap = new Map(students.map(s => [s._id.toString(), s]));
    const hostMap = new Map(hosts.map(h => [h._id.toString(), h]));

    const list = partnerIds.map((partnerId) => {
      const { latestMessage, unreadCount } = conversations[partnerId];
      let partnerName = "User";
      let partnerRole = "unknown";
      const st = studentMap.get(partnerId);
      const ho = hostMap.get(partnerId);
      if (st) {
        partnerName = `${st.firstName} ${st.lastName}`.trim();
        partnerRole = "student";
      } else if (ho) {
        partnerName = ho.fullName;
        partnerRole = "host";
      }
      return {
        partnerId,
        partnerName,
        partnerRole,
        unreadCount,
        latestMessage,
      };
    });

    list.sort((a, b) => new Date(b.latestMessage.createdAt) - new Date(a.latestMessage.createdAt));

    res.json({ conversations: list });
  } catch (err) { next(err); }
});

// GET /api/messages/unread-count
router.get("/unread-count", protect, async (req, res, next) => {
  try {
    const count = await Message.countDocuments({
      receiverId: req.user.id, read: false,
    });
    res.json({ unreadCount: count });
  } catch (err) { next(err); }
});

module.exports = router;