const dotenv = require('dotenv');
const createApp = require('./app');
const { connectToDatabase } = require('./config/database');

dotenv.config();

const port = process.env.PORT || 5000;
const mongoUri = process.env.MONGODB_URI || '';

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

