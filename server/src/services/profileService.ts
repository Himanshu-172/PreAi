import bcrypt from 'bcrypt';
import { User, type UserDocument } from '../models/User.js';

const SALT_ROUNDS = 10;

export class ProfileServiceError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message);
  }
}

function serializeUser(user: UserDocument) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

export async function getProfile(userId: string) {
  const user = await User.findById(userId).select('-password');

  if (!user) {
    throw new ProfileServiceError('Profile not found', 404);
  }

  return serializeUser(user);
}

export async function updateProfile(userId: string, name: string) {
  const user = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        name
      }
    },
    {
      new: true,
      runValidators: true
    }
  ).select('-password');

  if (!user) {
    throw new ProfileServiceError('Profile not found', 404);
  }

  return serializeUser(user);
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await User.findById(userId);

  if (!user) {
    throw new ProfileServiceError('Profile not found', 404);
  }

  const passwordMatches = await bcrypt.compare(currentPassword, user.password);

  if (!passwordMatches) {
    throw new ProfileServiceError('Current password is incorrect', 401);
  }

  user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await user.save();
}
