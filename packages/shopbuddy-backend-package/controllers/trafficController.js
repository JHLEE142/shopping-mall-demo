import Visitor from '../models/Visitor.js';
import PageView from '../models/PageView.js';
import TrafficSource from '../models/TrafficSource.js';
import Order from '../models/Order.js';
import { successResponse, errorResponse } from '../utils/response.js';

// User-Agent 파싱을 위한 간단한 함수
function parseUserAgent(userAgent) {
  if (!userAgent) {
    return { browser: null, os: null, device: 'unknown' };
  }

  const ua = userAgent.toLowerCase();
  
  // 브라우저 감지
  let browser = null;
  if (ua.includes('chrome') && !ua.includes('edg')) browser = 'Chrome';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('edg')) browser = 'Edge';
  else if (ua.includes('opera')) browser = 'Opera';
  
  // OS 감지
  let os = null;
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
  
  // 디바이스 감지
  let device = 'desktop';
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    device = 'mobile';
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    device = 'tablet';
  }
  
  return { browser, os, device };
}

// Referrer에서 도메인 추출
function extractDomain(referrer) {
  if (!referrer) return null;
  try {
    const url = new URL(referrer);
    return url.hostname.replace('www.', '');
  } catch (e) {
    return null;
  }
}

// 트래픽 소스 타입 결정
function determineTrafficSourceType(referrer, utmSource, utmMedium) {
  if (utmSource) {
    if (utmMedium === 'email') return 'email';
    if (utmMedium === 'social' || utmMedium === 'social-media') return 'social';
    if (utmMedium === 'cpc' || utmMedium === 'paid') return 'paid';
    return 'other';
  }
  
  if (!referrer) return 'direct';
  
  const domain = extractDomain(referrer);
  if (!domain) return 'direct';
  
  // 검색 엔진 감지
  const searchEngines = ['google', 'bing', 'yahoo', 'naver', 'daum', 'duckduckgo'];
  if (searchEngines.some(se => domain.includes(se))) {
    return 'organic';
  }
  
  // 소셜 미디어 감지
  const socialMedia = ['facebook', 'twitter', 'instagram', 'linkedin', 'youtube', 'pinterest', 'tiktok', 'kakao'];
  if (socialMedia.some(sm => domain.includes(sm))) {
    return 'social';
  }
  
  return 'referral';
}

// 페이지뷰 기록
export const trackPageView = async (req, res) => {
  try {
    const {
      visitorId,
      userId,
      url,
      title,
      referrer,
      utmSource,
      utmMedium,
      utmCampaign,
      utmTerm,
      utmContent,
      sessionId,
      duration,
      userAgent,
      ipAddress: clientIpAddress
    } = req.body;

    // 필수 필드 검증
    if (!visitorId || !url || !sessionId) {
      return errorResponse(res, '필수 필드가 누락되었습니다.', 400);
    }

    // IP 주소 추출 (프록시를 통한 경우)
    const ipAddress = clientIpAddress || 
                     req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                     req.headers['x-real-ip'] ||
                     req.connection?.remoteAddress ||
                     req.socket?.remoteAddress ||
                     null;

    // URL에서 경로 추출
    let path = url;
    try {
      const urlObj = new URL(url);
      path = urlObj.pathname;
    } catch (e) {
      // 상대 경로인 경우
      path = url.split('?')[0];
    }

    // User-Agent 파싱
    const { browser, os, device } = parseUserAgent(userAgent);
    
    // Referrer 도메인 추출
    const referrerDomain = extractDomain(referrer);
    
    // 트래픽 소스 타입 결정
    const sourceType = determineTrafficSourceType(referrer, utmSource, utmMedium);
    
    // 트래픽 소스 이름 결정
    let sourceName = 'Direct';
    if (utmSource) {
      sourceName = utmSource;
    } else if (referrerDomain) {
      sourceName = referrerDomain;
    }

    // 페이지뷰 저장
    const pageView = new PageView({
      visitorId,
      userId: userId || null,
      url,
      path,
      title: title || null,
      referrer: referrer || null,
      referrerDomain,
      utmSource: utmSource || null,
      utmMedium: utmMedium || null,
      utmCampaign: utmCampaign || null,
      utmTerm: utmTerm || null,
      utmContent: utmContent || null,
      sessionId,
      duration: duration || 0,
      device,
      browser,
      os,
      ipAddress: ipAddress || null
    });

    await pageView.save();

    // 방문자 정보 업데이트
    let visitor = await Visitor.findOne({ visitorId });
    if (visitor) {
      visitor.lastVisitAt = new Date();
      visitor.visitCount += 1;
      visitor.pageViewCount += 1;
      if (device !== 'unknown') visitor.device = device;
      if (browser) visitor.browser = browser;
      if (os) visitor.os = os;
      await visitor.save();
    } else {
      // 새 방문자 생성
      visitor = new Visitor({
        visitorId,
        userId: userId || null,
        firstVisitAt: new Date(),
        lastVisitAt: new Date(),
        visitCount: 1,
        pageViewCount: 1,
        device,
        browser,
        os
      });
      await visitor.save();
    }

    successResponse(res, { 
      visitorId: visitor.visitorId,
      pageViewId: pageView._id 
    }, '페이지뷰가 기록되었습니다.');
  } catch (error) {
    console.error('Error tracking page view:', error);
    errorResponse(res, error.message, 500);
  }
};

