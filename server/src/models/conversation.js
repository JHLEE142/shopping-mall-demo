const { Schema, model } = require('mongoose');

/**
 * 대화 히스토리 모델
 * 사용자와 AI 간의 대화를 저장하여 컨텍스트 관리
 */
const conversationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    conversationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    messages: [
      {
        role: {
          type: String,
          enum: ['user', 'assistant', 'system'],
          required: true,
        },
        content: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        metadata: {
          type: Schema.Types.Mixed,
          default: {},
        },
      },
    ],
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
      // 예: { searchKeywords: [], productCards: [], etc. }
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// 인덱스
conversationSchema.index({ userId: 1, createdAt: -1 });
conversationSchema.index({ conversationId: 1 });
conversationSchema.index({ 'messages.timestamp': -1 });

// 최근 메시지만 조회하는 메서드
conversationSchema.statics.getRecentMessages = async function (
  conversationId,
  limit = 10
) {
  const conversation = await this.findOne({ conversationId });
  if (!conversation) {
    return [];
  }
  return conversation.messages.slice(-limit);
};

// 메시지 추가 메서드
conversationSchema.methods.addMessage = function (role, content, metadata = {}) {
  this.messages.push({
    role,
    content,
    timestamp: new Date(),
    metadata,
  });
  // 메시지가 너무 많아지면 오래된 것부터 제거 (최대 100개 유지)
  if (this.messages.length > 100) {
    this.messages = this.messages.slice(-100);
  }
  return this.save();
};

const Conversation = model('Conversation', conversationSchema);

module.exports = Conversation;

