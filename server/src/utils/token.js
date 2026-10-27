import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const signToken = (user, remember = false) =>
  jwt.sign({ sub: user.id || user._id, role: user.role }, env.JWT_SECRET, {
    expiresIn: remember ? '30d' : '1d',
  });

export const setAuthCookie = (res, token, remember = false) =>
  res.cookie('token', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: (remember ? 30 : 1) * 24 * 60 * 60 * 1000,
  });

export const clearAuthCookie = (res) =>
  res.clearCookie('token', {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
  });
