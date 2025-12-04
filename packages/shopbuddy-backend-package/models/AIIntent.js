import mongoose from 'mongoose';

const aiIntentSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  messageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    required: true
  },
  intent: {
    type: String,
    required: true
    // 'search_product', 'compare', 'recommend', 'add_to_cart', 'checkout', 'track_order' 등
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1
  },
  entities: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
    // 예: { "product_name": "조명", "price_max": 30000, "category": "조명" }
  },
  originalText: String,
  processedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 인덱스
aiIntentSchema.index({ conversationId: 1 });
aiIntentSchema.index({ intent: 1 });
aiIntentSchema.index({ processedAt: -1 });

const AIIntent = mongoose.model('AIIntent', aiIntentSchema);

export default AIIntent;

