import { resumeAiAnalysisSchema, type ResumeAiAnalysis } from '../validators/resumeValidators.js';

const DEFAULT_OPENAI_BASE_URL = 'https://api.openai.com/v1';
const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini';
const DEFAULT_OLLAMA_BASE_URL = 'http://localhost:11434';
const DEFAULT_OLLAMA_MODEL = 'llama3.1:8b';
const DEFAULT_TIMEOUT_MS = 30000;
const DEFAULT_MAX_RESUME_CHARS = 12000;

type AiProviderName = 'openai' | 'ollama';

const analysisJsonSchema = {
  name: 'resume_analysis',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: [
      'overallScore',
      'atsScore',
      'contentScore',
      'formattingScore',
      'skills',
      'missingSkills',
      'strengths',
      'weaknesses',
      'suggestions',
      'summary'
    ],
    properties: {
      overallScore: { type: 'number', minimum: 0, maximum: 100 },
      atsScore: { type: 'number', minimum: 0, maximum: 100 },
      contentScore: { type: 'number', minimum: 0, maximum: 100 },
      formattingScore: { type: 'number', minimum: 0, maximum: 100 },
      skills: { type: 'array', items: { type: 'string' }, maxItems: 20 },
      missingSkills: { type: 'array', items: { type: 'string' }, maxItems: 20 },
      strengths: { type: 'array', items: { type: 'string' }, maxItems: 20 },
      weaknesses: { type: 'array', items: { type: 'string' }, maxItems: 20 },
      suggestions: { type: 'array', items: { type: 'string' }, maxItems: 20 },
      summary: { type: 'string', minLength: 20, maxLength: 1200 }
    }
  }
} as const;

type OpenAiChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
};

type OpenAiErrorResponse = {
  error?: {
    message?: unknown;
    type?: unknown;
    code?: unknown;
  };
};

type OllamaChatResponse = {
  message?: {
    content?: string;
  };
};

type OllamaErrorResponse = {
  error?: unknown;
};

type SafeOpenAiErrorDetails = {
  status: number;
  code?: string;
  type?: string;
  message?: string;
};

type SafeOllamaErrorDetails = {
  status?: number;
  type: 'connection' | 'http' | 'timeout' | 'unknown';
  message?: string;
};

type JsonSchemaDefinition = {
  name: string;
  strict: true;
  schema: unknown;
};

type AiJsonAnalysisRequest = {
  taskName: string;
  userPrompt: string;
  jsonSchema: JsonSchemaDefinition;
  openAiSystemPrompt: string;
  ollamaSystemPrompt: string;
};

type AiTextMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type AiTextRequest = {
  taskName: string;
  messages: AiTextMessage[];
};

type ResumeAiProvider = {
  name: AiProviderName;
  analyze(request: AiJsonAnalysisRequest): Promise<unknown>;
  generateText(request: AiTextRequest): Promise<string>;
};

function isDevelopmentDiagnosticsEnabled() {
  return process.env.NODE_ENV !== 'production';
}

