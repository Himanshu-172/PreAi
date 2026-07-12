import { useMemo, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { getAuthErrorMessage } from '../services/authService';
import { analyzeResume, uploadResume, type ApiResumeAnalysis } from '../services/api';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_FILE_SIZE_LABEL = '5 MB';
const PREVIEW_LENGTH = 900;

function formatBytes(bytes: number) {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 1
  }).format(bytes / (1024 * 1024));
}

function formatDate(value: string) {
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

function getPreview(text?: string) {
  if (!text) {
    return '';
  }

  return text.length > PREVIEW_LENGTH ? `${text.slice(0, PREVIEW_LENGTH).trim()}...` : text;
}

export function ResumeAnalyzer() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [analysis, setAnalysis] = useState<ApiResumeAnalysis | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractedTextPreview = useMemo(() => getPreview(analysis?.extractedText), [analysis?.extractedText]);

  function selectFile(file: File | undefined) {
    if (!file) {
      return;
    }

    const validationError = getFileValidationError(file);

    if (validationError) {
      setSelectedFile(null);
      setErrorMessage(validationError);
      return;
    }

    setSelectedFile(file);
    setAnalysis(null);
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

  async function handleUpload() {
    if (!selectedFile) {
      setErrorMessage('Select a resume PDF before uploading.');
      return;
    }

    setIsUploading(true);
    setErrorMessage('');

    try {
      const uploadedAnalysis = await uploadResume(selectedFile);
      setAnalysis(uploadedAnalysis);
      setSelectedFile(null);
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

    try {
      const analyzedResume = await analyzeResume(analysis.id);
      setAnalysis(analyzedResume);
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error, 'Unable to analyze resume right now.'));
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase text-slate-500">PrepAI</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Resume Analyzer</h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              Upload a text-based PDF resume, extract its text, and request a structured AI analysis.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            PDF only, up to {MAX_FILE_SIZE_LABEL}
          </div>
        </div>
      </section>

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
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-white text-2xl shadow-sm" aria-hidden="true">
              PDF
            </div>
            <h2 className="mt-5 text-xl font-semibold text-slate-950">Drop your resume here</h2>
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

          {errorMessage ? (
            <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{errorMessage}</div>
          ) : null}

          <div className="mt-6 flex justify-end">
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

        <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Upload Status</h2>
          <div className="mt-4 space-y-4 text-sm">
            <div>
              <p className="font-medium text-slate-500">Status</p>
              <p className="mt-1 font-semibold capitalize text-slate-950">
                {isUploading ? 'uploading' : isAnalyzing ? 'analyzing' : analysis ? analysis.status : 'waiting for upload'}
              </p>
            </div>
            <div>
              <p className="font-medium text-slate-500">Accepted format</p>
              <p className="mt-1 text-slate-700">PDF, maximum {MAX_FILE_SIZE_LABEL}</p>
            </div>
            {analysis ? (
              <>
                <div>
                  <p className="font-medium text-slate-500">File name</p>
                  <p className="mt-1 break-words font-semibold text-slate-950">{analysis.fileName}</p>
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
      </section>

      {analysis ? (
        <section className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase text-emerald-700">Upload complete</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950">{analysis.fileName}</h2>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold capitalize text-emerald-700">{analysis.status}</span>
          </div>
          <div className="mt-5 flex justify-end">
            <button
              type="button"
              className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              onClick={handleAnalyze}
              disabled={isAnalyzing || analysis.status === 'processing'}
            >
              {isAnalyzing ? 'Analyzing...' : analysis.analysis ? 'Analyze again' : 'Analyze Resume'}
            </button>
          </div>
          <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-500">Extracted text preview</p>
            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">
              {extractedTextPreview || 'No preview available.'}
            </p>
          </div>
        </section>
      ) : null}

      {analysis?.analysis ? (
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase text-cyan-700">Temporary analysis results</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950">Structured Resume Analysis</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
              {[
                { label: 'Overall', score: analysis.analysis.overallScore },
                { label: 'ATS', score: analysis.analysis.atsScore },
                { label: 'Content', score: analysis.analysis.contentScore },
                { label: 'Formatting', score: analysis.analysis.formattingScore }
              ].map(({ label, score }) => (
                <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-950">{score}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              { title: 'Skills', items: analysis.analysis.skills },
              { title: 'Missing Skills', items: analysis.analysis.missingSkills },
              { title: 'Strengths', items: analysis.analysis.strengths },
              { title: 'Weaknesses', items: analysis.analysis.weaknesses },
              { title: 'Suggestions', items: analysis.analysis.suggestions }
            ].map(({ title, items }) => (
              <div key={title} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h3 className="font-semibold text-slate-950">{title}</h3>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
                  {items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 md:col-span-2">
              <h3 className="font-semibold text-slate-950">Summary</h3>
              <p className="mt-3 text-sm leading-6 text-slate-700">{analysis.analysis.summary}</p>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
