import dotenv from 'dotenv';
import app from './src/app';
import connectDB from './src/config/db';
import logger from './src/utils/logger';

dotenv.config();

const PORT = Number(process.env.PORT) || 5000;

const start = async (): Promise<void> => {
  await connectDB();
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  });
};

start().catch((err: unknown) => {
  logger.error('Failed to start server', err);
  process.exit(1);
});
