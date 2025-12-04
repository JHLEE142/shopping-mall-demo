import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // 비회원도 가능
  },
  sessionId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'abandoned'],
    default: 'active'
  },
  context: {
    intent: String, // 'search', 'compare', 'recommend', 'purchase' 등
    category: String,
    budget: Number,
    preferences: mongoose.Schema.Types.Mixed
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  lastActivityAt: {
    type: Date,
    default: Date.now
  },
  endedAt: Date
}, {
  timestamps: true
});

// 인덱스
conversationSchema.index({ userId: 1 });
conversationSchema.index({ sessionId: 1 }, { unique: true });
conversationSchema.index({ status: 1 });
conversationSchema.index({ lastActivityAt: -1 });

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;

