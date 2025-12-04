import mongoose from 'mongoose';

const sellerApplicationSchema = new mongoose.Schema({
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
  salesPlan: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  reviewedAt: Date,
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectionReason: String,
  notes: String
}, {
  timestamps: true
});

// 인덱스
sellerApplicationSchema.index({ userId: 1 });
sellerApplicationSchema.index({ status: 1 });

const SellerApplication = mongoose.model('SellerApplication', sellerApplicationSchema);

export default SellerApplication;

