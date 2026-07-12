import mongoose from 'mongoose';
import { ChatConversation, type ChatConversationDocument } from '../models/ChatConversation.js';
import { generateTextWithAi } from './resumeAiService.js';

const DEFAULT_MAX_MESSAGE_CHARS = 8000;
const DEFAULT_MAX_HISTORY_MESSAGES = 20;

type ChatRole = 'user' | 'assistant';

export type ChatMessageInput = {
  role: ChatRole;
  content: string;
};

export class ChatServiceError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message);
  }
}

function toObjectId(id: string) {
  return new mongoose.Types.ObjectId(id);
}

function getNumberEnv(name: string, fallback: number) {
  const value = process.env[name];
  const parsedValue = value ? Number(value) : fallback;
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
}

function truncateMessage(content: string) {
  const maxCharacters = getNumberEnv('AI_CHAT_MAX_MESSAGE_CHARS', DEFAULT_MAX_MESSAGE_CHARS);
  return content.trim().slice(0, maxCharacters);
}

function getConversationTitle(message: string) {
  const normalized = message.replace(/\s+/g, ' ').trim();
  return normalized.length > 60 ? `${normalized.slice(0, 57)}...` : normalized || 'New Chat';
}

function getRecentMessages(conversation: ChatConversationDocument) {
  const maxHistoryMessages = getNumberEnv('AI_CHAT_MAX_HISTORY_MESSAGES', DEFAULT_MAX_HISTORY_MESSAGES);
  return conversation.messages.slice(-maxHistoryMessages).map((message) => ({
    role: message.role,
    content: truncateMessage(message.content)
  }));
}

function buildChatMessages(conversation: ChatConversationDocument) {
  return [
    {
      role: 'system' as const,
      content: [
        'You are PrepAI, a professional AI interview preparation assistant.',
        'Answer clearly and practically in normal text or markdown.',
        'Use fenced code blocks for code.',
        'Stay focused on software engineering, interviews, resumes, DSA, SQL, aptitude, and career preparation.',
        'If the request is outside preparation topics, answer briefly and steer back to interview preparation.'
      ].join(' ')
    },
    ...getRecentMessages(conversation)
  ];
}

function mapAiError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Unable to generate chat response';

  if (message.includes('not configured')) {
    return new ChatServiceError('AI provider is not configured', 503);
  }

  if (message.includes('timed out')) {
    return new ChatServiceError('AI provider request timed out', 504);
  }

  if (message.includes('empty text') || message.includes('invalid response')) {
    return new ChatServiceError('AI provider returned an invalid chat response', 502);
  }

  return new ChatServiceError('Unable to generate chat response with the AI provider', 502);
}

export async function listChatConversations(userId: string) {
  return ChatConversation.find({ userId: toObjectId(userId) }).sort({ updatedAt: -1 });
}

export async function getChatConversationById(userId: string, conversationId: string) {
  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    return null;
  }

  return ChatConversation.findOne({
    _id: toObjectId(conversationId),
    userId: toObjectId(userId)
  });
}

export async function sendChatMessage(userId: string, message: string, conversationId?: string) {
  const userMessage = truncateMessage(message);

  if (!userMessage) {
    throw new ChatServiceError('Message is required', 400);
  }

  const userObjectId = toObjectId(userId);
  let conversation: ChatConversationDocument | null = null;
  if (conversationId) {
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      throw new ChatServiceError('Conversation not found', 404);
    }

    conversation = await ChatConversation.findOneAndUpdate(
      {
        _id: toObjectId(conversationId),
        userId: userObjectId
      },
      {
        $push: {
          messages: {
            role: 'user',
            content: userMessage,
            timestamp: new Date()
          }
        }
      },
      {
        new: true
      }
    );
  } else {
    conversation = await ChatConversation.create({
      userId: userObjectId,
      title: getConversationTitle(userMessage),
      messages: [
        {
          role: 'user',
          content: userMessage,
          timestamp: new Date()
        }
      ]
    });
  }

  if (!conversation) {
    throw new ChatServiceError('Conversation not found', 404);
  }

  try {
    const { content } = await generateTextWithAi({
      taskName: 'chat assistant',
      messages: buildChatMessages(conversation)
    });

    const update: Record<string, unknown> = {
      $push: {
        messages: {
          role: 'assistant',
          content,
          timestamp: new Date()
        }
      }
    };

    const updatedConversation = await ChatConversation.findOneAndUpdate(
      {
        _id: conversation._id,
        userId: userObjectId
      },
      update,
      {
        new: true
      }
    );

    if (!updatedConversation) {
      throw new ChatServiceError('Conversation not found', 404);
    }

    return updatedConversation;
  } catch (error) {
    if (error instanceof ChatServiceError) {
      throw error;
    }

    throw mapAiError(error);
  }
}

export async function renameChatConversation(userId: string, conversationId: string, title: string) {
  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    throw new ChatServiceError('Conversation not found', 404);
  }

  const trimmedTitle = title.trim();

  if (!trimmedTitle) {
    throw new ChatServiceError('Title is required', 400);
  }

  const conversation = await ChatConversation.findOneAndUpdate(
    {
      _id: toObjectId(conversationId),
      userId: toObjectId(userId)
    },
    {
      $set: {
        title: trimmedTitle.slice(0, 80)
      }
    },
    {
      new: true
    }
  );

  if (!conversation) {
    throw new ChatServiceError('Conversation not found', 404);
  }

  return conversation;
}

export async function deleteChatConversation(userId: string, conversationId: string) {
  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    throw new ChatServiceError('Conversation not found', 404);
  }

  const result = await ChatConversation.deleteOne({
    _id: toObjectId(conversationId),
    userId: toObjectId(userId)
  });

  if (result.deletedCount === 0) {
    throw new ChatServiceError('Conversation not found', 404);
  }
}
