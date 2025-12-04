import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
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
  // 상품 코드 (SKU)
  sku: {
    type: String,
    trim: true,
    uppercase: true,
    sparse: true // null 값 허용, 하지만 값이 있으면 unique
  },
  description: {
    type: String,
    required: true
  },
  shortDescription: String,
  // AI가 생성한 설명
  aiDescription: String,
  aiSummary: String,
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  // 상품 소유권: 'seller' (입점 셀러), 'platform' (도매콜/플랫폼 직접 판매)
  ownershipType: {
    type: String,
    enum: ['seller', 'platform'],
    required: true
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller',
    default: null // platform 상품은 null
  },
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    default: null // 도매콜 상품인 경우
  },
  // 기본 가격 (옵션 없을 때)
  basePrice: {
    type: Number,
    required: true,
    min: 0
  },
  // 할인 가격
  salePrice: {
    type: Number,
    min: 0
  },
  // 재고 관리 방식: 'track' (추적), 'unlimited' (무제한)
  stockManagement: {
    type: String,
    enum: ['track', 'unlimited'],
    default: 'track'
  },
  totalStock: {
    type: Number,
    default: 0
  },
  // 판매 상태
  status: {
    type: String,
    enum: ['draft', 'active', 'inactive', 'out_of_stock'],
    default: 'draft'
  },
  // 배송 정보
  shipping: {
    isFree: {
      type: Boolean,
      default: false
    },
    fee: {
      type: Number,
      default: 0
    },
    estimatedDays: {
      type: Number,
      default: 3
    }
  },
  // 반품/환불 정책
  returnPolicy: {
    isReturnable: {
      type: Boolean,
      default: true
    },
    returnDays: {
      type: Number,
      default: 7
    },
    returnFee: {
      type: Number,
      default: 0
    }
  },
  // SEO
  metaTitle: String,
  metaDescription: String,
  // 통계
  viewCount: {
    type: Number,
    default: 0
  },
  purchaseCount: {
    type: Number,
    default: 0
  },
  // AI 추천 관련
  aiRecommendationScore: {
    type: Number,
    default: 0
  },
  aiKeywords: [String], // AI가 추출한 키워드
  // 태그
  tags: [String]
}, {
  timestamps: true
});

// 인덱스
productSchema.index({ slug: 1 }, { unique: true });
productSchema.index({ sku: 1 }, { unique: true, sparse: true });
productSchema.index({ categoryId: 1 });
productSchema.index({ sellerId: 1 });
productSchema.index({ ownershipType: 1 });
productSchema.index({ status: 1 });
productSchema.index({ aiRecommendationScore: -1 });
productSchema.index({ 'shipping.isFree': 1 });
productSchema.index({ name: 'text', description: 'text', tags: 'text' }); // 텍스트 검색

const Product = mongoose.model('Product', productSchema);

export default Product;

