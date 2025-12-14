const { Schema, model } = require('mongoose');
const crypto = require('crypto');

const trustedDeviceSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    deviceId: {
      type: String,
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      index: true,
    },
    deviceName: {
      type: String,
      default: '',
      trim: true,
    },
    userAgent: {
      type: String,
      default: '',
      trim: true,
    },
    lastIp: {
      type: String,
      default: '',
      trim: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
    isRevoked: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// 복합 인덱스: deviceId와 tokenHash로 빠른 조회
trustedDeviceSchema.index({ deviceId: 1, tokenHash: 1 });
// 사용자별 활성 기기 조회
trustedDeviceSchema.index({ user: 1, isRevoked: 1, expiresAt: 1 });

// 만료된 기기 자동 삭제를 위한 TTL 인덱스 (선택사항)
// trustedDeviceSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// 토큰 해시 생성 헬퍼 메서드
trustedDeviceSchema.statics.hashToken = function (token) {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// 랜덤 토큰 생성 헬퍼 메서드
trustedDeviceSchema.statics.generateToken = function () {
  return crypto.randomBytes(32).toString('hex');
};

// 랜덤 deviceId 생성 헬퍼 메서드
trustedDeviceSchema.statics.generateDeviceId = function () {
  return crypto.randomBytes(16).toString('hex');
};

module.exports = model('TrustedDevice', trustedDeviceSchema);

