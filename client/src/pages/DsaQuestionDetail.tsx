import { useEffect, useMemo, useState } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import { Link, Navigate, useParams } from 'react-router-dom';
import {
  PracticeDetailSection,
  difficultyBadgeStyles
} from '../components/practice/PracticeComponents';
import { dsaQuestions } from '../data/dsaQuestions';
import { usePracticeState } from '../hooks/usePracticeState';
import {
  getQuestion,
  runQuestionCode,
  submitQuestionCode,
  type ApiCodeExecutionResult,
  type ApiCodeTestResult,
  type ApiQuestion,
  type ApiPublicTestCase,
  type CodeLanguage
} from '../services/api';

const languages: Array<{ value: CodeLanguage; label: string }> = [
  { value: 'java', label: 'Java' },
  { value: 'python', label: 'Python' },
  { value: 'cpp', label: 'C++' },
  { value: 'javascript', label: 'JavaScript' }
];

const defaultFunctionName = 'solve';
const editorLanguageByCodeLanguage: Record<CodeLanguage, string> = {
  java: 'java',
  python: 'python',
  cpp: 'cpp',
  javascript: 'javascript'
};

type ExecutionMode = 'run' | 'submit';

type CustomTestCase = {
  id: string;
  name: string;
  input: string;
  expectedOutput: string;
};

function toFunctionName(title: string) {
  const words = title
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .trim()
    .split(/\s+/);

  return words
    .map((word, index) => {
      const normalized = word.toLowerCase();
      return index === 0 ? normalized : `${normalized.charAt(0).toUpperCase()}${normalized.slice(1)}`;
    })
    .join('');
}

function createStarterCode(language: CodeLanguage, title: string, functionName = toFunctionName(title) || defaultFunctionName) {
  if (title === 'Two Sum') {
    if (language === 'java') {
      return `class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Write your solution here
        return new int[0];
    }
}`;
    }

    if (language === 'python') {
      return `class Solution:
    def twoSum(self, nums, target):
        # Write your solution here
        pass`;
    }

    if (language === 'cpp') {
      return `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Write your solution here
        return {};
    }
};`;
    }

    return `function twoSum(nums, target) {
    // Write your solution here
}`;
  }

  if (language === 'java') {
    return `class Solution {
    public String ${functionName}(String input) {
        // Write your solution here
        return input;
    }
}`;
  }

  if (language === 'python') {
    return `class Solution:
    def ${functionName}(self, input):
        # Write your solution here
        return input`;
  }

  if (language === 'cpp') {
    return `class Solution {
public:
    string ${functionName}(string input) {
        // Write your solution here
        return input;
    }
};`;
  }

  return `function ${functionName}(input) {
    // Write your solution here
    return input;
}`;
}

function formatJson(value: string | undefined) {
  if (!value) {
    return '';
  }

  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

function statusLabel(status: ApiCodeExecutionResult['status']) {
  const labels: Record<ApiCodeExecutionResult['status'], string> = {
    accepted: 'Accepted',
    wrong_answer: 'Wrong Answer',
    runtime_error: 'Runtime Error',
    compilation_error: 'Compilation Error',
    time_limit_exceeded: 'Time Limit Exceeded',
    execution_error: 'Execution Error'
  };

  return labels[status];
}

function getStatusStyles(status: ApiCodeExecutionResult['status'] | ApiCodeTestResult['status']) {
  if (status === 'accepted' || status === 'passed') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  }

  if (status === 'time_limit_exceeded' || status === 'timeout') {
    return 'border-amber-200 bg-amber-50 text-amber-800';
  }

  return 'border-rose-200 bg-rose-50 text-rose-800';
}

function getRequestErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    return response?.data?.message ?? fallback;
  }

  return fallback;
}

function formatConsoleText(value: string) {
  return value.trim() || 'No output.';
}

