import multer from "multer";
import path from "path";

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowed = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Solo se permiten archivos JPG, PNG, WEBP o PDF"));
  }
};

// memoryStorage: file forwarded as buffer to ms-documents, not stored locally
export const uploadVoucher = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 700 * 1024 },
}).single("voucher");
