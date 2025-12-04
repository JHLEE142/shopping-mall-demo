import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  // AI 응답인 경우
  aiResponse: {
    intent: String,
    confidence: Number,
    entities: mongoose.Schema.Types.Mixed,
    suggestedActions: [String]
  },
  // 메시지 타입
  type: {
    type: String,
    enum: ['text', 'product_list', 'product_detail', 'comparison', 'cart_action', 'order_form'],
    default: 'text'
  },
  // 메시지에 포함된 데이터
  metadata: {
    productIds: [mongoose.Schema.Types.ObjectId],
    orderId: mongoose.Schema.Types.ObjectId,
    cartAction: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 인덱스
messageSchema.index({ conversationId: 1 });
messageSchema.index({ timestamp: -1 });
messageSchema.index({ role: 1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;

