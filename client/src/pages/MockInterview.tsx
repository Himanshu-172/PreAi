import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { getAuthErrorMessage } from '../services/authService';
import {
  answerMockInterview,
  completeMockInterview,
  createMockInterview,
  evaluateMockInterview,
  getMockInterview,
  getMockInterviewHistory,
  type ApiMockInterview,
  type ApiMockInterviewQuestionFeedback,
  type MockInterviewCategory,
  type MockInterviewDifficulty,
  type MockInterviewStatus,
  type MockInterviewType
} from '../services/api';

const ACTIVE_INTERVIEW_STORAGE_KEY = 'prepai.activeMockInterviewId';
const interviewTypes: MockInterviewType[] = ['Technical', 'HR', 'Mixed'];
const technicalCategories: MockInterviewCategory[] = ['DSA', 'SQL', 'General CS'];
const difficulties: MockInterviewDifficulty[] = ['Easy', 'Medium', 'Hard', 'Mixed'];
const questionCounts: Array<5 | 10> = [5, 10];

type SetupState = {
  interviewType: MockInterviewType;
  category: MockInterviewCategory;
  difficulty: MockInterviewDifficulty;
  questionCount: 5 | 10;
};

const statusStyles: Record<MockInterviewStatus, string> = {
  in_progress: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
  completed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  abandoned: 'bg-slate-100 text-slate-700 ring-slate-200'
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(value));
}

function formatStatus(status: MockInterviewStatus) {
  return status.replace('_', ' ');
}

function getAnsweredCount(interview: ApiMockInterview) {
  return interview.questions?.filter((question) => question.userAnswer.trim()).length ?? interview.answeredCount;
}

