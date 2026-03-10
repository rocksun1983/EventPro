import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = [
    "text/csv",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ];

  const name = (file.originalname || "").toLowerCase();
  const Allowed = allowed.includes(file.mimetype)
    || name.endsWith(".csv")
    || name.endsWith(".xlsx");

  if (!Allowed) {
    return cb(new Error("Invalid file type. Upload CSV or Excel (.xlsx)."));
  }

  return cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

export const attendeeUpload = (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    return next();
  });
};
