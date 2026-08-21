import type { NextFunction, Response } from 'express';
import { ZodError } from 'zod';
import type { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { executeQuestionCode } from '../services/codeExecutionService.js';
import { upsertProgress } from '../services/progressService.js';
import { getDsaQuestionForExecution, getSafeQuestionByQuestionId, listQuestions } from '../services/questionService.js';
import { codeExecutionBodySchema, moduleQuerySchema, questionParamsSchema, questionQuerySchema } from '../validators/practiceValidators.js';

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

    const { questions, pagination } = await listQuestions(parsedQuery.data);

    response.status(200).json({
      success: true,
      data: {
        questions,
        pagination
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

    const parsedQuery = moduleQuerySchema.safeParse(request.query);

    if (!parsedQuery.success) {
      sendValidationError(parsedQuery.error, response);
    }

    const question = await getSafeQuestionByQuestionId(parsedParams.data.id, parsedQuery.data.module);

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

function getUserId(request: AuthenticatedRequest, response: Response) {
  if (!request.user) {
    response.status(401);
    throw new Error('Authentication is required');
  }

  return request.user.id;
}

export async function runQuestionCode(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  try {
    const parsedParams = questionParamsSchema.safeParse(request.params);
    const parsedBody = codeExecutionBodySchema.safeParse(request.body);

    if (!parsedParams.success) {
      sendValidationError(parsedParams.error, response);
    }

    if (!parsedBody.success) {
      sendValidationError(parsedBody.error, response);
    }

    const question = await getDsaQuestionForExecution(parsedParams.data.id);

    if (!question) {
      response.status(404);
      throw new Error('DSA question not found');
    }

    const publicTestCases = question.testCases.filter((testCase) => !testCase.isHidden);
    const selectedTestCases = parsedBody.data.testCaseIds?.length
      ? publicTestCases.filter((testCase) => parsedBody.data.testCaseIds?.includes(String(testCase._id)))
      : publicTestCases;

    if (selectedTestCases.length === 0) {
      response.status(400);
      throw new Error('No public test cases are configured for this question');
    }

    const result = await executeQuestionCode({
      language: parsedBody.data.language,
      code: parsedBody.data.code,
      functionName: question.functionName || 'solve',
      testCases: selectedTestCases.map((testCase, index) => ({
        id: String(testCase._id),
        name: testCase.name || `Test Case ${index + 1}`,
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        isHidden: false
      }))
    });

    response.status(200).json({
      success: true,
      data: {
        result
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function submitQuestionCode(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  try {
    const parsedParams = questionParamsSchema.safeParse(request.params);
    const parsedBody = codeExecutionBodySchema.safeParse(request.body);

    if (!parsedParams.success) {
      sendValidationError(parsedParams.error, response);
    }

    if (!parsedBody.success) {
      sendValidationError(parsedBody.error, response);
    }

    const question = await getDsaQuestionForExecution(parsedParams.data.id);

    if (!question) {
      response.status(404);
      throw new Error('DSA question not found');
    }

    const testCases = question.testCases.map((testCase, index) => ({
      id: String(testCase._id),
      name: testCase.isHidden ? `Hidden test case #${index + 1}` : testCase.name || `Test Case ${index + 1}`,
      input: testCase.input,
      expectedOutput: testCase.expectedOutput,
      isHidden: testCase.isHidden
    }));

    if (testCases.length === 0) {
      response.status(400);
      throw new Error('No test cases are configured for this question');
    }

    const result = await executeQuestionCode({
      language: parsedBody.data.language,
      code: parsedBody.data.code,
      functionName: question.functionName || 'solve',
      testCases,
      hideHiddenDetails: true
    });

    const accepted = result.status === 'accepted';
    const progress = accepted ? await upsertProgress(getUserId(request, response), 'DSA', parsedParams.data.id, { solved: true }) : null;

    response.status(200).json({
      success: true,
      data: {
        result,
        progress
      }
    });
  } catch (error) {
    next(error);
  }
}
