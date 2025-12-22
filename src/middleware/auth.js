const jwt = require('jsonwebtoken');

/**
 * Unified Auth Middleware
 * 
 * Usage:
 * - auth() - Required authentication, any role
 * - auth('ADMIN') - Required authentication, admin only
 * - auth('USER') - Required authentication, user only
 * - auth(['ADMIN', 'USER']) - Required authentication, multiple roles allowed
 * - auth(null, { optional: true }) - Optional authentication (populates req.user if token present)
 * 
 * Examples:
 *   router.get('/public', auth(null, { optional: true }), controller);
 *   router.post('/protected', auth(), controller);
 *   router.delete('/admin-only', auth('ADMIN'), controller);
 *   router.put('/multi-role', auth(['ADMIN', 'MODERATOR']), controller);
 */
const auth = (allowedRoles = null, options = {}) => {
    const { optional = false } = options;

    return (req, res, next) => {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        // No token provided
        if (!token) {
            if (optional) {
                req.user = null;
                return next();
            }
            return res.status(401).json({ message: 'No token, authorization denied' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
            req.user = decoded;

            // If no specific roles required, just authenticate
            if (!allowedRoles) {
                return next();
            }

            // Normalize allowedRoles to array
            const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

            // Check if user has one of the allowed roles
            if (roles.includes(req.user.role)) {
                return next();
            }

            // User doesn't have required role
            return res.status(403).json({
                message: `Access denied. Required role: ${roles.join(' or ')}.`
            });

        } catch (err) {
            if (optional) {
                req.user = null;
                return next();
            }
            return res.status(401).json({ message: 'Token is not valid' });
        }
    };
};

module.exports = auth;
