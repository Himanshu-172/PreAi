import path from 'node:path';
import mongoose from 'mongoose';
import { PDFParse } from 'pdf-parse';
import { ResumeAnalysis } from '../models/ResumeAnalysis.js';
import { analyzeResumeWithAi } from './resumeAiService.js';

export const RESUME_UPLOAD_FIELD = 'resume';
export const RESUME_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const MIN_USEFUL_TEXT_LENGTH = 40;

export type UploadedResumeFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

export class ResumeServiceError extends Error {
  constructor(
    message: string,
    readonly statusCode: number
  ) {
    super(message);
  }
}

function toObjectId(userId: string) {
  return new mongoose.Types.ObjectId(userId);
}

function toAnalysisObjectId(analysisId: string) {
  if (!mongoose.Types.ObjectId.isValid(analysisId)) {
    throw new ResumeServiceError('Invalid resume analysis ID', 400);
  }

  return new mongoose.Types.ObjectId(analysisId);
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
    status: 'uploaded'
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

export async function analyzeResumeAnalysis(userId: string, analysisId: string) {
  const analysisObjectId = toAnalysisObjectId(analysisId);
  const userObjectId = toObjectId(userId);
  const claimedAnalysis = await ResumeAnalysis.findOneAndUpdate(
    {
      _id: analysisObjectId,
      userId: userObjectId,
      status: {
        $ne: 'processing'
      }
    },
    {
      $set: {
        status: 'processing',
        analysis: null,
        analyzedAt: null
      }
    },
    {
      new: true
    }
  );

  if (!claimedAnalysis) {
    const existingAnalysis = await ResumeAnalysis.findOne({
      _id: analysisObjectId,
      userId: userObjectId
    }).select('status');

    if (existingAnalysis?.status === 'processing') {
      throw new ResumeServiceError('Resume analysis is already processing', 409);
    }

    throw new ResumeServiceError('Resume analysis not found', 404);
  }

  if (!claimedAnalysis.extractedText?.trim()) {
    await ResumeAnalysis.updateOne(
      {
        _id: analysisObjectId,
        userId: userObjectId
      },
      {
        $set: {
          status: 'failed'
        }
      }
    );

    throw new ResumeServiceError('Resume does not have extracted text to analyze', 400);
  }

  try {
    const aiAnalysis = await analyzeResumeWithAi(claimedAnalysis.extractedText);
    const updatedAnalysis = await ResumeAnalysis.findOneAndUpdate(
      {
        _id: analysisObjectId,
        userId: userObjectId
      },
      {
        $set: {
          analysis: aiAnalysis,
          analyzedAt: new Date(),
          status: 'completed'
        }
      },
      {
        new: true
      }
    );

    if (!updatedAnalysis) {
      throw new ResumeServiceError('Resume analysis not found', 404);
    }

    return updatedAnalysis;
  } catch (error) {
    await ResumeAnalysis.updateOne(
      {
        _id: analysisObjectId,
        userId: userObjectId
      },
      {
        $set: {
          status: 'failed'
        }
      }
    );

    if (error instanceof ResumeServiceError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : 'Unable to analyze resume';

    if (message.includes('not configured')) {
      throw new ResumeServiceError('AI provider is not configured', 503);
    }

    if (message.includes('timed out')) {
      throw new ResumeServiceError('AI provider request timed out', 504);
    }

    if (message.includes('malformed')) {
      throw new ResumeServiceError('AI provider returned an invalid analysis response', 502);
    }

    throw new ResumeServiceError('Unable to analyze resume with the AI provider', 502);
  }
}
