export type AptitudeDifficulty = 'Easy' | 'Medium' | 'Hard';

export type AptitudeCategory =
  | 'Quantitative Aptitude'
  | 'Logical Reasoning'
  | 'Verbal Ability'
  | 'Data Interpretation'
  | 'Number System'
  | 'Percentage'
  | 'Profit & Loss'
  | 'Time & Work'
  | 'Time, Speed & Distance'
  | 'Probability'
  | 'Permutation & Combination'
  | 'Blood Relations'
  | 'Coding-Decoding'
  | 'Seating Arrangement'
  | 'Puzzles';

export type AptitudeCompany =
  | 'Infosys'
  | 'TCS'
  | 'Wipro'
  | 'Accenture'
  | 'Cognizant'
  | 'Capgemini'
  | 'Deloitte'
  | 'EY'
  | 'Amazon'
  | 'Microsoft';

export type AptitudeQuestion = {
  id: number;
  title: string;
  difficulty: AptitudeDifficulty;
  category: AptitudeCategory;
  companies: AptitudeCompany[];
  estimatedTime: number;
  solved: boolean;
  question: string;
  options: {
    label: 'A' | 'B' | 'C' | 'D';
    value: string;
  }[];
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  shortcut: string;
};

export const aptitudeCategories: AptitudeCategory[] = [
  'Quantitative Aptitude',
  'Logical Reasoning',
  'Verbal Ability',
  'Data Interpretation',
  'Number System',
  'Percentage',
  'Profit & Loss',
  'Time & Work',
  'Time, Speed & Distance',
  'Probability',
  'Permutation & Combination',
  'Blood Relations',
  'Coding-Decoding',
  'Seating Arrangement',
  'Puzzles'
];

export const aptitudeCompanies: AptitudeCompany[] = [
  'Infosys',
  'TCS',
  'Wipro',
  'Accenture',
  'Cognizant',
  'Capgemini',
  'Deloitte',
  'EY',
  'Amazon',
  'Microsoft'
];

const difficultyCycle: AptitudeDifficulty[] = ['Easy', 'Medium', 'Hard', 'Medium'];

function getCompanies(index: number): AptitudeCompany[] {
  return [
    aptitudeCompanies[index % aptitudeCompanies.length],
    aptitudeCompanies[(index + 3) % aptitudeCompanies.length],
    aptitudeCompanies[(index + 6) % aptitudeCompanies.length]
  ];
}

function options(values: string[], correctAnswer: AptitudeQuestion['correctAnswer'] = 'B') {
  return values.map((value, index) => ({
    label: (['A', 'B', 'C', 'D'] as const)[index],
    value
  })).map((option) => ({ ...option, label: option.label }));
}

type BuilderInput = {
  id: number;
  variant: number;
  difficulty: AptitudeDifficulty;
  companies: AptitudeCompany[];
};

type QuestionTemplate = {
  category: AptitudeCategory;
  build: (input: BuilderInput) => Omit<AptitudeQuestion, 'id' | 'category' | 'difficulty' | 'companies' | 'solved'>;
};

