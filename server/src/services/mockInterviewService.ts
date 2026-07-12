import mongoose from 'mongoose';
import { MockInterview } from '../models/MockInterview.js';
import { Question, type QuestionDocument } from '../models/Question.js';
import type { CreateMockInterviewInput } from '../validators/mockInterviewValidators.js';
import { generalCsInterviewQuestions, hrInterviewQuestions, type StaticInterviewQuestion } from './mockInterviewQuestionBank.js';

type InterviewQuestionSnapshot = {
  source: 'Question' | 'Static';
  questionRef: mongoose.Types.ObjectId | null;
  sourceKey: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  questionText: string;
  userAnswer: string;
  answeredAt: Date | null;
};

export class MockInterviewServiceError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message);
  }
}

function toObjectId(id: string) {
  return new mongoose.Types.ObjectId(id);
}

function getQuestionText(question: QuestionDocument) {
  return question.module === 'DSA' ? `Solve this DSA problem: ${question.title}` : `Answer this SQL question: ${question.title}`;
}

function shuffle<T>(items: T[]) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

function filterByDifficulty<T extends { difficulty: 'Easy' | 'Medium' | 'Hard' }>(items: T[], difficulty: CreateMockInterviewInput['difficulty']) {
  return difficulty === 'Mixed' ? items : items.filter((item) => item.difficulty === difficulty);
}

function toQuestionSnapshots(questions: QuestionDocument[]): InterviewQuestionSnapshot[] {
  return questions.map((question) => ({
    source: 'Question',
    questionRef: question._id,
    sourceKey: `${question.module}:${question.questionId}`,
    category: question.module,
    difficulty: question.difficulty,
    questionText: getQuestionText(question),
    userAnswer: '',
    answeredAt: null
  }));
}

function toStaticSnapshots(questions: StaticInterviewQuestion[]): InterviewQuestionSnapshot[] {
  return questions.map((question) => ({
    source: 'Static',
    questionRef: null,
    sourceKey: question.sourceKey,
    category: question.category,
    difficulty: question.difficulty,
    questionText: question.questionText,
    userAnswer: '',
    answeredAt: null
  }));
}

async function getTechnicalQuestionPool(category: 'DSA' | 'SQL' | 'General CS', difficulty: CreateMockInterviewInput['difficulty']) {
  if (category === 'General CS') {
    return toStaticSnapshots(filterByDifficulty(generalCsInterviewQuestions, difficulty));
  }

  const filters: Record<string, unknown> = {
    module: category
  };

  if (difficulty !== 'Mixed') {
    filters.difficulty = difficulty;
  }

  const questions = await Question.find(filters).sort({ questionId: 1 });
  return toQuestionSnapshots(questions);
}

async function buildQuestionPool(input: CreateMockInterviewInput) {
  if (input.interviewType === 'HR') {
    return toStaticSnapshots(filterByDifficulty(hrInterviewQuestions, input.difficulty));
  }

  if (input.interviewType === 'Technical') {
    return getTechnicalQuestionPool(input.category ?? 'DSA', input.difficulty);
  }

  const dsaQuestions = await getTechnicalQuestionPool('DSA', input.difficulty);
  const sqlQuestions = await getTechnicalQuestionPool('SQL', input.difficulty);
  const generalCsQuestions = await getTechnicalQuestionPool('General CS', input.difficulty);
  const hrQuestions = toStaticSnapshots(filterByDifficulty(hrInterviewQuestions, input.difficulty));

  return [...dsaQuestions, ...sqlQuestions, ...generalCsQuestions, ...hrQuestions];
}

function getSessionCategory(input: CreateMockInterviewInput) {
  if (input.interviewType === 'HR') {
    return 'HR';
  }

  if (input.interviewType === 'Mixed') {
    return 'Mixed';
  }

  return input.category ?? 'DSA';
}

