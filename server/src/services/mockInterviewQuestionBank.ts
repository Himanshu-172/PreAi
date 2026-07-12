type QuestionDifficulty = 'Easy' | 'Medium' | 'Hard';

export type StaticInterviewQuestion = {
  sourceKey: string;
  category: 'HR' | 'General CS';
  difficulty: QuestionDifficulty;
  questionText: string;
};

export const hrInterviewQuestions: StaticInterviewQuestion[] = [
  {
    sourceKey: 'hr-easy-1',
    category: 'HR',
    difficulty: 'Easy',
    questionText: 'Tell me about yourself and the kind of role you are looking for.'
  },
  {
    sourceKey: 'hr-easy-2',
    category: 'HR',
    difficulty: 'Easy',
    questionText: 'Why are you interested in this company or role?'
  },
  {
    sourceKey: 'hr-easy-3',
    category: 'HR',
    difficulty: 'Easy',
    questionText: 'Describe one strength that helps you work well in a team.'
  },
  {
    sourceKey: 'hr-medium-1',
    category: 'HR',
    difficulty: 'Medium',
    questionText: 'Tell me about a time you handled a disagreement with a teammate.'
  },
  {
    sourceKey: 'hr-medium-2',
    category: 'HR',
    difficulty: 'Medium',
    questionText: 'Describe a project where you had to learn something quickly to succeed.'
  },
  {
    sourceKey: 'hr-medium-3',
    category: 'HR',
    difficulty: 'Medium',
    questionText: 'How do you prioritize tasks when multiple deadlines are close?'
  },
  {
    sourceKey: 'hr-hard-1',
    category: 'HR',
    difficulty: 'Hard',
    questionText: 'Tell me about a failure, what you learned, and what you changed afterward.'
  },
  {
    sourceKey: 'hr-hard-2',
    category: 'HR',
    difficulty: 'Hard',
    questionText: 'Describe a situation where you influenced a decision without formal authority.'
  },
  {
    sourceKey: 'hr-hard-3',
    category: 'HR',
    difficulty: 'Hard',
    questionText: 'How would you handle joining a team where expectations are unclear and delivery pressure is high?'
  },
  {
    sourceKey: 'hr-medium-4',
    category: 'HR',
    difficulty: 'Medium',
    questionText: 'What feedback have you received recently, and how did you act on it?'
  }
];

export const generalCsInterviewQuestions: StaticInterviewQuestion[] = [
  {
    sourceKey: 'cs-easy-1',
    category: 'General CS',
    difficulty: 'Easy',
    questionText: 'Explain the difference between a process and a thread.'
  },
  {
    sourceKey: 'cs-easy-2',
    category: 'General CS',
    difficulty: 'Easy',
    questionText: 'What is an index in a database, and why can it improve query performance?'
  },
  {
    sourceKey: 'cs-easy-3',
    category: 'General CS',
    difficulty: 'Easy',
    questionText: 'What happens when you type a URL in a browser and press Enter?'
  },
  {
    sourceKey: 'cs-medium-1',
    category: 'General CS',
    difficulty: 'Medium',
    questionText: 'Compare TCP and UDP, including when you would choose each one.'
  },
  {
    sourceKey: 'cs-medium-2',
    category: 'General CS',
    difficulty: 'Medium',
    questionText: 'Explain normalization in relational databases and one tradeoff it introduces.'
  },
  {
    sourceKey: 'cs-medium-3',
    category: 'General CS',
    difficulty: 'Medium',
    questionText: 'How does caching improve system performance, and what invalidation risks does it create?'
  },
  {
    sourceKey: 'cs-hard-1',
    category: 'General CS',
    difficulty: 'Hard',
    questionText: 'Design a high-level approach for rate limiting an API used by millions of users.'
  },
  {
    sourceKey: 'cs-hard-2',
    category: 'General CS',
    difficulty: 'Hard',
    questionText: 'Explain how you would investigate a production latency spike in a distributed service.'
  },
  {
    sourceKey: 'cs-hard-3',
    category: 'General CS',
    difficulty: 'Hard',
    questionText: 'Describe consistency, availability, and partition tolerance tradeoffs in distributed systems.'
  },
  {
    sourceKey: 'cs-medium-4',
    category: 'General CS',
    difficulty: 'Medium',
    questionText: 'What is the difference between horizontal and vertical scaling?'
  }
];
