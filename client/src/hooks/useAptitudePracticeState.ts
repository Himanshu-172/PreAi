import { useMemo } from 'react';
import { aptitudeQuestions } from '../data/aptitudeQuestions';
import { usePracticeState, type PracticeQuestionState } from './usePracticeState';

export type AptitudeQuestionState = PracticeQuestionState;

export function useAptitudePracticeState() {
  const fallbackQuestions = useMemo(
    () =>
      aptitudeQuestions.map((question) => ({
        id: question.id,
        solved: question.solved
      })),
    []
  );

  return usePracticeState('Aptitude', fallbackQuestions);
}
