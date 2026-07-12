import type { NextFunction, Response } from 'express';
import { ZodError } from 'zod';
import type { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import type { ResumeAnalysisDocument } from '../models/ResumeAnalysis.js';
import {
  createResumeAnalysis,
  getResumeAnalysisById,
  listResumeAnalyses,
  RESUME_MAX_FILE_SIZE_BYTES
} from '../services/resumeService.js';
import { resumeAnalysisParamsSchema } from '../validators/resumeValidators.js';

function sendValidationError(error: ZodError, response: Response): never {
  response.status(400);
  throw new Error(error.issues[0]?.message ?? 'Invalid request');
}

function getUserId(request: AuthenticatedRequest, response: Response) {
  if (!request.user) {
    response.status(401);
    throw new Error('Authentication is required');
  }

  return request.user.id;
}

function serializeResumeAnalysis(analysis: ResumeAnalysisDocument, includeExtractedText = true) {
  return {
    id: analysis._id.toString(),
    fileName: analysis.fileName,
    status: analysis.status,
    ...(includeExtractedText ? { extractedText: analysis.extractedText } : {}),
    createdAt: analysis.createdAt,
    updatedAt: analysis.updatedAt
  };
}

export async function uploadResume(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  try {
    if (!request.file) {
      response.status(400);
      throw new Error('Resume PDF file is required');
    }

    const analysis = await createResumeAnalysis(getUserId(request, response), request.file);

    response.status(201).json({
      success: true,
      data: {
        analysis: serializeResumeAnalysis(analysis),
        limits: {
          maxFileSizeBytes: RESUME_MAX_FILE_SIZE_BYTES
        }
      }
    });
  } catch (error) {
    if (response.statusCode === 200 && error instanceof Error) {
      response.status(error.message.includes('PDF') || error.message.includes('selectable text') ? 400 : 500);
    }

    next(error);
  }
}

export async function getResumeHistory(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  try {
    const analyses = await listResumeAnalyses(getUserId(request, response));

    response.status(200).json({
      success: true,
      data: {
        analyses: analyses.map((analysis) => serializeResumeAnalysis(analysis, false))
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getResumeAnalysis(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  try {
    const parsedParams = resumeAnalysisParamsSchema.safeParse(request.params);

    if (!parsedParams.success) {
      sendValidationError(parsedParams.error, response);
    }

    const analysis = await getResumeAnalysisById(getUserId(request, response), parsedParams.data.id);

    if (!analysis) {
      response.status(404);
      throw new Error('Resume analysis not found');
    }

    response.status(200).json({
      success: true,
      data: {
        analysis: serializeResumeAnalysis(analysis)
      }
    });
  } catch (error) {
    next(error);
  }
}