function TestCaseResult({ result }: { result: ApiCodeTestResult }) {
  const passed = result.status === 'passed';

  return (
    <div className={`rounded-md border px-3 py-2 text-sm ${getStatusStyles(result.status)}`}>
      <p className="font-semibold">
        {passed ? 'Passed' : result.status === 'timeout' ? 'Timeout' : 'Failed'} · {result.name} {result.hidden ? '(hidden)' : ''}
      </p>
      {!result.hidden ? (
        <div className="mt-2 grid gap-2 text-slate-700 md:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Input</p>
            <pre className="mt-1 whitespace-pre-wrap rounded bg-white/70 p-2">{formatJson(result.input)}</pre>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Expected</p>
            <pre className="mt-1 whitespace-pre-wrap rounded bg-white/70 p-2">{formatJson(result.expectedOutput)}</pre>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Actual</p>
            <pre className="mt-1 whitespace-pre-wrap rounded bg-white/70 p-2">{formatJson(result.actualOutput)}</pre>
          </div>
          {result.error ? <p className="md:col-span-3">Error: {result.error}</p> : null}
        </div>
      ) : result.error ? (
        <p className="mt-2 text-rose-700">{result.error}</p>
      ) : null}
    </div>
  );
}

function EditorLoadingState() {
  return (
    <div className="flex min-h-[520px] items-center justify-center rounded-b-lg bg-slate-950 text-sm font-medium text-slate-300">
      Loading editor...
    </div>
  );
}

