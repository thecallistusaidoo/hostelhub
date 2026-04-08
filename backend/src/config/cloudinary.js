const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Combined storage (images + documents in same request)
// We must accept both `images` and `documents` in one multipart request.
// Using `.array("images")` would reject `documents` as "Unexpected field".
const combinedStorage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => {
    const isImage = file.fieldname === "images";
    const isDoc = file.fieldname === "documents";

    const folder = isImage ? "hostelhub/hostels" : "hostelhub/documents";

    return {
      folder,
      allowed_formats: isImage ? ["jpg", "jpeg", "png", "webp"] : ["jpg", "jpeg", "png", "pdf"],
      resource_type: isDoc ? "auto" : "image",
      ...(isImage
        ? { transformation: [{ width: 1200, height: 800, crop: "limit", quality: "auto:good" }] }
        : {}),
    };
  },
});

// ── Multer config: 5MB max, images + PDFs
const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg","image/png","image/webp","application/pdf"];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Only JPG, PNG, WebP and PDF files are allowed"), false);
};

const uploadHostelSubmission = multer({
  storage: combinedStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter,
}).fields([
  { name: "images", maxCount: 10 },
  { name: "documents", maxCount: 5 },
]);

module.exports = { cloudinary, uploadHostelSubmission };