const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// ─── STUDENT ─────────────────────────────────────────────────────────────────
const studentSchema = new mongoose.Schema({
  firstName:    { type: String, required: true, trim: true },
  lastName:     { type: String, required: true, trim: true },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone:        { type: String, required: true, trim: true },
  password:     { type: String, required: true, minlength: 8, select: false },
  umatId:       { type: String, required: true, unique: true, trim: true },
  program:      { type: String, required: true },
  year:         { type: String, enum: ["L100","L200","L300","L400"], required: true },
  savedHostels: [{ type: mongoose.Schema.Types.ObjectId, ref: "Hostel" }],
  recentViews:  [{ type: mongoose.Schema.Types.ObjectId, ref: "Hostel" }],
  avatar:       { type: String, default: "" },
  role:         { type: String, default: "student" },
  refreshToken: { type: String, select: false },
}, { timestamps: true });

studentSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
studentSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

// ─── HOST ─────────────────────────────────────────────────────────────────────
const hostSchema = new mongoose.Schema({
  fullName:     { type: String, required: true, trim: true },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone:        { type: String, required: true, trim: true },
  password:     { type: String, required: true, minlength: 8, select: false },
  hostelIds:    [{ type: mongoose.Schema.Types.ObjectId, ref: "Hostel" }],
  verified:     { type: Boolean, default: false },
  avatar:       { type: String, default: "" },
  role:         { type: String, default: "host" },
  refreshToken: { type: String, select: false },
}, { timestamps: true });

hostSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
hostSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

// ─── HOSTEL ───────────────────────────────────────────────────────────────────
const hostelSchema = new mongoose.Schema({
  ownerId:        { type: mongoose.Schema.Types.ObjectId, ref: "Host", required: true },
  name:           { type: String, required: true, trim: true },
  description:    { type: String, required: true },
  location:       { type: String, required: true },
  city:           { type: String, default: "Tarkwa" },
  address:        { type: String, default: "" },
  landmark:       { type: String, default: "" },
  ghanaPost:      { type: String, default: "" },
  campusDistance: { type: String, default: "" },
  gender:         { type: String, enum: ["Mixed","Male Only","Female Only"], default: "Mixed" },
  type:           { type: String, default: "Private" },
  amenities:      [{ type: String }],
  priceFrom:      { type: Number, default: 0 },
  priceTo:        { type: Number, default: 0 },
  images:         [{ type: String }],
  ownershipDocs:  [{ type: String }],
  status:         { type: String, enum: ["pending","approved","rejected"], default: "pending" },
  rejectionReason:{ type: String, default: "" },
  isAvailable:    { type: Boolean, default: true },
  viewsCount:     { type: Number, default: 0 },
  hostRating:     { type: Number, default: 0 },
  featured:       { type: Boolean, default: false },
  rules:          [{ type: String }],
}, { timestamps: true });

// ─── ROOM ─────────────────────────────────────────────────────────────────────
const roomSchema = new mongoose.Schema({
  hostelId:         { type: mongoose.Schema.Types.ObjectId, ref: "Hostel", required: true },
  name:             { type: String, required: true },
  price:            { type: Number, required: true },
  billing:          { type: String, enum: ["Yearly","Semester"], default: "Yearly" },
  // totalRooms = total physical rooms of this type
  totalRooms:       { type: Number, required: true, default: 1 },
  // reservedRooms = rooms with active/pending reservations
  reservedRooms:    { type: Number, default: 0 },
  bathroom:         { type: String, default: "Shared" },
  status:           { type: String, enum: ["available","fully_reserved","inactive"], default: "available" },
}, { timestamps: true });

// Virtual: how many rooms actually remain open
roomSchema.virtual("availableRooms").get(function () {
  return Math.max(0, this.totalRooms - this.reservedRooms);
});
roomSchema.set("toJSON", { virtuals: true });
roomSchema.set("toObject", { virtuals: true });

// ─── RESERVATION (replaces Booking + Payment) ─────────────────────────────────
// A reservation is created when a student selects a hostel + room type + # of people.
// Admin then schedules a physical meetup with student + host.
const reservationSchema = new mongoose.Schema({
  studentId:      { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  hostelId:       { type: mongoose.Schema.Types.ObjectId, ref: "Hostel",  required: true },
  roomId:         { type: mongoose.Schema.Types.ObjectId, ref: "Room",    required: true },
  hostId:         { type: mongoose.Schema.Types.ObjectId, ref: "Host",    required: true },

  // How many people the student wants to reserve for (important for "X in a room" types)
  numberOfPeople: { type: Number, required: true, min: 1, default: 1 },

  // Student's message / notes
  message:        { type: String, default: "" },

  // Status flow: pending → scheduled → confirmed → cancelled
  status: {
    type: String,
    enum: ["pending", "scheduled", "confirmed", "cancelled"],
    default: "pending",
  },

  // ── Meetup scheduling (set by admin) ───────────────────────────────────────
  meetup: {
    scheduledAt:  { type: Date },           // The date/time of the physical meetup
    location:     { type: String, default: "" }, // Where to meet (usually at the hostel)
    notes:        { type: String, default: "" }, // Any admin notes for the meeting
    // Whether notifications were sent
    notificationSent: { type: Boolean, default: false },
    notifiedAt:   { type: Date },
  },

}, { timestamps: true });

// ─── MESSAGE ──────────────────────────────────────────────────────────────────
const messageSchema = new mongoose.Schema({
  senderId:      { type: mongoose.Schema.Types.ObjectId, required: true, refPath: "senderModel" },
  senderModel:   { type: String, enum: ["Student","Host"], required: true },
  receiverId:    { type: mongoose.Schema.Types.ObjectId, required: true, refPath: "receiverModel" },
  receiverModel: { type: String, enum: ["Student","Host"], required: true },
  hostelId:      { type: mongoose.Schema.Types.ObjectId, ref: "Hostel" },
  body:          { type: String, required: true },
  read:          { type: Boolean, default: false },
}, { timestamps: true });

module.exports = {
  Student:     mongoose.model("Student",     studentSchema),
  Host:        mongoose.model("Host",        hostSchema),
  Hostel:      mongoose.model("Hostel",      hostelSchema),
  Room:        mongoose.model("Room",        roomSchema),
  Reservation: mongoose.model("Reservation", reservationSchema),
  Message:     mongoose.model("Message",     messageSchema),
};