import { useEffect, useMemo, useState } from 'react';
import { AxiosError } from 'axios';
import {
  getFavorites,
  getNotes,
  getProgress,
  getQuestions,
  removeFavorite,
  saveFavorite,
  saveNotes,
  updateProgress,
  type ApiProgress,
  type ApiQuestion,
  type PracticeModule
} from '../services/api';

export type PracticeQuestionState = {
  solved: boolean;
  favorite: boolean;
  notes: string;
  notesOpen: boolean;
};

type InitialQuestion = {
  id: number;
  solved?: boolean;
};

function getErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    const message = error.response?.data && typeof error.response.data === 'object' ? (error.response.data as { message?: string }).message : undefined;
    return message ?? 'Unable to load practice data. Please try again.';
  }

  return 'Unable to load practice data. Please try again.';
}

function createInitialState(questions: InitialQuestion[]) {
  return questions.reduce<Record<number, PracticeQuestionState>>((state, question) => {
    state[question.id] = {
      solved: question.solved ?? false,
      favorite: false,
      notes: '',
      notesOpen: false
    };
    return state;
  }, {});
}

function questionFromApi(question: ApiQuestion): InitialQuestion {
  return {
    id: question.questionId,
    solved: false
  };
}

function applyProgress(
  currentState: Record<number, PracticeQuestionState>,
  progressItems: ApiProgress[]
) {
  return progressItems.reduce<Record<number, PracticeQuestionState>>(
    (state, item) => ({
      ...state,
      [item.questionId]: {
        ...(state[item.questionId] ?? { solved: false, favorite: false, notes: '', notesOpen: false }),
        solved: item.solved,
        favorite: item.favorite,
        notes: item.notes
      }
    }),
    currentState
  );
}

export function usePracticeState(module: PracticeModule, fallbackQuestions: InitialQuestion[] = []) {
  const [questions, setQuestions] = useState<ApiQuestion[]>([]);
  const [questionState, setQuestionState] = useState<Record<number, PracticeQuestionState>>(() => createInitialState(fallbackQuestions));
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const moduleQuery = useMemo(() => ({ module }), [module]);

  useEffect(() => {
    let isActive = true;

    async function loadPracticeData() {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const [loadedQuestions, progress, favorites, notes] = await Promise.all([
          getQuestions(moduleQuery),
          getProgress(moduleQuery),
          getFavorites(moduleQuery),
          getNotes(moduleQuery)
        ]);

        if (!isActive) {
          return;
        }

        const initialQuestions = loadedQuestions.length > 0 ? loadedQuestions.map(questionFromApi) : fallbackQuestions;
        const mergedProgress = applyProgress(createInitialState(initialQuestions), [...progress, ...favorites, ...notes]);

        setQuestions(loadedQuestions);
        setQuestionState(mergedProgress);
      } catch (error) {
        if (isActive) {
          setErrorMessage(getErrorMessage(error));
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadPracticeData();

    return () => {
      isActive = false;
    };
  }, [fallbackQuestions, moduleQuery]);

  function setSolved(id: number, solved: boolean) {
    setQuestionState((current) => ({
      ...current,
      [id]: {
        ...(current[id] ?? { solved: false, favorite: false, notes: '', notesOpen: false }),
        solved
      }
    }));

    void updateProgress(id, { module, solved }).catch((error) => {
      setErrorMessage(getErrorMessage(error));
    });
  }

  function toggleFavorite(id: number) {
    const nextFavorite = !(questionState[id]?.favorite ?? false);

    setQuestionState((current) => ({
      ...current,
      [id]: {
        ...(current[id] ?? { solved: false, favorite: false, notes: '', notesOpen: false }),
        favorite: nextFavorite
      }
    }));

    const request = nextFavorite ? saveFavorite({ module, questionId: id, favorite: true }) : removeFavorite(module, id);

    void request.catch((error) => {
      setErrorMessage(getErrorMessage(error));
    });
  }

  function toggleNotes(id: number) {
    setQuestionState((current) => ({
      ...current,
      [id]: {
        ...(current[id] ?? { solved: false, favorite: false, notes: '', notesOpen: false }),
        notesOpen: !(current[id]?.notesOpen ?? false)
      }
    }));
  }

  function setNotes(id: number, notes: string) {
    setQuestionState((current) => ({
      ...current,
      [id]: {
        ...(current[id] ?? { solved: false, favorite: false, notes: '', notesOpen: false }),
        notes
      }
    }));

    void saveNotes({ module, questionId: id, notes }).catch((error) => {
      setErrorMessage(getErrorMessage(error));
    });
  }

  return {
    questions,
    questionState,
    isLoading,
    errorMessage,
    setSolved,
    toggleFavorite,
    toggleNotes,
    setNotes
  };
}
