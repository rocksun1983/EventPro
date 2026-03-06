import Vendor from "../models/vendor.js";

export const createVendor = async (req, res) => {

  const vendor = await Vendor.create(req.body);

  res.json(vendor);

};

export const getVendors = async (req, res) => {

  const vendors = await Vendor.find();

  res.json(vendors);

};