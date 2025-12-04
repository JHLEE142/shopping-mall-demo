import mongoose from 'mongoose';

const productImageSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  url: {
    type: String,
    required: true
  },
  alt: String,
  order: {
    type: Number,
    default: 0
  },
  isPrimary: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// 인덱스
productImageSchema.index({ productId: 1 });
productImageSchema.index({ isPrimary: 1 });

const ProductImage = mongoose.model('ProductImage', productImageSchema);

export default ProductImage;

