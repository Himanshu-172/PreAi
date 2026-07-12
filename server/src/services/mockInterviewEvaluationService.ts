import mongoose from 'mongoose';
import { z } from 'zod';
import { MockInterview, type MockInterviewDocument } from '../models/MockInterview.js';
import { analyzeStructuredJsonWithAi } from './resumeAiService.js';

const DEFAULT_MAX_ANSWER_CHARS = 4000;

const scoreSchema = z.number().min(0).max(100);
const stringListSchema = z.array(z.string().trim().min(1)).max(8);

export const mockInterviewEvaluationSchema = z
  .object({
    overallScore: scoreSchema,
    communication: scoreSchema,
    technicalKnowledge: scoreSchema,
    problemSolving: scoreSchema,
    confidence: scoreSchema,
    summary: z.string().trim().min(20).max(1200),
    recommendations: stringListSchema,
    questionFeedback: z
      .array(
        z
          .object({
            questionIndex: z.number().int().min(0),
            score: scoreSchema,
            strengths: stringListSchema,
            weaknesses: stringListSchema,
            improvements: stringListSchema,
            sampleBetterAnswer: z.string().trim().min(20).max(2000)
          })
          .strict()
      )
      .min(1)
      .max(10)
  })
  .strict();

export type MockInterviewEvaluation = z.infer<typeof mockInterviewEvaluationSchema>;

const evaluationJsonSchema = {
  name: 'mock_interview_evaluation',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: [
      'overallScore',
      'communication',
      'technicalKnowledge',
      'problemSolving',
      'confidence',
      'summary',
      'recommendations',
      'questionFeedback'
    ],
    properties: {
      overallScore: { type: 'number', minimum: 0, maximum: 100 },
      communication: { type: 'number', minimum: 0, maximum: 100 },
      technicalKnowledge: { type: 'number', minimum: 0, maximum: 100 },
      problemSolving: { type: 'number', minimum: 0, maximum: 100 },
      confidence: { type: 'number', minimum: 0, maximum: 100 },
      summary: { type: 'string', minLength: 20, maxLength: 1200 },
      recommendations: { type: 'array', items: { type: 'string' }, maxItems: 8 },
      questionFeedback: {
        type: 'array',
        minItems: 1,
        maxItems: 10,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['questionIndex', 'score', 'strengths', 'weaknesses', 'improvements', 'sampleBetterAnswer'],
          properties: {
            questionIndex: { type: 'number', minimum: 0 },
            score: { type: 'number', minimum: 0, maximum: 100 },
            strengths: { type: 'array', items: { type: 'string' }, maxItems: 8 },
            weaknesses: { type: 'array', items: { type: 'string' }, maxItems: 8 },
            improvements: { type: 'array', items: { type: 'string' }, maxItems: 8 },
            sampleBetterAnswer: { type: 'string', minLength: 20 }
          }
        }
      }
    }
  }
} as const;

export class MockInterviewEvaluationServiceError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message);
  }
}

function toObjectId(id: string) {
  return new mongoose.Types.ObjectId(id);
}

function getNumberEnv(name: string, fallback: number) {
  const value = process.env[name];
  const parsedValue = value ? Number(value) : fallback;
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
}

function isDevelopmentDiagnosticsEnabled() {
  return process.env.NODE_ENV !== 'production';
}

function logEvaluationDiagnostic(message: string, details: Record<string, unknown>) {
  if (!isDevelopmentDiagnosticsEnabled()) {
    return;
  }

  console.error(message, details);
}

function getSavedAnswers(interview: MockInterviewDocument) {
  const maxAnswerCharacters = getNumberEnv('AI_MOCK_INTERVIEW_ANSWER_MAX_CHARS', DEFAULT_MAX_ANSWER_CHARS);

  return interview.questions
    .map((question, index) => ({
      questionIndex: index,
      category: question.category,
      difficulty: question.difficulty,
      questionText: question.questionText,
      userAnswer: question.userAnswer?.trim().slice(0, maxAnswerCharacters) ?? ''
    }))
    .filter((question) => question.userAnswer);
}

function buildEvaluationPrompt(interview: MockInterviewDocument) {
  const savedAnswers = getSavedAnswers(interview);

  return [
    'Evaluate this completed mock interview.',
    'Score all numeric fields from 0 to 100.',
    'Evaluate every saved answer in the answers array and return one questionFeedback item for each questionIndex.',
    'Be specific, fair, and actionable. Penalize vague, incomplete, or incorrect answers.',
    'For sampleBetterAnswer, write a stronger answer the candidate could have given.',
    'Do not include markdown, explanations, or fields outside the requested JSON schema.',
    '',
    `Interview type: ${interview.interviewType}`,
    `Category: ${interview.category}`,
    `Difficulty: ${interview.difficulty}`,
    '',
    'Saved answers:',
    JSON.stringify(savedAnswers, null, 2)
  ].join('\n');
}

