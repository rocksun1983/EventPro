import { protect } from "./authMiddleware.js";

export const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Not authorized as an admin" });
  }
};

// Combined middleware for admin routes
export const protectAdmin = [protect, admin];
