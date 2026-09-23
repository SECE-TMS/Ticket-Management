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

const allowedExplicitOrigins = [
  process.env.CLIENT_URL,
  process.env.CLIENT_ORIGIN,
  process.env.CORS_ORIGIN,
  'https://tms.sece.ac.in',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
]
  .filter(Boolean)
  .flatMap((u) => String(u).split(',').map((s) => s.trim().replace(/\/$/, '')));

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      const normalized = origin.trim().replace(/\/$/, '');

      // Check explicit allowed origins
      if (allowedExplicitOrigins.includes(normalized)) {
        return callback(null, true);
      }

      // Allow sece.ac.in and all subdomains (e.g. https://tms.sece.ac.in)
      if (/^https?:\/\/([a-z0-9-]+\.)*sece\.ac\.in$/i.test(normalized)) {
        return callback(null, true);
      }

      // Allow Vercel preview/production deployments
      if (/^https:\/\/([a-z0-9-]+)\.vercel\.app$/i.test(normalized)) {
        return callback(null, true);
      }

      // Allow localhost and local network IP addresses
      if (/^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/i.test(normalized)) {
        return callback(null, true);
      }

      // Allow all in non-production
      if (process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }

      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['Set-Cookie'],
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
