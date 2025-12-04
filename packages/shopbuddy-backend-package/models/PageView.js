import mongoose from 'mongoose';

const pageViewSchema = new mongoose.Schema({
  // 방문자 ID
  visitorId: {
    type: String,
    required: true,
    index: true
  },
  // 사용자 ID (로그인한 경우)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  // 페이지 URL
  url: {
    type: String,
    required: true
  },
  // 페이지 경로 (쿼리 파라미터 제외)
  path: {
    type: String,
    required: true,
    index: true
  },
  // 페이지 제목
  title: {
    type: String,
    default: null
  },
  // Referrer (어디서 들어왔는지)
  referrer: {
    type: String,
    default: null
  },
  // Referrer 도메인
  referrerDomain: {
    type: String,
    default: null,
    index: true
  },
  // UTM 소스
  utmSource: {
    type: String,
    default: null,
    index: true
  },
  // UTM 미디엄
  utmMedium: {
    type: String,
    default: null,
    index: true
  },
  // UTM 캠페인
  utmCampaign: {
    type: String,
    default: null,
    index: true
  },
  // UTM 용어
  utmTerm: {
    type: String,
    default: null
  },
  // UTM 콘텐츠
  utmContent: {
    type: String,
    default: null
  },
  // 세션 ID
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  // 페이지뷰 시간 (초)
  duration: {
    type: Number,
    default: 0
  },
  // 디바이스 정보
  device: {
    type: String,
    enum: ['desktop', 'mobile', 'tablet', 'unknown'],
    default: 'unknown'
  },
  // 브라우저 정보
  browser: {
    type: String,
    default: null
  },
  // OS 정보
  os: {
    type: String,
    default: null
  },
  // IP 주소 (선택적, 개인정보 보호를 위해 해시화 가능)
  ipAddress: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// 인덱스
pageViewSchema.index({ visitorId: 1, createdAt: -1 });
pageViewSchema.index({ userId: 1, createdAt: -1 });
pageViewSchema.index({ path: 1, createdAt: -1 });
pageViewSchema.index({ referrerDomain: 1, createdAt: -1 });
pageViewSchema.index({ utmSource: 1, createdAt: -1 });
pageViewSchema.index({ sessionId: 1, createdAt: -1 });
pageViewSchema.index({ createdAt: -1 });

const PageView = mongoose.model('PageView', pageViewSchema);

export default PageView;

