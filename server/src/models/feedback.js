const { Schema, model } = require('mongoose');

const FEEDBACK_TYPES = ['suggestion', 'bug', 'feature', 'research', 'other'];
const FEEDBACK_STATUSES = ['pending', 'reviewing', 'accepted', 'rejected', 'implemented'];

const feedbackSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: FEEDBACK_TYPES,
      default: 'suggestion',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, '제목은 200자 이하여야 합니다.'],
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: FEEDBACK_STATUSES,
      default: 'pending',
      index: true,
    },
    category: {
      type: String,
      trim: true,
      default: '',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    response: {
      content: {
        type: String,
        default: '',
        trim: true,
      },
      respondedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      respondedAt: {
        type: Date,
        default: null,
      },
    },
    attachments: {
      type: [String],
      default: [],
    },
    researchData: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// 복합 인덱스
feedbackSchema.index({ user: 1, createdAt: -1 });
feedbackSchema.index({ status: 1, createdAt: -1 });
feedbackSchema.index({ type: 1, createdAt: -1 });

module.exports = model('Feedback', feedbackSchema);

