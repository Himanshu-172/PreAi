import { execFile } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import type { codeLanguageSchema } from '../validators/practiceValidators.js';
import type { z } from 'zod';

type CodeLanguage = z.infer<typeof codeLanguageSchema>;

export type CodeExecutionTestCase = {
  id: string;
  name: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
};

export type CodeExecutionTestResult = {
  id: string;
  name: string;
  status: 'passed' | 'failed' | 'error' | 'timeout';
  input?: string;
  expectedOutput?: string;
  actualOutput?: string;
  error?: string;
  hidden: boolean;
};

export type CodeExecutionResult = {
  status: 'accepted' | 'wrong_answer' | 'runtime_error' | 'compilation_error' | 'time_limit_exceeded' | 'execution_error';
  passedCount: number;
  totalCount: number;
  runtimeMs: number;
  stdout: string;
  stderr: string;
  testResults: CodeExecutionTestResult[];
};

type ExecuteCodeOptions = {
  language: CodeLanguage;
  code: string;
  functionName: string;
  testCases: CodeExecutionTestCase[];
  hideHiddenDetails?: boolean;
};

type ProcessResult = {
  stdout: string;
  stderr: string;
  timedOut: boolean;
  exitCode: number | null;
  runtimeMs: number;
};

const execFileAsync = promisify(execFile);
const EXECUTION_TIMEOUT_MS = 5000;
const MAX_OUTPUT_BYTES = 20000;
const RESULT_MARKER = '__PREPAI_RESULT__';

function safeEnvironment() {
  return {
    PATH: '/usr/bin:/bin:/usr/local/bin',
    HOME: tmpdir(),
    TMPDIR: tmpdir()
  };
}

function truncateOutput(output: string) {
  return output.length > MAX_OUTPUT_BYTES ? `${output.slice(0, MAX_OUTPUT_BYTES)}\n[output truncated]` : output;
}

async function runCommand(command: string, args: string[], cwd: string): Promise<ProcessResult> {
  const startedAt = Date.now();

  try {
    const result = await execFileAsync(command, args, {
      cwd,
      env: safeEnvironment(),
      timeout: EXECUTION_TIMEOUT_MS,
      maxBuffer: MAX_OUTPUT_BYTES,
      windowsHide: true
    });

    return {
      stdout: truncateOutput(result.stdout),
      stderr: truncateOutput(result.stderr),
      timedOut: false,
      exitCode: 0,
      runtimeMs: Date.now() - startedAt
    };
  } catch (error) {
    const execError = error as NodeJS.ErrnoException & {
      stdout?: string;
      stderr?: string;
      killed?: boolean;
      signal?: string;
      code?: number | string;
    };

    return {
      stdout: truncateOutput(execError.stdout ?? ''),
      stderr: truncateOutput(execError.stderr ?? execError.message),
      timedOut: Boolean(execError.killed || execError.signal === 'SIGTERM'),
      exitCode: typeof execError.code === 'number' ? execError.code : null,
      runtimeMs: Date.now() - startedAt
    };
  }
}

function normalizeOutput(value: string) {
  const trimmed = value.trim();

  try {
    return JSON.stringify(JSON.parse(trimmed));
  } catch {
    return trimmed.replace(/\s+/g, ' ');
  }
}

function redactResult(result: CodeExecutionTestResult, hideHiddenDetails: boolean) {
  if (!hideHiddenDetails || !result.hidden) {
    return result;
  }

  return {
    id: result.id,
    name: result.name,
    status: result.status,
    hidden: true,
    error: result.error ? 'Hidden test failed.' : undefined
  };
}

