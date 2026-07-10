import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

type JwtPayload = {
  userId: string;
};

export type AuthenticatedRequest = Request & {
  user?: {
    id: string;
    name: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
  };
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }

  return secret;
}

export async function authenticate(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction
) {
  try {
    const authorizationHeader = request.headers.authorization;

    if (!authorizationHeader?.startsWith('Bearer ')) {
      response.status(401);
      throw new Error('Authorization token is required');
    }

    const token = authorizationHeader.split(' ')[1];
    const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload;
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      response.status(401);
      throw new Error('Invalid authorization token');
    }

    request.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    next();
  } catch (error) {
    if (response.statusCode === 200) {
      response.status(401);
    }

    next(error);
  }
}
