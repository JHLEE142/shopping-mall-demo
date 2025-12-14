// 브라우저/기기 정보 수집 유틸리티

export function getDeviceInfo() {
  const userAgent = navigator.userAgent;
  const platform = navigator.platform;
  const language = navigator.language;
  
  // 화면 정보
  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;
  const screenColorDepth = window.screen.colorDepth;
  
  // 브라우저 정보
  const browserInfo = detectBrowser(userAgent);
  
  // OS 정보
  const osInfo = detectOS(userAgent, platform);
  
  // 기기 타입
  const deviceType = detectDeviceType(userAgent, screenWidth);
  
  // 타임존
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  return {
    userAgent,
    browser: browserInfo,
    os: osInfo,
    deviceType,
    screen: {
      width: screenWidth,
      height: screenHeight,
      colorDepth: screenColorDepth,
    },
    language,
    timezone,
    platform,
  };
}

function detectBrowser(userAgent) {
  if (userAgent.includes('Edg/')) {
    return 'Microsoft Edge';
  }
  if (userAgent.includes('Chrome/') && !userAgent.includes('Edg/')) {
    const match = userAgent.match(/Chrome\/(\d+)/);
    return match ? `Chrome ${match[1]}` : 'Chrome';
  }
  if (userAgent.includes('Firefox/')) {
    const match = userAgent.match(/Firefox\/(\d+)/);
    return match ? `Firefox ${match[1]}` : 'Firefox';
  }
  if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/')) {
    const match = userAgent.match(/Version\/(\d+)/);
    return match ? `Safari ${match[1]}` : 'Safari';
  }
  if (userAgent.includes('Opera/') || userAgent.includes('OPR/')) {
    return 'Opera';
  }
  return 'Unknown Browser';
}

function detectOS(userAgent, platform) {
  if (/Windows NT 10.0/.test(userAgent)) return 'Windows 10/11';
  if (/Windows NT 6.3/.test(userAgent)) return 'Windows 8.1';
  if (/Windows NT 6.2/.test(userAgent)) return 'Windows 8';
  if (/Windows NT 6.1/.test(userAgent)) return 'Windows 7';
  if (/Mac OS X/.test(userAgent)) {
    const match = userAgent.match(/Mac OS X (\d+[._]\d+)/);
    return match ? `macOS ${match[1].replace('_', '.')}` : 'macOS';
  }
  if (/Linux/.test(userAgent)) return 'Linux';
  if (/Android/.test(userAgent)) {
    const match = userAgent.match(/Android (\d+[.\d]*)/);
    return match ? `Android ${match[1]}` : 'Android';
  }
  if (/iPhone OS/.test(userAgent) || /iOS/.test(userAgent)) {
    const match = userAgent.match(/OS (\d+[._]\d+)/);
    return match ? `iOS ${match[1].replace('_', '.')}` : 'iOS';
  }
  if (/iPad/.test(userAgent)) {
    const match = userAgent.match(/OS (\d+[._]\d+)/);
    return match ? `iPadOS ${match[1].replace('_', '.')}` : 'iPadOS';
  }
  return platform || 'Unknown OS';
}

function detectDeviceType(userAgent, screenWidth) {
  if (/Mobile|Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
    if (/Tablet|iPad/i.test(userAgent) || (screenWidth >= 768 && screenWidth < 1024)) {
      return 'Tablet';
    }
    return 'Mobile';
  }
  return 'Desktop';
}

// 기기 이름 생성 (더 상세한 정보 포함)
export function generateDeviceName(deviceInfo) {
  const { browser, os, deviceType } = deviceInfo;
  
  let name = '';
  
  if (deviceType === 'Mobile') {
    name = `${os} (모바일)`;
  } else if (deviceType === 'Tablet') {
    name = `${os} (태블릿)`;
  } else {
    name = `${browser} on ${os}`;
  }
  
  return name;
}

// 기기 정보를 문자열로 요약
export function getDeviceSummary(deviceInfo) {
  const { browser, os, deviceType, screen, language, timezone } = deviceInfo;
  
  return {
    name: generateDeviceName(deviceInfo),
    details: [
      `브라우저: ${browser}`,
      `OS: ${os}`,
      `기기 타입: ${deviceType}`,
      `화면: ${screen.width}x${screen.height}`,
      `언어: ${language}`,
      `타임존: ${timezone}`,
    ].join(' | '),
  };
}

