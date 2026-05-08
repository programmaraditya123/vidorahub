// shared/middleware/optionalAuth.middleware.js
// For public endpoints (feed, ad serving) where auth is optional.
// If a valid Bearer token is present, attaches req.user; otherwise continues anonymously.
const jwt = require('jsonwebtoken');

const optionalAuth = (req, res, next) => {
  const authorizationHeader = req.header('Authorization');

  if (authorizationHeader) {
    try {
      const tokenValue = authorizationHeader.startsWith('Bearer ')
        ? authorizationHeader.slice(7)
        : authorizationHeader;
      req.user = jwt.verify(tokenValue, process.env.JWT_SECRET);
    } catch (_) {
      // Public endpoint: ignore invalid tokens and continue anonymously.
    }
  }

  next();
};

module.exports = { optionalAuth };
