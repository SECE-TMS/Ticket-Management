import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';

export interface TokenPayload {
  sub: string;
  role?: string;
  purpose?: string;
}

const accessSecret = (): string => {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error('JWT_ACCESS_SECRET is not defined');
  return secret;
};

const refreshSecret = (): string => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error('JWT_REFRESH_SECRET is not defined');
  return secret;
};

export const generateAccessToken = (payload: TokenPayload): string => {
  const options: SignOptions = {
    expiresIn: (process.env.JWT_ACCESS_EXPIRES || '15m') as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, accessSecret(), options);
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  const options: SignOptions = {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES || '7d') as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, refreshSecret(), options);
};

export const verifyAccessToken = (token: string): JwtPayload & TokenPayload =>
  jwt.verify(token, accessSecret()) as JwtPayload & TokenPayload;

export const verifyRefreshToken = (token: string): JwtPayload & TokenPayload =>
  jwt.verify(token, refreshSecret()) as JwtPayload & TokenPayload;

export const generateResetToken = (payload: TokenPayload): string => {
  const options: SignOptions = { expiresIn: '1h' };
  return jwt.sign(payload, accessSecret(), options);
};

export const verifyResetToken = (token: string): JwtPayload & TokenPayload =>
  jwt.verify(token, accessSecret()) as JwtPayload & TokenPayload;
