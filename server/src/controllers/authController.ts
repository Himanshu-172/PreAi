import bcrypt from 'bcrypt';
import type { Request, Response, NextFunction } from 'express';
import jwt, { type Secret, type SignOptions } from 'jsonwebtoken';
import { ZodError } from 'zod';
import type { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { User } from '../models/User.js';
import { loginSchema, registerSchema } from '../validators/authValidators.js';

const SALT_ROUNDS = 10;

function getJwtSecret(): Secret {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }

  return secret;
}

function signToken(userId: string) {
  const expiresIn = (process.env.JWT_EXPIRES_IN ?? '7d') as SignOptions['expiresIn'];
  const options: SignOptions = {
    expiresIn
  };

  return jwt.sign({ userId }, getJwtSecret(), options);
}

function sendValidationError(error: ZodError, response: Response): never {
  response.status(400);
  throw new Error(error.issues[0]?.message ?? 'Invalid request body');
}

function serializeUser(user: {
  _id: { toString(): string };
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

export async function register(request: Request, response: Response, next: NextFunction) {
  try {
    const parsedBody = registerSchema.safeParse(request.body);

    if (!parsedBody.success) {
      sendValidationError(parsedBody.error, response);
    }

    const existingUser = await User.findOne({ email: parsedBody.data.email });

    if (existingUser) {
      response.status(409);
      throw new Error('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(parsedBody.data.password, SALT_ROUNDS);
    const user = await User.create({
      name: parsedBody.data.name,
      email: parsedBody.data.email,
      password: hashedPassword
    });

    response.status(201).json({
      success: true,
      data: {
        user: serializeUser(user),
        token: signToken(user._id.toString())
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function login(request: Request, response: Response, next: NextFunction) {
  try {
    const parsedBody = loginSchema.safeParse(request.body);

    if (!parsedBody.success) {
      sendValidationError(parsedBody.error, response);
    }

    const user = await User.findOne({ email: parsedBody.data.email });

    if (!user) {
      response.status(401);
      throw new Error('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(parsedBody.data.password, user.password);

    if (!passwordMatches) {
      response.status(401);
      throw new Error('Invalid email or password');
    }

    response.status(200).json({
      success: true,
      data: {
        user: serializeUser(user),
        token: signToken(user._id.toString())
      }
    });
  } catch (error) {
    next(error);
  }
}

export function getMe(request: AuthenticatedRequest, response: Response) {
  response.status(200).json({
    success: true,
    data: {
      user: request.user
    }
  });
}
