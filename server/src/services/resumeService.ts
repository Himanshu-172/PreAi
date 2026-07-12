import path from 'node:path';
import mongoose from 'mongoose';
import { PDFParse } from 'pdf-parse';
import { ResumeAnalysis } from '../models/ResumeAnalysis.js';

export const RESUME_UPLOAD_FIELD = 'resume';
export const RESUME_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const MIN_USEFUL_TEXT_LENGTH = 40;

export type UploadedResumeFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

function toObjectId(userId: string) {
  return new mongoose.Types.ObjectId(userId);
}

export function sanitizeResumeFileName(fileName: string) {
  const baseName = path.basename(fileName).trim() || 'resume.pdf';
  return baseName.replace(/[^\w .()-]/g, '_').replace(/\s+/g, ' ').slice(0, 180);
}

export function isPdfFileName(fileName: string) {
  return path.extname(fileName).toLowerCase() === '.pdf';
}

export function isPdfMimeType(mimeType: string) {
  return mimeType === 'application/pdf' || mimeType === 'application/x-pdf';
}

function normalizeExtractedText(text: string) {
  return text.replace(/\r/g, '\n').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

function assertUsefulText(text: string) {
  const compactText = text.replace(/\s+/g, ' ').trim();

  if (compactText.length < MIN_USEFUL_TEXT_LENGTH) {
    throw new Error('The PDF does not contain enough selectable text to analyze');
  }
}

export async function extractResumeText(file: UploadedResumeFile) {
  if (!isPdfMimeType(file.mimetype) || !isPdfFileName(file.originalname)) {
    throw new Error('Only PDF files are supported');
  }

  if (!file.buffer?.length) {
    throw new Error('Uploaded PDF is empty');
  }

  const parser = new PDFParse({ data: file.buffer });

  try {
    const result = await parser.getText();
    const extractedText = normalizeExtractedText(result.text);
    assertUsefulText(extractedText);
    return extractedText;
  } catch (error) {
    if (error instanceof Error && error.message.includes('enough selectable text')) {
      throw error;
    }

    throw new Error('Unable to extract readable text from this PDF');
  } finally {
    await parser.destroy();
  }
}

export async function createResumeAnalysis(userId: string, file: UploadedResumeFile) {
  const extractedText = await extractResumeText(file);

  return ResumeAnalysis.create({
    userId: toObjectId(userId),
    fileName: sanitizeResumeFileName(file.originalname),
    extractedText,
    status: 'completed'
  });
}

export async function listResumeAnalyses(userId: string) {
  return ResumeAnalysis.find({ userId: toObjectId(userId) }).sort({ createdAt: -1 }).select('-extractedText');
}

export async function getResumeAnalysisById(userId: string, analysisId: string) {
  if (!mongoose.Types.ObjectId.isValid(analysisId)) {
    return null;
  }

  return ResumeAnalysis.findOne({
    _id: new mongoose.Types.ObjectId(analysisId),
    userId: toObjectId(userId)
  });
}
