const { Schema, model } = require('mongoose');

const NOTICE_TYPES = ['general', 'event', 'maintenance', 'policy', 'important'];
const NOTICE_STATUSES = ['draft', 'published', 'archived'];

const noticeSchema = new Schema(
  {
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
    type: {
      type: String,
      enum: NOTICE_TYPES,
      default: 'general',
      required: true,
    },
    status: {
      type: String,
      enum: NOTICE_STATUSES,
      default: 'published',
      index: true,
    },
    isImportant: {
      type: Boolean,
      default: false,
      index: true,
    },
    isPinned: {
      type: Boolean,
      default: false,
      index: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    attachments: {
      type: [String],
      default: [],
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// 복합 인덱스
noticeSchema.index({ status: 1, isPinned: -1, createdAt: -1 });
noticeSchema.index({ type: 1, createdAt: -1 });
noticeSchema.index({ isImportant: 1, createdAt: -1 });
noticeSchema.index({ publishedAt: -1 });

// 게시 전에 publishedAt 설정
noticeSchema.pre('save', function (next) {
  if (this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

module.exports = model('Notice', noticeSchema);

