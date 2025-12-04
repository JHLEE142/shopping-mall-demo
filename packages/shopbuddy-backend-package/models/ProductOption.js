import mongoose from 'mongoose';

const productOptionSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  // 옵션 타입: 'size', 'color', 'material', 'custom' 등
  type: {
    type: String,
    required: true,
    trim: true
  },
  values: [{
    label: {
      type: String,
      required: true
    },
    value: {
      type: String,
      required: true
    },
    priceAdjustment: {
      type: Number,
      default: 0 // 기본 가격 대비 증감액
    },
    stock: {
      type: Number,
      default: 0
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  }],
  isRequired: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// 인덱스
productOptionSchema.index({ productId: 1 });

const ProductOption = mongoose.model('ProductOption', productOptionSchema);

export default ProductOption;

