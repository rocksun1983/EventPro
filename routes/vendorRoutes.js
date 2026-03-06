import express from "express";
import { createVendor, getVendors } from "../controllers/vendorController.js";

const router = express.Router();

router.post("/", createVendor);
router.get("/", getVendors);

export default router;
