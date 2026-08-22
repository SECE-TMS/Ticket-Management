import path from 'path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';

import routes from './routes';
import { notFound, errorHandler } from './middlewares/error.middleware';

const app = express();

app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const configuredClientUrls = (process.env.CLIENT_URL || 'http://localhost:5173')
        .split(',')
        .map((u) => u.trim().replace(/\/+$/, ''));
      const normalizedOrigin = origin.replace(/\/+$/, '');
      if (
        configuredClientUrls.includes(normalizedOrigin) ||
        configuredClientUrls.includes('*') ||
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalizedOrigin) ||
        /\.vercel\.app$/.test(normalizedOrigin)
      ) {
        return callback(null, true);
      }
      return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
  })
);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  mongoSanitize({
    replaceWith: '_',
  })
);

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/v1', routes);

app.use(notFound);
app.use(errorHandler);

export default app;
