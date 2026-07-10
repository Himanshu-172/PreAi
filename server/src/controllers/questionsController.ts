import type { NextFunction, Response } from 'express';
import { ZodError } from 'zod';
import type { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { getQuestionByQuestionId, listQuestions } from '../services/questionService.js';
import { questionParamsSchema, questionQuerySchema } from '../validators/practiceValidators.js';

function sendValidationError(error: ZodError, response: Response): never {
  response.status(400);
  throw new Error(error.issues[0]?.message ?? 'Invalid request');
}

export async function getQuestions(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  try {
    const parsedQuery = questionQuerySchema.safeParse(request.query);

    if (!parsedQuery.success) {
      sendValidationError(parsedQuery.error, response);
    }

    const questions = await listQuestions(parsedQuery.data);

    response.status(200).json({
      success: true,
      data: {
        questions
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getQuestion(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  try {
    const parsedParams = questionParamsSchema.safeParse(request.params);

    if (!parsedParams.success) {
      sendValidationError(parsedParams.error, response);
    }

    const question = await getQuestionByQuestionId(parsedParams.data.id);

    if (!question) {
      response.status(404);
      throw new Error('Question not found');
    }

    response.status(200).json({
      success: true,
      data: {
        question
      }
    });
  } catch (error) {
    next(error);
  }
}
