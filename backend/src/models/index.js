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

  // ── Payout information (what the host enters) ──────────────────────────────
  payoutMethod:  { type: String, enum: ["bank", "momo", ""], default: "" },
  // Bank fields
  bankName:      { type: String, default: "" },
  bankCode:      { type: String, default: "" },   // Paystack bank code e.g. "030" for GCB
  accountNumber: { type: String, default: "" },
  accountName:   { type: String, default: "" },   // Verified by Paystack
  // MoMo fields
  momoNetwork:   { type: String, default: "" },   // "mtn", "vod", "tgo"
  momoNumber:    { type: String, default: "" },

  // ── Paystack recipient (set automatically when host saves payout info) ──────
  paystackRecipientCode: { type: String, default: "" },  // e.g. "RCP_xxxxxxxxxxxx"
  paystackRecipientId:   { type: Number, default: null }, // Paystack internal ID
  payoutSetupComplete:   { type: Boolean, default: false },

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
  capacity:         { type: Number, required: true },
  currentOccupancy: { type: Number, default: 0 },
  bathroom:         { type: String, default: "Shared" },
  status:           { type: String, enum: ["available","booked","inactive"], default: "available" },
}, { timestamps: true });

// ─── BOOKING ──────────────────────────────────────────────────────────────────
const bookingSchema = new mongoose.Schema({
  studentId:  { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  hostelId:   { type: mongoose.Schema.Types.ObjectId, ref: "Hostel",  required: true },
  roomId:     { type: mongoose.Schema.Types.ObjectId, ref: "Room" },
  status:     { type: String, enum: ["pending","approved","rejected","paid"], default: "pending" },
  amount:     { type: Number, default: 0 },
  currency:   { type: String, default: "GHS" },
  paymentStatus: { type: String, enum: ["pending","success","failed"], default: "pending" },
  paymentFailureReason: { type: String, default: "" },
  message:    { type: String, default: "" },
  paymentRef: { type: String, default: "" },
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

// ─── PAYMENT ──────────────────────────────────────────────────────────────────
const paymentSchema = new mongoose.Schema({
  // What was paid
  reference:         { type: String, required: true, unique: true },  // e.g. "HH-1234567890-ABCDEF"
  studentId:         { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  hostelId:          { type: mongoose.Schema.Types.ObjectId, ref: "Hostel",  required: true },
  hostId:            { type: mongoose.Schema.Types.ObjectId, ref: "Host",    required: true },
  bookingId:         { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
  roomName:          { type: String, default: "" },
  amountPaid:        { type: Number, required: true },    // Full amount in GH₵
  amountPaidPesewas: { type: Number, required: true },    // Full amount in pesewas (amountPaid * 100)

  // Fee split
  platformFeePercent:{ type: Number, default: 5 },
  platformFee:       { type: Number, required: true },    // 5% in GH₵ — stays in your Paystack balance
  hostPayout:        { type: Number, required: true },    // 95% in GH₵ — transferred to host

  // Paystack charge status (money hitting your account)
  paystackChargeStatus: { type: String, enum: ["pending","success","failed"], default: "pending" },
  paystackGatewayResponse: { type: String, default: "" },
  paystackChannel: { type: String, default: "" },
  chargeFailureReason: { type: String, default: "" },
  paidAt: { type: Date },
  currency: { type: String, default: "GHS" },

  // Transfer to host status (money going from your account to host)
  transferReference:  { type: String, default: "" },      // Paystack transfer reference
  transferCode:       { type: String, default: "" },      // Paystack transfer_code
  transferStatus:     { type: String, enum: ["pending","initiated","success","failed","reversed",""], default: "" },
  transferFailureReason: { type: String, default: "" },

  // Settled means host has been paid
  settled:           { type: Boolean, default: false },
  settledAt:         { type: Date },
}, { timestamps: true });

module.exports = {
  Student: mongoose.model("Student", studentSchema),
  Host:    mongoose.model("Host",    hostSchema),
  Hostel:  mongoose.model("Hostel",  hostelSchema),
  Room:    mongoose.model("Room",    roomSchema),
  Booking: mongoose.model("Booking", bookingSchema),
  Message: mongoose.model("Message", messageSchema),
  Payment: mongoose.model("Payment", paymentSchema),
};