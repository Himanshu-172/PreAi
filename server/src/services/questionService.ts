import { Question } from '../models/Question.js';
import type { questionQuerySchema } from '../validators/practiceValidators.js';
import type { z } from 'zod';

type QuestionQuery = z.infer<typeof questionQuerySchema>;

function getQuestionSort(sort: QuestionQuery['sort']): Record<string, 1 | -1> {
  if (sort === 'newest') {
    return { createdAt: -1 as const };
  }

  if (sort === 'oldest') {
    return { createdAt: 1 as const };
  }

  if (sort === 'alphabetical') {
    return { title: 1 as const };
  }

  return { module: 1 as const, questionId: 1 as const };
}

export async function listQuestions(query: QuestionQuery) {
  const filters: Record<string, unknown> = {};

  if (query.module) {
    filters.module = query.module;
  }

  if (query.difficulty) {
    filters.difficulty = query.difficulty;
  }

  if (query.category || query.topic) {
    filters.category = query.category ?? query.topic;
  }

  if (query.company) {
    filters.companies = query.company;
  }

  if (query.search) {
    filters.$text = {
      $search: query.search
    };
  }

  const questionsQuery = Question.find(filters).sort(getQuestionSort(query.sort));

  const isPaginated = Boolean(query.page || query.limit);
  const effectivePage = query.page ?? 1;
  const effectiveLimit = isPaginated ? (query.limit ?? 20) : undefined;

  if (effectiveLimit) {
    questionsQuery.skip((effectivePage - 1) * effectiveLimit).limit(effectiveLimit);
  }

  const [questions, total] = await Promise.all([questionsQuery, Question.countDocuments(filters)]);

  return {
    questions,
    pagination: {
      page: effectivePage,
      limit: effectiveLimit ?? total,
      total,
      totalPages: effectiveLimit ? Math.max(Math.ceil(total / effectiveLimit), 1) : 1
    }
  };
}

export async function getQuestionByQuestionId(questionId: number) {
  return Question.findOne({ questionId });
}
