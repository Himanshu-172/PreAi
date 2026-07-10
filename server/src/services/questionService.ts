import { Question } from '../models/Question.js';
import type { questionQuerySchema } from '../validators/practiceValidators.js';
import type { z } from 'zod';

type QuestionQuery = z.infer<typeof questionQuerySchema>;

export async function listQuestions(query: QuestionQuery) {
  const filters: Record<string, unknown> = {};

  if (query.module) {
    filters.module = query.module;
  }

  if (query.difficulty) {
    filters.difficulty = query.difficulty;
  }

  if (query.category) {
    filters.category = query.category;
  }

  if (query.company) {
    filters.companies = query.company;
  }

  if (query.search) {
    filters.$text = {
      $search: query.search
    };
  }

  return Question.find(filters).sort({ module: 1, questionId: 1 });
}

export async function getQuestionByQuestionId(questionId: number) {
  return Question.findOne({ questionId });
}
