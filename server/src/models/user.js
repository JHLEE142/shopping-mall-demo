const { Schema, model } = require('mongoose');

const USER_TYPES = ['customer', 'admin'];

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format'],
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    user_type: {
      type: String,
      required: true,
      enum: USER_TYPES,
    },
    address: {
      type: String,
      default: null,
      trim: true,
    },
    points: {
      type: Number,
      default: 0,
      min: 0,
    },
    // 관리자용 설정: 판매자 이름 표시 형식
    sellerNameDisplayFormat: {
      type: String,
      enum: ['businessName', 'sellerName', 'hide'],
      default: 'businessName', // 'businessName': 사업자명, 'sellerName': 판매자명, 'hide': 숨김
    },
  },
  {
    timestamps: true,
  }
);

module.exports = model('User', userSchema);

