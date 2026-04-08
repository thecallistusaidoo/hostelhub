const { z } = require("zod");

const signupStudentSchema = z.object({
  firstName: z.string().min(2, "First name too short"),
  lastName:  z.string().min(2, "Last name too short"),
  email:     z.string().email("Invalid email"),
  phone:     z.string().min(10, "Invalid phone number"),
  password:  z.string().min(8, "Password must be at least 8 characters"),
  umatId:    z.string().min(5, "Invalid UMaT ID"),
  program:   z.string().min(2, "Program required"),
  year:      z.enum(["L100","L200","L300","L400"]),
});

const signupHostSchema = z.object({
  fullName:  z.string().min(3, "Full name required"),
  email:     z.string().email("Invalid email"),
  phone:     z.string().min(10, "Invalid phone number"),
  password:  z.string().min(8, "Password must be at least 8 characters"),
});

const loginSchema = z.object({
  email:    z.string().email("Invalid email"),
  password: z.string().min(1, "Password required"),
});

const addHostelSchema = z.object({
  name:           z.string().min(3, "Hostel name required"),
  description:    z.string().min(20, "Description too short"),
  location:       z.string().min(2),
  address:        z.string().optional(),
  landmark:       z.string().optional(),
  ghanaPost:      z.string().optional(),
  campusDistance: z.string().optional(),
  gender:         z.enum(["Mixed","Male Only","Female Only"]).optional(),
  amenities:      z.array(z.string()).optional(),
  priceFrom:      z.number().optional(),
  priceTo:        z.number().optional(),
});

const bookingSchema = z.object({
  hostelId: z.string(),
  roomId:   z.string().optional(),
  message:  z.string().optional(),
});

const messageSchema = z.object({
  receiverId:    z.string(),
  receiverModel: z.enum(["Student","Host"]),
  hostelId:      z.string().optional(),
  body:          z.string().min(1, "Message cannot be empty"),
});

module.exports = {
  signupStudentSchema,
  signupHostSchema,
  loginSchema,
  addHostelSchema,
  bookingSchema,
  messageSchema,
};