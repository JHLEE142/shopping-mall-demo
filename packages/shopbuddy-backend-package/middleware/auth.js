import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// JWT 토큰 검증 미들웨어
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    // 디버깅: Authorization 헤더 확인
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔐 Authenticate middleware:', {
        path: req.path,
        method: req.method,
        hasAuthHeader: !!authHeader,
        authHeaderPrefix: authHeader?.substring(0, 20) + '...'
      });
    }
    
    const token = authHeader?.split(' ')[1]; // Bearer 토큰

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

    // JWT_SECRET 확인 (authController와 동일한 방식으로 가져오기)
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔑 JWT_SECRET exists:', !!JWT_SECRET);
      console.log('🔑 JWT_SECRET length:', JWT_SECRET?.length || 0);
      console.log('🔑 JWT_SECRET first 10 chars:', JWT_SECRET?.substring(0, 10) || 'N/A');
    }

    // 토큰 디코딩 시도 (서명 검증 전에 payload 확인)
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (verifyError) {
      // 서명 검증 실패 시 상세 정보 로깅
      if (process.env.NODE_ENV !== 'production') {
        console.error('❌ Token verification failed:', {
          errorName: verifyError.name,
          errorMessage: verifyError.message,
          tokenLength: token?.length,
          tokenPrefix: token?.substring(0, 20) + '...',
          jwtSecretLength: JWT_SECRET?.length,
          jwtSecretPrefix: JWT_SECRET?.substring(0, 10) + '...'
        });
        
        // 토큰 payload 디코딩 시도 (서명 검증 없이)
        try {
          const decodedWithoutVerify = jwt.decode(token, { complete: true });
          console.log('📋 Token payload (without verification):', {
            header: decodedWithoutVerify?.header,
            payload: decodedWithoutVerify?.payload
          });
        } catch (decodeError) {
          console.error('❌ Failed to decode token:', decodeError.message);
        }
      }
      throw verifyError;
    }
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('✅ Token decoded:', { userId: decoded.userId, email: decoded.email });
    }
    
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('❌ User not found:', decoded.userId);
      }
      return res.status(401).json({ 
        success: false,
        message: '로그인 정보가 올바르지 않습니다. 다시 로그인해주세요.',
        error: '유효하지 않은 사용자입니다.' 
      });
    }

    if (!user.isActive) {
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
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: '로그인 세션이 만료되었습니다. 다시 로그인해주세요.',
        error: '유효하지 않은 토큰입니다.' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: '로그인 세션이 만료되었습니다. 다시 로그인해주세요.',
        error: '토큰이 만료되었습니다.' 
      });
    }
    res.status(500).json({ 
      success: false,
      message: '로그인 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
      error: '인증 처리 중 오류가 발생했습니다.' 
    });
  }
};

// 역할 기반 권한 확인 미들웨어
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: '인증이 필요합니다.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: '권한이 없습니다.' });
    }

    next();
  };
};

// 선택적 인증 (토큰이 있으면 사용자 정보 추가, 없어도 통과)
export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const user = await User.findById(decoded.userId).select('-password');
      if (user && user.isActive) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // 토큰이 유효하지 않아도 통과
    next();
  }
};

