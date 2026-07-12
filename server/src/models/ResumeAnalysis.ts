import mongoose, { Schema, type InferSchemaType } from 'mongoose';

export const resumeAnalysisStatuses = ['uploaded', 'processing', 'completed', 'failed'] as const;

const resumeAnalysisSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    fileName: {
      type: String,
      required: true,
      trim: true
    },
    extractedText: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      required: true,
      enum: resumeAnalysisStatuses,
      default: 'uploaded'
    }
  },
  {
    timestamps: true
  }
);

resumeAnalysisSchema.index({ userId: 1, createdAt: -1 });
resumeAnalysisSchema.index({ userId: 1, status: 1, createdAt: -1 });

export type ResumeAnalysisDocument = InferSchemaType<typeof resumeAnalysisSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const ResumeAnalysis = mongoose.model('ResumeAnalysis', resumeAnalysisSchema);
