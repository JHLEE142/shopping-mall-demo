const TrustedDevice = require('../models/trustedDevice');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const { mergeGuestCartToUser } = require('./cartController');
const bcrypt = require('bcryptjs');

function createAuthToken(userId) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('Missing JWT_SECRET environment variable');
  }
  return jwt.sign({ sub: userId }, secret, { expiresIn: '60m' });
}

function sanitizeUser(user) {
  if (!user) {
    return null;
  }
  const userObj = user.toObject ? user.toObject() : { ...user };
  delete userObj.password;
  delete userObj.__v;
  return userObj;
}

// 기기 이름 추출 헬퍼 함수 (더 상세한 정보 포함)
function extractDeviceName(userAgent) {
  if (!userAgent) return '알 수 없는 기기';
  
  // OS 감지
  let os = '';
  if (/Windows NT 10.0/.test(userAgent)) os = 'Windows 10/11';
  else if (/Windows NT 6.3/.test(userAgent)) os = 'Windows 8.1';
  else if (/Windows NT 6.2/.test(userAgent)) os = 'Windows 8';
  else if (/Windows NT 6.1/.test(userAgent)) os = 'Windows 7';
  else if (/Mac OS X/.test(userAgent)) {
    const match = userAgent.match(/Mac OS X (\d+[._]\d+)/);
    os = match ? `macOS ${match[1].replace('_', '.')}` : 'macOS';
  }
  else if (/Linux/.test(userAgent)) os = 'Linux';
  else if (/Android/.test(userAgent)) {
    const match = userAgent.match(/Android (\d+[.\d]*)/);
    os = match ? `Android ${match[1]}` : 'Android';
  }
  else if (/iPhone OS/.test(userAgent) || /iOS/.test(userAgent)) {
    const match = userAgent.match(/OS (\d+[._]\d+)/);
    os = match ? `iOS ${match[1].replace('_', '.')}` : 'iOS';
  }
  else if (/iPad/.test(userAgent)) {
    const match = userAgent.match(/OS (\d+[._]\d+)/);
    os = match ? `iPadOS ${match[1].replace('_', '.')}` : 'iPadOS';
  }
  
  // 브라우저 감지
  let browser = '';
  if (userAgent.includes('Edg/')) {
    browser = 'Microsoft Edge';
  } else if (userAgent.includes('Chrome/') && !userAgent.includes('Edg/')) {
    const match = userAgent.match(/Chrome\/(\d+)/);
    browser = match ? `Chrome ${match[1]}` : 'Chrome';
  } else if (userAgent.includes('Firefox/')) {
    const match = userAgent.match(/Firefox\/(\d+)/);
    browser = match ? `Firefox ${match[1]}` : 'Firefox';
  } else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/')) {
    const match = userAgent.match(/Version\/(\d+)/);
    browser = match ? `Safari ${match[1]}` : 'Safari';
  } else if (userAgent.includes('Opera/') || userAgent.includes('OPR/')) {
    browser = 'Opera';
  }
  
  // 기기 타입 감지
  const isMobile = /Mobile|Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isTablet = /Tablet|iPad/i.test(userAgent);
  
  // 이름 조합
  if (isTablet) {
    return os ? `${os} (태블릿)` : '태블릿 기기';
  } else if (isMobile) {
    return os ? `${os} (모바일)` : '모바일 기기';
  } else {
    return browser && os ? `${browser} on ${os}` : (browser || os || '데스크톱');
  }
}

