import mongoose, { Schema, type InferSchemaType } from 'mongoose';
import { questionModules } from './Question.js';

const userProgressSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    module: {
      type: String,
      required: true,
      enum: questionModules
    },
    questionId: {
      type: Number,
      required: true,
      min: 1
    },
    solved: {
      type: Boolean,
      required: true,
      default: false
    },
    favorite: {
      type: Boolean,
      required: true,
      default: false
    },
    notes: {
      type: String,
      required: true,
      default: '',
      trim: true
    },
    solvedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: true
    }
  }
);

userProgressSchema.index({ userId: 1, module: 1, questionId: 1 }, { unique: true });
userProgressSchema.index({ userId: 1, module: 1, solved: 1 });
userProgressSchema.index({ userId: 1, module: 1, favorite: 1 });
userProgressSchema.index({ userId: 1, updatedAt: -1 });

export type UserProgressDocument = InferSchemaType<typeof userProgressSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const UserProgress = mongoose.model('UserProgress', userProgressSchema);
