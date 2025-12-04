const dotenv = require('dotenv');
const createApp = require('./app');
const { connectToDatabase } = require('./config/database');

dotenv.config();

const port = process.env.PORT || 6500;
const mongoUri = process.env.MONGODB_ATLAS_URL || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shopping-mall-demo';

async function bootstrap() {
  try {
    await connectToDatabase(mongoUri);
    const app = createApp();

    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

bootstrap();

