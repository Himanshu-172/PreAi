import mongoose, { Schema, type InferSchemaType } from 'mongoose';

export const questionModules = ['DSA', 'SQL', 'Aptitude'] as const;
export const questionDifficulties = ['Easy', 'Medium', 'Hard'] as const;

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
