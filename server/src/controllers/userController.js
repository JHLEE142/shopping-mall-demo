const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { createTrustedDevice } = require('./trustedDeviceController');

function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  const userObj = user.toObject ? user.toObject() : { ...user };
  delete userObj.password;
  delete userObj.__v;

  return userObj;
}

function createAuthToken(userId) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('Missing JWT_SECRET environment variable');
  }

  return jwt.sign({ sub: userId }, secret, { expiresIn: '60m' });
}

async function createUser(req, res, next) {
  try {
    const { password, confirmPassword, ...rest } = req.body;

    if (!password) {
      return res.status(400).json({ message: '비밀번호를 입력해주세요.' });
    }

    const normalizedEmail = rest.email ? rest.email.trim().toLowerCase() : '';
    if (!normalizedEmail) {
      return res.status(400).json({ message: '이메일을 입력해주세요.' });
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ message: '올바른 이메일 주소를 입력해주세요.' });
    }

    // 비밀번호 확인
    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ message: '비밀번호가 일치하지 않습니다.' });
    }

    // 이미 존재하는 이메일인지 확인
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: '이미 사용 중인 이메일입니다.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      ...rest,
      email: normalizedEmail,
      password: hashedPassword,
    });

    res.status(201).json(sanitizeUser(user));
  } catch (error) {
    // MongoDB duplicate key error 처리
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'email';
      if (field === 'email') {
        return res.status(409).json({ message: '이미 사용 중인 이메일입니다.' });
      }
      return res.status(409).json({ message: '이미 사용 중인 정보입니다.' });
    }

    // Validation error 처리
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors || {}).map((err) => err.message);
      return res.status(400).json({ message: messages[0] || '입력 정보를 확인해주세요.' });
    }

    // 기타 에러는 사용자 친화적인 메시지로 변환
    console.error('회원가입 오류:', error);
    res.status(500).json({ message: '회원가입 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' });
  }
}

async function getUsers(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);
    const skip = (page - 1) * limit;
    const userType = req.query.user_type; // 'customer' or 'admin' 필터링

    const filter = {};
    if (userType) {
      filter.user_type = userType;
    }

    const [items, totalItems] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
    ]);

    const totalPages = Math.max(Math.ceil(totalItems / limit), 1);

    res.json({
      page,
      limit,
      totalItems,
      totalPages,
      items: items.map(sanitizeUser),
    });
  } catch (error) {
    next(error);
  }
}

async function getUserById(req, res, next) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(sanitizeUser(user));
  } catch (error) {
    next(error);
  }
}

async function updateUser(req, res, next) {
  try {
    const updatePayload = { ...req.body };

    if (Object.prototype.hasOwnProperty.call(updatePayload, 'password')) {
      if (!updatePayload.password) {
        delete updatePayload.password;
      } else {
        updatePayload.password = await bcrypt.hash(updatePayload.password, 10);
      }
    }

    if (Object.prototype.hasOwnProperty.call(updatePayload, 'email') && updatePayload.email) {
      updatePayload.email = updatePayload.email.trim().toLowerCase();
    }

    delete updatePayload.confirmPassword;

    const user = await User.findByIdAndUpdate(req.params.id, updatePayload, {
      new: true,
      runValidators: true,
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(sanitizeUser(user));
  } catch (error) {
    next(error);
  }
}

async function deleteUser(req, res, next) {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

async function loginUser(req, res, next) {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = createAuthToken(user.id);

    const responseData = {
      message: 'Login successful',
      token,
      user: sanitizeUser(user),
    };

    // 현재 접속 정보 콘솔 출력
    const userAgent = req.headers['user-agent'] || '';
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || '';
    console.log('\n=== 현재 접속 계정 정보 ===');
    console.log('사용자:', user.name || user.email);
    console.log('사용자 ID:', user.id);
    console.log('=== 현재 기기/IP 정보 ===');
    console.log('IP 주소:', ip);
    console.log('User-Agent:', userAgent);
    console.log('X-Forwarded-For:', req.headers['x-forwarded-for'] || '없음');
    console.log('Remote Address:', req.connection.remoteAddress || '없음');
    console.log('Socket Remote Address:', req.socket?.remoteAddress || '없음');
    console.log('========================\n');
    
    // 자동 로그인 설정
    if (rememberMe) {
      try {
        console.log('[로그인] 자동 로그인 설정:', { userId: user.id, userAgent, ip });
        const deviceInfo = await createTrustedDevice(user.id, userAgent, ip);
        responseData.deviceId = deviceInfo.deviceId;
        responseData.rememberToken = deviceInfo.rememberToken;
        responseData.deviceExpiresAt = deviceInfo.expiresAt;
        console.log('[로그인] 기기 정보 저장 완료:', { deviceId: deviceInfo.deviceId });
      } catch (deviceError) {
        console.error('[로그인] 기기 정보 저장 실패:', deviceError);
        // 기기 저장 실패해도 로그인은 성공하도록 함
      }
    }

    res.json(responseData);
  } catch (error) {
    if (error.message === 'Missing JWT_SECRET environment variable') {
      error.status = 500;
    }
    next(error);
  }
}

function getCurrentUser(req, res) {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  res.json({ user: sanitizeUser(req.user) });
}

function logoutUser(req, res) {
  res.status(200).json({ message: '로그아웃되었습니다.' });
}

module.exports = {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  loginUser,
  getCurrentUser,
  logoutUser,
};

