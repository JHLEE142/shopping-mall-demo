import mongoose from 'mongoose';

const supplierProductSchema = new mongoose.Schema({
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true
  },
  externalId: {
    type: String,
    required: true // 공급사의 상품 ID
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  category: String,
  wholesalePrice: {
    type: Number,
    required: true
  },
  retailPrice: {
    type: Number
  },
  stock: {
    type: Number,
    default: 0
  },
  images: [String],
  specifications: mongoose.Schema.Types.Mixed, // 유연한 스펙 데이터
  // 내부 상품과 매핑
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    default: null
  },
  // 동기화 상태
  syncStatus: {
    type: String,
    enum: ['pending', 'synced', 'error'],
    default: 'pending'
  },
  lastSyncedAt: Date,
  syncError: String
}, {
  timestamps: true
});

// 인덱스
supplierProductSchema.index({ supplierId: 1, externalId: 1 }, { unique: true });
supplierProductSchema.index({ productId: 1 });
supplierProductSchema.index({ syncStatus: 1 });

const SupplierProduct = mongoose.model('SupplierProduct', supplierProductSchema);

export default SupplierProduct;

