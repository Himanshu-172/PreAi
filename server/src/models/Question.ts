import mongoose, { Schema, type InferSchemaType } from 'mongoose';

export const questionModules = ['DSA', 'SQL', 'Aptitude'] as const;
export const questionDifficulties = ['Easy', 'Medium', 'Hard'] as const;
export const codeLanguages = ['java', 'python', 'cpp', 'javascript'] as const;

const starterCodeSchema = new Schema(
  {
    java: {
      type: String,
      default: ''
    },
    python: {
      type: String,
      default: ''
    },
    cpp: {
      type: String,
      default: ''
    },
    javascript: {
      type: String,
      default: ''
    }
  },
  {
    _id: false
  }
);

const testCaseSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    input: {
      type: String,
      required: true
    },
    expectedOutput: {
      type: String,
      required: true
    },
    isHidden: {
      type: Boolean,
      required: true,
      default: false
    }
  },
  {
    _id: true
  }
);

const questionSchema = new Schema(
  {
    questionId: {
      type: Number,
      required: true,
      min: 1
    },
    module: {
      type: String,
      required: true,
      enum: questionModules
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    difficulty: {
      type: String,
      required: true,
      enum: questionDifficulties
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    companies: {
      type: [String],
      required: true,
      default: []
    },
    estimatedTime: {
      type: Number,
      required: true,
      min: 1
    },
    statement: {
      type: String,
      default: ''
    },
    examples: {
      type: [String],
      default: []
    },
    constraints: {
      type: [String],
      default: []
    },
    starterCode: {
      type: starterCodeSchema,
      default: undefined
    },
    functionName: {
      type: String,
      default: ''
    },
    testCases: {
      type: [testCaseSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

questionSchema.index({ module: 1, questionId: 1 }, { unique: true });
questionSchema.index({ module: 1, difficulty: 1 });
questionSchema.index({ module: 1, category: 1 });
questionSchema.index({ module: 1, companies: 1 });
questionSchema.index({ title: 'text', category: 'text', companies: 'text' });

export type QuestionDocument = InferSchemaType<typeof questionSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Question = mongoose.model('Question', questionSchema);
