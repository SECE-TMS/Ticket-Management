import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../server/src/app';
import connectDB from '../server/src/config/db';

let databaseConnection: Promise<void> | null = null;

const handler = async (req: VercelRequest, res: VercelResponse): Promise<void> => {
  databaseConnection ??= connectDB();

  try {
    await databaseConnection;
  } catch (error) {
    databaseConnection = null;
    throw error;
  }

  app(req, res);
};

export default handler;
