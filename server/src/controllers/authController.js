import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { signToken, setAuthCookie, clearAuthCookie } from '../utils/token.js';

const publicUser = (u) => ({
  id: u.id || u._id,
  name: u.name,
  email: u.email,
  rollNumber: u.rollNumber,
  role: u.role,
  avatarUrl: u.avatarUrl,
});

export const register = asyncHandler(async (req, res) => {
  const { name, rollNumber, email, password } = req.body;
  const user = await User.create({
    name,
    rollNumber,
    email,
    passwordHash: await User.hashPassword(password),
  });
  setAuthCookie(res, signToken(user));
  res.status(201).json({ data: publicUser(user) });
});

export const login = asyncHandler(async (req, res) => {
  const { identifier, password, remember } = req.body;
  const isEmail = identifier.includes('@');
  const user = await User.findOne(
    isEmail ? { email: identifier.toLowerCase() } : { rollNumber: identifier.toUpperCase() }
  ).select('+passwordHash');

  if (!user || !(await user.verifyPassword(password))) {
    throw new ApiError(401, 'Incorrect email/roll number or password');
  }
  if (user.isActive === false) throw new ApiError(403, 'This account has been deactivated. Contact the campus admin.');
  setAuthCookie(res, signToken(user, remember), remember);
  res.json({ data: publicUser(user) });
});

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export const googleLogin = asyncHandler(async (req, res) => {
  if (!env.GOOGLE_CLIENT_ID) throw new ApiError(501, 'Google login is not configured');
  const ticket = await googleClient.verifyIdToken({
    idToken: req.body.credential,
    audience: env.GOOGLE_CLIENT_ID,
  });
  const p = ticket.getPayload();
  if (!p?.email_verified) throw new ApiError(401, 'Google email is not verified');

  let user = await User.findOne({ $or: [{ googleId: p.sub }, { email: p.email.toLowerCase() }] });
  if (!user) {
    user = await User.create({ name: p.name, email: p.email, googleId: p.sub, avatarUrl: p.picture });
  } else if (!user.googleId) {
    user.googleId = p.sub;
    await user.save();
  }
  if (user.isActive === false) throw new ApiError(403, 'This account has been deactivated. Contact the campus admin.');
  setAuthCookie(res, signToken(user));
  res.json({ data: publicUser(user) });
});

export const logout = (_req, res) => {
  clearAuthCookie(res);
  res.status(204).end();
};

export const me = (req, res) => res.json({ data: publicUser(req.user) });
