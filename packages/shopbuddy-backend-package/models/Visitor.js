import mongoose from 'mongoose';

const visitorSchema = new mongoose.Schema({
  // 고유 방문자 식별자 (쿠키 또는 로컬 스토리지 기반)
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
  // 첫 방문일
  firstVisitAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  // 마지막 방문일
  lastVisitAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  // 총 방문 횟수
  visitCount: {
    type: Number,
    default: 1
  },
  // 총 페이지뷰 수
  pageViewCount: {
    type: Number,
    default: 0
  },
  // 디바이스 정보
  device: {
    type: String, // 'desktop', 'mobile', 'tablet'
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
  // 국가 (IP 기반, 선택적)
  country: {
    type: String,
    default: null
  },
  // 도시 (IP 기반, 선택적)
  city: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// 인덱스
visitorSchema.index({ visitorId: 1 });
visitorSchema.index({ userId: 1 });
visitorSchema.index({ firstVisitAt: -1 });
visitorSchema.index({ lastVisitAt: -1 });

const Visitor = mongoose.model('Visitor', visitorSchema);

export default Visitor;

