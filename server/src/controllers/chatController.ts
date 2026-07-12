import type { NextFunction, Response } from 'express';
import { z, ZodError } from 'zod';
import type { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import type { ChatConversationDocument } from '../models/ChatConversation.js';
import {
  ChatServiceError,
  deleteChatConversation,
  getChatConversationById,
  listChatConversations,
  renameChatConversation,
  sendChatMessage
} from '../services/chatService.js';

const chatParamsSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid conversation ID')
});

const sendChatMessageSchema = z.object({
  message: z.string().trim().min(1, 'Message is required').max(8000, 'Message must be 8000 characters or fewer'),
  conversationId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid conversation ID').optional()
});

const renameChatSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(80, 'Title must be 80 characters or fewer')
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

function serializeChatConversation(conversation: ChatConversationDocument) {
  return {
    id: conversation._id.toString(),
    title: conversation.title,
    messages: conversation.messages.map((message) => ({
      role: message.role,
      content: message.content,
      timestamp: message.timestamp
    })),
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt
  };
}

export async function createChatMessage(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  try {
    const parsedBody = sendChatMessageSchema.safeParse(request.body);

    if (!parsedBody.success) {
      sendValidationError(parsedBody.error, response);
    }

    const conversation = await sendChatMessage(
      getUserId(request, response),
      parsedBody.data.message,
      parsedBody.data.conversationId
    );

    response.status(parsedBody.data.conversationId ? 200 : 201).json({
      success: true,
      data: {
        conversation: serializeChatConversation(conversation)
      }
    });
  } catch (error) {
    if (error instanceof ChatServiceError) {
      response.status(error.statusCode);
    }

    next(error);
  }
}

export async function getChatHistory(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  try {
    const conversations = await listChatConversations(getUserId(request, response));

    response.status(200).json({
      success: true,
      data: {
        conversations: conversations.map(serializeChatConversation)
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getChatConversation(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  try {
    const parsedParams = chatParamsSchema.safeParse(request.params);

    if (!parsedParams.success) {
      sendValidationError(parsedParams.error, response);
    }

    const conversation = await getChatConversationById(getUserId(request, response), parsedParams.data.id);

    if (!conversation) {
      response.status(404);
      throw new Error('Conversation not found');
    }

    response.status(200).json({
      success: true,
      data: {
        conversation: serializeChatConversation(conversation)
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function renameChat(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  try {
    const parsedParams = chatParamsSchema.safeParse(request.params);
    const parsedBody = renameChatSchema.safeParse(request.body);

    if (!parsedParams.success) {
      sendValidationError(parsedParams.error, response);
    }

    if (!parsedBody.success) {
      sendValidationError(parsedBody.error, response);
    }

    const conversation = await renameChatConversation(
      getUserId(request, response),
      parsedParams.data.id,
      parsedBody.data.title
    );

    response.status(200).json({
      success: true,
      data: {
        conversation: serializeChatConversation(conversation)
      }
    });
  } catch (error) {
    if (error instanceof ChatServiceError) {
      response.status(error.statusCode);
    }

    next(error);
  }
}

export async function removeChatConversation(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  try {
    const parsedParams = chatParamsSchema.safeParse(request.params);

    if (!parsedParams.success) {
      sendValidationError(parsedParams.error, response);
    }

    await deleteChatConversation(getUserId(request, response), parsedParams.data.id);

    response.status(200).json({
      success: true,
      data: {
        deleted: true
      }
    });
  } catch (error) {
    if (error instanceof ChatServiceError) {
      response.status(error.statusCode);
    }

    next(error);
  }
}
