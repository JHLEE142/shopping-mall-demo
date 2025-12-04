const bcrypt = require('bcryptjs');
const User = require('../src/models/user');
const { connectToDatabase } = require('../src/config/database');
require('dotenv').config();

const USERS_TO_CREATE = [
  {
    name: '김민수',
    email: 'kim.minsu@example.com',
    password: 'password123',
    user_type: 'customer',
    address: '서울특별시 강남구 테헤란로 123',
  },
  {
    name: '이지은',
    email: 'lee.jieun@example.com',
    password: 'password123',
    user_type: 'customer',
    address: '서울특별시 서초구 서초대로 456',
  },
  {
    name: '박준호',
    email: 'park.junho@example.com',
    password: 'password123',
    user_type: 'customer',
    address: '서울특별시 송파구 올림픽로 789',
  },
  {
    name: '최수진',
    email: 'choi.sujin@example.com',
    password: 'password123',
    user_type: 'customer',
    address: '서울특별시 마포구 홍대로 234',
  },
  {
    name: '정현우',
    email: 'jung.hyunwoo@example.com',
    password: 'password123',
    user_type: 'customer',
    address: '서울특별시 용산구 한강대로 345',
  },
  {
    name: '한소영',
    email: 'han.soyoung@example.com',
    password: 'password123',
    user_type: 'customer',
    address: '서울특별시 강동구 천호대로 456',
  },
  {
    name: '윤태영',
    email: 'yoon.taeyoung@example.com',
    password: 'password123',
    user_type: 'customer',
    address: '서울특별시 노원구 상계로 567',
  },
  {
    name: '강미영',
    email: 'kang.miyoung@example.com',
    password: 'password123',
    user_type: 'customer',
    address: '서울특별시 은평구 은평로 678',
  },
  {
    name: '조성민',
    email: 'cho.sungmin@example.com',
    password: 'password123',
    user_type: 'customer',
    address: '서울특별시 양천구 목동로 789',
  },
  {
    name: '임다은',
    email: 'lim.daeun@example.com',
    password: 'password123',
    user_type: 'customer',
    address: '서울특별시 구로구 구로대로 890',
  },
  {
    name: '관리자2',
    email: 'admin2@example.com',
    password: 'admin123',
    user_type: 'admin',
    address: null,
  },
];

async function createUsers() {
  try {
    const mongoUri =
      process.env.MONGODB_ATLAS_URL ||
      process.env.MONGODB_URI ||
      'mongodb://127.0.0.1:27017/shopping-mall-demo';

    console.log('Connecting to database...');
    await connectToDatabase(mongoUri);

    console.log(`Creating ${USERS_TO_CREATE.length} users...`);

    for (const userData of USERS_TO_CREATE) {
      try {
        // 이미 존재하는지 확인
        const existingUser = await User.findOne({ email: userData.email });
        if (existingUser) {
          console.log(`⚠️  User ${userData.email} already exists. Skipping...`);
          continue;
        }

        // 비밀번호 해시화
        const hashedPassword = await bcrypt.hash(userData.password, 10);

        // 사용자 생성
        const user = await User.create({
          ...userData,
          password: hashedPassword,
          email: userData.email.toLowerCase().trim(),
        });

        console.log(`✅ Created user: ${user.name} (${user.email}) - ${user.user_type}`);
      } catch (error) {
        if (error.code === 11000) {
          console.log(`⚠️  User ${userData.email} already exists. Skipping...`);
        } else {
          console.error(`❌ Failed to create user ${userData.email}:`, error.message);
        }
      }
    }

    console.log('\n✨ User creation completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createUsers();

