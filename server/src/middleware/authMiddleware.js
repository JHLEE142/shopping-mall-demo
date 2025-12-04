const jwt = require('jsonwebtoken');
const User = require('../models/user');

// JWT 토큰 검증 미들웨어
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    
    // 디버깅: Authorization 헤더 확인
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔐 Authenticate middleware:', {
        path: req.path,
        method: req.method,
        hasAuthHeader: !!authHeader,
        authHeaderPrefix: authHeader?.substring(0, 20) + '...'
      });
    }
    
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.split(' ')[1];

    if (!token) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('❌ No token provided');
      }
      return res.status(401).json({ 
        success: false,
        message: '로그인이 필요합니다.',
        error: '인증 토큰이 필요합니다.' 
      });
    }

    // JWT_SECRET 확인
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔑 JWT_SECRET exists:', !!JWT_SECRET);
    }

    // 토큰 디코딩 시도
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (verifyError) {
      // 서명 검증 실패 시 상세 정보 로깅
      if (process.env.NODE_ENV !== 'production') {
        console.error('❌ Token verification failed:', {
          errorName: verifyError.name,
          errorMessage: verifyError.message
        });
      }
      
      if (verifyError.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          success: false,
          message: '로그인 세션이 만료되었습니다. 다시 로그인해주세요.',
          error: '토큰이 만료되었습니다.' 
        });
      }
      
      if (verifyError.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          success: false,
          message: '로그인 세션이 만료되었습니다. 다시 로그인해주세요.',
          error: '유효하지 않은 토큰입니다.' 
        });
      }
      
      throw verifyError;
    }
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('✅ Token decoded:', { userId: decoded.sub || decoded.userId, email: decoded.email });
    }
    
    // decoded.sub 또는 decoded.userId 사용 (기존 프로젝트는 sub 사용)
    const userId = decoded.sub || decoded.userId;
    const user = await User.findById(userId).select('-password');

    if (!user) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('❌ User not found:', userId);
      }
      return res.status(401).json({ 
        success: false,
        message: '로그인 정보가 올바르지 않습니다. 다시 로그인해주세요.',
        error: '유효하지 않은 사용자입니다.' 
      });
    }

    // isActive 체크 (있는 경우)
    if (user.isActive === false) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('❌ User is not active:', user._id);
      }
      return res.status(401).json({ 
        success: false,
        message: '로그인 정보가 올바르지 않습니다. 다시 로그인해주세요.',
        error: '유효하지 않은 사용자입니다.' 
      });
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('✅ Authentication successful:', { userId: user._id, email: user.email });
    }

    req.user = user;
    next();
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('❌ Authentication error:', {
        name: error.name,
        message: error.message,
        path: req.path
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: '로그인 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
      error: '인증 처리 중 오류가 발생했습니다.' 
    });
  }
}

// 역할 기반 권한 확인 미들웨어
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        error: '인증이 필요합니다.' 
      });
    }

    // user_type 또는 role 필드 확인
    const userRole = req.user.role || req.user.user_type;
    
    if (!roles.includes(userRole)) {
      return res.status(403).json({ 
        success: false,
        error: '권한이 없습니다.' 
      });
    }

    next();
  };
}

// 선택적 인증 (토큰이 있으면 사용자 정보 추가, 없어도 통과)
async function optionalAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (token) {
      const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
      const decoded = jwt.verify(token, JWT_SECRET);
      const userId = decoded.sub || decoded.userId;
      const user = await User.findById(userId).select('-password');
      if (user && (user.isActive !== false)) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // 토큰이 유효하지 않아도 통과
    next();
  }
}

module.exports = authenticate;
module.exports.authenticate = authenticate;
module.exports.authorize = authorize;
module.exports.optionalAuth = optionalAuth;


