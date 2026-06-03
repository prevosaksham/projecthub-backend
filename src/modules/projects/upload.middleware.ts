import crypto from "crypto";
import path from "path";
import fs from "fs";
import multer from "multer";
import ApiError from "@/utils/ApiError";
import { StatusCodes } from "http-status-codes";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

// Create uploads dir if missing
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, {
    recursive: true,
  });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },

  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);

    const id = crypto.randomBytes(16).toString("hex");

    const fileName = `${Date.now()}-${id}${ext}`;

    cb(null, fileName);
  },
});

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/png",
    "image/jpeg",
    "image/jpg",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv",
    "application/csv",
    "application/vnd.ms-powerpoint", // .ppt
    "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(StatusCodes.BAD_REQUEST, "Invalid file type"));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024,

    files: 10,
  },
});
