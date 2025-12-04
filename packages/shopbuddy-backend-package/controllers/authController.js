import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { successResponse, errorResponse } from '../utils/response.js';

// JWT_SECRET을 함수로 가져오기 (환경 변수가 나중에 로드될 수 있으므로)
const getJWTSecret = () => process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '60m'; // 60분 세션 유지

// 회원가입
export const register = async (req, res) => {
  try {
    console.log('📝 Register request received:', { 
      body: { ...req.body, password: '***' },
      headers: req.headers 
    });
    
    const { name, email, password, phone, role, address, adminCode } = req.body;

    // 필수 필드 검증
    if (!name || !email || !password) {
      return errorResponse(res, '이름, 이메일, 비밀번호는 필수 입력 항목입니다.', 400);
    }

    // 관리자 역할 검증
    if (role === 'admin') {
      const validAdminCode = process.env.ADMIN_CODE || 'ADMIN_SECRET_2024';
      if (!adminCode || adminCode !== validAdminCode) {
        return errorResponse(res, '관리자 코드가 올바르지 않습니다.', 403);
      }
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return errorResponse(res, '올바른 이메일 형식이 아닙니다.', 400);
    }

    // 비밀번호 강도 검증 (최소 6자, 권장: 8자 이상, 영문, 숫자, 특수문자)
    if (password.length < 6) {
      return errorResponse(res, '비밀번호는 최소 6자 이상이어야 합니다.', 400);
    }

    // 이메일 중복 확인
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse(res, '이미 등록된 이메일입니다.', 400);
    }

    // 비밀번호 해시
    const hashedPassword = await bcrypt.hash(password, 10);

    // 주소 객체 구성
    let addressData = null;
    if (address) {
      if (typeof address === 'string') {
        // 문자열로 온 경우 address1로 설정
        addressData = { address1: address, country: 'KR' };
      } else if (typeof address === 'object') {
        // 객체로 온 경우 그대로 사용
        addressData = { ...address, country: address.country || 'KR' };
      }
    }

    // 사용자 생성
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone: phone || undefined,
      role: role || 'buyer',
      address: addressData
    });

    // JWT 토큰 생성
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      getJWTSecret(),
      { expiresIn: JWT_EXPIRES_IN }
    );

    console.log('✅ User created successfully:', user._id);
    
    successResponse(
      res,
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          address: user.address
        },
        token
      },
      '회원가입이 완료되었습니다.',
      201
    );
  } catch (error) {
    console.error('❌ Register error:', error);
    
    // MongoDB 중복 키 에러 처리
    if (error.code === 11000) {
      return errorResponse(res, '이미 등록된 이메일입니다.', 400);
    }
    // 유효성 검사 에러 처리
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message).join(', ');
      return errorResponse(res, messages, 400);
    }
    errorResponse(res, error.message || '회원가입 중 오류가 발생했습니다.', 400);
  }
};

// 로그인
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 필수 필드 검증
    if (!email || !password) {
      return errorResponse(res, '이메일과 비밀번호를 입력해주세요.', 400);
    }

    // 사용자 찾기
    const user = await User.findOne({ email });
    if (!user) {
      return errorResponse(res, '이메일 또는 비밀번호가 올바르지 않습니다.', 401);
    }

    // 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return errorResponse(res, '이메일 또는 비밀번호가 올바르지 않습니다.', 401);
    }

    // 계정 활성화 확인
    if (!user.isActive) {
      return errorResponse(res, '비활성화된 계정입니다. 관리자에게 문의하세요.', 403);
    }

    // 마지막 로그인 시간 업데이트
    user.lastLogin = new Date();
    await user.save();

    // JWT 토큰 생성
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      getJWTSecret(),
      { expiresIn: JWT_EXPIRES_IN }
    );

    successResponse(res, {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address
      },
      token
    }, '로그인 성공');
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// 로그아웃 (클라이언트에서 토큰 삭제)
export const logout = async (req, res) => {
  try {
    // JWT는 stateless이므로 서버에서 특별한 처리가 필요 없음
    // 클라이언트에서 토큰을 삭제하면 됨
    successResponse(res, null, '로그아웃되었습니다.');
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// 토큰 갱신 (만료된 토큰도 갱신 가능)
export const refresh = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return errorResponse(res, '로그인이 필요합니다.', 401);
    }

    // JWT_SECRET 가져오기 (매번 환경 변수에서 읽기)
    const JWT_SECRET = getJWTSecret();
    
    // JWT_SECRET 확인 (디버깅용)
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔄 Token refresh attempt:', {
        tokenLength: token?.length,
        tokenPrefix: token?.substring(0, 20) + '...',
        jwtSecretLength: JWT_SECRET?.length,
        jwtSecretPrefix: JWT_SECRET?.substring(0, 10) + '...'
      });
    }

    // 만료된 토큰도 디코딩 가능하도록 decode 사용
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      // 서명 검증 실패 시 상세 정보 로깅
      if (process.env.NODE_ENV !== 'production') {
        console.error('❌ Token refresh verification failed:', {
          errorName: error.name,
          errorMessage: error.message
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
      
      // 만료된 토큰인 경우에도 디코딩 시도
      if (error.name === 'TokenExpiredError') {
        decoded = jwt.decode(token);
        if (!decoded || !decoded.userId) {
          return errorResponse(res, '로그인 세션이 만료되었습니다. 다시 로그인해주세요.', 401);
        }
      } else if (error.name === 'JsonWebTokenError') {
        // invalid signature 에러인 경우
        if (error.message === 'invalid signature') {
          return errorResponse(res, '토큰이 유효하지 않습니다. 다시 로그인해주세요.', 401);
        }
        return errorResponse(res, '로그인 세션이 만료되었습니다. 다시 로그인해주세요.', 401);
      } else {
        return errorResponse(res, '로그인 세션이 만료되었습니다. 다시 로그인해주세요.', 401);
      }
    }

    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return errorResponse(res, '로그인 정보가 올바르지 않습니다. 다시 로그인해주세요.', 401);
    }

    // 새 토큰 생성 (60분 유지) - SSO 세션 유지를 위해 항상 60분으로 설정
    const newToken = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      getJWTSecret(),
      { expiresIn: process.env.JWT_EXPIRES_IN || '60m' }
    );

    successResponse(res, { token: newToken }, '토큰이 갱신되었습니다.');
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return errorResponse(res, '유효하지 않은 토큰입니다.', 401);
    }
    errorResponse(res, error.message, 500);
  }
};

// 현재 사용자 정보
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    successResponse(res, { user }, '사용자 정보 조회 성공');
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