function logAiDiagnostic(message: string, details: Record<string, unknown>) {
  if (!isDevelopmentDiagnosticsEnabled()) {
    return;
  }

  console.error(message, details);
}

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not configured`);
  }

  return value;
}

function getNumberEnv(name: string, fallback: number) {
  const value = process.env[name];
  const parsedValue = value ? Number(value) : fallback;
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
}

function getOpenAiUrl() {
  const baseUrl = process.env.OPENAI_BASE_URL ?? DEFAULT_OPENAI_BASE_URL;
  return `${baseUrl.replace(/\/$/, '')}/chat/completions`;
}

function getOllamaUrl() {
  const baseUrl = process.env.OLLAMA_BASE_URL ?? DEFAULT_OLLAMA_BASE_URL;
  return `${baseUrl.replace(/\/$/, '')}/api/chat`;
}

function toOptionalString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function sanitizeOpenAiMessage(message: unknown, apiKey: string) {
  const rawMessage = toOptionalString(message);

  if (!rawMessage) {
    return undefined;
  }

  return rawMessage
    .replace(apiKey, '[REDACTED_OPENAI_API_KEY]')
    .replace(/sk-[A-Za-z0-9_-]+/g, '[REDACTED_OPENAI_API_KEY]')
    .replace(/\s+/g, ' ')
    .slice(0, 500);
}

async function readSafeOpenAiErrorDetails(response: Response, apiKey: string): Promise<SafeOpenAiErrorDetails> {
  const details: SafeOpenAiErrorDetails = {
    status: response.status
  };

  try {
    const body = (await response.json()) as OpenAiErrorResponse;
    details.code = toOptionalString(body.error?.code);
    details.type = toOptionalString(body.error?.type);
    details.message = sanitizeOpenAiMessage(body.error?.message, apiKey);
  } catch {
    details.message = `OpenAI returned a non-JSON error response with status ${response.status}`;
  }

  return details;
}

function logSafeOpenAiError(taskName: string, details: SafeOpenAiErrorDetails) {
  logAiDiagnostic(`OpenAI ${taskName} request failed`, details);
}

function sanitizeOllamaMessage(message: unknown) {
  const rawMessage = toOptionalString(message);

  if (!rawMessage) {
    return undefined;
  }

  return rawMessage.replace(/\s+/g, ' ').slice(0, 500);
}

async function readSafeOllamaErrorDetails(response: Response): Promise<SafeOllamaErrorDetails> {
  const details: SafeOllamaErrorDetails = {
    status: response.status,
    type: 'http'
  };

  try {
    const body = (await response.json()) as OllamaErrorResponse;
    details.message = sanitizeOllamaMessage(body.error);
  } catch {
    details.message = `Ollama returned a non-JSON error response with status ${response.status}`;
  }

  return details;
}

function logSafeOllamaError(taskName: string, details: SafeOllamaErrorDetails) {
  logAiDiagnostic(`Ollama ${taskName} request failed`, details);
}

function logRawAiTextResponse(taskName: string, provider: AiProviderName, content: string) {
  logAiDiagnostic('AI provider raw text response received', {
    taskName,
    provider,
    contentLength: content.length,
    preview: content.replace(/\s+/g, ' ').slice(0, 300)
  });
}

function buildPrompt(resumeText: string) {
  const maxCharacters = getNumberEnv(
    'AI_RESUME_ANALYSIS_MAX_CHARS',
    getNumberEnv('OPENAI_RESUME_ANALYSIS_MAX_CHARS', DEFAULT_MAX_RESUME_CHARS)
  );
  const boundedResumeText = resumeText.slice(0, maxCharacters);

  return [
    'Evaluate this resume as a software engineering or technology resume.',
    'Return realistic scores from 0 to 100.',
    'Identify demonstrated technical and professional skills.',
    'Identify important missing or weak skills.',
    'Identify strengths and weaknesses.',
    'Provide specific actionable suggestions.',
    'Provide a concise professional summary.',
    'Do not include markdown, explanations, or fields outside the requested JSON schema.',
    '',
    'Resume text:',
    boundedResumeText
  ].join('\n');
}

function parseJsonContent(content: string | null | undefined, taskName: string, provider: AiProviderName) {
  const trimmedContent = content?.trim();

  if (!trimmedContent) {
    logAiDiagnostic('AI provider returned empty JSON content', {
      taskName,
      provider
    });
    throw new Error('AI provider returned an empty analysis response');
  }

  const jsonContent = trimmedContent
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  try {
    return JSON.parse(jsonContent) as unknown;
  } catch {
    logAiDiagnostic('AI provider returned malformed JSON content', {
      taskName,
      provider,
      contentLength: trimmedContent.length,
      preview: trimmedContent.replace(/\s+/g, ' ').slice(0, 300)
    });
    throw new Error('AI provider returned malformed analysis JSON');
  }
}

function parseOpenAiProviderContent(response: OpenAiChatCompletionResponse, taskName: string) {
  const content = response.choices?.[0]?.message?.content;
  return parseJsonContent(content, taskName, 'openai');
}

function parseOllamaProviderContent(response: OllamaChatResponse, taskName: string) {
  return parseJsonContent(response.message?.content, taskName, 'ollama');
}

async function analyzeWithOpenAi(request: AiJsonAnalysisRequest): Promise<unknown> {
  const apiKey = getRequiredEnv('OPENAI_API_KEY');
  const model = process.env.OPENAI_MODEL ?? DEFAULT_OPENAI_MODEL;
  const timeoutMs = getNumberEnv('OPENAI_REQUEST_TIMEOUT_MS', DEFAULT_TIMEOUT_MS);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(getOpenAiUrl(), {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content: request.openAiSystemPrompt
          },
          {
            role: 'user',
            content: request.userPrompt
          }
        ],
        response_format: {
          type: 'json_schema',
          json_schema: request.jsonSchema
        }
      })
    });

    logAiDiagnostic('AI provider HTTP response received', {
      taskName: request.taskName,
      provider: 'openai',
      status: response.status,
      model
    });

    if (!response.ok) {
      logSafeOpenAiError(request.taskName, await readSafeOpenAiErrorDetails(response, apiKey));
      throw new Error('AI provider request failed');
    }

    const providerResponse = (await response.json()) as OpenAiChatCompletionResponse;
    return parseOpenAiProviderContent(providerResponse, request.taskName);
  } finally {
    clearTimeout(timeout);
  }
}

async function generateTextWithOpenAi(request: AiTextRequest): Promise<string> {
  const apiKey = getRequiredEnv('OPENAI_API_KEY');
  const model = process.env.OPENAI_MODEL ?? DEFAULT_OPENAI_MODEL;
  const timeoutMs = getNumberEnv('OPENAI_REQUEST_TIMEOUT_MS', DEFAULT_TIMEOUT_MS);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(getOpenAiUrl(), {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        messages: request.messages
      })
    });

    logAiDiagnostic('AI provider HTTP response received', {
      taskName: request.taskName,
      provider: 'openai',
      status: response.status,
      model
    });

    if (!response.ok) {
      logSafeOpenAiError(request.taskName, await readSafeOpenAiErrorDetails(response, apiKey));
      throw new Error('AI provider request failed');
    }

    const providerResponse = (await response.json()) as OpenAiChatCompletionResponse;
    const content = providerResponse.choices?.[0]?.message?.content?.trim();

    if (!content) {
      logAiDiagnostic('AI provider returned empty text content', {
        taskName: request.taskName,
        provider: 'openai'
      });
      throw new Error('AI provider returned an empty text response');
    }

    logRawAiTextResponse(request.taskName, 'openai', content);
    return content;
  } finally {
    clearTimeout(timeout);
  }
}

async function analyzeWithOllama(request: AiJsonAnalysisRequest): Promise<unknown> {
  const model = process.env.OLLAMA_MODEL ?? DEFAULT_OLLAMA_MODEL;
  const timeoutMs = getNumberEnv('OLLAMA_REQUEST_TIMEOUT_MS', DEFAULT_TIMEOUT_MS);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(getOllamaUrl(), {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        stream: false,
        messages: [
          {
            role: 'system',
            content: request.ollamaSystemPrompt
          },
          {
            role: 'user',
            content: request.userPrompt
          }
        ],
        format: request.jsonSchema.schema,
        options: {
          temperature: 0.2
        }
      })
    });

    logAiDiagnostic('AI provider HTTP response received', {
      taskName: request.taskName,
      provider: 'ollama',
      status: response.status,
      model,
      baseUrl: process.env.OLLAMA_BASE_URL ?? DEFAULT_OLLAMA_BASE_URL
    });

    if (!response.ok) {
      logSafeOllamaError(request.taskName, await readSafeOllamaErrorDetails(response));
      throw new Error('AI provider request failed');
    }

    const providerResponse = (await response.json()) as OllamaChatResponse;
    return parseOllamaProviderContent(providerResponse, request.taskName);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      logSafeOllamaError(request.taskName, {
        type: 'timeout',
        message: `Ollama request timed out after ${timeoutMs}ms`
      });
      throw error;
    }

    if (error instanceof TypeError) {
      logSafeOllamaError(request.taskName, {
        type: 'connection',
        message: `Unable to connect to Ollama at ${process.env.OLLAMA_BASE_URL ?? DEFAULT_OLLAMA_BASE_URL}`
      });
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function generateTextWithOllama(request: AiTextRequest): Promise<string> {
  const model = process.env.OLLAMA_MODEL ?? DEFAULT_OLLAMA_MODEL;
  const timeoutMs = getNumberEnv('OLLAMA_REQUEST_TIMEOUT_MS', DEFAULT_TIMEOUT_MS);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(getOllamaUrl(), {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        stream: false,
        messages: request.messages,
        options: {
          temperature: 0.4
        }
      })
    });

    logAiDiagnostic('AI provider HTTP response received', {
      taskName: request.taskName,
      provider: 'ollama',
      status: response.status,
      model,
      baseUrl: process.env.OLLAMA_BASE_URL ?? DEFAULT_OLLAMA_BASE_URL
    });

    if (!response.ok) {
      logSafeOllamaError(request.taskName, await readSafeOllamaErrorDetails(response));
      throw new Error('AI provider request failed');
    }

    const providerResponse = (await response.json()) as OllamaChatResponse;
    const content = providerResponse.message?.content?.trim();

    if (!content) {
      logAiDiagnostic('AI provider returned empty text content', {
        taskName: request.taskName,
        provider: 'ollama'
      });
      throw new Error('AI provider returned an empty text response');
    }

    logRawAiTextResponse(request.taskName, 'ollama', content);
    return content;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      logSafeOllamaError(request.taskName, {
        type: 'timeout',
        message: `Ollama request timed out after ${timeoutMs}ms`
      });
      throw error;
    }

    if (error instanceof TypeError) {
      logSafeOllamaError(request.taskName, {
        type: 'connection',
        message: `Unable to connect to Ollama at ${process.env.OLLAMA_BASE_URL ?? DEFAULT_OLLAMA_BASE_URL}`
      });
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function getAiProvider(): ResumeAiProvider {
  const providerName = (process.env.AI_PROVIDER ?? 'openai').toLowerCase();

  if (providerName === 'ollama') {
    return {
      name: 'ollama',
      analyze: analyzeWithOllama,
      generateText: generateTextWithOllama
    };
  }

  if (providerName === 'openai') {
    return {
      name: 'openai',
      analyze: analyzeWithOpenAi,
      generateText: generateTextWithOpenAi
    };
  }

  throw new Error('AI_PROVIDER is not configured');
}

export async function analyzeResumeWithAi(resumeText: string): Promise<ResumeAiAnalysis> {
  try {
    const provider = getAiProvider();
    logAiDiagnostic('AI provider selected', {
      taskName: 'resume analysis',
      provider: provider.name
    });
    const parsedAnalysis = resumeAiAnalysisSchema.safeParse(
      await provider.analyze({
        taskName: 'resume analysis',
        userPrompt: buildPrompt(resumeText),
        jsonSchema: analysisJsonSchema,
        openAiSystemPrompt:
          'You are an expert technical recruiter and resume reviewer. Return only valid JSON that matches the provided schema.',
        ollamaSystemPrompt:
          'You are an expert technical recruiter and resume reviewer. Return only valid JSON with the requested fields. Do not include markdown.'
      })
    );

    if (!parsedAnalysis.success) {
      logAiDiagnostic('AI provider returned invalid resume analysis structure', {
        provider: provider.name,
        issueCount: parsedAnalysis.error.issues.length,
        issues: parsedAnalysis.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message
        }))
      });
      throw new Error('AI provider returned invalid analysis structure');
    }

    return parsedAnalysis.data;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('AI provider request timed out');
    }

    if (error instanceof Error && error.message.includes('not configured')) {
      throw error;
    }

    if (error instanceof Error && (error.message.includes('malformed') || error.message.includes('invalid analysis'))) {
      throw error;
    }

    throw new Error('Unable to analyze resume with the AI provider');
  }
}

export async function analyzeStructuredJsonWithAi(request: AiJsonAnalysisRequest): Promise<{
  provider: AiProviderName;
  result: unknown;
}> {
  try {
    const provider = getAiProvider();
    logAiDiagnostic('AI provider selected', {
      taskName: request.taskName,
      provider: provider.name
    });
    return {
      provider: provider.name,
      result: await provider.analyze(request)
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('AI provider request timed out');
    }

    if (error instanceof Error && error.message.includes('not configured')) {
      throw error;
    }

    if (error instanceof Error && (error.message.includes('malformed') || error.message.includes('invalid analysis'))) {
      throw error;
    }

    throw new Error('Unable to analyze with the AI provider');
  }
}

export async function generateTextWithAi(request: AiTextRequest): Promise<{
  provider: AiProviderName;
  content: string;
}> {
  try {
    const provider = getAiProvider();
    logAiDiagnostic('AI provider selected', {
      taskName: request.taskName,
      provider: provider.name
    });
    return {
      provider: provider.name,
      content: await provider.generateText(request)
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('AI provider request timed out');
    }

    if (error instanceof Error && error.message.includes('not configured')) {
      throw error;
    }

    throw new Error('Unable to generate text with the AI provider');
  }
}
