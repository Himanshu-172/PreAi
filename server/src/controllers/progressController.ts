import type { NextFunction, Response } from 'express';
import { ZodError } from 'zod';
import type { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { listProgress, upsertProgress } from '../services/progressService.js';
import {
  moduleQuestionParamsSchema,
  moduleQuerySchema,
  progressBodySchema,
  progressPatchBodySchema
} from '../validators/practiceValidators.js';

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

export async function getProgress(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  try {
    const parsedQuery = moduleQuerySchema.safeParse(request.query);

    if (!parsedQuery.success) {
      sendValidationError(parsedQuery.error, response);
    }

    const progress = await listProgress(getUserId(request, response), parsedQuery.data.module);

    response.status(200).json({
      success: true,
      data: {
        progress
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function saveProgress(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  try {
    const parsedBody = progressBodySchema.safeParse(request.body);

    if (!parsedBody.success) {
      sendValidationError(parsedBody.error, response);
    }

    const { module, questionId, solved, favorite, notes } = parsedBody.data;
    const progress = await upsertProgress(getUserId(request, response), module, questionId, {
      solved,
      favorite,
      notes
    });

    response.status(200).json({
      success: true,
      data: {
        progress
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProgress(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  try {
    const parsedParams = moduleQuestionParamsSchema.safeParse(request.params);
    const parsedBody = progressPatchBodySchema.safeParse(request.body);

    if (!parsedParams.success) {
      sendValidationError(parsedParams.error, response);
    }

    if (!parsedBody.success) {
      sendValidationError(parsedBody.error, response);
    }

    const { module, solved, favorite, notes } = parsedBody.data;
    const progress = await upsertProgress(getUserId(request, response), module, parsedParams.data.questionId, {
      solved,
      favorite,
      notes
    });

    response.status(200).json({
      success: true,
      data: {
        progress
      }
    });
  } catch (error) {
    next(error);
  }
}
