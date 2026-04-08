const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// ─────────────────────────────────────────────────────────────
// STUDENT MODEL
// ─────────────────────────────────────────────────────────────
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
  role:         { type: String, default: "student" },
  refreshToken: { type: String, select: false },
}, { timestamps: true });

studentSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
studentSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.password);
};

// ─────────────────────────────────────────────────────────────
// HOST MODEL
// ─────────────────────────────────────────────────────────────
const hostSchema = new mongoose.Schema({
  fullName:     { type: String, required: true, trim: true },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone:        { type: String, required: true, trim: true },
  password:     { type: String, required: true, minlength: 8, select: false },
  hostelIds:    [{ type: mongoose.Schema.Types.ObjectId, ref: "Hostel" }],
  verified:     { type: Boolean, default: false },
  role:         { type: String, default: "host" },
  refreshToken: { type: String, select: false },
}, { timestamps: true });

hostSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
hostSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.password);
};

// ─────────────────────────────────────────────────────────────
// HOSTEL MODEL
// ─────────────────────────────────────────────────────────────
const hostelSchema = new mongoose.Schema({
  ownerId:          { type: mongoose.Schema.Types.ObjectId, ref: "Host", required: true },
  name:             { type: String, required: true, trim: true },
  description:      { type: String, required: true },
  location:         { type: String, required: true }, // "Umat" | "Tarkwa"
  city:             { type: String, default: "Tarkwa" },
  address:          { type: String },
  landmark:         { type: String },
  ghanaPost:        { type: String },
  campusDistance:   { type: String },
  gender:           { type: String, enum: ["Mixed","Male Only","Female Only"], default: "Mixed" },
  type:             { type: String, default: "Private" },
  amenities:        [{ type: String }],
  priceFrom:        { type: Number },
  priceTo:          { type: Number },
  images:           [{ type: String }],   // Cloudinary URLs
  ownershipDocs:    [{ type: String }],   // Cloudinary URLs
  status:           { type: String, enum: ["pending","approved","rejected"], default: "pending" },
  isAvailable:      { type: Boolean, default: true },
  viewsCount:       { type: Number, default: 0 },
  hostRating:       { type: Number, default: 0 },
  featured:         { type: Boolean, default: false },
  rules:            [{ type: String }],
}, { timestamps: true });

// ─────────────────────────────────────────────────────────────
// ROOM MODEL
// ─────────────────────────────────────────────────────────────
const roomSchema = new mongoose.Schema({
  hostelId:         { type: mongoose.Schema.Types.ObjectId, ref: "Hostel", required: true },
  name:             { type: String, required: true },  // "4 in a Room", "2 in a Room" etc
  price:            { type: Number, required: true },
  billing:          { type: String, enum: ["Yearly","Semester"], default: "Yearly" },
  capacity:         { type: Number, required: true },  // e.g. 4
  currentOccupancy: { type: Number, default: 0 },
  bathroom:         { type: String, default: "Shared" },
  status:           { type: String, enum: ["available","booked","inactive"], default: "available" },
}, { timestamps: true });

roomSchema.virtual("available").get(function () {
  return this.currentOccupancy < this.capacity;
});

// ─────────────────────────────────────────────────────────────
// BOOKING MODEL
// ─────────────────────────────────────────────────────────────
const bookingSchema = new mongoose.Schema({
  studentId:  { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  hostelId:   { type: mongoose.Schema.Types.ObjectId, ref: "Hostel", required: true },
  roomId:     { type: mongoose.Schema.Types.ObjectId, ref: "Room" },
  status:     { type: String, enum: ["pending","approved","rejected"], default: "pending" },
  message:    { type: String },
}, { timestamps: true });

// ─────────────────────────────────────────────────────────────
// MESSAGE MODEL
// ─────────────────────────────────────────────────────────────
const messageSchema = new mongoose.Schema({
  senderId:   { type: mongoose.Schema.Types.ObjectId, required: true, refPath: "senderModel" },
  senderModel:{ type: String, enum: ["Student","Host"] },
  receiverId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: "receiverModel" },
  receiverModel:{ type: String, enum: ["Student","Host"] },
  hostelId:   { type: mongoose.Schema.Types.ObjectId, ref: "Hostel" },
  body:       { type: String, required: true },
  read:       { type: Boolean, default: false },
}, { timestamps: true });

module.exports = {
  Student: mongoose.model("Student", studentSchema),
  Host:    mongoose.model("Host",    hostSchema),
  Hostel:  mongoose.model("Hostel",  hostelSchema),
  Room:    mongoose.model("Room",    roomSchema),
  Booking: mongoose.model("Booking", bookingSchema),
  Message: mongoose.model("Message", messageSchema),
};