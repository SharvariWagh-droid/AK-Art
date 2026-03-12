const User = require("../models/User");
const bcrypt = require("bcryptjs");


// REGISTER USER
exports.registerUser = async (req, res) => {

  try {

    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword
    });

    await user.save();

    res.json({ message: "Registration successful" });

  } catch (error) {

    res.json({ message: "Server error" });

  }

};



// LOGIN USER
exports.loginUser = async (req, res) => {

  try {

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ message: "User not found" });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.json({ message: "Incorrect password" });
    }

    res.json({
      message: "Login successful",
      user: user.name
    });

  } catch (error) {

    res.json({ message: "Server error" });

  }

};