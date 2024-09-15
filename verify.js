const jwt = require('jsonwebtoken');
require('dotenv').config();

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).send({ message: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).send({ message: 'Access denied. Invalid token format.' });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN, (err, user) => {
    if (err) {
      return res.status(403).send({ message: 'Invalid token.' });
    }

    req.user = user;

    next();
  });
};

module.exports = verifyToken;