const { Schema, model } = require('mongoose');

const recentlyViewedProductSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    viewedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// 복합 인덱스: 사용자별 최근 조회 순서 조회용
recentlyViewedProductSchema.index({ user: 1, viewedAt: -1 });
// 중복 방지 인덱스: 같은 사용자가 같은 상품을 여러 번 조회해도 하나만 유지
recentlyViewedProductSchema.index({ user: 1, product: 1 }, { unique: true });

// 상품 조회 시 기존 기록이 있으면 viewedAt만 업데이트, 없으면 새로 생성
recentlyViewedProductSchema.statics.addOrUpdate = async function (userId, productId) {
  try {
    // findOneAndUpdate를 사용하여 upsert 수행 (race condition 방지)
    const result = await this.findOneAndUpdate(
      { user: userId, product: productId },
      { viewedAt: new Date() },
      { 
        upsert: true, 
        new: true,
        setDefaultsOnInsert: true 
      }
    );
    return result;
  } catch (error) {
    // unique 인덱스 위반 에러가 발생하면 (동시 요청으로 인한) 다시 조회하여 반환
    if (error.code === 11000) {
      const existing = await this.findOne({ user: userId, product: productId });
      if (existing) {
        existing.viewedAt = new Date();
        await existing.save();
        return existing;
      }
      throw error;
    }
    throw error;
  }
};

module.exports = model('RecentlyViewedProduct', recentlyViewedProductSchema);

