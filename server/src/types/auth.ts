import type { Request } from 'express';
import type { IUserDocument } from '../models/User';

export interface AuthUser {
  id: string;
  role: string;
  department?: string | null;
}

export interface AuthRequest extends Request {
  user?: IUserDocument;
}
