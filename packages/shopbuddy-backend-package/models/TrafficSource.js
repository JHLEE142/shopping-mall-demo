import mongoose from 'mongoose';

const trafficSourceSchema = new mongoose.Schema({
  // 트래픽 소스 이름
  source: {
    type: String,
    required: true,
    index: true
  },
  // 트래픽 소스 타입
  type: {
    type: String,
    enum: ['direct', 'organic', 'referral', 'social', 'email', 'paid', 'other'],
    required: true,
    index: true
  },
  // UTM 소스 (있는 경우)
  utmSource: {
    type: String,
    default: null,
    index: true
  },
  // UTM 미디엄 (있는 경우)
  utmMedium: {
    type: String,
    default: null
  },
  // 총 방문자 수
  totalVisitors: {
    type: Number,
    default: 0
  },
  // 총 페이지뷰 수
  totalPageViews: {
    type: Number,
    default: 0
  },
  // 총 전환 수 (주문 발생)
  totalConversions: {
    type: Number,
    default: 0
  },
  // 전환율 (%)
  conversionRate: {
    type: Number,
    default: 0
  },
  // 평균 세션 시간 (초)
  avgSessionDuration: {
    type: Number,
    default: 0
  },
  // 이탈률 (%)
  bounceRate: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// 인덱스
trafficSourceSchema.index({ source: 1, type: 1 });
trafficSourceSchema.index({ type: 1 });

const TrafficSource = mongoose.model('TrafficSource', trafficSourceSchema);

export default TrafficSource;

