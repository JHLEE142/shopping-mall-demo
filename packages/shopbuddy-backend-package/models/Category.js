import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
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
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
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
    default: null, // null이면 기본 수수료율 사용
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
categorySchema.index({ code: 1 }, { unique: true });
categorySchema.index({ parentId: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ order: 1 });
categorySchema.index({ productCount: -1 }); // 인기 카테고리 조회용

const Category = mongoose.model('Category', categorySchema);

export default Category;

