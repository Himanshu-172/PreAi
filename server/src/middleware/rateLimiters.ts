import rateLimit from 'express-rate-limit';

function createJsonRateLimit(message: string, max: number, windowMs: number) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message
    }
  });
}

export const authRateLimiter = createJsonRateLimit('Too many authentication attempts. Try again later.', 20, 15 * 60 * 1000);
export const resumeUploadRateLimiter = createJsonRateLimit('Too many resume uploads. Try again later.', 10, 15 * 60 * 1000);
export const aiChatRateLimiter = createJsonRateLimit('Too many chat requests. Try again later.', 30, 15 * 60 * 1000);
export const mockInterviewEvaluationRateLimiter = createJsonRateLimit('Too many evaluation requests. Try again later.', 10, 15 * 60 * 1000);
