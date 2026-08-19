import '../src/config/env.js';
import mongoose from 'mongoose';
import { connectDatabase } from '../src/config/database.js';
import { Question, questionDifficulties, questionModules } from '../src/models/Question.js';
import { aptitudeQuestions } from '../../client/src/data/aptitudeQuestions.ts';
import { dsaQuestions } from '../../client/src/data/dsaQuestions.ts';
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
