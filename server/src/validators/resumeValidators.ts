import { z } from 'zod';

export const resumeAnalysisParamsSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid resume analysis ID')
});

const scoreSchema = z.number().min(0).max(100);
const stringListSchema = z.array(z.string().trim().min(1)).max(20);

export const resumeAiAnalysisSchema = z
  .object({
    overallScore: scoreSchema,
    atsScore: scoreSchema,
    contentScore: scoreSchema,
    formattingScore: scoreSchema,
    skills: stringListSchema,
    missingSkills: stringListSchema,
    strengths: stringListSchema,
    weaknesses: stringListSchema,
    suggestions: stringListSchema,
    summary: z.string().trim().min(20).max(1200)
  })
  .strict();

export type ResumeAiAnalysis = z.infer<typeof resumeAiAnalysisSchema>;
