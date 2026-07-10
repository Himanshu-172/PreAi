import { useMemo } from 'react';
import { sqlQuestions } from '../data/sqlQuestions';
import { usePracticeState, type PracticeQuestionState } from './usePracticeState';

export type SqlQuestionState = PracticeQuestionState;

export function useSqlPracticeState() {
  const fallbackQuestions = useMemo(
    () =>
      sqlQuestions.map((question) => ({
        id: question.id,
        solved: question.solved
      })),
    []
  );

  return usePracticeState('SQL', fallbackQuestions);
}