function mapAiError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Unable to evaluate mock interview';

  if (message.includes('not configured')) {
    return new MockInterviewEvaluationServiceError('AI provider is not configured', 503);
  }

  if (message.includes('timed out')) {
    return new MockInterviewEvaluationServiceError('AI provider request timed out', 504);
  }

  if (message.includes('malformed') || message.includes('invalid analysis') || message.includes('invalid evaluation')) {
    return new MockInterviewEvaluationServiceError('AI provider returned an invalid evaluation response', 502);
  }

  return new MockInterviewEvaluationServiceError('Unable to evaluate mock interview with the AI provider', 502);
}

function validateFeedbackCoverage(evaluation: MockInterviewEvaluation, expectedQuestionIndexes: number[]) {
  const returnedIndexes = new Set(evaluation.questionFeedback.map((feedback) => feedback.questionIndex));
  const hasAllExpectedAnswers = expectedQuestionIndexes.every((questionIndex) => returnedIndexes.has(questionIndex));

  if (!hasAllExpectedAnswers || returnedIndexes.size !== expectedQuestionIndexes.length) {
    throw new Error('AI provider returned invalid evaluation coverage');
  }
}

export async function evaluateMockInterview(userId: string, interviewId: string) {
  if (!mongoose.Types.ObjectId.isValid(interviewId)) {
    throw new MockInterviewEvaluationServiceError('Mock interview not found', 404);
  }

  const interviewObjectId = toObjectId(interviewId);
  const userObjectId = toObjectId(userId);
  const existingInterview = await MockInterview.findOne({
    _id: interviewObjectId,
    userId: userObjectId
  });

  if (!existingInterview) {
    throw new MockInterviewEvaluationServiceError('Mock interview not found', 404);
  }

  if (existingInterview.status !== 'completed') {
    throw new MockInterviewEvaluationServiceError('Only completed interviews can be evaluated', 409);
  }

  if (existingInterview.evaluationStatus === 'processing') {
    throw new MockInterviewEvaluationServiceError('Mock interview evaluation is already processing', 409);
  }

  if (existingInterview.evaluationStatus === 'completed' && existingInterview.evaluation) {
    return existingInterview;
  }

  const savedAnswers = getSavedAnswers(existingInterview);

  if (savedAnswers.length === 0) {
    throw new MockInterviewEvaluationServiceError('Mock interview has no saved answers to evaluate', 400);
  }

  const claimedInterview = await MockInterview.findOneAndUpdate(
    {
      _id: interviewObjectId,
      userId: userObjectId,
      status: 'completed',
      evaluationStatus: {
        $ne: 'processing'
      }
    },
    {
      $set: {
        evaluationStatus: 'processing',
        evaluationProvider: null,
        evaluation: null,
        evaluatedAt: null
      }
    },
    {
      new: true
    }
  );

  if (!claimedInterview) {
    const currentInterview = await MockInterview.findOne({
      _id: interviewObjectId,
      userId: userObjectId
    }).select('evaluationStatus');

    if (currentInterview?.evaluationStatus === 'processing') {
      throw new MockInterviewEvaluationServiceError('Mock interview evaluation is already processing', 409);
    }

    throw new MockInterviewEvaluationServiceError('Mock interview not found', 404);
  }

  try {
    const { provider, result } = await analyzeStructuredJsonWithAi({
      taskName: 'mock interview evaluation',
      userPrompt: buildEvaluationPrompt(claimedInterview),
      jsonSchema: evaluationJsonSchema,
      openAiSystemPrompt:
        'You are a senior technical interviewer. Return only valid JSON that matches the provided schema.',
      ollamaSystemPrompt:
        'You are a senior technical interviewer. Return only valid JSON with the requested fields. Do not include markdown.'
    });
    const parsedEvaluation = mockInterviewEvaluationSchema.safeParse(result);

    if (!parsedEvaluation.success) {
      logEvaluationDiagnostic('AI provider returned invalid mock interview evaluation structure', {
        provider,
        issueCount: parsedEvaluation.error.issues.length,
        issues: parsedEvaluation.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message
        }))
      });
      throw new Error('AI provider returned invalid evaluation structure');
    }

    validateFeedbackCoverage(
      parsedEvaluation.data,
      savedAnswers.map((answer) => answer.questionIndex)
    );

    const updatedInterview = await MockInterview.findOneAndUpdate(
      {
        _id: interviewObjectId,
        userId: userObjectId
      },
      {
        $set: {
          evaluation: parsedEvaluation.data,
          evaluationProvider: provider,
          evaluatedAt: new Date(),
          evaluationStatus: 'completed'
        }
      },
      {
        new: true
      }
    );

    if (!updatedInterview) {
      throw new MockInterviewEvaluationServiceError('Mock interview not found', 404);
    }

    return updatedInterview;
  } catch (error) {
    await MockInterview.updateOne(
      {
        _id: interviewObjectId,
        userId: userObjectId
      },
      {
        $set: {
          evaluationStatus: 'failed'
        }
      }
    );

    if (error instanceof MockInterviewEvaluationServiceError) {
      throw error;
    }

    throw mapAiError(error);
  }
}
