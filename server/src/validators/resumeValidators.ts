import { z } from 'zod';

export const resumeAnalysisParamsSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid resume analysis ID')
});
