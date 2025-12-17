const { Schema, model } = require('mongoose');

const categoryMappingSchema = new Schema({
  // 매핑 소스 (도매콜/전산/자사몰/쿠팡 등)
  source: {
    type: String,
    required: true,
    enum: ['domecall', 'erp', 'mall', 'coupang', 'other'],
    index: true
  },
  // 원본 카테고리 경로 문자열 (예: "주방용품 > 조리도구 > 건지기/망")
  sourcePath: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  // 내부 Category(소분류) 참조
  categoryId: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
    index: true
  },
  // 자동 매핑 신뢰도 (0~1)
  confidence: {
    type: Number,
    default: 1.0,
    min: 0,
    max: 1
  },
}, {
  timestamps: true
});

// 복합 인덱스: 소스와 경로로 빠르게 조회
categoryMappingSchema.index({ source: 1, sourcePath: 1 }, { unique: true });
// 카테고리 ID로 역매핑 조회
categoryMappingSchema.index({ categoryId: 1 });

module.exports = model('CategoryMapping', categoryMappingSchema);