function StatusBadge({ status }: { status: MockInterviewStatus }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ${statusStyles[status]}`}>{formatStatus(status)}</span>;
}

function FieldCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function SelectField<T extends string>({
  id,
  label,
  value,
  options,
  onChange,
  disabled = false
}: {
  id: string;
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase text-slate-500">{label}</span>
      <select
        id={id}
        className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        disabled={disabled}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function validateSetup(setup: SetupState) {
  if (setup.interviewType === 'Technical' && !setup.category) {
    return 'Choose a technical category before starting.';
  }

  if (!questionCounts.includes(setup.questionCount)) {
    return 'Choose either 5 or 10 questions.';
  }

  return '';
}

function SetupPanel({
  setup,
  isStarting,
  onChange,
  onStart
}: {
  setup: SetupState;
  isStarting: boolean;
  onChange: (setup: SetupState) => void;
  onStart: () => void;
}) {
  return (
    <FieldCard title="Interview Setup">
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          id="interview-type"
          label="Interview Type"
          value={setup.interviewType}
          options={interviewTypes}
          onChange={(interviewType) => onChange({ ...setup, interviewType })}
        />
        <SelectField
          id="interview-category"
          label="Technical Category"
          value={setup.category}
          options={technicalCategories}
          onChange={(category) => onChange({ ...setup, category })}
          disabled={setup.interviewType === 'HR'}
        />
        <SelectField
          id="interview-difficulty"
          label="Difficulty"
          value={setup.difficulty}
          options={difficulties}
          onChange={(difficulty) => onChange({ ...setup, difficulty })}
        />
        <SelectField
          id="interview-question-count"
          label="Number of Questions"
          value={String(setup.questionCount)}
          options={questionCounts.map(String)}
          onChange={(questionCount) => onChange({ ...setup, questionCount: Number(questionCount) as 5 | 10 })}
        />
      </div>
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          className="rounded-md bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          onClick={onStart}
          disabled={isStarting}
        >
          {isStarting ? 'Starting...' : 'Start Interview'}
        </button>
      </div>
    </FieldCard>
  );
}

function InterviewSession({
  interview,
  answer,
  isSaving,
  isCompleting,
  onAnswerChange,
  onSaveNext,
  onComplete
}: {
  interview: ApiMockInterview;
  answer: string;
  isSaving: boolean;
  isCompleting: boolean;
  onAnswerChange: (answer: string) => void;
  onSaveNext: () => void;
  onComplete: () => void;
}) {
  const questions = interview.questions ?? [];
  const currentQuestion = questions[interview.currentQuestionIndex] ?? questions[questions.length - 1];
  const currentNumber = Math.min(interview.currentQuestionIndex + 1, interview.questionCount);
  const progress = interview.questionCount > 0 ? Math.round((getAnsweredCount(interview) / interview.questionCount) * 100) : 0;
  const isLastQuestion = currentNumber >= interview.questionCount;

  if (!currentQuestion) {
    return null;
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-cyan-700">Interview in progress</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            {interview.interviewType} Interview
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <span className="rounded-md bg-slate-100 px-2.5 py-1 font-medium text-slate-700">{interview.category}</span>
            <span className="rounded-md bg-slate-100 px-2.5 py-1 font-medium text-slate-700">{interview.difficulty}</span>
            <StatusBadge status={interview.status} />
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase text-slate-500">Question</p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">
            {currentNumber}/{interview.questionCount}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between gap-4 text-sm">
          <p className="font-semibold text-slate-950">Progress</p>
          <p className="font-medium text-slate-600">
            {getAnsweredCount(interview)}/{interview.questionCount} answered
          </p>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-cyan-600" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-5">
        <p className="text-xs font-semibold uppercase text-slate-500">{currentQuestion.category}</p>
        <p className="mt-2 text-lg font-semibold leading-7 text-slate-950">{currentQuestion.questionText}</p>
      </div>

      <label className="mt-6 block">
        <span className="text-sm font-semibold text-slate-700">Your answer</span>
        <textarea
          className="mt-2 min-h-56 w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          placeholder="Type your answer here."
          value={answer}
          onChange={(event) => onAnswerChange(event.target.value)}
          maxLength={10000}
        />
      </label>
      <div className="mt-2 flex justify-end text-xs text-slate-500">{answer.length}/10000 characters</div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={onComplete}
          disabled={isSaving || isCompleting}
        >
          {isCompleting ? 'Completing...' : 'Complete Interview'}
        </button>
        <button
          type="button"
          className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          onClick={onSaveNext}
          disabled={isSaving || isCompleting}
        >
          {isSaving ? 'Saving...' : isLastQuestion ? 'Save Answer' : 'Save & Next'}
        </button>
      </div>
    </section>
  );
}

function ScoreTile({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{Math.round(value)}</p>
    </article>
  );
}

function FeedbackList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div>
      <h4 className="text-sm font-semibold text-slate-950">{title}</h4>
      <ul className="mt-2 space-y-1.5 text-sm leading-6 text-slate-600">
        {items.map((item) => (
          <li key={item}>- {item}</li>
        ))}
      </ul>
    </div>
  );
}

function QuestionFeedback({
  feedback,
  interview
}: {
  feedback: ApiMockInterviewQuestionFeedback;
  interview: ApiMockInterview;
}) {
  const question = interview.questions?.find((item) => item.index === feedback.questionIndex);

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-cyan-700">Question {feedback.questionIndex + 1}</p>
          <h3 className="mt-2 text-base font-semibold leading-6 text-slate-950">{question?.questionText ?? 'Saved answer feedback'}</h3>
        </div>
        <div className="rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white">{Math.round(feedback.score)}/100</div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <FeedbackList title="Strengths" items={feedback.strengths} />
        <FeedbackList title="Weaknesses" items={feedback.weaknesses} />
        <FeedbackList title="Improvements" items={feedback.improvements} />
      </div>

      <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
        <p className="text-sm font-semibold text-emerald-900">Better answer</p>
        <p className="mt-2 text-sm leading-6 text-emerald-900">{feedback.sampleBetterAnswer}</p>
      </div>
    </article>
  );
}

function EvaluationResults({ interview }: { interview: ApiMockInterview }) {
  const evaluation = interview.evaluation;

  if (!evaluation) {
    return null;
  }

  return (
    <div className="mt-6 space-y-5">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Overall score</p>
            <p className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">{Math.round(evaluation.overallScore)}/100</p>
          </div>
          <p className="max-w-3xl text-sm leading-6 text-slate-600">{evaluation.summary}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ScoreTile label="Communication" value={evaluation.communication} />
        <ScoreTile label="Technical Knowledge" value={evaluation.technicalKnowledge} />
        <ScoreTile label="Problem Solving" value={evaluation.problemSolving} />
        <ScoreTile label="Confidence" value={evaluation.confidence} />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <FeedbackList title="Recommendations" items={evaluation.recommendations} />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-950">Per Question Feedback</h3>
        {evaluation.questionFeedback.map((feedback) => (
          <QuestionFeedback key={feedback.questionIndex} feedback={feedback} interview={interview} />
        ))}
      </div>
    </div>
  );
}

function CompletionSummary({
  interview,
  isEvaluating,
  onEvaluate,
  onStartNew
}: {
  interview: ApiMockInterview;
  isEvaluating: boolean;
  onEvaluate: () => void;
  onStartNew: () => void;
}) {
  const answeredCount = getAnsweredCount(interview);
  const hasEvaluation = interview.evaluationStatus === 'completed' && Boolean(interview.evaluation);

  return (
    <section className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-emerald-700">Interview completed</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{interview.interviewType} Interview</h2>
          <p className="mt-2 max-w-2xl text-slate-600">Your responses were saved. Run AI evaluation when you are ready, or review saved feedback from previous sessions.</p>
        </div>
        <StatusBadge status={interview.status} />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Type" value={interview.interviewType} detail="Configured interview mode" accentClassName="bg-cyan-500" />
        <SummaryCard label="Category" value={interview.category} detail="Selected question area" accentClassName="bg-emerald-500" />
        <SummaryCard label="Difficulty" value={interview.difficulty} detail="Session difficulty" accentClassName="bg-amber-500" />
        <SummaryCard label="Answered" value={`${answeredCount}/${interview.questionCount}`} detail="Saved text responses" accentClassName="bg-rose-500" />
      </div>

      {interview.evaluationStatus === 'processing' || isEvaluating ? (
        <div className="mt-6 rounded-lg border border-cyan-200 bg-cyan-50 p-5 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-cyan-200 border-t-cyan-700" />
          <p className="mt-3 text-sm font-semibold text-cyan-900">Evaluating interview...</p>
        </div>
      ) : null}

      {interview.evaluationStatus === 'failed' && !isEvaluating ? (
        <div className="mt-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          Evaluation failed. You can retry the AI evaluation.
        </div>
      ) : null}

      {hasEvaluation ? <EvaluationResults interview={interview} /> : null}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
        {!hasEvaluation ? (
          <button
            type="button"
            className="rounded-md bg-cyan-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-cyan-400"
            onClick={onEvaluate}
            disabled={isEvaluating || interview.evaluationStatus === 'processing'}
          >
            {isEvaluating || interview.evaluationStatus === 'processing' ? 'Evaluating...' : 'Evaluate Interview'}
          </button>
        ) : null}
        <button type="button" className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800" onClick={onStartNew}>
          Start New Interview
        </button>
      </div>
    </section>
  );
}

function SummaryCard({ label, value, detail, accentClassName }: { label: string; value: string; detail: string; accentClassName: string }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
        </div>
        <span className={`h-3 w-3 rounded-full ${accentClassName}`} aria-hidden="true" />
      </div>
      <p className="mt-3 text-sm text-slate-500">{detail}</p>
    </article>
  );
}

function InterviewHistory({
  interviews,
  isLoading,
  errorMessage,
  activeId,
  onOpen
}: {
  interviews: ApiMockInterview[];
  isLoading: boolean;
  errorMessage: string;
  activeId: string | null;
  onOpen: (id: string) => void;
}) {
  return (
    <FieldCard title="Interview History">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">Resume in-progress sessions or review completed summaries.</p>
        <p className="text-sm font-medium text-slate-600">{interviews.length} records</p>
      </div>

      {isLoading ? (
        <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-950" />
          <p className="mt-3 text-sm font-medium text-slate-600">Loading interview history...</p>
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{errorMessage}</div>
      ) : null}

      {!isLoading && !errorMessage && interviews.length === 0 ? (
        <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <p className="text-sm font-semibold text-slate-950">No mock interviews yet.</p>
          <p className="mt-1 text-sm text-slate-500">Started sessions will appear here.</p>
        </div>
      ) : null}

      {interviews.length > 0 ? (
        <div className="mt-5 space-y-3">
          {interviews.map((interview) => {
            const isActive = activeId === interview.id;

            return (
              <article
                key={interview.id}
                className={`rounded-lg border p-4 transition ${
                  isActive ? 'border-cyan-300 bg-cyan-50' : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-slate-950">{interview.interviewType} Interview</h3>
                      <StatusBadge status={interview.status} />
                    </div>
                    <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                      <span>{interview.category}</span>
                      <span>{interview.difficulty}</span>
                      <span>{formatDate(interview.startedAt)}</span>
                      <span>
                        {interview.answeredCount}/{interview.questionCount} answered
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    onClick={() => onOpen(interview.id)}
                  >
                    {interview.status === 'in_progress' ? 'Resume' : 'Open'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </FieldCard>
  );
}

export function MockInterview() {
  const [setup, setSetup] = useState<SetupState>({
    interviewType: 'Technical',
    category: 'DSA',
    difficulty: 'Medium',
    questionCount: 5
  });
  const [activeInterview, setActiveInterview] = useState<ApiMockInterview | null>(null);
  const [history, setHistory] = useState<ApiMockInterview[]>([]);
  const [answer, setAnswer] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [historyErrorMessage, setHistoryErrorMessage] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [isSessionLoading, setIsSessionLoading] = useState(false);

  const currentQuestion = useMemo(() => {
    const questions = activeInterview?.questions ?? [];
    return questions[activeInterview?.currentQuestionIndex ?? 0] ?? null;
  }, [activeInterview]);

  useEffect(() => {
    if (currentQuestion) {
      setAnswer(currentQuestion.userAnswer ?? '');
    } else {
      setAnswer('');
    }
  }, [currentQuestion]);

  async function loadHistory() {
    setIsHistoryLoading(true);
    setHistoryErrorMessage('');

    try {
      const interviews = await getMockInterviewHistory();
      setHistory(interviews);
    } catch (error) {
      setHistoryErrorMessage(getAuthErrorMessage(error, 'Unable to load interview history.'));
    } finally {
      setIsHistoryLoading(false);
    }
  }

  async function openInterview(id: string) {
    setIsSessionLoading(true);
    setErrorMessage('');

    try {
      const interview = await getMockInterview(id);
      setActiveInterview(interview);

      if (interview.status === 'in_progress') {
        localStorage.setItem(ACTIVE_INTERVIEW_STORAGE_KEY, interview.id);
      } else {
        localStorage.removeItem(ACTIVE_INTERVIEW_STORAGE_KEY);
      }
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error, 'Unable to load the mock interview.'));
    } finally {
      setIsSessionLoading(false);
    }
  }

  useEffect(() => {
    let isActive = true;

    async function initialize() {
      await loadHistory();

      const activeInterviewId = localStorage.getItem(ACTIVE_INTERVIEW_STORAGE_KEY);

      if (activeInterviewId && isActive) {
        await openInterview(activeInterviewId);
      }
    }

    void initialize();

    return () => {
      isActive = false;
    };
  }, []);

  async function refreshHistoryAfterChange(interview: ApiMockInterview) {
    setHistory((current) => [interview, ...current.filter((item) => item.id !== interview.id)]);
    await loadHistory();
  }

  async function handleStartInterview() {
    const validationError = validateSetup(setup);

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsStarting(true);
    setErrorMessage('');

    try {
      const payload = {
        interviewType: setup.interviewType,
        category: setup.interviewType === 'HR' ? undefined : setup.category,
        difficulty: setup.difficulty,
        questionCount: setup.questionCount
      };
      const interview = await createMockInterview(payload);
      setActiveInterview(interview);
      localStorage.setItem(ACTIVE_INTERVIEW_STORAGE_KEY, interview.id);
      await refreshHistoryAfterChange(interview);
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error, 'Unable to start the mock interview.'));
    } finally {
      setIsStarting(false);
    }
  }

  async function handleSaveNext() {
    if (!activeInterview || !currentQuestion) {
      return;
    }

    if (!answer.trim()) {
      setErrorMessage('Type an answer before saving.');
      return;
    }

    setIsSaving(true);
    setErrorMessage('');

    try {
      const interview = await answerMockInterview(activeInterview.id, {
        questionIndex: currentQuestion.index,
        answer
      });
      setActiveInterview(interview);
      localStorage.setItem(ACTIVE_INTERVIEW_STORAGE_KEY, interview.id);
      await refreshHistoryAfterChange(interview);
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error, 'Unable to save this answer. Reload the session and try again.'));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCompleteInterview() {
    if (!activeInterview) {
      return;
    }

    setIsCompleting(true);
    setErrorMessage('');

    try {
      const interview = await completeMockInterview(activeInterview.id);
      setActiveInterview(interview);
      localStorage.removeItem(ACTIVE_INTERVIEW_STORAGE_KEY);
      await refreshHistoryAfterChange(interview);
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error, 'Unable to complete the mock interview.'));
    } finally {
      setIsCompleting(false);
    }
  }

  async function handleEvaluateInterview() {
    if (!activeInterview) {
      return;
    }

    setIsEvaluating(true);
    setErrorMessage('');

    try {
      const interview = await evaluateMockInterview(activeInterview.id);
      setActiveInterview(interview);
      await refreshHistoryAfterChange(interview);
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error, 'Unable to evaluate the mock interview.'));
    } finally {
      setIsEvaluating(false);
    }
  }

  function handleStartNew() {
    setActiveInterview(null);
    setAnswer('');
    setErrorMessage('');
    localStorage.removeItem(ACTIVE_INTERVIEW_STORAGE_KEY);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase text-cyan-700">PrepAI</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Mock Interview</h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              Run a focused text-answer interview session and keep your progress saved to your account.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase text-slate-500">Milestone 1</p>
            <p className="mt-1 text-sm font-semibold text-slate-950">Text sessions with history</p>
          </div>
        </div>
      </section>

      {errorMessage ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{errorMessage}</div>
      ) : null}

      {isSessionLoading ? (
        <section className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-950" />
          <p className="mt-3 text-sm font-medium text-slate-600">Loading interview session...</p>
        </section>
      ) : null}

      {!activeInterview && !isSessionLoading ? (
        <SetupPanel setup={setup} isStarting={isStarting} onChange={setSetup} onStart={handleStartInterview} />
      ) : null}

      {activeInterview?.status === 'in_progress' && !isSessionLoading ? (
        <InterviewSession
          interview={activeInterview}
          answer={answer}
          isSaving={isSaving}
          isCompleting={isCompleting}
          onAnswerChange={setAnswer}
          onSaveNext={handleSaveNext}
          onComplete={handleCompleteInterview}
        />
      ) : null}

      {activeInterview?.status === 'completed' && !isSessionLoading ? (
        <CompletionSummary
          interview={activeInterview}
          isEvaluating={isEvaluating}
          onEvaluate={handleEvaluateInterview}
          onStartNew={handleStartNew}
        />
      ) : null}

      <InterviewHistory
        interviews={history}
        isLoading={isHistoryLoading}
        errorMessage={historyErrorMessage}
        activeId={activeInterview?.id ?? null}
        onOpen={openInterview}
      />
    </div>
  );
}
