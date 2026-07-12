import mongoose, { Schema, type InferSchemaType } from 'mongoose';
import { questionDifficulties } from './Question.js';

export const mockInterviewTypes = ['Technical', 'HR', 'Mixed'] as const;
export const mockInterviewCategories = ['DSA', 'SQL', 'General CS', 'HR', 'Mixed'] as const;
export const mockInterviewDifficulties = [...questionDifficulties, 'Mixed'] as const;
export const mockInterviewStatuses = ['in_progress', 'completed', 'abandoned'] as const;
export const mockInterviewEvaluationStatuses = ['not_started', 'processing', 'completed', 'failed'] as const;

const mockInterviewQuestionSchema = new Schema(
  {
    source: {
      type: String,
      required: true,
      enum: ['Question', 'Static']
    },
    questionRef: {
      type: Schema.Types.ObjectId,
      ref: 'Question',
      default: null
    },
    sourceKey: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    difficulty: {
      type: String,
      required: true,
      enum: questionDifficulties
    },
    questionText: {
      type: String,
      required: true,
      trim: true
    },
    userAnswer: {
      type: String,
      default: '',
      trim: true,
      maxlength: 10000
    },
    answeredAt: {
      type: Date,
      default: null
    }
  },
  {
    _id: false
  }
);

const mockInterviewQuestionEvaluationSchema = new Schema(
  {
    questionIndex: {
      type: Number,
      required: true,
      min: 0
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    strengths: {
      type: [String],
      required: true,
      default: []
    },
    weaknesses: {
      type: [String],
      required: true,
      default: []
    },
    improvements: {
      type: [String],
      required: true,
      default: []
    },
    sampleBetterAnswer: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    _id: false
  }
);

const mockInterviewEvaluationSchema = new Schema(
  {
    overallScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    communication: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    technicalKnowledge: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    problemSolving: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    summary: {
      type: String,
      required: true,
      trim: true
    },
    recommendations: {
      type: [String],
      required: true,
      default: []
    },
    questionFeedback: {
      type: [mockInterviewQuestionEvaluationSchema],
      required: true,
      default: []
    }
  },
  {
    _id: false
  }
);

const mockInterviewSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    interviewType: {
      type: String,
      required: true,
      enum: mockInterviewTypes
    },
    category: {
      type: String,
      required: true,
      enum: mockInterviewCategories
    },
    difficulty: {
      type: String,
      required: true,
      enum: mockInterviewDifficulties
    },
    questionCount: {
      type: Number,
      required: true,
      enum: [5, 10]
    },
    questions: {
      type: [mockInterviewQuestionSchema],
      required: true,
      default: []
    },
    currentQuestionIndex: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    status: {
      type: String,
      required: true,
      enum: mockInterviewStatuses,
      default: 'in_progress'
    },
    startedAt: {
      type: Date,
      required: true,
      default: Date.now
    },
    completedAt: {
      type: Date,
      default: null
    },
    evaluationStatus: {
      type: String,
      required: true,
      enum: mockInterviewEvaluationStatuses,
      default: 'not_started'
    },
    evaluationProvider: {
      type: String,
      enum: ['openai', 'ollama', null],
      default: null
    },
    evaluation: {
      type: mockInterviewEvaluationSchema,
      default: null
    },
    evaluatedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

mockInterviewSchema.index({ userId: 1, createdAt: -1 });
mockInterviewSchema.index({ userId: 1, status: 1, updatedAt: -1 });

export type MockInterviewDocument = InferSchemaType<typeof mockInterviewSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const MockInterview = mongoose.model('MockInterview', mockInterviewSchema);
