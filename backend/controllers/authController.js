const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const streamifier = require("streamifier");

const User = require("../models/User");
const Vendor = require("../models/vendor");
const transporter = require("../config/mail");
const cloudinary = require("../config/cloudinary");

// =====================================================
// JWT TOKEN
// =====================================================

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    },
  );
};

// =====================================================
// OTP GENERATOR
// =====================================================

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "homebite/users",
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      },
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

// =====================================================
// REGISTER
// =====================================================

const register = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      confirmPassword,
      role,
      shopName,
      address,
      description,
      vendorType,
      city,
      ownerName,
    } = req.body;

    // ==========================================
    // REQUIRED BASIC FIELDS
    // ==========================================

    if (!name || !email || !phone || !password || !confirmPassword || !role) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be filled",
      });
    }

    // ==========================================
    // ALLOWED PUBLIC ROLES
    // ==========================================

    const allowedRoles = ["customer", "vendor", "homechef", "delivery_partner"];

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        success: false,
        message: "Admin registration is not allowed",
      });
    }

    // ==========================================
    // PASSWORD VALIDATION
    // ==========================================

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 6 characters",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedPhone = phone.trim();

    // ==========================================
    // CHECK EMAIL
    // ==========================================

    const existingEmail = await User.findOne({
      email: normalizedEmail,
    });

    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    // ==========================================
    // CHECK PHONE
    // ==========================================

    const existingPhone = await User.findOne({
      phone: normalizedPhone,
    });

    if (existingPhone) {
      return res.status(409).json({
        success: false,
        message: "Phone number already registered",
      });
    }

    // ==========================================
    // VENDOR VALIDATION
    // ==========================================

    if (role === "vendor") {
      if (
        !ownerName ||
        !shopName ||
        !vendorType ||
        !address ||
        !description ||
        !city
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Owner name, business name, vendor type, address, city and description are required",
        });
      }

      if (!["restaurant", "grocery"].includes(vendorType)) {
        return res.status(400).json({
          success: false,
          message: "Vendor type must be restaurant or grocery",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Please select a vendor image",
        });
      }
    }

    // ==========================================
    // HASH PASSWORD
    // ==========================================

    const hashedPassword = await bcrypt.hash(password, 10);

    // ==========================================
    // IMAGE UPLOAD
    // ==========================================

    let imageUrl = null;

    if (req.file) {
      const uploadedImage = await uploadToCloudinary(req.file.buffer);
      imageUrl = uploadedImage.secure_url;
    }

    // ==========================================
    // CREATE USER
    // ==========================================

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      password: hashedPassword,
      role,
    });

    // ==========================================
    // CREATE VENDOR
    // ==========================================

    if (role === "vendor") {
      const vendor = await Vendor.create({
        userId: user._id,

        ownerName: ownerName.trim(),

        businessName: shopName.trim(),

        vendorType,

        email: normalizedEmail,

        phone: normalizedPhone,

        address: address.trim(),

        city: city.trim(),

        description: description.trim(),

        image: imageUrl,

        status: "pending",

        isActive: false,
      });

      return res.status(201).json({
        success: true,
        message: "Vendor registration successful",

        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },

        vendor: {
          id: vendor._id,
          userId: vendor.userId,
          ownerName: vendor.ownerName,
          businessName: vendor.businessName,
          vendorType: vendor.vendorType,
          email: vendor.email,
          phone: vendor.phone,
          address: vendor.address,
          city: vendor.city,
          description: vendor.description,
          image: vendor.image,
          status: vendor.status,
          isActive: vendor.isActive,
        },
      });
    }

    // ==========================================
    // CUSTOMER / OTHER ROLE RESPONSE
    // ==========================================

    return res.status(201).json({
      success: true,
      message: "Registration successful",

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Register Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error during registration",
      error: error.message,
    });
  }
};

// =====================================================
// LOGIN
// =====================================================

const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Check fields
    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Email, password and role are required",
      });
    }

    const allowedRoles = [
      "customer",
      "vendor",
      "homechef",
      "delivery_partner",
      "admin",
    ];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user using email + role
    const user = await User.findOne({
      email: normalizedEmail,
      role,
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email, password or role",
      });
    }

    // Check password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email, password or role",
      });
    }

    // Generate token
    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: "Login successful",

      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

// =====================================================
// GET PROFILE
// =====================================================

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "-password -resetOTP -resetOTPExpiry",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Account details only. A vendor's business details (address,
    // description, image) live on the Vendor record ("My Store").
    const profile = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    };

    res.status(200).json({
      success: true,
      user: profile,
    });
  } catch (error) {
    console.error("Get Profile Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =====================================================
// UPDATE PROFILE
// =====================================================

const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (name && name.trim() !== "") {
      user.name = name.trim();
    }

    if (phone && phone.trim() !== "" && phone.trim() !== user.phone) {
      const existingPhone = await User.findOne({
        phone: phone.trim(),
        _id: { $ne: user._id },
      });

      if (existingPhone) {
        return res.status(409).json({
          success: false,
          message: "Phone number already registered",
        });
      }

      user.phone = phone.trim();
    }

    await user.save();

    const updatedUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    };

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while updating profile",
    });
  }
};

// =====================================================
// FORGOT PASSWORD - SEND OTP
// =====================================================

const forgotPassword = async (req, res) => {
  try {
    const { email, role } = req.body;

    if (!email || !role) {
      return res.status(400).json({
        success: false,
        message: "Email and role are required",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      role,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    const otp = generateOTP();

    // OTP valid for 10 minutes
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    user.resetOTP = otp;
    user.resetOTPExpiry = expiry;

    await user.save();

    await transporter.sendMail({
      from: `"HomeBite" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "HomeBite Password Reset OTP",

      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>HomeBite Password Reset</h2>

          <p>Hello ${user.name},</p>

          <p>
            We received a request to reset your password.
          </p>

          <p>Your OTP is:</p>

          <h1 style="letter-spacing: 6px;">
            ${otp}
          </h1>

          <p>
            This OTP will expire in 10 minutes.
          </p>

          <p>
            If you did not request this, please ignore
            this email.
          </p>
        </div>
      `,
    });

    res.status(200).json({
      success: true,
      message: "OTP sent successfully to your email",
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to send OTP",
    });
  }
};

// =====================================================
// VERIFY OTP
// =====================================================

const verifyOTP = async (req, res) => {
  try {
    const { email, role, otp } = req.body;

    if (!email || !role || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email, role and OTP are required",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      role,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    if (!user.resetOTP || !user.resetOTPExpiry) {
      return res.status(400).json({
        success: false,
        message: "OTP was not requested",
      });
    }

    if (user.resetOTPExpiry < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
    }

    if (user.resetOTP !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    res.status(200).json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    console.error("Verify OTP Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while verifying OTP",
    });
  }
};

// =====================================================
// RESET PASSWORD
// =====================================================

const resetPassword = async (req, res) => {
  try {
    const { email, role, otp, newPassword, confirmPassword } = req.body;

    if (!email || !role || !otp || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 6 characters",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      role,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    if (!user.resetOTP || !user.resetOTPExpiry) {
      return res.status(400).json({
        success: false,
        message: "OTP was not requested",
      });
    }

    if (user.resetOTPExpiry < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
    }

    if (user.resetOTP !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // Hash new password
    user.password = await bcrypt.hash(newPassword, 10);

    // Remove OTP
    user.resetOTP = null;
    user.resetOTPExpiry = null;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset Password Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while resetting password",
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  forgotPassword,
  verifyOTP,
  resetPassword,
};
