import type { NextFunction, Response } from 'express';
import { z, ZodError } from 'zod';
import type { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { changePassword, getProfile, ProfileServiceError, updateProfile } from '../services/profileService.js';

const profileUpdateSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80, 'Name must be 80 characters or fewer')
});

const passwordUpdateSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .max(128, 'New password must be 128 characters or fewer')
    .regex(/[a-z]/, 'New password must include a lowercase letter')
    .regex(/[A-Z]/, 'New password must include an uppercase letter')
    .regex(/\d/, 'New password must include a number')
});

function sendValidationError(error: ZodError, response: Response): never {
  response.status(400);
  throw new Error(error.issues[0]?.message ?? 'Invalid request');
}

function getUserId(request: AuthenticatedRequest, response: Response) {
  if (!request.user) {
    response.status(401);
    throw new Error('Authentication is required');
  }

  return request.user.id;
}

export async function getUserProfile(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  try {
    const user = await getProfile(getUserId(request, response));

    response.status(200).json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    if (error instanceof ProfileServiceError) {
      response.status(error.statusCode);
    }

    next(error);
  }
}

export async function updateUserProfile(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  try {
    const parsedBody = profileUpdateSchema.safeParse(request.body);

    if (!parsedBody.success) {
      sendValidationError(parsedBody.error, response);
    }

    const user = await updateProfile(getUserId(request, response), parsedBody.data.name);

    response.status(200).json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    if (error instanceof ProfileServiceError) {
      response.status(error.statusCode);
    }

    next(error);
  }
}

export async function updateUserPassword(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  try {
    const parsedBody = passwordUpdateSchema.safeParse(request.body);

    if (!parsedBody.success) {
      sendValidationError(parsedBody.error, response);
    }

    await changePassword(getUserId(request, response), parsedBody.data.currentPassword, parsedBody.data.newPassword);

    response.status(200).json({
      success: true,
      data: {
        updated: true
      }
    });
  } catch (error) {
    if (error instanceof ProfileServiceError) {
      response.status(error.statusCode);
    }

    next(error);
  }
}