// 자동 로그인 처리
exports.autoLogin = async (req, res, next) => {
  try {
    const { deviceId, rememberToken } = req.body;

    if (!deviceId || !rememberToken) {
      return res.status(400).json({ message: 'deviceId와 rememberToken이 필요합니다.' });
    }

    const tokenHash = TrustedDevice.hashToken(rememberToken);
    const device = await TrustedDevice.findOne({
      deviceId,
      tokenHash,
      isRevoked: false,
    }).populate('user', '-password');

    if (!device) {
      return res.status(401).json({ message: '유효하지 않은 자동 로그인 정보입니다.' });
    }

    // 만료 확인
    if (new Date() > device.expiresAt) {
      await TrustedDevice.findByIdAndUpdate(device._id, { isRevoked: true });
      return res.status(401).json({ message: '자동 로그인이 만료되었습니다.' });
    }

    // 30일 미사용 시 만료 처리
    const lastUsed = new Date(device.lastUsedAt);
    const daysSinceLastUse = (Date.now() - lastUsed.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceLastUse > 30) {
      await TrustedDevice.findByIdAndUpdate(device._id, { isRevoked: true });
      return res.status(401).json({ message: '30일 이상 사용하지 않아 자동 로그인이 만료되었습니다.' });
    }

    // 사용자 확인
    const user = await User.findById(device.user._id);
    if (!user) {
      await TrustedDevice.findByIdAndUpdate(device._id, { isRevoked: true });
      return res.status(401).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    // 현재 접속 정보 콘솔 출력
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || '';
    console.log('\n=== 자동 로그인 접속 정보 ===');
    console.log('사용자:', user.name || user.email);
    console.log('사용자 ID:', user.id);
    console.log('IP 주소:', ip);
    console.log('User-Agent:', req.headers['user-agent'] || '없음');
    console.log('========================\n');

    // lastUsedAt 업데이트 및 만료일 연장 (30일)
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 30);
    
    device.lastUsedAt = new Date();
    device.lastIp = ip;
    device.expiresAt = newExpiresAt;
    await device.save();

    // 새 JWT 토큰 발급
    const token = createAuthToken(user.id);

    const responseData = {
      message: '자동 로그인 성공',
      token,
      user: sanitizeUser(user),
    };

    // 비회원 장바구니를 회원 장바구니로 병합
    try {
      const guestSessionId = req.headers['x-guest-session-id'] || req.body.guestSessionId;
      const requestDeviceId = req.headers['x-device-id'] || req.body.deviceId;
      const normalizedIp = ip ? ip.split(',')[0].trim() : '';
      
      // autoLogin에서는 deviceId가 이미 있지만, 비회원 장바구니 병합을 위해 요청의 deviceId도 사용
      if (guestSessionId || requestDeviceId) {
        console.log('[자동 로그인] 비회원 장바구니 병합 시도:', { 
          guestSessionId: guestSessionId ? '있음' : '없음',
          deviceId: requestDeviceId ? '있음' : '없음',
          ip: normalizedIp || '없음'
        });
        
        const mergedCart = await mergeGuestCartToUser(
          user._id,
          guestSessionId,
          requestDeviceId,
          normalizedIp
        );
        
        if (mergedCart) {
          console.log('[자동 로그인] 비회원 장바구니 병합 완료:', {
            itemCount: mergedCart.items?.length || 0
          });
          responseData.cartMerged = true;
          responseData.cartItemCount = mergedCart.items?.length || 0;
        } else {
          console.log('[자동 로그인] 병합할 비회원 장바구니가 없습니다.');
        }
      }
    } catch (cartMergeError) {
      // 장바구니 병합 실패해도 자동 로그인은 성공하도록 함
      console.error('[자동 로그인] 비회원 장바구니 병합 실패:', cartMergeError.message);
      // 에러는 무시하고 자동 로그인은 계속 진행
    }

    res.json(responseData);
  } catch (error) {
    next(error);
  }
};