// 트래픽 소스 통계 조회
export const getTrafficSources = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const now = new Date();
    const defaultStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 최근 30일
    const start = startDate ? new Date(startDate) : defaultStartDate;
    const end = endDate ? new Date(endDate) : now;

    // 페이지뷰 데이터 집계
    const pageViews = await PageView.find({
      createdAt: { $gte: start, $lte: end }
    }).lean();

    // 트래픽 소스별 집계
    const sourceMap = new Map();

    pageViews.forEach((pv) => {
      let sourceName = 'Direct';
      let sourceType = 'direct';
      
      if (pv.utmSource) {
        sourceName = pv.utmSource;
        if (pv.utmMedium === 'email') sourceType = 'email';
        else if (pv.utmMedium === 'social' || pv.utmMedium === 'social-media') sourceType = 'social';
        else if (pv.utmMedium === 'cpc' || pv.utmMedium === 'paid') sourceType = 'paid';
        else sourceType = 'other';
      } else if (pv.referrerDomain) {
        sourceName = pv.referrerDomain;
        const searchEngines = ['google', 'bing', 'yahoo', 'naver', 'daum', 'duckduckgo'];
        const socialMedia = ['facebook', 'twitter', 'instagram', 'linkedin', 'youtube', 'pinterest', 'tiktok', 'kakao'];
        
        if (searchEngines.some(se => pv.referrerDomain.includes(se))) {
          sourceType = 'organic';
        } else if (socialMedia.some(sm => pv.referrerDomain.includes(sm))) {
          sourceType = 'social';
        } else {
          sourceType = 'referral';
        }
      }

      if (!sourceMap.has(sourceName)) {
        sourceMap.set(sourceName, {
          source: sourceName,
          type: sourceType,
          visitors: new Set(),
          pageViews: 0,
          sessions: new Set(),
          totalDuration: 0
        });
      }

      const source = sourceMap.get(sourceName);
      source.visitors.add(pv.visitorId);
      source.pageViews += 1;
      source.sessions.add(pv.sessionId);
      source.totalDuration += pv.duration || 0;
    });

    // 전환 수 계산 (주문 발생)
    const orders = await Order.find({
      createdAt: { $gte: start, $lte: end }
    }).populate('userId').lean();

    // 방문자별 첫 페이지뷰 찾기 (트래픽 소스 추적)
    const visitorFirstPageView = new Map();
    for (const pv of pageViews) {
      const key = pv.userId?.toString() || pv.visitorId;
      if (!visitorFirstPageView.has(key)) {
        visitorFirstPageView.set(key, pv);
      } else {
        const existing = visitorFirstPageView.get(key);
        if (pv.createdAt < existing.createdAt) {
          visitorFirstPageView.set(key, pv);
        }
      }
    }

    // 주문한 사용자의 트래픽 소스 매핑
    const conversionsBySource = new Map();
    orders.forEach((order) => {
      if (order.userId) {
        const key = order.userId._id?.toString() || order.userId.toString();
        const firstPageView = visitorFirstPageView.get(key);
        if (firstPageView) {
          let sourceName = 'Direct';
          if (firstPageView.utmSource) {
            sourceName = firstPageView.utmSource;
          } else if (firstPageView.referrerDomain) {
            sourceName = firstPageView.referrerDomain;
          }
          
          if (!conversionsBySource.has(sourceName)) {
            conversionsBySource.set(sourceName, 0);
          }
          conversionsBySource.set(sourceName, conversionsBySource.get(sourceName) + 1);
        }
      }
    });

    // 결과 데이터 생성
    const data = Array.from(sourceMap.entries()).map(([sourceName, stats]) => {
      const visitors = stats.visitors.size;
      const conversions = conversionsBySource.get(sourceName) || 0;
      const rate = visitors > 0 ? ((conversions / visitors) * 100).toFixed(1) : 0;
      const avgDuration = stats.sessions.size > 0 
        ? Math.round(stats.totalDuration / stats.sessions.size) 
        : 0;

      return {
        source: sourceName,
        type: stats.type,
        visitors: visitors,
        pageViews: stats.pageViews,
        conversions: conversions,
        rate: parseFloat(rate),
        avgSessionDuration: avgDuration
      };
    }).sort((a, b) => b.visitors - a.visitors);

    successResponse(res, data);
  } catch (error) {
    console.error('Error getting traffic sources:', error);
    errorResponse(res, error.message, 500);
  }
};

