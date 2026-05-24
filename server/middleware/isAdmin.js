module.exports = function (req, res, next) {
  console.log('isAdmin middleware - session contents:', req.session);
  if (req.session && req.session.admin) {
    next();
  } else {
    console.warn('Unauthorized request to', req.originalUrl);
    res.status(401).json({ error: 'Unauthorized' });
  }
};
