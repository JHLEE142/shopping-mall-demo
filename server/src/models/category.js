const { Schema, model } = require('mongoose');

const categorySchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  // 카테고리 고유 코드 (프론트엔드에서 사용하는 ID)
  code: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    unique: true
  },
  description: String,
  // 카테고리 색상 (프론트엔드 디스플레이용)
  color: {
    type: String,
    default: '#333333',
    match: /^#[0-9A-F]{6}$/i // HEX 색상 형식 검증
  },
  // 카테고리 아이콘/이미지
  image: String,
  icon: String, // 아이콘 URL 또는 아이콘 이름
  parentId: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  // 카테고리 레벨 (1: 대분류, 2: 중분류, 3: 소분류)
  level: {
    type: Number,
    required: true,
    enum: [1, 2, 3],
    default: 1
  },
  // 경로 ID 배열 (조회 최적화용) - [대분류_id, 중분류_id, 소분류_id]
  pathIds: {
    type: [Schema.Types.ObjectId],
    default: [],
    ref: 'Category'
  },
  // 경로 이름 배열 (표시 최적화용) - ["주방용품", "조리도구", "건지기/망"]
  pathNames: {
    type: [String],
    default: []
  },
  // 리프 노드 여부 (소분류일 때만 true)
  isLeaf: {
    type: Boolean,
    default: false
  },
  // 정렬 순서
  order: {
    type: Number,
    default: 0
  },
  // 활성화 여부
  isActive: {
    type: Boolean,
    default: true
  },
  // 수수료율 (카테고리별 커스텀 수수료율)
  commissionRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  // SEO 메타 정보
  metaTitle: String,
  metaDescription: String,
  // 통계 정보
  productCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// 인덱스
categorySchema.index({ slug: 1 }, { unique: true });
// code 필드는 필드 정의에서 unique: true로 이미 인덱스가 생성되므로 중복 정의 제거
categorySchema.index({ parentId: 1, order: 1 }); // 하위 카테고리 리스트 빠르게 조회
categorySchema.index({ level: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ order: 1 });
categorySchema.index({ productCount: -1 }); // 인기 카테고리 조회용
categorySchema.index({ pathIds: 1 }); // 검색/필터 최적화
categorySchema.index({ pathNames: 1 }); // 검색/필터 최적화

module.exports = model('Category', categorySchema);

