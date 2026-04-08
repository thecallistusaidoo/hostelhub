const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Hostel images storage
const hostelImageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "hostelhub/hostels",
    allowed_formats: ["jpg","jpeg","png","webp"],
    transformation: [{ width: 1200, height: 800, crop: "limit", quality: "auto:good" }],
  },
});

// ── Ownership documents storage (PDF + images)
const documentStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "hostelhub/documents",
    allowed_formats: ["jpg","jpeg","png","pdf"],
    resource_type: "auto",
  },
});

// ── Multer config: 5MB max, images + PDFs
const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg","image/png","image/webp","application/pdf"];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Only JPG, PNG, WebP and PDF files are allowed"), false);
};

const uploadHostelImages = multer({
  storage: hostelImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter,
}).array("images", 10); // max 10 images

const uploadDocuments = multer({
  storage: documentStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
}).array("documents", 5); // max 5 documents

module.exports = { cloudinary, uploadHostelImages, uploadDocuments };