import '../src/config/env.js';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { connectDatabase } from '../src/config/database.js';
import { Question, questionDifficulties, questionModules } from '../src/models/Question.js';
import { aptitudeQuestions } from '../../client/src/data/aptitudeQuestions.ts';
import { sqlQuestions } from '../../client/src/data/sqlQuestions.ts';

type QuestionModule = (typeof questionModules)[number];
type QuestionDifficulty = (typeof questionDifficulties)[number];

type SeedQuestion = {
  questionId: number;
  module: QuestionModule;
  title: string;
  difficulty: QuestionDifficulty;
  category: string;
  companies: string[];
  estimatedTime: number;
};

type DsaQuestion = {
  id: number;
  title: string;
  difficulty: QuestionDifficulty;
  topic: string;
  companies: string[];
  estimatedTime: number;
};

const scriptDir = dirname(fileURLToPath(import.meta.url));
const dsaPracticePath = resolve(scriptDir, '../../client/src/pages/DsaPractice.tsx');

function findMatchingBracket(source: string, openBracketIndex: number) {
  let depth = 0;
  let quote: '"' | "'" | '`' | null = null;
  let escaped = false;

  for (let index = openBracketIndex; index < source.length; index += 1) {
    const character = source[index];

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (character === '\\') {
        escaped = true;
      } else if (character === quote) {
        quote = null;
      }

      continue;
    }

    if (character === '"' || character === "'" || character === '`') {
      quote = character;
      continue;
    }

    if (character === '[') {
      depth += 1;
    } else if (character === ']') {
      depth -= 1;

      if (depth === 0) {
        return index;
      }
    }
  }

  throw new Error('Could not find the end of the DSA questions array');
}

async function loadDsaQuestions() {
  const source = await readFile(dsaPracticePath, 'utf8');
  const declarationIndex = source.indexOf('const dsaQuestions');

  if (declarationIndex === -1) {
    throw new Error('Could not find dsaQuestions in DsaPractice.tsx');
  }

  const assignmentIndex = source.indexOf('=', declarationIndex);

  if (assignmentIndex === -1) {
    throw new Error('Could not find the DSA questions assignment');
  }

  const arrayStart = source.indexOf('[', assignmentIndex);

  if (arrayStart === -1) {
    throw new Error('Could not find the DSA questions array start');
  }

  const arrayEnd = findMatchingBracket(source, arrayStart);
  const arrayLiteral = source.slice(arrayStart, arrayEnd + 1);
  const questions = Function(`"use strict"; return (${arrayLiteral});`)() as DsaQuestion[];

  if (!Array.isArray(questions)) {
    throw new Error('DSA questions did not evaluate to an array');
  }

  return questions;
}

function toSeedQuestions(module: 'DSA', questions: DsaQuestion[]): SeedQuestion[];
function toSeedQuestions(module: 'SQL', questions: typeof sqlQuestions): SeedQuestion[];
function toSeedQuestions(module: 'Aptitude', questions: typeof aptitudeQuestions): SeedQuestion[];
function toSeedQuestions(
  module: QuestionModule,
  questions: DsaQuestion[] | typeof sqlQuestions | typeof aptitudeQuestions
): SeedQuestion[] {
  return questions.map((question) => ({
    questionId: question.id,
    module,
    title: question.title,
    difficulty: question.difficulty,
    category: 'topic' in question ? question.topic : question.category,
    companies: question.companies,
    estimatedTime: question.estimatedTime
  }));
}

function assertNoDuplicateSeedKeys(questions: SeedQuestion[]) {
  const seenKeys = new Set<string>();

  for (const question of questions) {
    const key = `${question.module}:${question.questionId}`;

    if (seenKeys.has(key)) {
      throw new Error(`Duplicate seed question key found: ${key}`);
    }

    seenKeys.add(key);
  }
}

async function seedQuestions() {
  const dsaQuestions = await loadDsaQuestions();
  const questions = [
    ...toSeedQuestions('DSA', dsaQuestions),
    ...toSeedQuestions('SQL', sqlQuestions),
    ...toSeedQuestions('Aptitude', aptitudeQuestions)
  ];

  assertNoDuplicateSeedKeys(questions);

  await connectDatabase();
  await Question.init();

  const result = await Question.bulkWrite(
    questions.map((question) => ({
      updateOne: {
        filter: {
          module: question.module,
          questionId: question.questionId
        },
        update: {
          $setOnInsert: question
        },
        upsert: true
      }
    })),
    { ordered: false }
  );

  const totalQuestions = await Question.countDocuments();
  const moduleCounts = await Question.aggregate<{ _id: QuestionModule; count: number }>([
    {
      $group: {
        _id: '$module',
        count: { $sum: 1 }
      }
    },
    {
      $sort: {
        _id: 1
      }
    }
  ]);

  console.log(`Prepared ${questions.length} seed questions.`);
  console.log(`Inserted ${result.upsertedCount} new questions.`);
  console.log(`Question collection now has ${totalQuestions} questions.`);
  console.table(moduleCounts.map(({ _id, count }) => ({ module: _id, count })));
}

seedQuestions()
  .catch((error: unknown) => {
    console.error('Question seed failed');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
