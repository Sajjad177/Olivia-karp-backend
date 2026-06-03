import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../../uploads"));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

export const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|pdf|png|mp4|avi|mov|avif|webp|doc|docx|mp3|mpeg|wav|m4a|xls|xlsx|ppt|pptx|csv/;

    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype =
      filetypes.test(file.mimetype) ||
      file.mimetype === "text/csv" ||
      file.mimetype === "application/vnd.ms-excel" ||
      file.mimetype === "text/plain";

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("This file type is not allowed!"));
  },
});