export function DsaQuestionDetail() {
  const { id } = useParams();
  const questionId = Number(id);
  const fallbackQuestion = dsaQuestions.find((item) => item.id === questionId);
  const fallbackQuestions = useMemo(
    () =>
      dsaQuestions.map((item) => ({
        id: item.id,
        solved: item.solved
      })),
    []
  );
  const { questionState, isLoading, errorMessage, setSolved, toggleFavorite, setNotes } = usePracticeState('DSA', fallbackQuestions);
  const [question, setQuestion] = useState<ApiQuestion | null>(null);
  const [questionError, setQuestionError] = useState('');
  const [language, setLanguage] = useState<CodeLanguage>('java');
  const [codeByLanguage, setCodeByLanguage] = useState<Partial<Record<CodeLanguage, string>>>({});
  const [selectedTestCaseId, setSelectedTestCaseId] = useState('');
  const [customTestCases, setCustomTestCases] = useState<CustomTestCase[]>([]);
  const [executionResult, setExecutionResult] = useState<ApiCodeExecutionResult | null>(null);
  const [executionMode, setExecutionMode] = useState<ExecutionMode | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function loadQuestion() {
      setQuestionError('');

      try {
        const loadedQuestion = await getQuestion(questionId, 'DSA');

        if (isActive) {
          setQuestion(loadedQuestion);
          setSelectedTestCaseId(loadedQuestion.publicTestCases?.[0]?.id ?? '');
        }
      } catch {
        if (isActive) {
          setQuestionError('Unable to load the DSA question details.');
        }
      }
    }

    if (Number.isFinite(questionId)) {
      void loadQuestion();
    }

    return () => {
      isActive = false;
    };
  }, [questionId]);

  const displayQuestion = useMemo(
    () =>
      question ??
      (fallbackQuestion
        ? {
            _id: String(fallbackQuestion.id),
            questionId: fallbackQuestion.id,
            module: 'DSA' as const,
            title: fallbackQuestion.title,
            difficulty: fallbackQuestion.difficulty,
            category: fallbackQuestion.topic,
            companies: fallbackQuestion.companies,
            estimatedTime: fallbackQuestion.estimatedTime,
            createdAt: '',
            updatedAt: '',
            statement: `Solve ${fallbackQuestion.title} using an efficient algorithm for the ${fallbackQuestion.topic} pattern.`,
            examples: [],
            constraints: [],
            starterCode: undefined,
            functionName: undefined,
            publicTestCases: [],
            hiddenTestCount: 0
          }
        : null),
    [fallbackQuestion, question]
  );

  useEffect(() => {
    if (!displayQuestion) {
      return;
    }

    setCodeByLanguage((current) => {
      const next = { ...current };

      for (const item of languages) {
        if (!next[item.value]) {
          next[item.value] = displayQuestion.starterCode?.[item.value] ?? createStarterCode(item.value, displayQuestion.title, displayQuestion.functionName);
        }
      }

      return next;
    });
  }, [displayQuestion]);

  if (!Number.isFinite(questionId) || (!fallbackQuestion && !question && questionError)) {
    return <Navigate to="/dsa-practice" replace />;
  }

  if (!displayQuestion) {
    return null;
  }

  const publicTestCases = displayQuestion.publicTestCases ?? [];
  const totalSubmitTestCount = publicTestCases.length + (displayQuestion.hiddenTestCount ?? 0);
  const selectedPublicTestCase = publicTestCases.find((testCase) => testCase.id === selectedTestCaseId);
  const selectedCustomTestCase = customTestCases.find((testCase) => testCase.id === selectedTestCaseId);
  const selectedTestCase = selectedPublicTestCase ?? selectedCustomTestCase ?? publicTestCases[0] ?? customTestCases[0];
  const selectedResult = selectedTestCase?.id.startsWith('custom-')
    ? undefined
    : executionResult?.testResults.find((result) => result.id === selectedTestCase?.id);
  const state = questionState[questionId] ?? {
    solved: false,
    favorite: false,
    notes: '',
    notesOpen: false
  };
  const currentCode = codeByLanguage[language] ?? createStarterCode(language, displayQuestion.title, displayQuestion.functionName);
  const publicResults = executionResult?.testResults.filter((result) => !result.hidden) ?? [];
  const hiddenResults = executionResult?.testResults.filter((result) => result.hidden) ?? [];
  const hiddenPassedCount = hiddenResults.filter((result) => result.status === 'passed').length;
  const isExecuting = isRunning || isSubmitting;
  const selectedLanguageLabel = languages.find((item) => item.value === language)?.label ?? language;
  const selectedStarterCode = displayQuestion.starterCode?.[language] ?? createStarterCode(language, displayQuestion.title, displayQuestion.functionName);

  function updateCode(nextCode: string) {
    setCodeByLanguage((current) => ({
      ...current,
      [language]: nextCode
    }));
  }

  function resetCurrentCode() {
    setCodeByLanguage((current) => ({
      ...current,
      [language]: selectedStarterCode
    }));
  }

  function clearOutput() {
    setExecutionResult(null);
    setExecutionMode(null);
  }

  function addCustomTestCase() {
    const nextCase = {
      id: `custom-${Date.now()}`,
      name: `Custom Case ${customTestCases.length + 1}`,
      input: '{\n  \n}',
      expectedOutput: ''
    };

    setCustomTestCases((current) => [...current, nextCase]);
    setSelectedTestCaseId(nextCase.id);
  }

  function updateCustomTestCase(id: string, patch: Partial<CustomTestCase>) {
    setCustomTestCases((current) => current.map((testCase) => (testCase.id === id ? { ...testCase, ...patch } : testCase)));
  }

  function removeCustomTestCase(id: string) {
    setCustomTestCases((current) => current.filter((testCase) => testCase.id !== id));
    setSelectedTestCaseId(publicTestCases[0]?.id ?? '');
  }

  const handleEditorMount: OnMount = (editor) => {
    editor.focus();
  };

  async function runCode() {
    if (isExecuting) {
      return;
    }

    setIsRunning(true);
    setExecutionResult(null);
    setExecutionMode('run');

    try {
      const result = await runQuestionCode(questionId, {
        language,
        code: currentCode
      });
      setExecutionResult(result);
    } catch (error) {
      setExecutionResult({
        status: 'execution_error',
        passedCount: 0,
        totalCount: publicTestCases.length,
        runtimeMs: 0,
        stdout: '',
        stderr: getRequestErrorMessage(error, 'Unable to run code right now.'),
        testResults: []
      });
    } finally {
      setIsRunning(false);
    }
  }

  async function submitCode() {
    if (isExecuting) {
      return;
    }

    setIsSubmitting(true);
    setExecutionResult(null);
    setExecutionMode('submit');

    try {
      const { result } = await submitQuestionCode(questionId, {
        language,
        code: currentCode
      });
      setExecutionResult(result);

      if (result.status === 'accepted') {
        setSolved(questionId, true);
      }
    } catch (error) {
      setExecutionResult({
        status: 'execution_error',
        passedCount: 0,
        totalCount: totalSubmitTestCount,
        runtimeMs: 0,
        stdout: '',
        stderr: getRequestErrorMessage(error, 'Unable to submit code right now.'),
        testResults: []
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <Link className="text-sm font-semibold text-slate-600 underline-offset-4 hover:text-slate-950 hover:underline" to="/dsa-practice">
          Back to DSA Practice
        </Link>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{displayQuestion.title}</h1>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${difficultyBadgeStyles[displayQuestion.difficulty]}`}>
                {displayQuestion.difficulty}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <span className="rounded-md bg-slate-100 px-2.5 py-1 font-medium text-slate-700">{displayQuestion.category}</span>
              <span>{displayQuestion.estimatedTime} min</span>
              <span className="hidden text-slate-300 sm:inline">|</span>
              <span>{displayQuestion.companies.join(', ')}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="flex h-10 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-700">
              <input
                className="h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-slate-400"
                type="checkbox"
                checked={state.solved}
                onChange={(event) => setSolved(questionId, event.target.checked)}
              />
              Solved
            </label>
            <button
              className={[
                'h-10 rounded-md border px-3 text-sm font-medium transition',
                state.favorite
                  ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
                  : 'border-slate-300 text-slate-700 hover:bg-slate-100'
              ].join(' ')}
              type="button"
              onClick={() => toggleFavorite(questionId)}
              aria-pressed={state.favorite}
            >
              {state.favorite ? 'Favorited' : 'Favorite'}
            </button>
          </div>
        </div>
      </section>

      {isLoading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-950" />
          <p className="mt-3 text-sm font-medium text-slate-600">Loading saved progress...</p>
        </div>
      ) : null}

      {errorMessage || questionError ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{errorMessage || questionError}</div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[minmax(320px,0.82fr)_minmax(0,1.18fr)]">
        <div className="space-y-6 xl:max-h-[calc(100vh-7rem)] xl:overflow-y-auto xl:pr-1">
          <PracticeDetailSection title="Problem Statement">
            <p className="text-sm leading-6 text-slate-700">{displayQuestion.statement}</p>
          </PracticeDetailSection>

          <PracticeDetailSection title="Examples">
            {displayQuestion.examples?.length ? (
              <div className="space-y-3">
                {displayQuestion.examples.map((example, index) => (
                  <pre key={`${example}-${index}`} className="whitespace-pre-wrap rounded-md bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                    {example}
                  </pre>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No examples available.</p>
            )}
          </PracticeDetailSection>

          <PracticeDetailSection title="Constraints">
            {displayQuestion.constraints?.length ? (
              <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
                {displayQuestion.constraints.map((constraint) => (
                  <li key={constraint}>{constraint}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No constraints available.</p>
            )}
          </PracticeDetailSection>
        </div>

        <div className="space-y-6">
          <PracticeDetailSection title="Code Editor">
            <div className="mb-3 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                Language:
                <select
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  value={language}
                  onChange={(event) => setLanguage(event.target.value as CodeLanguage)}
                >
                  {languages.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-slate-100 px-2.5 py-1 text-sm font-semibold text-slate-700">Public: {publicTestCases.length}</span>
                <span className="rounded-md bg-slate-100 px-2.5 py-1 text-sm font-semibold text-slate-700">Hidden: {displayQuestion.hiddenTestCount ?? 0}</span>
                <button
                  className="h-9 rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                  type="button"
                  onClick={resetCurrentCode}
                  disabled={isExecuting}
                >
                  Reset Code
                </button>
              </div>
            </div>
            <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-950 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-2">
                <p className="text-sm font-semibold text-slate-200">{selectedLanguageLabel}</p>
                <p className="text-xs font-medium text-slate-400">{displayQuestion.functionName ?? defaultFunctionName}</p>
              </div>
              <Editor
                height="520px"
                language={editorLanguageByCodeLanguage[language]}
                loading={<EditorLoadingState />}
                onChange={(value) => updateCode(value ?? '')}
                onMount={handleEditorMount}
                options={{
                  automaticLayout: true,
                  fontFamily: 'Menlo, Monaco, Consolas, "Courier New", monospace',
                  fontSize: 14,
                  minimap: { enabled: false },
                  padding: { top: 16, bottom: 16 },
                  scrollBeyondLastLine: false,
                  tabSize: 4,
                  wordWrap: 'on'
                }}
                theme="vs-dark"
                value={currentCode}
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                className="h-10 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                onClick={runCode}
                disabled={isRunning || isSubmitting}
              >
                {isRunning ? 'Running...' : 'Run'}
              </button>
              <button
                className="h-10 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                onClick={submitCode}
                disabled={isRunning || isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </PracticeDetailSection>

          <PracticeDetailSection title="Test Cases">
            {publicTestCases.length || customTestCases.length ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  {publicTestCases.map((testCase: ApiPublicTestCase, index: number) => (
                    <button
                      key={testCase.id}
                      className={[
                        'rounded-md border px-3 py-2 text-sm font-semibold transition',
                        selectedTestCase?.id === testCase.id ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                      ].join(' ')}
                      type="button"
                      onClick={() => setSelectedTestCaseId(testCase.id)}
                    >
                      Public {index + 1}
                    </button>
                  ))}
                  {customTestCases.map((testCase, index) => (
                    <button
                      key={testCase.id}
                      className={[
                        'rounded-md border px-3 py-2 text-sm font-semibold transition',
                        selectedTestCase?.id === testCase.id ? 'border-cyan-700 bg-cyan-700 text-white' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                      ].join(' ')}
                      type="button"
                      onClick={() => setSelectedTestCaseId(testCase.id)}
                    >
                      Custom {index + 1}
                    </button>
                  ))}
                  <button
                    className="rounded-md border border-dashed border-slate-400 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    type="button"
                    onClick={addCustomTestCase}
                  >
                    Add Custom
                  </button>
                </div>

                {selectedCustomTestCase ? (
                  <div className="space-y-3 rounded-lg border border-cyan-200 bg-cyan-50 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <input
                        className="rounded-md border border-cyan-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                        value={selectedCustomTestCase.name}
                        onChange={(event) => updateCustomTestCase(selectedCustomTestCase.id, { name: event.target.value })}
                        aria-label="Custom test case name"
                      />
                      <button
                        className="h-9 rounded-md border border-cyan-300 px-3 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-100"
                        type="button"
                        onClick={() => removeCustomTestCase(selectedCustomTestCase.id)}
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid gap-3 lg:grid-cols-2">
                      <label>
                        <span className="text-xs font-semibold uppercase text-cyan-800">Input</span>
                        <textarea
                          className="mt-2 min-h-32 w-full resize-y rounded-md border border-cyan-200 bg-white p-3 font-mono text-sm text-slate-800 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                          value={selectedCustomTestCase.input}
                          onChange={(event) => updateCustomTestCase(selectedCustomTestCase.id, { input: event.target.value })}
                        />
                      </label>
                      <label>
                        <span className="text-xs font-semibold uppercase text-cyan-800">Expected Output</span>
                        <textarea
                          className="mt-2 min-h-32 w-full resize-y rounded-md border border-cyan-200 bg-white p-3 font-mono text-sm text-slate-800 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                          value={selectedCustomTestCase.expectedOutput}
                          onChange={(event) => updateCustomTestCase(selectedCustomTestCase.id, { expectedOutput: event.target.value })}
                        />
                      </label>
                    </div>
                    <p className="text-sm font-medium text-cyan-900">Custom cases are stored in this page state. Run and Submit execute the configured public and hidden tests from the backend.</p>
                  </div>
                ) : selectedTestCase ? (
                  <div className="grid gap-3 lg:grid-cols-3">
                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-500">Input</p>
                      <pre className="mt-2 min-h-24 whitespace-pre-wrap rounded-md bg-slate-50 p-3 text-sm text-slate-700">{formatJson(selectedTestCase.input)}</pre>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-500">Expected Output</p>
                      <pre className="mt-2 min-h-24 whitespace-pre-wrap rounded-md bg-slate-50 p-3 text-sm text-slate-700">
                        {formatJson(selectedTestCase.expectedOutput)}
                      </pre>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-500">Actual Output</p>
                      <pre className="mt-2 min-h-24 whitespace-pre-wrap rounded-md bg-slate-50 p-3 text-sm text-slate-700">
                        {selectedResult ? formatJson(selectedResult.actualOutput) : 'Run code to see output.'}
                      </pre>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-slate-500">No public test cases available yet.</p>
                <button
                  className="rounded-md border border-dashed border-slate-400 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  type="button"
                  onClick={addCustomTestCase}
                >
                  Add Custom
                </button>
              </div>
            )}
          </PracticeDetailSection>

          <PracticeDetailSection title="Result Console">
            {isExecuting ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-950" />
                  <p className="text-sm font-semibold text-slate-700">{isSubmitting ? 'Submitting...' : 'Running...'}</p>
                </div>
              </div>
            ) : executionResult ? (
              <div className="space-y-4">
                <div className={`rounded-lg border p-4 ${getStatusStyles(executionResult.status)}`}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-lg font-semibold">{statusLabel(executionResult.status)}</p>
                      <p className="mt-1 text-sm font-medium">
                        {executionResult.passedCount} / {executionResult.totalCount} test cases passed · Runtime: {executionResult.runtimeMs}ms
                      </p>
                      {executionMode === 'submit' && hiddenResults.length > 0 ? (
                        <p className="mt-1 text-sm font-medium">
                          Hidden tests: {hiddenResults.length} · Hidden tests passed: {hiddenPassedCount}
                        </p>
                      ) : null}
                    </div>
                    <button
                      className="h-9 rounded-md border border-current px-3 text-sm font-semibold transition hover:bg-white/50"
                      type="button"
                      onClick={clearOutput}
                    >
                      Clear Output
                    </button>
                  </div>
                </div>
                {publicResults.length ? (
                  <div className="space-y-2">
                    {publicResults.map((result) => (
                      <TestCaseResult key={result.id} result={result} />
                    ))}
                  </div>
                ) : null}
                {executionMode === 'submit' && hiddenResults.length > 0 ? (
                  <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                    Hidden tests passed: {hiddenPassedCount} / {hiddenResults.length}
                  </div>
                ) : null}
                {executionResult.stdout ? (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase text-slate-500">stdout</p>
                    <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-950 p-4 text-sm leading-6 text-slate-50">
                      {formatConsoleText(executionResult.stdout)}
                    </pre>
                  </div>
                ) : null}
                {executionResult.stderr ? (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase text-slate-500">stderr</p>
                    <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-950 p-4 text-sm leading-6 text-slate-50">
                      {formatConsoleText(executionResult.stderr)}
                    </pre>
                  </div>
                ) : null}
              </div>
            ) : (
              <pre className="min-h-[180px] whitespace-pre-wrap rounded-lg bg-slate-950 p-4 text-sm leading-6 text-slate-50">
                Ready. Run executes public tests only. Submit executes public and hidden tests.
              </pre>
            )}
          </PracticeDetailSection>
        </div>
      </section>

      <PracticeDetailSection title="Notes">
        <label className="block">
          <span className="sr-only">Notes</span>
          <textarea
            className="min-h-36 w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            placeholder="Add approach notes, edge cases, complexity, or mistakes to revisit."
            value={state.notes}
            onChange={(event) => setNotes(questionId, event.target.value)}
          />
        </label>
      </PracticeDetailSection>
    </div>
  );
}
