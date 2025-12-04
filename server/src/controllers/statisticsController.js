const Order = require('../models/order');
const User = require('../models/user');
const Product = require('../models/product');

async function getDashboardStats(req, res, next) {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // 총 매출 (전체 기간)
    const allOrders = await Order.find({}).lean();
    const totalRevenue = allOrders.reduce((sum, order) => {
      return sum + (order.summary?.grandTotal || order.payment?.amount || 0);
    }, 0);

    // 최근 30일 매출
    const recentOrders = await Order.find({
      createdAt: { $gte: thirtyDaysAgo },
    }).lean();
    const recentRevenue = recentOrders.reduce((sum, order) => {
      return sum + (order.summary?.grandTotal || order.payment?.amount || 0);
    }, 0);

    // 이전 30일 매출 (비교용)
    const previousOrders = await Order.find({
      createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
    }).lean();
    const previousRevenue = previousOrders.reduce((sum, order) => {
      return sum + (order.summary?.grandTotal || order.payment?.amount || 0);
    }, 0);

    // 총 주문 수
    const totalOrders = allOrders.length;
    const recentOrdersCount = recentOrders.length;
    const previousOrdersCount = previousOrders.length;

    // 총 고객 수
    const totalCustomers = await User.countDocuments({ user_type: 'customer' });
    const recentCustomers = await User.countDocuments({
      user_type: 'customer',
      createdAt: { $gte: thirtyDaysAgo },
    });
    const previousCustomers = await User.countDocuments({
      user_type: 'customer',
      createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
    });

    // 총 상품 수
    const totalProducts = await Product.countDocuments();
    const recentProducts = await Product.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });
    const previousProducts = await Product.countDocuments({
      createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
    });

    // 변화율 계산
    const revenueChange =
      previousRevenue > 0 ? ((recentRevenue - previousRevenue) / previousRevenue) * 100 : 0;
    const ordersChange =
      previousOrdersCount > 0
        ? ((recentOrdersCount - previousOrdersCount) / previousOrdersCount) * 100
        : 0;
    const customersChange =
      previousCustomers > 0
        ? ((recentCustomers - previousCustomers) / previousCustomers) * 100
        : 0;
    const productsChange =
      previousProducts > 0
        ? ((recentProducts - previousProducts) / previousProducts) * 100
        : 0;

    res.json({
      totalRevenue,
      recentRevenue,
      revenueChange,
      totalOrders,
      recentOrdersCount,
      ordersChange,
      totalCustomers,
      recentCustomers,
      customersChange,
      totalProducts,
      recentProducts,
      productsChange,
    });
  } catch (error) {
    next(error);
  }
}

