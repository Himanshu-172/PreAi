import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent, type ReactNode } from 'react';
import { getAuthErrorMessage } from '../services/authService';
import {
  analyzeResume,
  getResumeAnalysis,
  getResumeHistory,
  uploadResume,
  type ApiResumeAnalysis,
  type ApiResumeStructuredAnalysis,
  type ResumeAnalysisStatus
} from '../services/api';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_FILE_SIZE_LABEL = '5 MB';

type PageStage = 'initial' | 'uploading' | 'ready' | 'analyzing' | 'completed' | 'error';

const statusStyles: Record<ResumeAnalysisStatus, string> = {
  uploaded: 'bg-slate-100 text-slate-700 ring-slate-200',
  processing: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
  completed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  failed: 'bg-rose-50 text-rose-700 ring-rose-200'
};

function formatBytes(bytes: number) {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 1
  }).format(bytes / (1024 * 1024));
}

function formatDate(value?: string | null) {
  if (!value) {
    return 'Not available';
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(value));
}

function isPdfFile(file: File) {
  return file.type === 'application/pdf' && file.name.toLowerCase().endsWith('.pdf');
}

function getFileValidationError(file: File) {
  if (!isPdfFile(file)) {
    return 'Choose a PDF file with a .pdf extension.';
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `Choose a PDF that is ${MAX_FILE_SIZE_LABEL} or smaller.`;
  }

  return '';
}

function clampScore(score: number) {
  return Math.min(Math.max(Math.round(score), 0), 100);
}

function getStage({
  analysis,
  errorMessage,
  isAnalyzing,
  isUploading
}: {
  analysis: ApiResumeAnalysis | null;
  errorMessage: string;
  isAnalyzing: boolean;
  isUploading: boolean;
}): PageStage {
  if (isUploading) {
    return 'uploading';
  }

  if (isAnalyzing || analysis?.status === 'processing') {
    return 'analyzing';
  }

  if (analysis?.analysis && analysis.status === 'completed') {
    return 'completed';
  }

  if (analysis?.status === 'uploaded' || analysis?.status === 'failed') {
    return 'ready';
  }

  if (errorMessage) {
    return 'error';
  }

  return 'initial';
}

function StatusBadge({ status }: { status: ResumeAnalysisStatus }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ${statusStyles[status]}`}>{status}</span>;
}

function ScoreCard({ label, score, detail, accentClassName }: { label: string; score: number; detail: string; accentClassName: string }) {
  const normalizedScore = clampScore(score);

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{normalizedScore}/100</p>
        </div>
        <span className={`h-3 w-3 rounded-full ${accentClassName}`} aria-hidden="true" />
      </div>
      <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
        <div className={`h-full rounded-full ${accentClassName}`} style={{ width: `${normalizedScore}%` }} />
      </div>
      <p className="mt-3 text-sm text-slate-500">{detail}</p>
    </article>
  );
}

function SectionCard({ title, children, className = '' }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function SkillTags({ items, variant = 'default', emptyText }: { items: string[]; variant?: 'default' | 'missing'; emptyText: string }) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-500">{emptyText}</p>;
  }

  const tagClassName =
    variant === 'missing'
      ? 'border-amber-200 bg-amber-50 text-amber-800'
      : 'border-cyan-100 bg-cyan-50 text-cyan-800';

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item} className={`rounded-full border px-3 py-1 text-sm font-medium ${tagClassName}`}>
          {item}
        </span>
      ))}
    </div>
  );
}

function BulletList({ items, emptyText, markerClassName }: { items: string[]; emptyText: string; markerClassName: string }) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-500">{emptyText}</p>;
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-sm leading-6 text-slate-700">
          <span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${markerClassName}`} aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function SuggestionList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-500">No prioritized suggestions were returned for this analysis.</p>;
  }

  return (
    <ol className="space-y-3">
      {items.map((item, index) => (
        <li key={item} className="flex gap-3 text-sm leading-6 text-slate-700">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-semibold text-white">
            {index + 1}
          </span>
          <span className="pt-0.5">{item}</span>
        </li>
      ))}
    </ol>
  );
}

