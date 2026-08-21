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
  statement?: string;
  examples?: string[];
  constraints?: string[];
  starterCode?: {
    java: string;
    python: string;
    cpp: string;
    javascript: string;
  };
  functionName?: string;
  testCases?: Array<{
    name: string;
    input: string;
    expectedOutput: string;
    isHidden: boolean;
  }>;
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
    estimatedTime: question.estimatedTime,
    ...('topic' in question ? createDsaExecutionMetadata(question) : {})
  }));
}

function toCamelCaseTitle(title: string) {
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

function createGenericStarterCode(functionName: string) {
  return {
    java: `class Solution {
    public String ${functionName}(String input) {
        // Write your solution here
        return input;
    }
}`,
    python: `class Solution:
    def ${functionName}(self, input):
        # Write your solution here
        return input`,
    cpp: `class Solution {
public:
    string ${functionName}(string input) {
        // Write your solution here
        return input;
    }
};`,
    javascript: `function ${functionName}(input) {
    // Write your solution here
    return input;
}`
  };
}

function createTwoSumMetadata(question: DsaQuestion) {
  return {
    statement:
      'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume each input has exactly one solution, and you may not use the same element twice.',
    examples: ['Input: nums = [2,7,11,15], target = 9. Output: [0,1]', 'Input: nums = [3,2,4], target = 6. Output: [1,2]'],
    constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9', '-10^9 <= target <= 10^9', 'Exactly one valid answer exists.'],
    functionName: 'twoSum',
    starterCode: {
      java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Write your solution here
        return new int[0];
    }
}`,
      python: `class Solution:
    def twoSum(self, nums, target):
        # Write your solution here
        pass`,
      cpp: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Write your solution here
        return {};
    }
};`,
      javascript: `function twoSum(nums, target) {
    // Write your solution here
}`
    },
    testCases: [
      { name: 'Test Case 1', input: JSON.stringify({ nums: [2, 7, 11, 15], target: 9 }), expectedOutput: JSON.stringify([0, 1]), isHidden: false },
      { name: 'Test Case 2', input: JSON.stringify({ nums: [3, 2, 4], target: 6 }), expectedOutput: JSON.stringify([1, 2]), isHidden: false },
      { name: 'Test Case 3', input: JSON.stringify({ nums: [3, 3], target: 6 }), expectedOutput: JSON.stringify([0, 1]), isHidden: false },
      { name: 'Hidden Test Case 1', input: JSON.stringify({ nums: [1, 5, 3, 7], target: 8 }), expectedOutput: JSON.stringify([1, 2]), isHidden: true },
      { name: 'Hidden Test Case 2', input: JSON.stringify({ nums: [-3, 4, 3, 90], target: 0 }), expectedOutput: JSON.stringify([0, 2]), isHidden: true },
      { name: 'Hidden Test Case 3', input: JSON.stringify({ nums: [0, 4, 3, 0], target: 0 }), expectedOutput: JSON.stringify([0, 3]), isHidden: true }
    ]
  };
}

function createDsaExecutionMetadata(question: DsaQuestion) {
  if (question.title === 'Two Sum') {
    return createTwoSumMetadata(question);
  }

  const functionName = toCamelCaseTitle(question.title) || 'solve';

  return {
    statement: `Solve ${question.title} using an efficient algorithm for the ${question.topic} pattern.`,
    examples: ['Input: "sample". Output: "sample"'],
    constraints: ['Use the function signature provided in the starter code.', 'Return the computed answer rather than printing it.'],
    functionName,
    starterCode: createGenericStarterCode(functionName),
    testCases: [
      { name: 'Test Case 1', input: JSON.stringify({ input: 'sample' }), expectedOutput: JSON.stringify('sample'), isHidden: false },
      { name: 'Test Case 2', input: JSON.stringify({ input: question.topic }), expectedOutput: JSON.stringify(question.topic), isHidden: false },
      { name: 'Hidden Test Case 1', input: JSON.stringify({ input: question.title }), expectedOutput: JSON.stringify(question.title), isHidden: true }
    ]
  };
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
        update:
          question.module === 'DSA'
            ? {
                $setOnInsert: {
                  questionId: question.questionId,
                  module: question.module,
                  title: question.title,
                  difficulty: question.difficulty,
                  category: question.category,
                  companies: question.companies,
                  estimatedTime: question.estimatedTime
                },
                $set: {
                  statement: question.statement,
                  examples: question.examples,
                  constraints: question.constraints,
                  starterCode: question.starterCode,
                  functionName: question.functionName,
                  testCases: question.testCases
                }
              }
            : {
                $setOnInsert: question
              },
        upsert: true,
        ...(question.module === 'DSA' ? {} : { timestamps: false })
      }
    })),
    { ordered: false }
  );

  const totalQuestions = await Question.countDocuments();
  const enrichedDsaQuestionCount = await Question.countDocuments({
    module: 'DSA',
    statement: { $ne: '' },
    examples: { $not: { $size: 0 } },
    constraints: { $not: { $size: 0 } },
    starterCode: { $exists: true },
    functionName: { $ne: '' },
    testCases: { $not: { $size: 0 } }
  });
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
  console.log(`Matched ${result.matchedCount} existing questions.`);
  console.log(`Modified ${result.modifiedCount} existing questions.`);
  console.log(`Enriched DSA questions: ${enrichedDsaQuestionCount}.`);
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
