import mongoose, { Schema, type InferSchemaType } from 'mongoose';

export const resumeAnalysisStatuses = ['uploaded', 'processing', 'completed', 'failed'] as const;

const resumeAnalysisResultSchema = new Schema(
  {
    overallScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    atsScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    contentScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    formattingScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    skills: {
      type: [String],
      required: true,
      default: []
    },
    missingSkills: {
      type: [String],
      required: true,
      default: []
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
    suggestions: {
      type: [String],
      required: true,
      default: []
    },
    summary: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    _id: false
  }
);

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
    },
    analysis: {
      type: resumeAnalysisResultSchema,
      default: null
    },
    analyzedAt: {
      type: Date,
      default: null
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
