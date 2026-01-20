const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const PasswordResetToken = require('../models/passwordResetToken');

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function normalizeEmail(email) {
  return (email || '').trim().toLowerCase();
}

async function requestPasswordReset(req, res, next) {
  try {
    const email = normalizeEmail(req.body.email);
    if (!email) {
      return res.status(400).json({ message: '이메일을 입력해주세요.' });
    }

    const user = await User.findOne({ email });
    if (user) {
      const token = crypto.randomBytes(24).toString('hex');
      const tokenHash = hashToken(token);
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

      await PasswordResetToken.create({
        user: user._id,
        email,
        tokenHash,
        expiresAt,
      });

      const response = { message: '비밀번호 재설정 안내를 전송했습니다.' };
      if (process.env.NODE_ENV !== 'production') {
        response.resetToken = token;
        response.expiresAt = expiresAt;
      }
      return res.json(response);
    }

    return res.json({ message: '비밀번호 재설정 안내를 전송했습니다.' });
  } catch (error) {
    next(error);
  }
}

async function verifyPasswordResetToken(req, res, next) {
  try {
    const token = req.body.token || req.query.token;
    if (!token) {
      return res.status(400).json({ message: '토큰이 필요합니다.' });
    }

    const tokenHash = hashToken(token);
    const resetToken = await PasswordResetToken.findOne({
      tokenHash,
      usedAt: null,
      expiresAt: { $gt: new Date() },
    });

    if (!resetToken) {
      return res.status(400).json({ message: '유효하지 않은 토큰입니다.' });
    }

    return res.json({ valid: true });
  } catch (error) {
    next(error);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { token, password, confirmPassword } = req.body;
    if (!token) {
      return res.status(400).json({ message: '토큰이 필요합니다.' });
    }
    if (!password) {
      return res.status(400).json({ message: '비밀번호를 입력해주세요.' });
    }
    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ message: '비밀번호가 일치하지 않습니다.' });
    }

    const tokenHash = hashToken(token);
    const resetToken = await PasswordResetToken.findOne({
      tokenHash,
      usedAt: null,
      expiresAt: { $gt: new Date() },
    });

    if (!resetToken) {
      return res.status(400).json({ message: '유효하지 않은 토큰입니다.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.findByIdAndUpdate(resetToken.user, { password: hashedPassword });

    resetToken.usedAt = new Date();
    await resetToken.save();

    return res.json({ message: '비밀번호가 변경되었습니다.' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  requestPasswordReset,
  verifyPasswordResetToken,
  resetPassword,
};
