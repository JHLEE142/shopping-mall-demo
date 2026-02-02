const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { createTrustedDevice } = require('./trustedDeviceController');
const { mergeGuestCartToUser } = require('./cartController');

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
    const { password, confirmPassword, googleCredential, ...rest } = req.body;

    // Google 로그인으로 온 경우 비밀번호가 없을 수 있음
    let hashedPassword;
    if (googleCredential) {
      // Google 로그인: 임시 비밀번호 생성 (사용자는 Google로만 로그인)
      const crypto = require('crypto');
      hashedPassword = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
    } else {
      // 일반 회원가입: 비밀번호 필수
      if (!password) {
        return res.status(400).json({ message: '비밀번호를 입력해주세요.' });
      }
      hashedPassword = await bcrypt.hash(password, 10);
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

    // 비밀번호 확인 (Google 로그인이 아닌 경우만)
    if (!googleCredential && confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ message: '비밀번호가 일치하지 않습니다.' });
    }

    // 이미 존재하는 이메일인지 확인
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: '이미 사용 중인 이메일입니다.' });
    }

    // 비밀번호 해싱 (Google 로그인인 경우 위에서 이미 처리됨)
    if (!hashedPassword) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

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
    // 인증 미들웨어를 통해 req.user가 설정되어 있어야 함
    if (!req.user) {
      return res.status(401).json({ message: '인증이 필요합니다.' });
    }
    
    const userId = req.user._id || req.user.id;
    const isAdmin = req.user.user_type === 'admin';
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // 관리자는 모든 사용자 조회 가능, 일반 사용자는 본인만 조회 가능
    if (!isAdmin && user._id.toString() !== userId.toString()) {
      return res.status(403).json({ message: '권한이 없습니다.' });
    }
    
    res.json({ user: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
}

async function updateUser(req, res, next) {
  try {
    const userId = req.user?._id || req.user?.id;
    const isAdmin = req.user?.user_type === 'admin';
    
    // 관리자는 모든 사용자 수정 가능, 일반 사용자는 본인만 수정 가능
    if (!isAdmin && req.params.id !== userId?.toString()) {
      return res.status(403).json({ message: '권한이 없습니다.' });
    }
    
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
    
    // 비회원 장바구니를 회원 장바구니로 병합
    try {
      const guestSessionId = req.headers['x-guest-session-id'] || req.body.guestSessionId;
      const deviceId = req.headers['x-device-id'] || req.body.deviceId;
      const normalizedIp = ip ? ip.split(',')[0].trim() : '';
      
      if (guestSessionId || deviceId) {
        console.log('[로그인] 비회원 장바구니 병합 시도:', { 
          guestSessionId: guestSessionId ? '있음' : '없음',
          deviceId: deviceId ? '있음' : '없음',
          ip: normalizedIp || '없음'
        });
        
        const mergedCart = await mergeGuestCartToUser(
          user._id,
          guestSessionId,
          deviceId,
          normalizedIp
        );
        
        if (mergedCart) {
          console.log('[로그인] 비회원 장바구니 병합 완료:', {
            itemCount: mergedCart.items?.length || 0
          });
          responseData.cartMerged = true;
          responseData.cartItemCount = mergedCart.items?.length || 0;
        } else {
          console.log('[로그인] 병합할 비회원 장바구니가 없습니다.');
        }
      }
    } catch (cartMergeError) {
      // 장바구니 병합 실패해도 로그인은 성공하도록 함
      console.error('[로그인] 비회원 장바구니 병합 실패:', cartMergeError.message);
      // 에러는 무시하고 로그인은 계속 진행
    }
    
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

async function googleLogin(req, res, next) {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: 'Google credential is required' });
    }

    // Google ID 토큰 디코딩 (JWT 형식)
    // 주의: 프로덕션에서는 Google의 공개키로 검증해야 합니다
    const tokenParts = credential.split('.');
    if (tokenParts.length !== 3) {
      return res.status(400).json({ message: 'Invalid Google credential format' });
    }

    // JWT payload 디코딩
    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
    const { email, name, picture } = payload;

    if (!email) {
      return res.status(400).json({ message: 'Email not found in Google credential' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 기존 사용자 확인
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      // 기존 사용자: 바로 로그인
      const token = createAuthToken(existingUser.id);

      const responseData = {
        message: 'Login successful',
        token,
        user: sanitizeUser(existingUser),
      };

      // 비회원 장바구니를 회원 장바구니로 병합
      try {
        const guestCartId = req.headers['x-guest-cart-id'];
        if (guestCartId) {
          await mergeGuestCartToUser(guestCartId, existingUser.id);
        }
      } catch (cartMergeError) {
        console.error('[Google 로그인] 장바구니 병합 실패:', cartMergeError.message);
      }

      // 자동 로그인 설정
      const userAgent = req.headers['user-agent'] || '';
      const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || '';
      try {
        const deviceInfo = await createTrustedDevice(existingUser.id, userAgent, ip);
        responseData.deviceId = deviceInfo.deviceId;
        responseData.rememberToken = deviceInfo.rememberToken;
        responseData.deviceExpiresAt = deviceInfo.expiresAt;
      } catch (deviceError) {
        console.error('[Google 로그인] 기기 정보 저장 실패:', deviceError);
      }

      return res.json(responseData);
    } else {
      // 신규 사용자: 회원가입 필요 정보 반환
      return res.status(200).json({
        requiresSignup: true,
        googleUser: {
          email: normalizedEmail,
          name: name || email.split('@')[0],
          picture: picture || null,
        },
        message: '회원가입이 필요합니다.',
      });
    }
  } catch (error) {
    console.error('Google 로그인 오류:', error);
    if (error.message === 'Missing JWT_SECRET environment variable') {
      error.status = 500;
    }
    return res.status(500).json({ message: 'Google 로그인 처리 중 오류가 발생했습니다.' });
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
  googleLogin,
  getCurrentUser,
  logoutUser,
};

