// Creates the first admin account.
//
//   ADMIN_PASSWORD="a-strong-password" node createAdmin.js
//
// Optional: ADMIN_EMAIL (default admin@homebite.com), ADMIN_NAME, ADMIN_PHONE.
// The password is never hardcoded, so it is safe to use against a hosted database.
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("./models/User");
const connectDB = require("./config/db");

const createAdmin = async () => {
  const email = (process.env.ADMIN_EMAIL || "admin@homebite.com")
    .trim()
    .toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!password || password.length < 8) {
    console.error(
      "Set a password of at least 8 characters, for example:\n" +
        '  ADMIN_PASSWORD="your-strong-password" node createAdmin.js',
    );
    process.exit(1);
  }

  try {
    await connectDB();

    const existingAdmin = await User.findOne({ email });

    if (existingAdmin) {
      console.log(`Admin already exists: ${email}`);
      await mongoose.disconnect();
      process.exit(0);
    }

    await User.create({
      name: process.env.ADMIN_NAME || "HomeBite Admin",
      email,
      phone: process.env.ADMIN_PHONE || "9000000000",
      password: await bcrypt.hash(password, 10),
      role: "admin",
    });

    console.log(`Admin created successfully. Log in with: ${email}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Admin creation error:", error.message);
    process.exit(1);
  }
};

createAdmin();
