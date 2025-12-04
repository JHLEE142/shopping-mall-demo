import mongoose from 'mongoose';

const aiActionLogSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  intentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AIIntent',
    default: null
  },
  action: {
    type: String,
    required: true
    // 'search', 'filter', 'recommend', 'add_to_cart', 'create_order', 'show_summary' 등
  },
  actionType: {
    type: String,
    enum: ['query', 'filter', 'recommendation', 'purchase', 'info'],
    required: true
  },
  // 실행된 액션의 결과
  result: {
    productCount: Number,
    products: [mongoose.Schema.Types.ObjectId],
    cartItems: Number,
    orderId: mongoose.Schema.Types.ObjectId,
    success: Boolean,
    error: String
  },
  // 성능 메트릭
  performance: {
    responseTime: Number, // 밀리초
    tokensUsed: Number,
    model: String
  },
  executedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 인덱스
aiActionLogSchema.index({ conversationId: 1 });
aiActionLogSchema.index({ action: 1 });
aiActionLogSchema.index({ executedAt: -1 });
aiActionLogSchema.index({ 'result.success': 1 });

const AIActionLog = mongoose.model('AIActionLog', aiActionLogSchema);

export default AIActionLog;

