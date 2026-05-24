const multer = require("multer");
const path = require("path");

let storage;

// Configure hybrid storage: Cloudinary in production/if configured, local storage fallback
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  const cloudinary = require("cloudinary").v2;
  const { CloudinaryStorage } = require("multer-storage-cloudinary");

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });

  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: "hitech_gold_diamonds",
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      public_id: (req, file) => {
        const fileExt = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, fileExt).replace(/[^a-zA-Z0-9]/g, "_");
        return `${Date.now()}_${baseName}`;
      }
    }
  });
  console.log("Cloudinary Storage configured successfully for file uploads.");
} else {
  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      // Save uploads in server/uploads directory relative to project root
      cb(null, path.join(__dirname, "..", "uploads"));
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname));
    }
  });
  console.log("Local Disk Storage configured successfully (No Cloudinary credentials provided).");
}

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPEG, JPG, PNG, and WEBP images are allowed."), false);
  }
};

module.exports = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});
