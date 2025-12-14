require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const { Coupon } = require('../models/coupon');

const MONGODB_ATLAS_URL = process.env.MONGODB_ATLAS_URL;
const MONGODB_URI = process.env.MONGODB_URI;

async function connectDB() {
  try {
    const uri = MONGODB_ATLAS_URL || MONGODB_URI;
    if (!uri) {
      throw new Error('MongoDB connection string is missing. Set MONGODB_ATLAS_URL or MONGODB_URI in your .env file.');
    }

    await mongoose.connect(uri);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
}

const INITIAL_COUPONS = [
  {
    title: '무료배송',
    description: '생일 축하 쿠폰',
    type: 'freeShipping',
    discountValue: 0,
    minPurchaseAmount: 0,
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90일 후
    isActive: true,
  },
  {
    title: '3,000원',
    description: 'Silver 3,000원 할인 쿠폰',
    type: 'fixedAmount',
    discountValue: 3000,
    minPurchaseAmount: 10000,
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60일 후
    isActive: true,
  },
  {
    title: '15%',
    description: '1주년 감사 쿠폰',
    type: 'percentage',
    discountValue: 15,
    minPurchaseAmount: 50000,
    maxDiscountAmount: 20000,
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30일 후
    isActive: true,
  },
  {
    title: '10%',
    description: 'Silver 10% 할인 쿠폰',
    type: 'percentage',
    discountValue: 10,
    minPurchaseAmount: 30000,
    maxDiscountAmount: 15000,
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45일 후
    isActive: true,
  },
];

async function initCoupons() {
  try {
    await connectDB();

    console.log('📝 쿠폰 초기화 시작...');

    for (const couponData of INITIAL_COUPONS) {
      // 이미 존재하는 쿠폰인지 확인 (제목과 설명으로)
      const existing = await Coupon.findOne({
        title: couponData.title,
        description: couponData.description,
      });

      if (existing) {
        console.log(`⏭️  쿠폰 이미 존재: ${couponData.title} - ${couponData.description}`);
        // 기존 쿠폰 업데이트
        await Coupon.findByIdAndUpdate(existing._id, {
          ...couponData,
          isActive: true,
        });
        console.log(`✅ 쿠폰 업데이트: ${couponData.title}`);
      } else {
        const coupon = await Coupon.create(couponData);
        console.log(`✅ 쿠폰 생성: ${coupon.title} - ${coupon.description}`);
      }
    }

    console.log('✅ 쿠폰 초기화 완료!');
    process.exit(0);
  } catch (error) {
    console.error('❌ 쿠폰 초기화 오류:', error);
    process.exit(1);
  }
}

initCoupons();

