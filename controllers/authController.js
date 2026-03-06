import User from "../models/user.js";
import bcrypt from "bcryptjs";
import generateToken from "../utils/generateToken.js";

export const registerUser = async (req, res) => {

  const { name, email, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashedPassword
  });

  res.json({
    message: "User registered",
    token: generateToken(user._id)
  });

};


export const loginUser = async (req, res) => {

  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const match = await bcrypt.compare(password, user.password);

  if (!match) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  res.json({
    token: generateToken(user._id),
    user
  });

};


export const resetPassword = async (req, res) => {

  const { email, newPassword } = req.body;

  const user = await User.findOne({ email });

  const hashed = await bcrypt.hash(newPassword, 10);

  user.password = hashed;

  await user.save();

  res.json({ message: "Password reset successful" });

};