function AnalysisResults({
  analysis,
  isHistorical,
  onBackToCurrent,
  onStartNew
}: {
  analysis: ApiResumeAnalysis;
  isHistorical: boolean;
  onBackToCurrent: () => void;
  onStartNew: () => void;
}) {
  const result = analysis.analysis;

  if (!result) {
    return null;
  }

  const scoreCards = [
    { label: 'Overall Score', score: result.overallScore, detail: 'Combined readiness score', accentClassName: 'bg-slate-950' },
    { label: 'ATS Score', score: result.atsScore, detail: 'Applicant tracking system fit', accentClassName: 'bg-cyan-600' },
    { label: 'Content Score', score: result.contentScore, detail: 'Impact, clarity, and relevance', accentClassName: 'bg-emerald-500' },
    { label: 'Formatting Score', score: result.formattingScore, detail: 'Layout and scanability', accentClassName: 'bg-amber-500' }
  ];

  return (
    <section className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase text-cyan-700">{isHistorical ? 'Saved analysis' : 'Analysis complete'}</p>
            <h2 className="mt-2 break-words text-2xl font-semibold tracking-tight text-slate-950">{analysis.fileName}</h2>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
              <StatusBadge status={analysis.status} />
              <span>Analyzed {formatDate(analysis.analyzedAt)}</span>
              <span>Uploaded {formatDate(analysis.createdAt)}</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            {isHistorical ? (
              <button
                type="button"
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                onClick={onBackToCurrent}
              >
                Back to current analysis
              </button>
            ) : null}
            <button type="button" className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800" onClick={onStartNew}>
              Upload another resume
            </button>
          </div>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {scoreCards.map((score) => (
          <ScoreCard key={score.label} {...score} />
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Professional Summary" className="lg:col-span-2">
          <p className="text-sm leading-6 text-slate-700">{result.summary || 'No professional summary was returned for this analysis.'}</p>
        </SectionCard>

        <SectionCard title="Detected Skills">
          <SkillTags items={result.skills} emptyText="No explicit skills were detected in this analysis." />
        </SectionCard>

        <SectionCard title="Missing or Weak Skills">
          <SkillTags items={result.missingSkills} variant="missing" emptyText="No missing or weak skills were identified." />
        </SectionCard>

        <SectionCard title="Strengths">
          <BulletList items={result.strengths} emptyText="No strengths were returned for this analysis." markerClassName="bg-emerald-500" />
        </SectionCard>

        <SectionCard title="Weaknesses">
          <BulletList items={result.weaknesses} emptyText="No weaknesses were returned for this analysis." markerClassName="bg-rose-500" />
        </SectionCard>

        <SectionCard title="Actionable Suggestions" className="lg:col-span-2">
          <SuggestionList items={result.suggestions} />
        </SectionCard>
      </div>
    </section>
  );
}

function UploadStatusCard({
  analysis,
  stage,
  selectedFile
}: {
  analysis: ApiResumeAnalysis | null;
  stage: PageStage;
  selectedFile: File | null;
}) {
  return (
    <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">Current Flow</h2>
      <div className="mt-4 space-y-4 text-sm">
        <div>
          <p className="font-medium text-slate-500">Page state</p>
          <p className="mt-1 font-semibold capitalize text-slate-950">{stage}</p>
        </div>
        <div>
          <p className="font-medium text-slate-500">Accepted format</p>
          <p className="mt-1 text-slate-700">PDF, maximum {MAX_FILE_SIZE_LABEL}</p>
        </div>
        {selectedFile ? (
          <div>
            <p className="font-medium text-slate-500">Selected file</p>
            <p className="mt-1 break-words font-semibold text-slate-950">{selectedFile.name}</p>
          </div>
        ) : null}
        {analysis ? (
          <>
            <div>
              <p className="font-medium text-slate-500">Uploaded resume</p>
              <p className="mt-1 break-words font-semibold text-slate-950">{analysis.fileName}</p>
            </div>
            <div>
              <p className="font-medium text-slate-500">Resume status</p>
              <div className="mt-2">
                <StatusBadge status={analysis.status} />
              </div>
            </div>
            <div>
              <p className="font-medium text-slate-500">Uploaded</p>
              <p className="mt-1 text-slate-700">{formatDate(analysis.createdAt)}</p>
            </div>
            {analysis.analyzedAt ? (
              <div>
                <p className="font-medium text-slate-500">Analyzed</p>
                <p className="mt-1 text-slate-700">{formatDate(analysis.analyzedAt)}</p>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </aside>
  );
}

function ReadyToAnalyzeCard({
  analysis,
  isAnalyzing,
  onAnalyze,
  onStartNew
}: {
  analysis: ApiResumeAnalysis;
  isAnalyzing: boolean;
  onAnalyze: () => void;
  onStartNew: () => void;
}) {
  return (
    <section className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase text-emerald-700">{analysis.status === 'failed' ? 'Analysis failed' : 'Ready to analyze'}</p>
          <h2 className="mt-2 break-words text-xl font-semibold text-slate-950">{analysis.fileName}</h2>
          <p className="mt-2 text-sm text-slate-600">
            {analysis.status === 'failed'
              ? 'The previous analysis attempt failed. You can retry without uploading the PDF again.'
              : 'The PDF uploaded successfully. Start analysis when you are ready.'}
          </p>
        </div>
        <StatusBadge status={analysis.status} />
      </div>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={onStartNew}
          disabled={isAnalyzing}
        >
          Upload another resume
        </button>
        <button
          type="button"
          className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          onClick={onAnalyze}
          disabled={isAnalyzing || analysis.status === 'processing'}
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze Resume'}
        </button>
      </div>
    </section>
  );
}

function ResumeHistory({
  history,
  isLoading,
  errorMessage,
  selectedId,
  onSelect
}: {
  history: ApiResumeAnalysis[];
  isLoading: boolean;
  errorMessage: string;
  selectedId: string | null;
  onSelect: (analysis: ApiResumeAnalysis) => void;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Resume Analysis History</h2>
          <p className="text-sm text-slate-500">Select a completed analysis to view saved results.</p>
        </div>
        <p className="text-sm font-medium text-slate-600">{history.length} records</p>
      </div>

      {isLoading ? (
        <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-950" />
          <p className="mt-3 text-sm font-medium text-slate-600">Loading resume history...</p>
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{errorMessage}</div>
      ) : null}

      {!isLoading && !errorMessage && history.length === 0 ? (
        <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <p className="text-sm font-semibold text-slate-950">No resume history yet.</p>
          <p className="mt-1 text-sm text-slate-500">Uploaded resumes and completed analyses will appear here.</p>
        </div>
      ) : null}

      {history.length > 0 ? (
        <div className="mt-5 space-y-3">
          {history.map((item) => {
            const isCompleted = item.status === 'completed' && Boolean(item.analysis);
            const result = item.analysis as ApiResumeStructuredAnalysis | null | undefined;
            const isSelected = selectedId === item.id;

            return (
              <article
                key={item.id}
                className={`rounded-lg border p-4 transition ${
                  isSelected ? 'border-cyan-300 bg-cyan-50' : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="break-words text-sm font-semibold text-slate-950">{item.fileName}</h3>
                      <StatusBadge status={item.status} />
                    </div>
                    <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                      <span>Uploaded {formatDate(item.createdAt)}</span>
                      <span>Analyzed {formatDate(item.analyzedAt)}</span>
                      <span>Overall {result ? `${clampScore(result.overallScore)}/100` : 'Not available'}</span>
                      <span>ATS {result ? `${clampScore(result.atsScore)}/100` : 'Not available'}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => onSelect(item)}
                    disabled={!isCompleted}
                  >
                    {isCompleted ? 'View analysis' : item.status === 'uploaded' ? 'Not analyzed' : 'Unavailable'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

export function ResumeAnalyzer() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [isHistoryDetailLoading, setIsHistoryDetailLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [historyErrorMessage, setHistoryErrorMessage] = useState('');
  const [analysis, setAnalysis] = useState<ApiResumeAnalysis | null>(null);
  const [history, setHistory] = useState<ApiResumeAnalysis[]>([]);
  const [historicalAnalysis, setHistoricalAnalysis] = useState<ApiResumeAnalysis | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stage = useMemo(
    () => getStage({ analysis, errorMessage, isAnalyzing, isUploading }),
    [analysis, errorMessage, isAnalyzing, isUploading]
  );
  const displayedAnalysis = historicalAnalysis ?? analysis;
  const isShowingHistoricalResult = Boolean(historicalAnalysis);

  async function loadHistory() {
    setIsHistoryLoading(true);
    setHistoryErrorMessage('');

    try {
      const analyses = await getResumeHistory();
      setHistory(analyses);
    } catch (error) {
      setHistoryErrorMessage(getAuthErrorMessage(error, 'Unable to load resume history.'));
    } finally {
      setIsHistoryLoading(false);
    }
  }

  useEffect(() => {
    void loadHistory();
  }, []);

  function selectFile(file: File | undefined) {
    if (!file) {
      return;
    }

    const validationError = getFileValidationError(file);

    if (validationError) {
      setSelectedFile(null);
      setErrorMessage(validationError);
      setHistoricalAnalysis(null);
      return;
    }

    setSelectedFile(file);
    setAnalysis(null);
    setHistoricalAnalysis(null);
    setErrorMessage('');
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    selectFile(event.target.files?.[0]);
    event.target.value = '';
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    selectFile(event.dataTransfer.files[0]);
  }

  function removeSelectedFile() {
    setSelectedFile(null);
    setErrorMessage('');
  }

  function startNewAnalysis() {
    setSelectedFile(null);
    setAnalysis(null);
    setHistoricalAnalysis(null);
    setErrorMessage('');
  }

  async function handleUpload() {
    if (!selectedFile) {
      setErrorMessage('Select a resume PDF before uploading.');
      return;
    }

    setIsUploading(true);
    setErrorMessage('');
    setHistoricalAnalysis(null);

    try {
      const uploadedAnalysis = await uploadResume(selectedFile);
      setAnalysis(uploadedAnalysis);
      setSelectedFile(null);
      await loadHistory();
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error, 'Unable to upload resume. Try a different PDF.'));
    } finally {
      setIsUploading(false);
    }
  }

  async function handleAnalyze() {
    if (!analysis) {
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage('');
    setHistoricalAnalysis(null);

    try {
      const analyzedResume = await analyzeResume(analysis.id);
      setAnalysis(analyzedResume);
      await loadHistory();
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error, 'Unable to analyze resume right now.'));
      await loadHistory();
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleSelectHistory(item: ApiResumeAnalysis) {
    if (item.status !== 'completed' || !item.analysis) {
      return;
    }

    setIsHistoryDetailLoading(true);
    setErrorMessage('');

    try {
      const savedAnalysis = await getResumeAnalysis(item.id);
      setHistoricalAnalysis(savedAnalysis);
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error, 'Unable to load the saved resume analysis.'));
    } finally {
      setIsHistoryDetailLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase text-cyan-700">PrepAI</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Resume Analyzer</h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              Upload a text-based PDF resume, run structured AI analysis, and revisit saved resume reviews.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase text-slate-500">Accepted Upload</p>
            <p className="mt-1 text-sm font-semibold text-slate-950">PDF only, up to {MAX_FILE_SIZE_LABEL}</p>
          </div>
        </div>
      </section>

      {errorMessage ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{errorMessage}</div>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)]">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div
            className={`flex min-h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition ${
              isDragging ? 'border-cyan-500 bg-cyan-50' : 'border-slate-300 bg-slate-50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-white text-sm font-semibold text-slate-700 shadow-sm" aria-hidden="true">
              PDF
            </div>
            <h2 className="mt-5 text-xl font-semibold text-slate-950">
              {isUploading ? 'Uploading resume...' : selectedFile ? 'Resume selected' : 'Drop your resume here'}
            </h2>
            <p className="mt-2 max-w-md text-sm text-slate-500">
              Use a selectable-text PDF. Scanned or image-only resumes may not contain enough readable text.
            </p>
            <button
              type="button"
              className="mt-6 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isAnalyzing}
            >
              Browse file
            </button>
            <input ref={fileInputRef} className="hidden" type="file" accept="application/pdf,.pdf" onChange={handleFileChange} />
          </div>

          {selectedFile ? (
            <div className="mt-5 rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-500">Selected file</p>
                  <p className="mt-1 truncate text-base font-semibold text-slate-950">{selectedFile.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{formatBytes(selectedFile.size)} MB</p>
                </div>
                <button
                  type="button"
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={removeSelectedFile}
                  disabled={isUploading || isAnalyzing}
                >
                  Remove
                </button>
              </div>
            </div>
          ) : null}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
            {analysis || historicalAnalysis ? (
              <button
                type="button"
                className="rounded-md border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={startNewAnalysis}
                disabled={isUploading || isAnalyzing}
              >
                New analysis
              </button>
            ) : null}
            <button
              type="button"
              className="rounded-md bg-cyan-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              onClick={handleUpload}
              disabled={!selectedFile || isUploading || isAnalyzing}
            >
              {isUploading ? 'Uploading...' : 'Upload resume'}
            </button>
          </div>
        </div>

        <UploadStatusCard analysis={analysis} stage={stage} selectedFile={selectedFile} />
      </section>

      {analysis && !analysis.analysis ? (
        <ReadyToAnalyzeCard analysis={analysis} isAnalyzing={isAnalyzing} onAnalyze={handleAnalyze} onStartNew={startNewAnalysis} />
      ) : null}

      {isAnalyzing ? (
        <section className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-950" />
          <p className="mt-3 text-sm font-semibold text-slate-950">Analyzing resume...</p>
          <p className="mt-1 text-sm text-slate-500">This may take a moment depending on the configured AI provider.</p>
        </section>
      ) : null}

      {isHistoryDetailLoading ? (
        <section className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-950" />
          <p className="mt-3 text-sm font-semibold text-slate-950">Loading saved analysis...</p>
        </section>
      ) : null}

      {displayedAnalysis?.analysis && !isAnalyzing && !isHistoryDetailLoading ? (
        <AnalysisResults
          analysis={displayedAnalysis}
          isHistorical={isShowingHistoricalResult}
          onBackToCurrent={() => setHistoricalAnalysis(null)}
          onStartNew={startNewAnalysis}
        />
      ) : null}

      <ResumeHistory
        history={history}
        isLoading={isHistoryLoading}
        errorMessage={historyErrorMessage}
        selectedId={historicalAnalysis?.id ?? null}
        onSelect={handleSelectHistory}
      />
    </div>
  );
}
