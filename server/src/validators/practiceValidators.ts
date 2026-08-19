import { z } from 'zod';

export const moduleSchema = z.enum(['DSA', 'SQL', 'Aptitude']);

export const questionIdSchema = z.coerce
  .number()
  .int('Question ID must be an integer')
  .positive('Question ID must be positive');

export const questionQuerySchema = z.object({
  module: moduleSchema.optional(),
  search: z.string().trim().min(1).optional(),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).optional(),
  topic: z.string().trim().min(1).optional(),
  category: z.string().trim().min(1).optional(),
  company: z.string().trim().min(1).optional(),
  page: z.coerce.number().int('Page must be an integer').positive('Page must be positive').optional(),
  limit: z.coerce
    .number()
    .int('Limit must be an integer')
    .positive('Limit must be positive')
    .max(100, 'Limit cannot exceed 100')
    .optional(),
  sort: z.enum(['newest', 'oldest', 'alphabetical']).optional()
});

export const questionParamsSchema = z.object({
  id: questionIdSchema
});

export const moduleQuerySchema = z.object({
  module: moduleSchema.optional()
});

export const moduleQuestionParamsSchema = z.object({
  questionId: questionIdSchema
});

export const moduleQuestionBodySchema = z.object({
  module: moduleSchema,
  questionId: questionIdSchema
});

export const progressBodySchema = moduleQuestionBodySchema.extend({
  solved: z.boolean().optional(),
  favorite: z.boolean().optional(),
  notes: z.string().trim().max(5000, 'Notes must be 5000 characters or fewer').optional()
});

export const progressPatchBodySchema = z
  .object({
    module: moduleSchema,
    solved: z.boolean().optional(),
    favorite: z.boolean().optional(),
    notes: z.string().trim().max(5000, 'Notes must be 5000 characters or fewer').optional()
  })
  .refine((value) => value.solved !== undefined || value.favorite !== undefined || value.notes !== undefined, {
    message: 'At least one of solved, favorite, or notes is required'
  });

export const favoriteBodySchema = moduleQuestionBodySchema.extend({
  favorite: z.boolean().optional()
});

export const moduleOnlyBodySchema = z.object({
  module: moduleSchema
});

export const notesBodySchema = moduleQuestionBodySchema.extend({
  notes: z.string().trim().max(5000, 'Notes must be 5000 characters or fewer')
});

export const notesPatchBodySchema = z.object({
  module: moduleSchema,
  notes: z.string().trim().max(5000, 'Notes must be 5000 characters or fewer')
});
