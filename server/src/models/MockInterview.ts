import mongoose, { Schema, type InferSchemaType } from 'mongoose';
import { questionDifficulties } from './Question.js';

export const mockInterviewTypes = ['Technical', 'HR', 'Mixed'] as const;
export const mockInterviewCategories = ['DSA', 'SQL', 'General CS', 'HR', 'Mixed'] as const;
export const mockInterviewDifficulties = [...questionDifficulties, 'Mixed'] as const;
export const mockInterviewStatuses = ['in_progress', 'completed', 'abandoned'] as const;

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
