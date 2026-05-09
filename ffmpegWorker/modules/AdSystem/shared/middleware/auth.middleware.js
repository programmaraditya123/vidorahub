// shared/middleware/auth.middleware.js
// Authentication & role gating for the Ad System.
// Roles: 2 = admin, 3 = brand.
const jwt = require('jsonwebtoken');
require('dotenv').config();

const requireSignIn = async (req, res, next) => {
  try {
    let token = req.header('Authorization');
    if (!token) return res.status(401).json({ message: 'token is not present' });
    if (token.startsWith('Bearer ')) token = token.slice(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role === 2) return next();
  return res.status(403).json({ message: 'admin only' });
};

const requireBrand = (req, res, next) => {
  if (req.user?.role === 3) return next();
  return res.status(403).json({ message: 'brand only' });
};

module.exports = { requireSignIn, requireAdmin, requireBrand };
