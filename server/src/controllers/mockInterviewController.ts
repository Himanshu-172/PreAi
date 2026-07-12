import type { NextFunction, Response } from 'express';
import { ZodError } from 'zod';
import type { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import type { MockInterviewDocument } from '../models/MockInterview.js';
import {
  answerCurrentMockInterviewQuestion,
  completeMockInterview,
  createMockInterview,
  getMockInterviewById,
  listMockInterviews,
  MockInterviewServiceError
} from '../services/mockInterviewService.js';
import {
  evaluateMockInterview,
  MockInterviewEvaluationServiceError
} from '../services/mockInterviewEvaluationService.js';
import {
  answerMockInterviewSchema,
  createMockInterviewSchema,
  mockInterviewParamsSchema
} from '../validators/mockInterviewValidators.js';

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

function getAnsweredCount(analysis: MockInterviewDocument) {
  return analysis.questions.filter((question) => Boolean(question.userAnswer?.trim())).length;
}

function serializeMockInterview(interview: MockInterviewDocument, includeQuestions = true) {
  return {
    id: interview._id.toString(),
    interviewType: interview.interviewType,
    category: interview.category,
    difficulty: interview.difficulty,
    questionCount: interview.questionCount,
    currentQuestionIndex: interview.currentQuestionIndex,
    status: interview.status,
    evaluationStatus: interview.evaluationStatus,
    evaluationProvider: interview.evaluationProvider,
    evaluation: interview.evaluation,
    evaluatedAt: interview.evaluatedAt,
    startedAt: interview.startedAt,
    completedAt: interview.completedAt,
    answeredCount: getAnsweredCount(interview),
    ...(includeQuestions
      ? {
          questions: interview.questions.map((question, index) => ({
            index,
            source: question.source,
            sourceKey: question.sourceKey,
            category: question.category,
            difficulty: question.difficulty,
            questionText: question.questionText,
            userAnswer: question.userAnswer,
            answeredAt: question.answeredAt
          }))
        }
      : {}),
    createdAt: interview.createdAt,
    updatedAt: interview.updatedAt
  };
}

export async function startMockInterview(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  try {
    const parsedBody = createMockInterviewSchema.safeParse(request.body);

    if (!parsedBody.success) {
      sendValidationError(parsedBody.error, response);
    }

    const interview = await createMockInterview(getUserId(request, response), parsedBody.data);

    response.status(201).json({
      success: true,
      data: {
        interview: serializeMockInterview(interview)
      }
    });
  } catch (error) {
    if (error instanceof MockInterviewServiceError) {
      response.status(error.statusCode);
    }

    next(error);
  }
}

export async function getMockInterviewHistory(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  try {
    const interviews = await listMockInterviews(getUserId(request, response));

    response.status(200).json({
      success: true,
      data: {
        interviews: interviews.map((interview) => serializeMockInterview(interview, false))
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getMockInterview(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  try {
    const parsedParams = mockInterviewParamsSchema.safeParse(request.params);

    if (!parsedParams.success) {
      sendValidationError(parsedParams.error, response);
    }

    const interview = await getMockInterviewById(getUserId(request, response), parsedParams.data.id);

    if (!interview) {
      response.status(404);
      throw new Error('Mock interview not found');
    }

    response.status(200).json({
      success: true,
      data: {
        interview: serializeMockInterview(interview)
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function answerMockInterview(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  try {
    const parsedParams = mockInterviewParamsSchema.safeParse(request.params);
    const parsedBody = answerMockInterviewSchema.safeParse(request.body);

    if (!parsedParams.success) {
      sendValidationError(parsedParams.error, response);
    }

    if (!parsedBody.success) {
      sendValidationError(parsedBody.error, response);
    }

    const interview = await answerCurrentMockInterviewQuestion(
      getUserId(request, response),
      parsedParams.data.id,
      parsedBody.data.questionIndex,
      parsedBody.data.answer
    );

    response.status(200).json({
      success: true,
      data: {
        interview: serializeMockInterview(interview)
      }
    });
  } catch (error) {
    if (error instanceof MockInterviewServiceError) {
      response.status(error.statusCode);
    }

    next(error);
  }
}

export async function finishMockInterview(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  try {
    const parsedParams = mockInterviewParamsSchema.safeParse(request.params);

    if (!parsedParams.success) {
      sendValidationError(parsedParams.error, response);
    }

    const interview = await completeMockInterview(getUserId(request, response), parsedParams.data.id);

    response.status(200).json({
      success: true,
      data: {
        interview: serializeMockInterview(interview)
      }
    });
  } catch (error) {
    if (error instanceof MockInterviewServiceError) {
      response.status(error.statusCode);
    }

    next(error);
  }
}

export async function evaluateCompletedMockInterview(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  try {
    const parsedParams = mockInterviewParamsSchema.safeParse(request.params);

    if (!parsedParams.success) {
      sendValidationError(parsedParams.error, response);
    }

    const interview = await evaluateMockInterview(getUserId(request, response), parsedParams.data.id);

    response.status(200).json({
      success: true,
      data: {
        interview: serializeMockInterview(interview)
      }
    });
  } catch (error) {
    if (error instanceof MockInterviewEvaluationServiceError) {
      response.status(error.statusCode);
    }

    next(error);
  }
}