function buildTestResults(testCases: CodeExecutionTestCase[], outputs: Array<{ output?: unknown; error?: string }>, hideHiddenDetails: boolean) {
  return testCases.map((testCase, index) => {
    const output = outputs[index];
    const actualOutput = output?.output === undefined ? '' : JSON.stringify(output.output);
    const passed = !output?.error && normalizeOutput(actualOutput) === normalizeOutput(testCase.expectedOutput);
    const result: CodeExecutionTestResult = {
      id: testCase.id,
      name: testCase.name,
      status: output?.error ? 'error' : passed ? 'passed' : 'failed',
      input: testCase.input,
      expectedOutput: testCase.expectedOutput,
      actualOutput,
      error: output?.error,
      hidden: testCase.isHidden
    };

    return redactResult(result, hideHiddenDetails);
  });
}

function summarize(testResults: CodeExecutionTestResult[], processResult: ProcessResult): CodeExecutionResult {
  const passedCount = testResults.filter((testResult) => testResult.status === 'passed').length;
  const firstFailure = testResults.find((testResult) => testResult.status !== 'passed');

  return {
    status: processResult.timedOut
      ? 'time_limit_exceeded'
      : !firstFailure
        ? 'accepted'
        : firstFailure.status === 'failed'
          ? 'wrong_answer'
          : 'runtime_error',
    passedCount,
    totalCount: testResults.length,
    runtimeMs: processResult.runtimeMs,
    stdout: processResult.stdout,
    stderr: processResult.stderr,
    testResults
  };
}

function parseMarkedJson(stdout: string) {
  const markerIndex = stdout.lastIndexOf(RESULT_MARKER);

  if (markerIndex === -1) {
    return [];
  }

  const jsonText = stdout.slice(markerIndex + RESULT_MARKER.length).trim();
  return JSON.parse(jsonText) as Array<{ output?: unknown; error?: string }>;
}

async function executeJavaScript(options: ExecuteCodeOptions, cwd: string) {
  const filePath = path.join(cwd, 'solution.js');
  const runner = `
${options.code}
const tests = ${JSON.stringify(options.testCases.map((testCase) => JSON.parse(testCase.input)))};
const results = [];
for (const input of tests) {
  try {
    const fn = typeof ${options.functionName} === 'function' ? ${options.functionName} : null;
    if (!fn) throw new Error('Function ${options.functionName} was not found');
    results.push({ output: fn(...Object.values(input)) });
  } catch (error) {
    results.push({ error: error instanceof Error ? error.message : String(error) });
  }
}
console.log('${RESULT_MARKER}' + JSON.stringify(results));
`;
  await writeFile(filePath, runner, 'utf8');
  return runCommand('node', [filePath], cwd);
}

async function executePython(options: ExecuteCodeOptions, cwd: string) {
  const filePath = path.join(cwd, 'solution.py');
  const runner = `
${options.code}
import json
tests = ${JSON.stringify(options.testCases.map((testCase) => JSON.parse(testCase.input)))}
results = []
for item in tests:
    try:
        target = globals().get('${options.functionName}')
        if target is None and 'Solution' in globals():
            target = getattr(Solution(), '${options.functionName}', None)
        if target is None:
            raise Exception('Function ${options.functionName} was not found')
        results.append({'output': target(*list(item.values()))})
    except Exception as error:
        results.append({'error': str(error)})
print('${RESULT_MARKER}' + json.dumps(results))
`;
  await writeFile(filePath, runner, 'utf8');
  return runCommand('python3', [filePath], cwd);
}

function getRunnerShape(options: ExecuteCodeOptions) {
  const isTwoSum = options.functionName === 'twoSum' && options.testCases.every((testCase) => {
    const input = JSON.parse(testCase.input);
    return Array.isArray(input.nums) && typeof input.target === 'number';
  });

  if (isTwoSum) {
    return 'twoSum';
  }

  const isStringInput = options.testCases.every((testCase) => {
    const input = JSON.parse(testCase.input);
    return typeof input.input === 'string';
  });

  if (isStringInput) {
    return 'stringInput';
  }

  throw new Error('This local runner does not support the typed input shape for this question yet.');
}

