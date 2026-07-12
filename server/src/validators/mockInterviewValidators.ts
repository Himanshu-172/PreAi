import { z } from 'zod';

export const mockInterviewParamsSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid mock interview ID')
});

export const createMockInterviewSchema = z
  .object({
    interviewType: z.enum(['Technical', 'HR', 'Mixed']),
    category: z.enum(['DSA', 'SQL', 'General CS']).optional(),
    difficulty: z.enum(['Easy', 'Medium', 'Hard', 'Mixed']),
    questionCount: z.union([z.literal(5), z.literal(10)])
  })
  .superRefine((value, context) => {
    if (value.interviewType === 'Technical' && !value.category) {
      context.addIssue({
        code: 'custom',
        message: 'Technical category is required',
        path: ['category']
      });
    }
  });

export const answerMockInterviewSchema = z.object({
  questionIndex: z.number().int('Question index must be an integer').min(0, 'Question index must be valid'),
  answer: z.string().trim().min(1, 'Answer is required').max(10000, 'Answer must be 10000 characters or fewer')
});

export type CreateMockInterviewInput = z.infer<typeof createMockInterviewSchema>;
export type AnswerMockInterviewInput = z.infer<typeof answerMockInterviewSchema>;