async function getRevenueTrend(req, res, next) {
  try {
    const months = 6; // 최근 6개월
    const now = new Date();
    const data = [];

    for (let i = months - 1; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);

      const monthOrders = await Order.find({
        createdAt: { $gte: monthStart, $lte: monthEnd },
      }).lean();

      const revenue = monthOrders.reduce((sum, order) => {
        return sum + (order.summary?.grandTotal || order.payment?.amount || 0);
      }, 0);

      const monthName = monthStart.toLocaleDateString('en-US', { month: 'short' });

      data.push({
        month: monthName,
        revenue: Math.round(revenue),
        orders: monthOrders.length,
      });
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function getCategorySales(req, res, next) {
  try {
    // 최근 3개월 데이터 사용 (더 많은 데이터를 보여주기 위해)
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const orders = await Order.find({
      createdAt: { $gte: threeMonthsAgo, $lte: monthEnd },
    }).lean();

    // 모든 카테고리 가져오기 (데이터베이스에 있는 모든 카테고리)
    const allCategories = await Product.distinct('category');
    
    // 모든 주문 아이템에서 product ID 수집
    const productIds = new Set();
    orders.forEach((order) => {
      order.items?.forEach((item) => {
        if (item.product) {
          const productId = typeof item.product === 'object' ? item.product._id || item.product.toString() : item.product.toString();
          if (productId) {
            productIds.add(productId);
          }
        }
      });
    });

    // Product 문서에서 카테고리 정보 가져오기
    const products = await Product.find({
      _id: { $in: Array.from(productIds) },
    }).select('category').lean();

    const productCategoryMap = new Map();
    products.forEach((product) => {
      productCategoryMap.set(product._id.toString(), product.category || '기타');
    });

    // 모든 카테고리를 0으로 초기화
    const categoryMap = new Map();
    allCategories.forEach((category) => {
      if (category) {
        categoryMap.set(category, 0);
      }
    });
    // '기타' 카테고리도 추가
    if (!categoryMap.has('기타')) {
      categoryMap.set('기타', 0);
    }

    // 카테고리별 매출 집계
    orders.forEach((order) => {
      order.items?.forEach((item) => {
        const productId = item.product
          ? typeof item.product === 'object'
            ? item.product._id?.toString() || item.product.toString()
            : item.product.toString()
          : null;

        const category = productId && productCategoryMap.has(productId)
          ? productCategoryMap.get(productId)
          : '기타';

        const itemTotal = item.lineTotal || item.unitPrice * item.quantity - (item.lineDiscount || 0);

        if (categoryMap.has(category)) {
          categoryMap.set(category, categoryMap.get(category) + itemTotal);
        } else {
          categoryMap.set(category, itemTotal);
        }
      });
    });

    // 모든 카테고리를 반환 (매출이 0이어도 포함)
    const data = Array.from(categoryMap.entries())
      .map(([category, sales]) => ({
        category: category || '기타',
        sales: Math.round(sales),
      }))
      .sort((a, b) => b.sales - a.sales); // 매출 순으로 정렬

    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function getOrderStatusDistribution(req, res, next) {
  try {
    const orders = await Order.find({}).lean();

    const statusMap = {
      fulfilled: { name: 'Completed', value: 0, color: '#16a34a' },
      shipped: { name: 'Shipped', value: 0, color: '#3b82f6' },
      processing: { name: 'Processing', value: 0, color: '#f59e0b' },
      pending: { name: 'Pending', value: 0, color: '#f59e0b' },
      cancelled: { name: 'Cancelled', value: 0, color: '#ef4444' },
      refunded: { name: 'Refunded', value: 0, color: '#ef4444' },
    };

    orders.forEach((order) => {
      const status = (order.status || 'pending').toLowerCase();
      if (statusMap[status]) {
        statusMap[status].value += 1;
      } else {
        statusMap.pending.value += 1;
      }
    });

    const data = Object.values(statusMap).filter((item) => item.value > 0);

    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function getTopProducts(req, res, next) {
  try {
    const orders = await Order.find({}).lean();

    // 상품별 판매량과 매출 집계
    const productMap = new Map();

    orders.forEach((order) => {
      order.items?.forEach((item) => {
        const productId = item.product?.toString() || item.product;
        const productName = item.name || 'Unknown Product';
        const quantity = item.quantity || 0;
        const itemTotal = item.lineTotal || item.unitPrice * item.quantity - (item.lineDiscount || 0);

        if (productMap.has(productId)) {
          const existing = productMap.get(productId);
          existing.sales += quantity;
          existing.revenue += itemTotal;
        } else {
          productMap.set(productId, {
            name: productName,
            sales: quantity,
            revenue: itemTotal,
          });
        }
      });
    });

    const data = Array.from(productMap.values())
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5)
      .map((item) => ({
        name: item.name,
        sales: item.sales,
        revenue: Math.round(item.revenue),
      }));

    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function getStatisticsData(req, res, next) {
  try {
    const months = 6; // 최근 6개월
    const now = new Date();
    const monthlyStats = [];
    const acquisitionData = [];

    for (let i = months - 1; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);

      // 월별 주문 및 매출
      const monthOrders = await Order.find({
        createdAt: { $gte: monthStart, $lte: monthEnd },
      }).lean();

      const revenue = monthOrders.reduce((sum, order) => {
        return sum + (order.summary?.grandTotal || order.payment?.amount || 0);
      }, 0);

      // 월별 고객
      const monthCustomers = await User.countDocuments({
        user_type: 'customer',
        createdAt: { $gte: monthStart, $lte: monthEnd },
      });

      // 이전 달 고객 (재방문 고객 계산용)
      const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - i - 1, 1);
      const previousMonthEnd = new Date(now.getFullYear(), now.getMonth() - i, 0, 23, 59, 59, 999);
      const previousMonthCustomers = await User.find({
        user_type: 'customer',
        createdAt: { $gte: previousMonthStart, $lte: previousMonthEnd },
      }).select('_id').lean();

      // 이전 달 고객 중 이번 달 주문한 고객 (재방문 고객)
      const returningCustomerIds = new Set();
      monthOrders.forEach((order) => {
        if (order.user) {
          const userId = order.user.toString();
          if (previousMonthCustomers.some((c) => c._id.toString() === userId)) {
            returningCustomerIds.add(userId);
          }
        }
      });

      const monthName = monthStart.toLocaleDateString('en-US', { month: 'short' });

      monthlyStats.push({
        month: monthName,
        revenue: Math.round(revenue),
        orders: monthOrders.length,
        customers: monthCustomers,
        conversion: monthOrders.length > 0 ? ((monthOrders.length / Math.max(monthCustomers, 1)) * 100).toFixed(1) : 0,
      });

      acquisitionData.push({
        month: monthName,
        newCustomers: monthCustomers,
        returningCustomers: returningCustomerIds.size,
      });
    }

    res.json({
      monthlyStats,
      acquisitionData,
    });
  } catch (error) {
    next(error);
  }
}

async function getCategoryPerformance(req, res, next) {
  try {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const currentOrders = await Order.find({
      createdAt: { $gte: currentMonthStart, $lte: currentMonthEnd },
    }).lean();

    const previousOrders = await Order.find({
      createdAt: { $gte: previousMonthStart, $lte: previousMonthEnd },
    }).lean();

    // 카테고리별 집계
    const categoryMap = new Map();

    // 현재 달
    currentOrders.forEach((order) => {
      order.items?.forEach((item) => {
        const category = item.product?.category || '기타';
        const itemTotal = item.lineTotal || item.unitPrice * item.quantity - (item.lineDiscount || 0);

        if (!categoryMap.has(category)) {
          categoryMap.set(category, {
            revenue: 0,
            orders: 0,
            previousRevenue: 0,
            previousOrders: 0,
          });
        }

        const cat = categoryMap.get(category);
        cat.revenue += itemTotal;
        cat.orders += 1;
      });
    });

    // 이전 달
    previousOrders.forEach((order) => {
      order.items?.forEach((item) => {
        const category = item.product?.category || '기타';
        const itemTotal = item.lineTotal || item.unitPrice * item.quantity - (item.lineDiscount || 0);

        if (!categoryMap.has(category)) {
          categoryMap.set(category, {
            revenue: 0,
            orders: 0,
            previousRevenue: 0,
            previousOrders: 0,
          });
        }

        const cat = categoryMap.get(category);
        cat.previousRevenue += itemTotal;
        cat.previousOrders += 1;
      });
    });

    const data = Array.from(categoryMap.entries())
      .map(([category, stats]) => {
        const avgOrder = stats.orders > 0 ? Math.round(stats.revenue / stats.orders) : 0;
        const growth =
          stats.previousRevenue > 0
            ? ((stats.revenue - stats.previousRevenue) / stats.previousRevenue) * 100
            : 0;

        return {
          category,
          revenue: Math.round(stats.revenue),
          orders: stats.orders,
          avgOrder,
          growth: Math.round(growth * 10) / 10,
        };
      })
      .sort((a, b) => b.revenue - a.revenue);

    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function getStatisticsHighlights(req, res, next) {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // 최근 30일 주문
    const recentOrders = await Order.find({
      createdAt: { $gte: thirtyDaysAgo },
    }).lean();

    const recentRevenue = recentOrders.reduce((sum, order) => {
      return sum + (order.summary?.grandTotal || order.payment?.amount || 0);
    }, 0);

    // 평균 주문 금액
    const avgOrderValue = recentOrders.length > 0 ? recentRevenue / recentOrders.length : 0;

    // 이전 30일 주문
    const previousOrders = await Order.find({
      createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
    }).lean();

    const previousRevenue = previousOrders.reduce((sum, order) => {
      return sum + (order.summary?.grandTotal || order.payment?.amount || 0);
    }, 0);

    const previousAvgOrderValue = previousOrders.length > 0 ? previousRevenue / previousOrders.length : 0;
    const avgOrderValueChange =
      previousAvgOrderValue > 0
        ? ((avgOrderValue - previousAvgOrderValue) / previousAvgOrderValue) * 100
        : 0;

    // 전환율 (주문 수 / 고객 수)
    const recentCustomers = await User.countDocuments({
      user_type: 'customer',
      createdAt: { $gte: thirtyDaysAgo },
    });
    const conversionRate = recentCustomers > 0 ? (recentOrders.length / recentCustomers) * 100 : 0;

    const previousCustomers = await User.countDocuments({
      user_type: 'customer',
      createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
    });
    const previousConversionRate = previousCustomers > 0 ? (previousOrders.length / previousCustomers) * 100 : 0;
    const conversionRateChange =
      previousConversionRate > 0
        ? ((conversionRate - previousConversionRate) / previousConversionRate) * 100
        : 0;

    // 고객 생애 가치 (평균 주문 금액 * 평균 주문 횟수)
    const customerOrders = await Order.aggregate([
      {
        $match: {
          user: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: '$user',
          orderCount: { $sum: 1 },
          totalSpent: {
            $sum: { $ifNull: ['$summary.grandTotal', { $ifNull: ['$payment.amount', 0] }] },
          },
        },
      },
    ]);

    const avgLifetimeValue =
      customerOrders.length > 0
        ? customerOrders.reduce((sum, c) => sum + c.totalSpent, 0) / customerOrders.length
        : 0;

    const previousCustomerOrders = await Order.aggregate([
      {
        $match: {
          user: { $exists: true, $ne: null },
          createdAt: { $lt: thirtyDaysAgo, $gte: sixtyDaysAgo },
        },
      },
      {
        $group: {
          _id: '$user',
          totalSpent: {
            $sum: { $ifNull: ['$summary.grandTotal', { $ifNull: ['$payment.amount', 0] }] },
          },
        },
      },
    ]);

    const previousAvgLifetimeValue =
      previousCustomerOrders.length > 0
        ? previousCustomerOrders.reduce((sum, c) => sum + c.totalSpent, 0) / previousCustomerOrders.length
        : 0;
    const lifetimeValueChange =
      previousAvgLifetimeValue > 0
        ? ((avgLifetimeValue - previousAvgLifetimeValue) / previousAvgLifetimeValue) * 100
        : 0;

    // 장바구니 이탈률 (취소된 주문 / 전체 주문)
    const cancelledOrders = await Order.countDocuments({
      status: 'cancelled',
      createdAt: { $gte: thirtyDaysAgo },
    });
    const cartAbandonmentRate =
      recentOrders.length > 0 ? (cancelledOrders / recentOrders.length) * 100 : 0;

    const previousCancelledOrders = await Order.countDocuments({
      status: 'cancelled',
      createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
    });
    const previousCartAbandonmentRate =
      previousOrders.length > 0 ? (previousCancelledOrders / previousOrders.length) * 100 : 0;
    const cartAbandonmentChange =
      previousCartAbandonmentRate > 0
        ? ((cartAbandonmentRate - previousCartAbandonmentRate) / previousCartAbandonmentRate) * 100
        : 0;

    res.json({
      avgOrderValue: Math.round(avgOrderValue),
      avgOrderValueChange: Math.round(avgOrderValueChange * 10) / 10,
      conversionRate: Math.round(conversionRate * 10) / 10,
      conversionRateChange: Math.round(conversionRateChange * 10) / 10,
      lifetimeValue: Math.round(avgLifetimeValue),
      lifetimeValueChange: Math.round(lifetimeValueChange * 10) / 10,
      cartAbandonmentRate: Math.round(cartAbandonmentRate * 10) / 10,
      cartAbandonmentChange: Math.round(cartAbandonmentChange * 10) / 10,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDashboardStats,
  getRevenueTrend,
  getCategorySales,
  getOrderStatusDistribution,
  getTopProducts,
  getStatisticsData,
  getCategoryPerformance,
  getStatisticsHighlights,
};

