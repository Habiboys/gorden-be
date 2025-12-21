const jwt = require('jsonwebtoken');

// Optional auth middleware: populates req.user if token is present, but doesn't reject if missing
module.exports = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        // No token, continue without user
        req.user = null;
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        req.user = decoded;
        next();
    } catch (err) {
        // Invalid token, continue without user
        req.user = null;
        next();
    }
};