export async function createMockInterview(userId: string, input: CreateMockInterviewInput) {
  const questionPool = await buildQuestionPool(input);
  const selectedQuestions = shuffle(questionPool).slice(0, input.questionCount);

  if (selectedQuestions.length < input.questionCount) {
    throw new MockInterviewServiceError('Not enough questions are available for this interview configuration', 400);
  }

  return MockInterview.create({
    userId: toObjectId(userId),
    interviewType: input.interviewType,
    category: getSessionCategory(input),
    difficulty: input.difficulty,
    questionCount: input.questionCount,
    questions: selectedQuestions,
    currentQuestionIndex: 0,
    status: 'in_progress',
    startedAt: new Date(),
    completedAt: null
  });
}

export async function listMockInterviews(userId: string) {
  return MockInterview.find({ userId: toObjectId(userId) })
    .sort({ createdAt: -1 })
    .select('interviewType category difficulty questionCount currentQuestionIndex status startedAt completedAt createdAt updatedAt questions.userAnswer');
}

export async function getMockInterviewById(userId: string, interviewId: string) {
  if (!mongoose.Types.ObjectId.isValid(interviewId)) {
    return null;
  }

  return MockInterview.findOne({
    _id: toObjectId(interviewId),
    userId: toObjectId(userId)
  });
}

export async function answerCurrentMockInterviewQuestion(userId: string, interviewId: string, questionIndex: number, answer: string) {
  if (!mongoose.Types.ObjectId.isValid(interviewId)) {
    throw new MockInterviewServiceError('Mock interview not found', 404);
  }

  const interview = await getMockInterviewById(userId, interviewId);

  if (!interview) {
    throw new MockInterviewServiceError('Mock interview not found', 404);
  }

  if (interview.status !== 'in_progress') {
    throw new MockInterviewServiceError('Completed interviews cannot be answered', 409);
  }

  if (questionIndex !== interview.currentQuestionIndex || !interview.questions[questionIndex]) {
    throw new MockInterviewServiceError('Question index does not match the current interview state', 409);
  }

  const nextQuestionIndex = Math.min(questionIndex + 1, interview.questions.length - 1);
  const questionPath = `questions.${questionIndex}`;
  const updatedInterview = await MockInterview.findOneAndUpdate(
    {
      _id: toObjectId(interviewId),
      userId: toObjectId(userId),
      status: 'in_progress',
      currentQuestionIndex: questionIndex
    },
    {
      $set: {
        [`${questionPath}.userAnswer`]: answer,
        [`${questionPath}.answeredAt`]: new Date(),
        currentQuestionIndex: nextQuestionIndex
      }
    },
    {
      new: true
    }
  );

  if (!updatedInterview) {
    throw new MockInterviewServiceError('Interview state changed. Reload the session and try again.', 409);
  }

  return updatedInterview;
}

export async function completeMockInterview(userId: string, interviewId: string) {
  if (!mongoose.Types.ObjectId.isValid(interviewId)) {
    throw new MockInterviewServiceError('Mock interview not found', 404);
  }

  const interview = await getMockInterviewById(userId, interviewId);

  if (!interview) {
    throw new MockInterviewServiceError('Mock interview not found', 404);
  }

  if (interview.status === 'completed') {
    throw new MockInterviewServiceError('Mock interview is already completed', 409);
  }

  if (interview.status !== 'in_progress') {
    throw new MockInterviewServiceError('Mock interview cannot be completed from its current state', 409);
  }

  const now = new Date();
  const updatedInterview = await MockInterview.findOneAndUpdate(
    {
      _id: toObjectId(interviewId),
      userId: toObjectId(userId),
      status: 'in_progress'
    },
    {
      $set: {
        status: 'completed',
        completedAt: now,
        currentQuestionIndex: Math.max(interview.questions.length - 1, 0)
      }
    },
    {
      new: true
    }
  );

  if (!updatedInterview) {
    throw new MockInterviewServiceError('Interview state changed. Reload the session and try again.', 409);
  }

  return updatedInterview;
}
