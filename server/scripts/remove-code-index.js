const mongoose = require('mongoose');
require('dotenv').config();

async function removeCodeIndex() {
  try {
    const mongoUri = process.env.MONGODB_ATLAS_URL || process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('MongoDB connection string not found in environment variables');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const indexes = await db.collection('coupons').indexes();
    
    console.log('Current indexes:', indexes.map(idx => idx.name).join(', '));
    
    const codeIndex = indexes.find(idx => idx.name === 'code_1');
    if (codeIndex) {
      console.log('Found code_1 index, attempting to drop...');
      await db.collection('coupons').dropIndex('code_1');
      console.log('✓ code_1 index dropped successfully');
    } else {
      console.log('code_1 index not found, nothing to remove');
    }

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

removeCodeIndex();

