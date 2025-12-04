import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['wholesale', 'dropshipping', 'b2b'],
    required: true
  },
  contactInfo: {
    email: String,
    phone: String,
    address: String
  },
  apiEndpoint: String,
  apiKey: String,
  syncSettings: {
    autoSync: {
      type: Boolean,
      default: false
    },
    syncInterval: {
      type: Number, // 분 단위
      default: 60
    },
    lastSyncAt: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// 인덱스
supplierSchema.index({ code: 1 }, { unique: true });
supplierSchema.index({ isActive: 1 });

const Supplier = mongoose.model('Supplier', supplierSchema);

export default Supplier;

