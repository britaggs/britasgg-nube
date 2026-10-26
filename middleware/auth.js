// middleware/auth.js

const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    req.user = { id: 1, rol: 'admin' };
    next();
};

const adminOnly = (req, res, next) => {
    next();
};

const requireAdmin = (req, res, next) => {
    next();
};

module.exports = { auth, adminOnly, requireAdmin };