// 로그인된 기기 목록 조회
exports.getTrustedDevices = async (req, res, next) => {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || '';
    console.log('\n=== 환경설정 페이지 접속 정보 ===');
    console.log('사용자:', req.user.name || req.user.email);
    console.log('사용자 ID:', req.user.id);
    console.log('IP 주소:', ip);
    console.log('User-Agent:', req.headers['user-agent'] || '없음');
    console.log('================================\n');
    
    console.log('[getTrustedDevices] 요청:', { userId: req.user.id });
    
    const devices = await TrustedDevice.find({
      user: req.user.id,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    })
      .sort({ lastUsedAt: -1 })
      .lean();
    
    console.log('[getTrustedDevices] 조회된 기기 수 (만료 전):', devices.length);

    // 30일 미사용 기기 필터링
    const now = new Date();
    const activeDevices = devices.filter((device) => {
      const lastUsed = new Date(device.lastUsedAt);
      const daysSinceLastUse = (now.getTime() - lastUsed.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceLastUse <= 30;
    });
    
    console.log('[getTrustedDevices] 활성 기기 수 (30일 이내 사용):', activeDevices.length);

    // 만료된 기기는 자동으로 revoke 처리
    const expiredDevices = devices.filter((device) => {
      const lastUsed = new Date(device.lastUsedAt);
      const daysSinceLastUse = (now.getTime() - lastUsed.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceLastUse > 30;
    });

    if (expiredDevices.length > 0) {
      await TrustedDevice.updateMany(
        { _id: { $in: expiredDevices.map((d) => d._id) } },
        { isRevoked: true }
      );
    }

    res.json({
      devices: activeDevices.map((device) => ({
        _id: device._id,
        deviceId: device.deviceId,
        deviceName: device.deviceName || extractDeviceName(device.userAgent),
        userAgent: device.userAgent,
        lastIp: device.lastIp,
        lastUsedAt: device.lastUsedAt,
        expiresAt: device.expiresAt,
        createdAt: device.createdAt,
        // 만료까지 남은 일수 계산
        daysUntilExpiry: Math.ceil((new Date(device.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)),
      })),
    });
  } catch (error) {
    next(error);
  }
};

// 특정 기기 로그아웃 (revoke)
exports.revokeDevice = async (req, res, next) => {
  try {
    const { deviceId } = req.params;

    const device = await TrustedDevice.findOne({
      _id: deviceId,
      user: req.user.id,
    });

    if (!device) {
      return res.status(404).json({ message: '기기를 찾을 수 없습니다.' });
    }

    device.isRevoked = true;
    await device.save();

    res.json({ message: '기기 로그아웃이 완료되었습니다.' });
  } catch (error) {
    next(error);
  }
};

// 모든 기기 로그아웃
exports.revokeAllDevices = async (req, res, next) => {
  try {
    await TrustedDevice.updateMany(
      { user: req.user.id, isRevoked: false },
      { isRevoked: true }
    );

    res.json({ message: '모든 기기에서 로그아웃되었습니다.' });
  } catch (error) {
    next(error);
  }
};

// 신뢰된 기기 생성 (로그인 시 호출)
exports.createTrustedDevice = async (userId, userAgent, ip) => {
  try {
    console.log('[createTrustedDevice] 시작:', { userId, userAgent: userAgent?.substring(0, 50), ip });
    
    // 같은 사용자의 기존 기기 중 동일한 userAgent를 가진 기기가 있는지 확인
    // (같은 기기에서 다시 로그인하는 경우)
    const existingDevice = await TrustedDevice.findOne({
      user: userId,
      userAgent: userAgent || '',
      isRevoked: false,
    }).sort({ lastUsedAt: -1 }); // 가장 최근에 사용한 기기
    
    console.log('[createTrustedDevice] 기존 기기 확인:', existingDevice ? '발견됨' : '없음');

  let device;
  let deviceId;
  let rememberToken;
  let tokenHash;

  if (existingDevice && existingDevice.expiresAt > new Date()) {
    // 기존 기기가 있고 아직 만료되지 않았다면 토큰만 갱신
    deviceId = existingDevice.deviceId;
    rememberToken = TrustedDevice.generateToken();
    tokenHash = TrustedDevice.hashToken(rememberToken);
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30일 연장

    device = await TrustedDevice.findByIdAndUpdate(
      existingDevice._id,
      {
        tokenHash,
        lastIp: ip || '',
        lastUsedAt: new Date(),
        expiresAt,
        isRevoked: false, // 혹시 revoke된 경우 다시 활성화
      },
      { new: true }
    );
  } else {
    // 새 기기 등록
    deviceId = TrustedDevice.generateDeviceId();
    rememberToken = TrustedDevice.generateToken();
    tokenHash = TrustedDevice.hashToken(rememberToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30일 후 만료

    device = await TrustedDevice.create({
      user: userId,
      deviceId,
      tokenHash,
      deviceName: extractDeviceName(userAgent),
      userAgent: userAgent || '',
      lastIp: ip || '',
      expiresAt,
      lastUsedAt: new Date(),
    });
  }

    console.log('[createTrustedDevice] 완료:', { deviceId, expiresAt: device.expiresAt });
    
    return {
      deviceId,
      rememberToken,
      expiresAt: device.expiresAt,
    };
  } catch (error) {
    console.error('[createTrustedDevice] 에러:', error);
    throw error;
  }
};