// 방문자 통계 조회
export const getVisitorStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const now = new Date();
    const defaultStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const start = startDate ? new Date(startDate) : defaultStartDate;
    const end = endDate ? new Date(endDate) : now;

    // 총 방문자 수
    const totalVisitors = await Visitor.countDocuments({
      firstVisitAt: { $lte: end }
    });

    // 기간 내 신규 방문자
    const newVisitors = await Visitor.countDocuments({
      firstVisitAt: { $gte: start, $lte: end }
    });

    // 기간 내 재방문자
    const returningVisitors = await Visitor.countDocuments({
      firstVisitAt: { $lt: start },
      lastVisitAt: { $gte: start, $lte: end }
    });

    // 기간 내 총 페이지뷰
    const totalPageViews = await PageView.countDocuments({
      createdAt: { $gte: start, $lte: end }
    });

    // 기간 내 고유 세션 수
    const uniqueSessions = await PageView.distinct('sessionId', {
      createdAt: { $gte: start, $lte: end }
    });

    // 평균 세션 시간
    const pageViews = await PageView.find({
      createdAt: { $gte: start, $lte: end }
    }).select('sessionId duration').lean();

    const sessionDurations = new Map();
    pageViews.forEach((pv) => {
      if (!sessionDurations.has(pv.sessionId)) {
        sessionDurations.set(pv.sessionId, 0);
      }
      sessionDurations.set(pv.sessionId, sessionDurations.get(pv.sessionId) + (pv.duration || 0));
    });

    const avgSessionDuration = sessionDurations.size > 0
      ? Math.round(Array.from(sessionDurations.values()).reduce((a, b) => a + b, 0) / sessionDurations.size)
      : 0;

    // 디바이스별 통계
    const deviceStats = await PageView.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$device',
          count: { $sum: 1 },
          uniqueVisitors: { $addToSet: '$visitorId' }
        }
      },
      {
        $project: {
          device: '$_id',
          pageViews: '$count',
          visitors: { $size: '$uniqueVisitors' }
        }
      }
    ]);

    // 브라우저별 통계
    const browserStats = await PageView.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          browser: { $ne: null }
        }
      },
      {
        $group: {
          _id: '$browser',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          browser: '$_id',
          pageViews: '$count'
        }
      },
      {
        $sort: { pageViews: -1 }
      },
      {
        $limit: 5
      }
    ]);

    successResponse(res, {
      totalVisitors,
      newVisitors,
      returningVisitors,
      totalPageViews,
      uniqueSessions: uniqueSessions.length,
      avgSessionDuration,
      deviceStats,
      browserStats
    });
  } catch (error) {
    console.error('Error getting visitor stats:', error);
    errorResponse(res, error.message, 500);
  }
};

// 페이지별 통계 조회
export const getPageStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const now = new Date();
    const defaultStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const start = startDate ? new Date(startDate) : defaultStartDate;
    const end = endDate ? new Date(endDate) : now;

    const pageStats = await PageView.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$path',
          pageViews: { $sum: 1 },
          uniqueVisitors: { $addToSet: '$visitorId' },
          avgDuration: { $avg: '$duration' }
        }
      },
      {
        $project: {
          path: '$_id',
          pageViews: 1,
          visitors: { $size: '$uniqueVisitors' },
          avgDuration: { $round: ['$avgDuration', 0] }
        }
      },
      {
        $sort: { pageViews: -1 }
      },
      {
        $limit: 20
      }
    ]);

    successResponse(res, pageStats);
  } catch (error) {
    console.error('Error getting page stats:', error);
    errorResponse(res, error.message, 500);
  }
};

