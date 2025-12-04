const { Schema, model } = require('mongoose');

const PRODUCT_CATEGORIES = ['상의', '하의', '악세사리', '아우터', '신발', '기타'];

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
    category: {
      type: String,
      required: true,
      enum: PRODUCT_CATEGORIES,
    },
    image: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
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


