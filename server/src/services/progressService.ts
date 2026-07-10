import mongoose from 'mongoose';
import { UserProgress } from '../models/UserProgress.js';
import type { moduleSchema } from '../validators/practiceValidators.js';
import type { z } from 'zod';

type Module = z.infer<typeof moduleSchema>;

type ProgressPatch = {
  solved?: boolean;
  favorite?: boolean;
  notes?: string;
};

function toObjectId(userId: string) {
  return new mongoose.Types.ObjectId(userId);
}

function withSolvedAt(update: ProgressPatch) {
  return {
    ...update,
    ...(update.solved !== undefined
      ? {
          solvedAt: update.solved ? new Date() : null
        }
      : {})
  };
}

export async function listProgress(userId: string, module?: Module) {
  return UserProgress.find({
    userId: toObjectId(userId),
    ...(module ? { module } : {})
  }).sort({ module: 1, questionId: 1 });
}

export async function upsertProgress(userId: string, module: Module, questionId: number, update: ProgressPatch) {
  return UserProgress.findOneAndUpdate(
    {
      userId: toObjectId(userId),
      module,
      questionId
    },
    {
      $set: withSolvedAt(update),
      $setOnInsert: {
        userId: toObjectId(userId),
        module,
        questionId
      }
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    }
  );
}

export async function listFavorites(userId: string, module?: Module) {
  return UserProgress.find({
    userId: toObjectId(userId),
    favorite: true,
    ...(module ? { module } : {})
  }).sort({ updatedAt: -1 });
}

export async function setFavorite(userId: string, module: Module, questionId: number, favorite = true) {
  return upsertProgress(userId, module, questionId, { favorite });
}

export async function removeFavorite(userId: string, module: Module, questionId: number) {
  return UserProgress.findOneAndUpdate(
    {
      userId: toObjectId(userId),
      module,
      questionId
    },
    {
      $set: {
        favorite: false
      }
    },
    {
      new: true
    }
  );
}

export async function listNotes(userId: string, module?: Module) {
  return UserProgress.find({
    userId: toObjectId(userId),
    notes: {
      $ne: ''
    },
    ...(module ? { module } : {})
  }).sort({ updatedAt: -1 });
}

export async function setNotes(userId: string, module: Module, questionId: number, notes: string) {
  return upsertProgress(userId, module, questionId, { notes });
}
