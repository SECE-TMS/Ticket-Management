import type { Request, Response, NextFunction } from 'express';
import { ZodError, type ZodSchema } from 'zod';

type RequestSource = 'body' | 'query' | 'params';

const validate =
  (schema: ZodSchema, source: RequestSource = 'body') =>
  (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[source]);
      (req as Request & Record<RequestSource, unknown>)[source] = parsed;
      next();
    } catch (err) {
      next(err instanceof ZodError ? err : err);
    }
  };

export default validate;
