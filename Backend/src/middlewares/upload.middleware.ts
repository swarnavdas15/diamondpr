import multer from 'multer';
import path from 'path';

// Memory storage keeps files in buffer (Best for parsing Excel & direct cloud upload like S3/R2)
const memoryStorage = multer.memoryStorage();

// File filter for Excel Sheets
const excelFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === '.xlsx' || ext === '.xls') {
    cb(null, true);
  } else {
    cb(new Error('Only Excel files (.xlsx, .xls) are allowed'));
  }
};

// File filter for Technical Drawings & Attachments (PDF, Images, CAD, DWG)
const drawingFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedExts = ['.pdf', '.png', '.jpg', '.jpeg', '.dwg', '.dxf'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported drawing format. Allowed: PDF, PNG, JPG, DWG, DXF'));
  }
};

// Exported Multer Upload Instances (Max 10MB per file)
export const uploadExcel = multer({
  storage: memoryStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: excelFileFilter
});

export const uploadDrawing = multer({
  storage: memoryStorage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit for large CAD/PDF drawings
  fileFilter: drawingFileFilter
});