import type { NextFunction, Response } from 'express';
import { ZodError } from 'zod';
import type { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { listFavorites, removeFavorite, setFavorite } from '../services/progressService.js';
import {
  favoriteBodySchema,
  moduleOnlyBodySchema,
  moduleQuestionParamsSchema,
  moduleQuerySchema
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

export async function getFavorites(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  try {
    const parsedQuery = moduleQuerySchema.safeParse(request.query);

    if (!parsedQuery.success) {
      sendValidationError(parsedQuery.error, response);
    }

    const favorites = await listFavorites(getUserId(request, response), parsedQuery.data.module);

    response.status(200).json({
      success: true,
      data: {
        favorites
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function saveFavorite(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  try {
    const parsedBody = favoriteBodySchema.safeParse(request.body);

    if (!parsedBody.success) {
      sendValidationError(parsedBody.error, response);
    }

    const { module, questionId, favorite } = parsedBody.data;
    const progress = await setFavorite(getUserId(request, response), module, questionId, favorite ?? true);

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

export async function deleteFavorite(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  try {
    const parsedParams = moduleQuestionParamsSchema.safeParse(request.params);
    const parsedBody = moduleOnlyBodySchema.safeParse(request.body);

    if (!parsedParams.success) {
      sendValidationError(parsedParams.error, response);
    }

    if (!parsedBody.success) {
      sendValidationError(parsedBody.error, response);
    }

    const progress = await removeFavorite(
      getUserId(request, response),
      parsedBody.data.module,
      parsedParams.data.questionId
    );

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
