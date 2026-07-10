import type { NextFunction, Response } from 'express';
import { ZodError } from 'zod';
import type { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { listNotes, setNotes } from '../services/progressService.js';
import {
  moduleQuestionParamsSchema,
  moduleQuerySchema,
  notesBodySchema,
  notesPatchBodySchema
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

export async function getNotes(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  try {
    const parsedQuery = moduleQuerySchema.safeParse(request.query);

    if (!parsedQuery.success) {
      sendValidationError(parsedQuery.error, response);
    }

    const notes = await listNotes(getUserId(request, response), parsedQuery.data.module);

    response.status(200).json({
      success: true,
      data: {
        notes
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function saveNotes(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  try {
    const parsedBody = notesBodySchema.safeParse(request.body);

    if (!parsedBody.success) {
      sendValidationError(parsedBody.error, response);
    }

    const { module, questionId, notes } = parsedBody.data;
    const progress = await setNotes(getUserId(request, response), module, questionId, notes);

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

export async function updateNotes(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  try {
    const parsedParams = moduleQuestionParamsSchema.safeParse(request.params);
    const parsedBody = notesPatchBodySchema.safeParse(request.body);

    if (!parsedParams.success) {
      sendValidationError(parsedParams.error, response);
    }

    if (!parsedBody.success) {
      sendValidationError(parsedBody.error, response);
    }

    const { module, notes } = parsedBody.data;
    const progress = await setNotes(getUserId(request, response), module, parsedParams.data.questionId, notes);

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
