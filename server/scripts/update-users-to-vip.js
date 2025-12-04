const User = require('../src/models/user');
const { connectToDatabase } = require('../src/config/database');
require('dotenv').config();

async function updateUsersToVIP() {
  try {
    const mongoUri =
      process.env.MONGODB_ATLAS_URL ||
      process.env.MONGODB_URI ||
      'mongodb://127.0.0.1:27017/shopping-mall-demo';

    console.log('Connecting to database...');
    await connectToDatabase(mongoUri);

    // customer 타입 사용자 중 처음 3명 가져오기
    const customers = await User.find({ user_type: 'customer' })
      .sort({ createdAt: 1 })
      .limit(3)
      .lean();

    if (customers.length === 0) {
      console.log('❌ No customers found.');
      process.exit(1);
    }

    console.log(`Updating ${customers.length} customers to VIP status...`);

    // 90일 이상 전 날짜로 설정 (100일 전)
    const vipDate = new Date();
    vipDate.setDate(vipDate.getDate() - 100);

    for (const customer of customers) {
      try {
        await User.findByIdAndUpdate(customer._id, {
          $set: {
            createdAt: vipDate,
            updatedAt: new Date(),
          },
        });

        console.log(`✅ Updated ${customer.name} (${customer.email}) to VIP`);
      } catch (error) {
        console.error(`❌ Failed to update ${customer.email}:`, error.message);
      }
    }

    console.log('\n✨ VIP update completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

updateUsersToVIP();

