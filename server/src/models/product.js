const { Schema, model } = require('mongoose');

// 새로운 카테고리 목록
const PRODUCT_CATEGORIES = [
  '주방용품',
  '욕실용품',
  '침구/홈데코',
  '인테리어소품',
  '청소용품',
  '수납/정리',
  '생활잡화',
  '전자제품',
  '반려동물용품',
  '육아용품',
  '야외/캠핑',
  '사무용품',
  '건강용품',
  '뷰티/미용',
  '식품/음료',
  '의류',
];

const productSchema = new Schema(
  {
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Price must be a positive number'],
    },
    // 카테고리 ID (소분류를 가리키는 ObjectId)
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true
    },
    // 카테고리 경로 ID 배열 (조회 성능 최적화용, 옵션)
    categoryPathIds: {
      type: [Schema.Types.ObjectId],
      default: [],
      ref: 'Category'
    },
    // 카테고리 경로 텍스트 (표시용) - "주방용품 > 조리도구 > 건지기/망"
    categoryPathText: {
      type: String,
      default: '',
      trim: true
    },
    // 하위 호환성을 위해 유지 (최종 선택된 카테고리 이름)
    category: {
      type: String,
      default: '',
      trim: true
    },
    // 계층 구조 카테고리 (하위 호환성 유지)
    categoryMain: {
      type: String,
      default: null,
      trim: true,
    },
    categoryMid: {
      type: String,
      default: null,
      trim: true,
    },
    categorySub: {
      type: String,
      default: null,
      trim: true,
    },
    image: {
      type: String,
      required: true,
      trim: true,
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: function(v) {
          return v.length <= 4;
        },
        message: '이미지는 최대 4개까지 업로드할 수 있습니다.',
      },
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    colors: {
      type: [{
        name: { type: String, required: true, trim: true },
        value: { type: String, required: true, trim: true }, // hex color code
        image: { type: String, default: '', trim: true }, // optional color-specific image
      }],
      default: [],
    },
    sizes: {
      type: [{
        label: { type: String, required: true, trim: true }, // e.g., "XS (KR 90)"
        value: { type: String, required: true, trim: true }, // e.g., "XS"
        available: { type: Boolean, default: true },
      }],
      default: [],
    },
    shipping: {
      isFree: { type: Boolean, default: false },
      fee: { type: Number, default: 0, min: 0 },
      estimatedDays: { type: Number, default: 3, min: 1 },
    },
    returnPolicy: {
      isReturnable: { type: Boolean, default: true },
      returnDays: { type: Number, default: 30, min: 0 },
      returnFee: { type: Number, default: 0, min: 0 },
    },
    phoneme_name: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },
    embedding: {
      type: [Number],
      default: null,
    },
    inventory: {
      stock: {
        type: Number,
        default: 0,
        min: [0, '재고 수량은 음수가 될 수 없습니다.'],
      },
      reserved: {
        type: Number,
        default: 0,
        min: [0, '예약 수량은 음수가 될 수 없습니다.'],
      },
      reorderPoint: {
        type: Number,
        default: 0,
        min: [0, '재주문 임계값은 음수가 될 수 없습니다.'],
      },
      supplier: {
        type: String,
        default: '',
        trim: true,
      },
      cost: {
        type: Number,
        default: 0,
        min: [0, '원가는 음수가 될 수 없습니다.'],
      },
      status: {
        type: String,
        enum: ['in-stock', 'low-stock', 'critical', 'out-of-stock'],
        default: 'in-stock',
      },
      updatedAt: {
        type: Date,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

const Product = model('Product', productSchema);
Product.CATEGORIES = PRODUCT_CATEGORIES;

module.exports = Product;