async function executeJava(options: ExecuteCodeOptions, cwd: string) {
  const runnerShape = getRunnerShape(options);

  const filePath = path.join(cwd, 'Main.java');
  const tests = options.testCases.map((testCase) => JSON.parse(testCase.input));
  const invocation =
    runnerShape === 'twoSum'
      ? `
    int[][] nums = new int[][] { ${tests.map((test) => `{${(test.nums as number[]).join(',')}}`).join(',')} };
    int[] targets = new int[] { ${tests.map((test) => test.target as number).join(',')} };
    for (int index = 0; index < nums.length; index++) {
      try {
        int[] output = solution.${options.functionName}(nums[index], targets[index]);
        results.add("{\\"output\\":" + toJson(output) + "}");
      } catch (Exception error) {
        results.add("{\\"error\\":\\"" + escapeJson(error.getMessage()) + "\\"}");
      }
    }`
      : `
    String[] inputs = new String[] { ${tests.map((test) => `"${String(test.input).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`).join(',')} };
    for (String input : inputs) {
      try {
        String output = solution.${options.functionName}(input);
        results.add("{\\"output\\":\\"" + escapeJson(output) + "\\"}");
      } catch (Exception error) {
        results.add("{\\"error\\":\\"" + escapeJson(error.getMessage()) + "\\"}");
      }
    }`;
  const runner = `
import java.util.*;
${options.code}
public class Main {
  private static String toJson(int[] values) {
    return Arrays.toString(values).replace(" ", "");
  }
  private static String escapeJson(String value) {
    if (value == null) return "";
    return value.replace("\\\\", "\\\\\\\\").replace("\\"", "\\\\\\"");
  }

  public static void main(String[] args) {
    List<String> results = new ArrayList<>();
    Solution solution = new Solution();
${invocation}
    System.out.println("${RESULT_MARKER}[" + String.join(",", results) + "]");
  }
}
`;
  await writeFile(filePath, runner, 'utf8');
  const compileResult = await runCommand('javac', [filePath], cwd);

  if (compileResult.exitCode !== 0 || compileResult.timedOut) {
    return compileResult;
  }

  return runCommand('java', ['-cp', cwd, 'Main'], cwd);
}

async function executeCpp(options: ExecuteCodeOptions, cwd: string) {
  const runnerShape = getRunnerShape(options);

  const sourcePath = path.join(cwd, 'solution.cpp');
  const binaryPath = path.join(cwd, 'solution');
  const tests = options.testCases.map((testCase) => JSON.parse(testCase.input));
  const invocation =
    runnerShape === 'twoSum'
      ? `
  vector<vector<int>> nums = { ${tests.map((test) => `{${(test.nums as number[]).join(',')}}`).join(',')} };
  vector<int> targets = { ${tests.map((test) => test.target as number).join(',')} };
  for (size_t index = 0; index < nums.size(); ++index) {
    try {
      vector<int> output = solution.${options.functionName}(nums[index], targets[index]);
      results.push_back("{\\"output\\":" + toJson(output) + "}");
    } catch (const exception& error) {
      results.push_back("{\\"error\\":\\"" + escapeJson(error.what()) + "\\"}");
    }
  }`
      : `
  vector<string> inputs = { ${tests.map((test) => `"${String(test.input).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`).join(',')} };
  for (const string& input : inputs) {
    try {
      string output = solution.${options.functionName}(input);
      results.push_back("{\\"output\\":\\"" + escapeJson(output) + "\\"}");
    } catch (const exception& error) {
      results.push_back("{\\"error\\":\\"" + escapeJson(error.what()) + "\\"}");
    }
  }`;
  const runner = `
#include <exception>
#include <iostream>
#include <string>
#include <unordered_map>
#include <vector>
using namespace std;
${options.code}
static string toJson(const vector<int>& values) {
  string output = "[";
  for (size_t index = 0; index < values.size(); ++index) {
    if (index > 0) output += ",";
    output += to_string(values[index]);
  }
  output += "]";
  return output;
}
static string escapeJson(const string& value) {
  string output;
  for (char item : value) {
    if (item == '\\\\') output += "\\\\\\\\";
    else if (item == '"') output += "\\\\\\"";
    else output += item;
  }
  return output;
}
int main() {
  vector<string> results;
  Solution solution;
${invocation}
  cout << "${RESULT_MARKER}[";
  for (size_t index = 0; index < results.size(); ++index) {
    if (index > 0) cout << ",";
    cout << results[index];
  }
  cout << "]" << endl;
  return 0;
}
`;
  await writeFile(sourcePath, runner, 'utf8');
  const compileResult = await runCommand('g++', ['-std=c++17', sourcePath, '-o', binaryPath], cwd);

  if (compileResult.exitCode !== 0 || compileResult.timedOut) {
    return compileResult;
  }

  return runCommand(binaryPath, [], cwd);
}

export async function executeQuestionCode(options: ExecuteCodeOptions): Promise<CodeExecutionResult> {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'prepai-code-'));

  try {
    let processResult: ProcessResult;

    try {
      if (options.language === 'javascript') {
        processResult = await executeJavaScript(options, tempDirectory);
      } else if (options.language === 'python') {
        processResult = await executePython(options, tempDirectory);
      } else if (options.language === 'java') {
        processResult = await executeJava(options, tempDirectory);
      } else {
        processResult = await executeCpp(options, tempDirectory);
      }
    } catch (error) {
      return {
        status: 'execution_error',
        passedCount: 0,
        totalCount: options.testCases.length,
        runtimeMs: 0,
        stdout: '',
        stderr: error instanceof Error ? error.message : 'Unable to execute code.',
        testResults: options.testCases.map((testCase) =>
          redactResult(
            {
              id: testCase.id,
              name: testCase.name,
              status: 'error',
              input: testCase.input,
              expectedOutput: testCase.expectedOutput,
              actualOutput: '',
              error: error instanceof Error ? error.message : 'Unable to execute code.',
              hidden: testCase.isHidden
            },
            Boolean(options.hideHiddenDetails)
          )
        )
      };
    }

    if (processResult.timedOut) {
      const timeoutResults = options.testCases.map((testCase) =>
        redactResult(
          {
            id: testCase.id,
            name: testCase.name,
            status: 'timeout' as const,
            input: testCase.input,
            expectedOutput: testCase.expectedOutput,
            actualOutput: '',
            error: `Execution exceeded ${EXECUTION_TIMEOUT_MS / 1000} seconds.`,
            hidden: testCase.isHidden
          },
          Boolean(options.hideHiddenDetails)
        )
      );

      return {
        status: 'time_limit_exceeded',
        passedCount: 0,
        totalCount: options.testCases.length,
        runtimeMs: processResult.runtimeMs,
        stdout: processResult.stdout,
        stderr: processResult.stderr,
        testResults: timeoutResults
      };
    }

    if (processResult.exitCode !== 0) {
      return {
        status: options.language === 'java' || options.language === 'cpp' ? 'compilation_error' : 'runtime_error',
        passedCount: 0,
        totalCount: options.testCases.length,
        runtimeMs: processResult.runtimeMs,
        stdout: processResult.stdout,
        stderr: processResult.stderr,
        testResults: options.testCases.map((testCase) =>
          redactResult(
            {
              id: testCase.id,
              name: testCase.name,
              status: 'error',
              input: testCase.input,
              expectedOutput: testCase.expectedOutput,
              actualOutput: '',
              error: processResult.stderr || 'Execution failed.',
              hidden: testCase.isHidden
            },
            Boolean(options.hideHiddenDetails)
          )
        )
      };
    }

    const outputs = parseMarkedJson(processResult.stdout);
    const testResults = buildTestResults(options.testCases, outputs, Boolean(options.hideHiddenDetails));
    return summarize(testResults, {
      ...processResult,
      stdout: options.hideHiddenDetails ? '' : processResult.stdout
    });
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
}
