import mongoose from 'mongoose';

const sellerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  businessName: {
    type: String,
    required: true,
    trim: true
  },
  businessNumber: {
    type: String,
    required: true,
    trim: true
  },
  businessType: {
    type: String,
    enum: ['individual', 'corporation'],
    required: true
  },
  contactPhone: {
    type: String,
    required: true,
    trim: true
  },
  contactEmail: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    postalCode: String,
    address1: String,
    address2: String,
    city: String,
    country: {
      type: String,
      default: 'KR'
    }
  },
  bankAccount: {
    bankName: String,
    accountNumber: String,
    accountHolder: String
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'suspended', 'rejected'],
    default: 'pending'
  },
  commissionRate: {
    type: Number,
    default: 10, // 기본 10%
    min: 0,
    max: 100
  },
  plan: {
    type: String,
    enum: ['basic', 'pro'],
    default: 'basic'
  },
  totalSales: {
    type: Number,
    default: 0
  },
  totalEarnings: {
    type: Number,
    default: 0
  },
  approvedAt: Date,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: String
}, {
  timestamps: true
});

// 인덱스
sellerSchema.index({ userId: 1 }, { unique: true });
sellerSchema.index({ status: 1 });
sellerSchema.index({ businessNumber: 1 }, { unique: true });

const Seller = mongoose.model('Seller', sellerSchema);

export default Seller;

