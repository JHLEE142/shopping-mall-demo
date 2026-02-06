import { useState, useEffect } from 'react';
import { getTrustedDevices, revokeDevice, revokeAllDevices } from '../services/trustedDeviceService';
import { clearSession, clearTrustedDevice } from '../utils/sessionStorage';
import { getDeviceInfo, generateDeviceName } from '../utils/deviceInfo';
import { getUserById, updateUserSettings } from '../services/userService';
import './SettingsPage.css';

function SettingsPage({ user, onBack, onLogout }) {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revokingDeviceId, setRevokingDeviceId] = useState(null);
  const [sellerNameDisplayFormat, setSellerNameDisplayFormat] = useState('businessName');
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    // 현재 기기 정보 콘솔 출력 (항상 실행)
    console.log('=== SettingsPage 로드됨 ===');
    console.log('user prop:', user);
    
    const deviceInfo = getDeviceInfo();
    console.log('\n=== 현재 접속 계정 정보 ===');
    if (user) {
      console.log('사용자:', user.name || user.email);
      console.log('사용자 ID:', user._id || user.id);
    } else {
      console.log('사용자: 로그인되지 않음');
    }
    console.log('\n=== 현재 기기 정보 ===');
    console.log('기기 이름:', generateDeviceName(deviceInfo));
    console.log('브라우저:', deviceInfo.browser);
    console.log('OS:', deviceInfo.os);
    console.log('기기 타입:', deviceInfo.deviceType);
    console.log('화면 해상도:', `${deviceInfo.screen.width}x${deviceInfo.screen.height}`);
    console.log('언어:', deviceInfo.language);
    console.log('타임존:', deviceInfo.timezone);
    console.log('플랫폼:', deviceInfo.platform);
    console.log('User-Agent:', deviceInfo.userAgent);
    console.log('========================\n');
    
    loadDevices();
    
    // 관리자 권한이 있는 경우 사용자 설정 로드
    if (user?.user_type === 'admin' && user?._id) {
      getUserById(user._id)
        .then((data) => {
          if (data.user?.sellerNameDisplayFormat) {
            setSellerNameDisplayFormat(data.user.sellerNameDisplayFormat);
          }
        })
        .catch((err) => {
          console.error('Failed to load user settings:', err);
        });
    }
  }, [user]);
  
  const handleSaveSellerNameDisplayFormat = async () => {
    if (!user?._id || user?.user_type !== 'admin') return;
    
    try {
      setSavingSettings(true);
      await updateUserSettings(user._id, { sellerNameDisplayFormat });
      alert('설정이 저장되었습니다.');
    } catch (err) {
      alert(err.message || '설정 저장에 실패했습니다.');
    } finally {
      setSavingSettings(false);
    }
  };

  const loadDevices = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('[SettingsPage] 기기 목록 로드 시작');
      const data = await getTrustedDevices();
      console.log('[SettingsPage] 기기 목록 로드 완료:', data);
      setDevices(data.devices || []);
    } catch (err) {
      console.error('[SettingsPage] 기기 목록 로드 실패:', err);
      setError(err.message || '기기 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeDevice = async (deviceId) => {
    if (!confirm('이 기기에서 로그아웃하시겠습니까?')) {
      return;
    }

    try {
      setRevokingDeviceId(deviceId);
      await revokeDevice(deviceId);
      await loadDevices();
    } catch (err) {
      alert(err.message || '기기 로그아웃에 실패했습니다.');
    } finally {
      setRevokingDeviceId(null);
    }
  };

  const handleRevokeAllDevices = async () => {
    if (!confirm('모든 기기에서 로그아웃하시겠습니까? 현재 기기에서도 로그아웃됩니다.')) {
      return;
    }

    try {
      await revokeAllDevices();
      clearSession();
      clearTrustedDevice();
      if (onLogout) {
        onLogout();
      }
    } catch (err) {
      alert(err.message || '모든 기기 로그아웃에 실패했습니다.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const weekday = weekdays[date.getDay()];
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).replace(/(\d{4})년 (\d{1,2})월 (\d{1,2})일/, `$1년 $2월 $3일 (${
      weekday
    })`);
  };

  const formatShortDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const weekday = weekdays[date.getDay()];
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).replace(/(\d{4})년 (\d{1,2})월 (\d{1,2})일/, `$1년 $2월 $3일 (${
      weekday
    })`);
  };

  const getDeviceDisplayName = (device) => {
    const parts = [];
    if (device.deviceName) {
      const name = device.deviceName;
      // "Chrome on macOS" 형식을 "Chrome|macOS"로 변환
      if (name.includes(' on ')) {
        const [browser, os] = name.split(' on ');
        parts.push(os.trim());
        parts.push(browser.trim());
      } else if (name.includes('(')) {
        // "iOS (모바일)" 형식은 그대로 사용
        parts.push(name);
      } else {
        parts.push(name);
      }
    } else {
      parts.push('알 수 없는 기기');
    }
    return parts.join('|');
  };

  const isCurrentDevice = (device) => {
    try {
      const currentDevice = JSON.parse(localStorage.getItem('trustedDevice') || '{}');
      // deviceId로 비교 (device._id는 MongoDB ObjectId이므로 deviceId 필드와 비교)
      return currentDevice.deviceId && device.deviceId === currentDevice.deviceId;
    } catch {
      return false;
    }
  };

  return (
    <div className="settings-wrapper">
      <button className="back-link" type="button" onClick={onBack}>
        ← 뒤로가기
      </button>

      <section className="settings-card">
        <header className="settings-header">
          <h1 className="settings-title">환경설정</h1>
          <p className="settings-subtitle">계정 및 보안 설정을 관리하세요.</p>
        </header>

        <div className="settings-content">
          <section className="settings-section">
            <h2 className="settings-section-title">로그인된 기기</h2>
            <p className="settings-section-description">
              현재 로그인되어 있는 기기 목록입니다. 30일 이상 사용하지 않은 기기는 자동으로 만료됩니다.
            </p>

            {loading ? (
              <div className="settings-loading">기기 목록을 불러오는 중...</div>
            ) : error ? (
              <div className="settings-error">{error}</div>
            ) : devices.length === 0 ? (
              <div className="settings-empty">로그인된 기기가 없습니다.</div>
            ) : (
              <div className="devices-list">
                {devices.map((device) => {
                  const isCurrent = isCurrentDevice(device);
                  const deviceDisplayName = getDeviceDisplayName(device);
                  
                  return (
                    <div key={device._id} className="device-card">
                      <div className="device-card-header">
                        <div className="device-icon">
                          {device.deviceType === 'Mobile' || device.deviceName?.includes('iPhone') || device.deviceName?.includes('Android') ? (
                            <span className="device-icon-mobile">📱</span>
                          ) : (
                            <span className="device-icon-desktop">💻</span>
                          )}
                        </div>
                        <div className="device-title">{deviceDisplayName}</div>
                      </div>
                      <div className="device-card-body">
                        <div className="device-info-row">
                          <span className="device-info-label">로그인 IP</span>
                          <span className="device-info-value">
                            {device.lastIp || '알 수 없음'} (대한민국)
                          </span>
                        </div>
                        <div className="device-info-row">
                          <span className="device-info-label">최근 로그인</span>
                          <span className={`device-info-value ${isCurrent ? 'device-info-value--active' : ''}`}>
                            {isCurrent ? '현재 사용 중' : formatShortDate(device.lastUsedAt)}
                          </span>
                        </div>
                        <div className="device-info-row">
                          <span className="device-info-label">최초 로그인</span>
                          <span className="device-info-value">
                            {formatShortDate(device.createdAt)}
                          </span>
                        </div>
                      </div>
                      {!isCurrent && (
                        <div className="device-card-footer">
                          <button
                            type="button"
                            className="device-logout-button"
                            onClick={() => handleRevokeDevice(device._id)}
                            disabled={revokingDeviceId === device._id}
                          >
                            {revokingDeviceId === device._id ? '처리 중...' : '로그아웃'}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {devices.length > 0 && (
              <div className="settings-section-actions">
                <button
                  type="button"
                  className="danger-button"
                  onClick={handleRevokeAllDevices}
                >
                  모든 기기에서 로그아웃
                </button>
              </div>
            )}
          </section>
          
          {/* 관리자 전용: 판매자 이름 표시 설정 */}
          {user?.user_type === 'admin' && (
            <section className="settings-section">
              <h2 className="settings-section-title">판매자 이름 표시 설정</h2>
              <p className="settings-section-description">
                상품 상세페이지에서 판매자 이름을 어떻게 표시할지 선택하세요.
              </p>
              
              <div style={{ marginTop: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  표시 형식
                </label>
                <select
                  value={sellerNameDisplayFormat}
                  onChange={(e) => setSellerNameDisplayFormat(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px',
                    fontSize: '0.9rem',
                    marginBottom: '1rem',
                  }}
                >
                  <option value="businessName">사업자명 표시</option>
                  <option value="sellerName">판매자명 표시</option>
                  <option value="hide">숨김</option>
                </select>
                
                <button
                  type="button"
                  onClick={handleSaveSellerNameDisplayFormat}
                  disabled={savingSettings}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#6366f1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: savingSettings ? 'not-allowed' : 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                  }}
                >
                  {savingSettings ? '저장 중...' : '설정 저장'}
                </button>
              </div>
            </section>
          )}
        </div>
      </section>
    </div>
  );
}

export default SettingsPage;

