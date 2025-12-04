const Order = require('../src/models/order');
const { connectToDatabase } = require('../src/config/database');
require('dotenv').config();

function computeOrderTotals(items = [], summaryOverrides = {}) {
  const subtotal = items.reduce((sum, item) => sum + (item.unitPrice || 0) * (item.quantity || 0), 0);
  const discountTotal = items.reduce((sum, item) => sum + (item.lineDiscount || 0), 0);
  const shippingFee = Number(summaryOverrides.shippingFee ?? 0);
  const tax = Number(summaryOverrides.tax ?? 0);
  const grandTotal = subtotal - discountTotal + shippingFee + tax;

  return {
    currency: (summaryOverrides.currency || 'KRW').toUpperCase(),
    subtotal,
    discountTotal,
    shippingFee,
    tax,
    grandTotal,
  };
}

async function fixOrderAmounts() {
  try {
    const mongoUri =
      process.env.MONGODB_ATLAS_URL ||
      process.env.MONGODB_URI ||
      'mongodb://127.0.0.1:27017/shopping-mall-demo';

    console.log('Connecting to database...');
    await connectToDatabase(mongoUri);

    // 모든 주문 가져오기
    const orders = await Order.find().lean();
    console.log(`Found ${orders.length} orders to check...\n`);

    let fixedCount = 0;
    let errorCount = 0;

    for (const order of orders) {
      try {
        const items = order.items || [];
        
        // 올바른 금액 계산
        const computedSummary = computeOrderTotals(items, {
          shippingFee: order.summary?.shippingFee ?? 0,
          tax: order.summary?.tax ?? 0,
          currency: order.summary?.currency || 'KRW',
        });

        // 각 아이템의 lineTotal도 재계산
        const updatedItems = items.map((item) => {
          const unitPrice = item.unitPrice || 0;
          const quantity = item.quantity || 0;
          const lineDiscount = item.lineDiscount || 0;
          const lineTotal = unitPrice * quantity - lineDiscount;

          return {
            ...item,
            lineTotal,
          };
        });

        // 변경사항이 있는지 확인 (소수점 오차 고려)
        const tolerance = 1; // 1원 오차 허용
        const needsUpdate =
          Math.abs((order.summary?.subtotal || 0) - computedSummary.subtotal) > tolerance ||
          Math.abs((order.summary?.discountTotal || 0) - computedSummary.discountTotal) > tolerance ||
          Math.abs((order.summary?.grandTotal || 0) - computedSummary.grandTotal) > tolerance ||
          Math.abs((order.payment?.amount || 0) - computedSummary.grandTotal) > tolerance ||
          items.some((item) => {
            const expectedLineTotal = (item.unitPrice || 0) * (item.quantity || 0) - (item.lineDiscount || 0);
            return Math.abs((item.lineTotal || 0) - expectedLineTotal) > tolerance;
          });

        if (needsUpdate) {
          // 디버깅 정보 출력
          if (fixedCount < 5) {
            console.log(`\nOrder ${order.orderNumber} details:`);
            console.log(`  Current: subtotal=${order.summary?.subtotal}, discount=${order.summary?.discountTotal}, shipping=${order.summary?.shippingFee}, tax=${order.summary?.tax}, grandTotal=${order.summary?.grandTotal}, payment.amount=${order.payment?.amount}`);
            console.log(`  Computed: subtotal=${computedSummary.subtotal}, discount=${computedSummary.discountTotal}, shipping=${computedSummary.shippingFee}, tax=${computedSummary.tax}, grandTotal=${computedSummary.grandTotal}`);
          }
          await Order.findByIdAndUpdate(
            order._id,
            {
              $set: {
                'summary.subtotal': computedSummary.subtotal,
                'summary.discountTotal': computedSummary.discountTotal,
                'summary.shippingFee': computedSummary.shippingFee,
                'summary.tax': computedSummary.tax,
                'summary.grandTotal': computedSummary.grandTotal,
                'payment.amount': computedSummary.grandTotal,
                items: updatedItems,
              },
            },
            { new: true }
          );

          console.log(
            `✅ Fixed order ${order.orderNumber}: ${computedSummary.grandTotal.toLocaleString()}원 (was ${order.summary?.grandTotal?.toLocaleString() || order.payment?.amount?.toLocaleString() || 'N/A'}원)`
          );
          fixedCount++;
        }
      } catch (error) {
        console.error(`❌ Failed to fix order ${order.orderNumber}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n✨ Order amount fix completed!`);
    console.log(`   Fixed: ${fixedCount} orders`);
    console.log(`   Errors: ${errorCount} orders`);
    console.log(`   Unchanged: ${orders.length - fixedCount - errorCount} orders`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixOrderAmounts();

