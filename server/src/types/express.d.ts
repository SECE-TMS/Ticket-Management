import type { IUserDocument } from '../models/User';
import 'multer';

declare global {
  namespace Express {
    interface Request {
      user?: IUserDocument;
      file?: Multer.File;
      files?: Multer.File[] | { [fieldname: string]: Multer.File[] };
    }
  }
}

export {};
