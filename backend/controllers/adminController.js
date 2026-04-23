const Admin = require("../models/Admin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const JWT_SECRET = process.env.JWT_SECRET || "ak_art_admin_secret_key_2026";

// LOGIN ADMIN
exports.loginAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Check if it's the first time and no admin exists, create the default one
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0 && username === "abhilasha" && password === "admin123") {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      const newAdmin = new Admin({
        username: "abhilasha",
        email: "admin@akart.com", // default email
        password: hashedPassword
      });
      await newAdmin.save();
    }

    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: admin._id, username: admin.username }, JWT_SECRET, {
      expiresIn: "24h"
    });

    res.json({
      message: "Login successful",
      token: token
    });

  } catch (error) {
    console.error("ADMIN LOGIN ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// UPDATE ADMIN CREDENTIALS
exports.updateAdmin = async (req, res) => {
  try {
    const { username, password, email } = req.body;
    
    // For simplicity, we update the first admin found (usually there's only one)
    const admin = await Admin.findOne();
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    if (username) admin.username = username;
    if (email) admin.email = email;
    if (password) {
      admin.password = await bcrypt.hash(password, 10);
    }

    await admin.save();
    res.json({ message: "Credentials updated successfully" });

  } catch (error) {
    console.error("ADMIN UPDATE ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// FORGOT PASSWORD
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.json({ message: "Admin with this email not found" });
    }

    const token = crypto.randomBytes(20).toString('hex');
    admin.resetToken = token;
    admin.resetTokenExpiry = Date.now() + 3600000; // 1 hour

    await admin.save();

    // In production, send email here. For now, just return token as requested.
    res.json({ 
      success: true, 
      message: "Reset token generated", 
      token: token 
    });

  } catch (error) {
    console.error("ADMIN FORGOT PW ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// RESET PASSWORD
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    const admin = await Admin.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!admin) {
      return res.json({ message: "Invalid or expired token" });
    }

    admin.password = await bcrypt.hash(password, 10);
    admin.resetToken = undefined;
    admin.resetTokenExpiry = undefined;

    await admin.save();
    res.json({ message: "Password reset successful" });

  } catch (error) {
    console.error("ADMIN RESET PW ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};