const templates: QuestionTemplate[] = [
  {
    category: 'Percentage',
    build: ({ variant }) => {
      const base = 240 + variant * 20;
      const percent = 12 + variant;
      const answer = (base * percent) / 100;
      return {
        title: `${percent}% of ${base}`,
        estimatedTime: 3,
        question: `What is ${percent}% of ${base}?`,
        options: options([String(answer - 8), String(answer), String(answer + 12), String(answer + 20)]),
        correctAnswer: 'B',
        explanation: `${percent}% of ${base} = ${base} x ${percent} / 100 = ${answer}.`,
        shortcut: 'For percentages, divide by 100 first and then multiply by the percentage value.'
      };
    }
  },
  {
    category: 'Profit & Loss',
    build: ({ variant }) => {
      const cost = 500 + variant * 40;
      const profitPercent = 15 + variant;
      const selling = cost + (cost * profitPercent) / 100;
      return {
        title: `Selling price at ${profitPercent}% profit`,
        estimatedTime: 4,
        question: `An article costs Rs. ${cost}. At a profit of ${profitPercent}%, what is the selling price?`,
        options: options([`Rs. ${selling - 30}`, `Rs. ${selling}`, `Rs. ${selling + 25}`, `Rs. ${selling + 50}`]),
        correctAnswer: 'B',
        explanation: `Selling price = cost price x (100 + profit%) / 100 = ${cost} x ${100 + profitPercent} / 100 = ${selling}.`,
        shortcut: 'For profit, multiply cost price by 1 plus the profit rate.'
      };
    }
  },
  {
    category: 'Time & Work',
    build: ({ variant }) => {
      const aDays = 12 + variant;
      const bDays = 18 + variant;
      const combined = Math.round((aDays * bDays) / (aDays + bDays));
      return {
        title: `Combined work of two employees`,
        estimatedTime: 5,
        question: `A can complete a task in ${aDays} days and B can complete it in ${bDays} days. Approximately how many days will they take together?`,
        options: options([`${combined - 2} days`, `${combined} days`, `${combined + 3} days`, `${combined + 5} days`]),
        correctAnswer: 'B',
        explanation: `Combined time = AB / (A + B) = ${aDays} x ${bDays} / (${aDays} + ${bDays}), approximately ${combined} days.`,
        shortcut: 'For two workers, use product divided by sum when their individual times are known.'
      };
    }
  },
  {
    category: 'Time, Speed & Distance',
    build: ({ variant }) => {
      const speed = 45 + variant * 5;
      const time = 3 + (variant % 3);
      const distance = speed * time;
      return {
        title: `Distance covered at ${speed} km/h`,
        estimatedTime: 3,
        question: `A vehicle travels at ${speed} km/h for ${time} hours. What distance does it cover?`,
        options: options([`${distance - 20} km`, `${distance} km`, `${distance + 15} km`, `${distance + 30} km`]),
        correctAnswer: 'B',
        explanation: `Distance = speed x time = ${speed} x ${time} = ${distance} km.`,
        shortcut: 'Keep units consistent, then apply distance = speed x time.'
      };
    }
  },
  {
    category: 'Number System',
    build: ({ variant }) => {
      const number = 84 + variant * 6;
      const divisor = 6;
      const remainder = number % divisor;
      return {
        title: `Remainder when ${number} is divided by ${divisor}`,
        estimatedTime: 3,
        question: `What is the remainder when ${number} is divided by ${divisor}?`,
        options: options([String((remainder + 1) % divisor), String(remainder), String((remainder + 2) % divisor), String((remainder + 3) % divisor)]),
        correctAnswer: 'B',
        explanation: `${number} = ${Math.floor(number / divisor)} x ${divisor} + ${remainder}, so the remainder is ${remainder}.`,
        shortcut: 'Use the nearest lower multiple of the divisor and subtract it from the number.'
      };
    }
  },
  {
    category: 'Probability',
    build: ({ variant }) => {
      const red = 3 + variant;
      const blue = 5 + variant;
      const total = red + blue;
      return {
        title: `Probability of selecting a red ball`,
        estimatedTime: 4,
        question: `A bag has ${red} red balls and ${blue} blue balls. What is the probability of selecting a red ball?`,
        options: options([`${blue}/${total}`, `${red}/${total}`, `${red}/${blue}`, `${total}/${red}`]),
        correctAnswer: 'B',
        explanation: `Favorable outcomes are ${red}; total outcomes are ${total}. Probability = ${red}/${total}.`,
        shortcut: 'Probability is favorable outcomes divided by total outcomes.'
      };
    }
  },
  {
    category: 'Permutation & Combination',
    build: ({ variant }) => {
      const n = 5 + (variant % 4);
      const arrangements = Array.from({ length: n }, (_, index) => index + 1).reduce((product, value) => product * value, 1);
      return {
        title: `Arrangements of ${n} people`,
        estimatedTime: 5,
        question: `In how many ways can ${n} people stand in a line?`,
        options: options([String(arrangements / n), String(arrangements), String(arrangements * 2), String(arrangements + n)]),
        correctAnswer: 'B',
        explanation: `${n} distinct people can be arranged in ${n}! ways, which equals ${arrangements}.`,
        shortcut: 'For arranging all distinct items in a line, use factorial.'
      };
    }
  },
  {
    category: 'Logical Reasoning',
    build: ({ variant }) => {
      const start = 4 + variant;
      const step = 3 + (variant % 4);
      const fourth = start + step * 3;
      const fifth = start + step * 4;
      return {
        title: `Complete the arithmetic sequence`,
        estimatedTime: 3,
        question: `Find the missing term: ${start}, ${start + step}, ${start + step * 2}, ${fourth}, ?`,
        options: options([String(fifth - step), String(fifth), String(fifth + step), String(fifth + 2 * step)]),
        correctAnswer: 'B',
        explanation: `The sequence increases by ${step} each time, so the next term is ${fourth} + ${step} = ${fifth}.`,
        shortcut: 'Check whether consecutive differences are constant before trying complex patterns.'
      };
    }
  },
  {
    category: 'Blood Relations',
    build: ({ variant }) => ({
      title: `Identify the family relationship`,
      estimatedTime: 4,
      question: `Pointing to a woman, Ravi says, "She is the daughter of my mother's only son." How is the woman related to Ravi?`,
      options: options(['Sister', 'Daughter', 'Mother', 'Niece']),
      correctAnswer: 'B',
      explanation: `Ravi's mother's only son is Ravi himself, so the woman is Ravi's daughter.`,
      shortcut: 'Replace relationship phrases with names step by step.'
    })
  },
  {
    category: 'Coding-Decoding',
    build: ({ variant }) => {
      const shift = 2 + (variant % 4);
      return {
        title: `Decode a letter shifting pattern`,
        estimatedTime: 4,
        question: `If CAT is coded as ${String.fromCharCode(67 + shift)}${String.fromCharCode(65 + shift)}${String.fromCharCode(84 + shift)}, how is DOG coded using the same rule?`,
        options: options(['FQI', `${String.fromCharCode(68 + shift)}${String.fromCharCode(79 + shift)}${String.fromCharCode(71 + shift)}`, 'EPH', 'GRJ']),
        correctAnswer: 'B',
        explanation: `Each letter is shifted forward by ${shift} positions in the alphabet.`,
        shortcut: 'Find the shift from the sample word, then apply it letter by letter.'
      };
    }
  },
  {
    category: 'Seating Arrangement',
    build: ({ variant }) => ({
      title: `Linear seating position`,
      estimatedTime: 6,
      question: `A, B, C, D and E sit in a row. B is to the right of A, C is to the left of D, and E is at the right end. If D sits next to E, who sits in the middle?`,
      options: options(['A', 'C', 'B', 'D']),
      correctAnswer: 'B',
      explanation: `A valid arrangement is A-B-C-D-E. The middle position is occupied by C.`,
      shortcut: 'Place fixed endpoints first, then fill relative positions.'
    })
  },
  {
    category: 'Puzzles',
    build: ({ variant }) => ({
      title: `Find the heavier box`,
      estimatedTime: 7,
      question: `Four boxes A, B, C and D have different weights. A is heavier than B, C is heavier than A, and D is lighter than B. Which box is the heaviest?`,
      options: options(['A', 'C', 'B', 'D']),
      correctAnswer: 'B',
      explanation: `The order from heaviest to lightest is C, A, B, D. Therefore C is the heaviest.`,
      shortcut: 'Convert comparisons into an ordered chain.'
    })
  },
  {
    category: 'Verbal Ability',
    build: ({ variant }) => ({
      title: `Choose the correct synonym`,
      estimatedTime: 3,
      question: `Choose the word closest in meaning to "meticulous".`,
      options: options(['Careless', 'Careful', 'Rapid', 'Ordinary']),
      correctAnswer: 'B',
      explanation: `Meticulous means showing great attention to detail, which is closest to careful.`,
      shortcut: 'Use context: meticulous work is detailed and precise.'
    })
  },
  {
    category: 'Data Interpretation',
    build: ({ variant }) => {
      const q1 = 120 + variant * 10;
      const q2 = 150 + variant * 10;
      const increase = q2 - q1;
      const percent = Math.round((increase / q1) * 100);
      return {
        title: `Quarterly sales growth`,
        estimatedTime: 5,
        question: `A team sold ${q1} units in Q1 and ${q2} units in Q2. What is the approximate percentage increase?`,
        options: options([`${percent - 5}%`, `${percent}%`, `${percent + 5}%`, `${percent + 10}%`]),
        correctAnswer: 'B',
        explanation: `Increase = ${q2} - ${q1} = ${increase}. Percentage increase = ${increase}/${q1} x 100, approximately ${percent}%.`,
        shortcut: 'Percentage increase = change divided by original value, multiplied by 100.'
      };
    }
  },
  {
    category: 'Quantitative Aptitude',
    build: ({ variant }) => {
      const average = 60 + variant;
      const count = 5;
      const newValue = 70 + variant;
      const newAverage = Math.round((average * count + newValue) / (count + 1));
      return {
        title: `Average after adding one score`,
        estimatedTime: 4,
        question: `The average of ${count} scores is ${average}. If a new score of ${newValue} is added, what is the new approximate average?`,
        options: options([String(newAverage - 2), String(newAverage), String(newAverage + 2), String(newAverage + 4)]),
        correctAnswer: 'B',
        explanation: `Old total = ${average} x ${count}. New total = old total + ${newValue}; divide by ${count + 1}.`,
        shortcut: 'Convert averages back to totals before adding or removing values.'
      };
    }
  }
];

export const aptitudeQuestions: AptitudeQuestion[] = Array.from({ length: 100 }, (_, index) => {
  const template = templates[index % templates.length];
  const variant = Math.floor(index / templates.length) + 1;
  const difficulty = difficultyCycle[index % difficultyCycle.length];
  const companies = getCompanies(index);
  const builtQuestion = template.build({
    id: index + 1,
    variant,
    difficulty,
    companies
  });

  return {
    id: index + 1,
    category: template.category,
    difficulty,
    companies,
    solved: index % 9 === 0,
    ...builtQuestion
  };
});
