import type { NextFunction, Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { getAnalytics } from '../services/analyticsService.js';

function getUserId(request: AuthenticatedRequest, response: Response) {
  if (!request.user) {
    response.status(401);
    throw new Error('Authentication is required');
  }

  return request.user.id;
}

export async function getUserAnalytics(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  try {
    const analytics = await getAnalytics(getUserId(request, response));

    response.status(200).json({
      success: true,
      data: {
        analytics
      }
    });
  } catch (error) {
    next(error);
  }
}
