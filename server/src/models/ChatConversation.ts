import mongoose, { Schema, type InferSchemaType } from 'mongoose';

export const chatMessageRoles = ['user', 'assistant'] as const;

const chatMessageSchema = new Schema(
  {
    role: {
      type: String,
      required: true,
      enum: chatMessageRoles
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20000
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now
    }
  },
  {
    _id: false
  }
);

const chatConversationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
      default: 'New Chat'
    },
    messages: {
      type: [chatMessageSchema],
      required: true,
      default: []
    }
  },
  {
    timestamps: true
  }
);

chatConversationSchema.index({ userId: 1, updatedAt: -1 });
chatConversationSchema.index({ userId: 1, createdAt: -1 });

export type ChatConversationDocument = InferSchemaType<typeof chatConversationSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const ChatConversation = mongoose.model('ChatConversation', chatConversationSchema);
