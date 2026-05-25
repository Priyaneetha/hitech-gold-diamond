const express = require("express");
const mongoose = require("mongoose");
mongoose.set("bufferCommands", false);
const session = require("express-session");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

// Ensure uploads folder exists dynamically on startup (important for Git-ignored directories on cloud hosts)
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("Local uploads directory initialized successfully.");
}


const app = express();

// Trust reverse proxy for secure cookies on hosting platforms (like Render/Railway)
app.set("trust proxy", 1);

/* Middleware */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(session({
  secret: process.env.SESSION_SECRET || "hitechgoldsecret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

/* MongoDB */
const seedAdmin = async () => {
  try {
    const Admin = require("./models/Admin");
    const bcrypt = require("bcrypt");
    const username = process.env.ADMIN_USERNAME || "admin";
    const password = process.env.ADMIN_PASSWORD || "admin123";

    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      // Re-hash and update password in case it was changed in env config
      const hashedPassword = await bcrypt.hash(password, 10);
      existingAdmin.password = hashedPassword;
      await existingAdmin.save();
      console.log(`Admin credentials verified & synchronized successfully for user: '${username}'`);
    } else {
      // Clear old admins to keep user database secure and single-tenant
      await Admin.deleteMany({});
      const hashedPassword = await bcrypt.hash(password, 10);
      const newAdmin = new Admin({ username, password: hashedPassword });
      await newAdmin.save();
      console.log(`Admin user initialized successfully with username: '${username}'`);
    }
  } catch (error) {
    console.error("Error seeding admin user:", error);
  }
};

const connectDB = async () => {
  const primaryUri = process.env.MONGO_URI;
  const localFallback = "mongodb://127.0.0.1:27017/hitech_gold_diamonds";
  
  try {
    await mongoose.connect(primaryUri);
    console.log("MongoDB connected successfully to primary Atlas cluster.");
    await seedAdmin();
  } catch (err) {
    console.error("MongoDB Atlas primary connection failed:", err.message);
    console.log("Attempting local offline MongoDB fallback...");
    try {
      await mongoose.connect(localFallback);
      console.log("MongoDB connected successfully to local fallback database.");
      await seedAdmin();
    } catch (localErr) {
      console.error("MongoDB local fallback connection failed:", localErr.message);
      console.error("CRITICAL WARNING: The application is running without an active database connection. Database features will time out!");
    }
  }
};

connectDB();

/* Static files */
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* API Routes */
app.use("/api/admin", require("./routes/admin"));
app.use("/api/products", require("./routes/products"));
app.use("/api/categories", require("./routes/categories"));
app.use("/api/goldrate", require("./routes/goldrate"));
app.use("/api/sliders", require("./routes/sliders"));
app.use("/api/tagline", require("./routes/tagline"));
app.use("/api/contact", require("./routes/contact"));
app.use("/api/offers", require("./routes/offers"));

/* Frontend */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* Global Error Handler */
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);
  res.status(err.status || 500).json({
    message: err.message || "An unexpected error occurred on the server"
  });
});

/* Server start — ALWAYS LAST */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});