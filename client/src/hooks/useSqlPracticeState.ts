import { useEffect, useState } from 'react';
import { sqlQuestions } from '../data/sqlQuestions';

export type SqlQuestionState = {
  solved: boolean;
  favorite: boolean;
  notes: string;
  notesOpen: boolean;
};

const SQL_PRACTICE_STATE_KEY = 'prepai.sqlPracticeState';

function createInitialSqlQuestionState() {
  return sqlQuestions.reduce<Record<number, SqlQuestionState>>((state, question) => {
    state[question.id] = {
      solved: question.solved,
      favorite: false,
      notes: '',
      notesOpen: false
    };
    return state;
  }, {});
}

function mergeStoredState(storedState: Partial<Record<number, Partial<SqlQuestionState>>>) {
  const initialState = createInitialSqlQuestionState();

  return sqlQuestions.reduce<Record<number, SqlQuestionState>>((state, question) => {
    const storedQuestionState = storedState[question.id];
    state[question.id] = {
      ...initialState[question.id],
      solved: storedQuestionState?.solved ?? initialState[question.id].solved,
      favorite: storedQuestionState?.favorite ?? initialState[question.id].favorite,
      notes: storedQuestionState?.notes ?? initialState[question.id].notes
    };
    return state;
  }, {});
}

function readSqlPracticeState() {
  if (typeof window === 'undefined') {
    return createInitialSqlQuestionState();
  }

  const storedValue = window.localStorage.getItem(SQL_PRACTICE_STATE_KEY);

  if (!storedValue) {
    return createInitialSqlQuestionState();
  }

  try {
    const parsedValue = JSON.parse(storedValue) as Partial<Record<number, Partial<SqlQuestionState>>>;
    return mergeStoredState(parsedValue);
  } catch {
    return createInitialSqlQuestionState();
  }
}

function createPersistableState(questionState: Record<number, SqlQuestionState>) {
  return sqlQuestions.reduce<Record<number, Omit<SqlQuestionState, 'notesOpen'>>>((state, question) => {
    const currentState = questionState[question.id];
    state[question.id] = {
      solved: currentState?.solved ?? question.solved,
      favorite: currentState?.favorite ?? false,
      notes: currentState?.notes ?? ''
    };
    return state;
  }, {});
}

export function useSqlPracticeState() {
  const [questionState, setQuestionState] = useState<Record<number, SqlQuestionState>>(readSqlPracticeState);

  useEffect(() => {
    window.localStorage.setItem(SQL_PRACTICE_STATE_KEY, JSON.stringify(createPersistableState(questionState)));
  }, [questionState]);

  function setSolved(id: number, solved: boolean) {
    setQuestionState((current) => ({
      ...current,
      [id]: {
        ...current[id],
        solved
      }
    }));
  }

  function toggleFavorite(id: number) {
    setQuestionState((current) => ({
      ...current,
      [id]: {
        ...current[id],
        favorite: !current[id].favorite
      }
    }));
  }

  function toggleNotes(id: number) {
    setQuestionState((current) => ({
      ...current,
      [id]: {
        ...current[id],
        notesOpen: !current[id].notesOpen
      }
    }));
  }

  function setNotes(id: number, notes: string) {
    setQuestionState((current) => ({
      ...current,
      [id]: {
        ...current[id],
        notes
      }
    }));
  }

  return {
    questionState,
    setSolved,
    toggleFavorite,
    toggleNotes,
    setNotes
  };
}
