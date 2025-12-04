const jwt = require('jsonwebtoken');
const User = require('../models/user');

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

    if (!token) {
      return res.status(401).json({ message: '인증이 필요합니다.' });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('Missing JWT_SECRET environment variable');
    }

    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: '세션이 만료되었습니다. 다시 로그인해주세요.' });
      }
      throw error;
    }

    const user = await User.findById(decoded.sub);
    if (!user) {
      return res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = authenticate;

