import type { NextFunction, Response } from 'express';
import multer from 'multer';
import type { AuthenticatedRequest } from './authMiddleware.js';
import {
  isPdfFileName,
  isPdfMimeType,
  RESUME_MAX_FILE_SIZE_BYTES,
  RESUME_UPLOAD_FIELD
} from '../services/resumeService.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: RESUME_MAX_FILE_SIZE_BYTES,
    files: 1
  },
  fileFilter: (_request, file, callback) => {
    if (!isPdfMimeType(file.mimetype) || !isPdfFileName(file.originalname)) {
      callback(new Error('Only PDF files are supported'));
      return;
    }

    callback(null, true);
  }
}).single(RESUME_UPLOAD_FIELD);

export function uploadResumePdf(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  upload(request, response, (error) => {
    if (error instanceof multer.MulterError) {
      response.status(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400);
      next(new Error(error.code === 'LIMIT_FILE_SIZE' ? 'PDF file size must be 5 MB or less' : 'Invalid resume upload'));
      return;
    }

    if (error) {
      response.status(400);
      next(error);
      return;
    }

    next();
  });
}
