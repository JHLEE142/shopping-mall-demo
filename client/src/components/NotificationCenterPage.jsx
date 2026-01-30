import { useState, useEffect } from 'react';
import { getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../services/notificationService';
import './MonochromePage.css';

function NotificationCenterPage({ onBack, onViewProduct }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getUserNotifications(1, 50, false);
      if (response.success && response.data) {
        setNotifications(response.data.notifications || []);
        setUnreadCount(response.data.unreadCount || 0);
      }
    } catch (err) {
      setError(err.message || '알림을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(notifications.map(n => 
        n._id === notificationId ? { ...n, isRead: true } : n
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (err) {
      console.error('알림 읽음 처리 실패:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('모든 알림 읽음 처리 실패:', err);
    }
  };

  const handleProductClick = (notification) => {
    if (notification.relatedProduct && notification.relatedProduct !== null) {
      if (onViewProduct) {
        onViewProduct({ _id: notification.relatedProduct._id || notification.relatedProduct });
      }
    }
  };

  return (
    <div className="mono-page">
      <div className="mono-page__container">
        <header className="mono-header">
          <button type="button" className="mono-back" onClick={onBack}>
            ← 뒤로가기
          </button>
          <h1 className="mono-title">알림 센터</h1>
          <p className="mono-subtitle">주문, 배송, 프로모션 알림을 확인하세요.</p>
          {unreadCount > 0 && (
            <div style={{ marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#111827',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                모두 읽음 처리 ({unreadCount}개)
              </button>
            </div>
          )}
        </header>

        <section className="mono-section">
          <h2 className="mono-section__title">최근 알림</h2>
          {loading ? (
            <p className="mono-muted">알림을 불러오는 중...</p>
          ) : error ? (
            <p className="mono-muted" style={{ color: '#dc3545' }}>{error}</p>
          ) : notifications.length === 0 ? (
            <p className="mono-muted">새로운 알림이 없습니다.</p>
          ) : (
            <ul className="mono-list">
              {notifications.map((item) => {
                const isProductDeleted = item.relatedProduct === null || !item.relatedProduct;
                const isRead = item.isRead;
                
                return (
                  <li 
                    key={item._id} 
                    className={`mono-list__item ${!isRead ? 'mono-list__item--unread' : ''}`}
                    style={{
                      opacity: isRead ? 0.7 : 1,
                      cursor: item.relatedProduct && !isProductDeleted ? 'pointer' : 'default',
                    }}
                    onClick={() => {
                      if (!isRead) {
                        handleMarkAsRead(item._id);
                      }
                      if (item.relatedProduct && !isProductDeleted) {
                        handleProductClick(item);
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                      {item.relatedProduct && !isProductDeleted && item.relatedProduct.image && (
                        <img 
                          src={item.relatedProduct.image} 
                          alt={item.relatedProduct.name || '상품'}
                          style={{
                            width: '60px',
                            height: '60px',
                            objectFit: 'cover',
                            borderRadius: '4px',
                          }}
                        />
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          fontWeight: isRead ? 'normal' : 'bold',
                          marginBottom: '0.25rem',
                        }}>
                          {item.title}
                        </div>
                        <div style={{ 
                          color: '#666',
                          fontSize: '0.875rem',
                          marginBottom: '0.5rem',
                        }}>
                          {item.message}
                        </div>
                        {isProductDeleted && item.type === 'new_product' && (
                          <div style={{
                            color: '#dc3545',
                            fontSize: '0.75rem',
                            fontStyle: 'italic',
                            marginTop: '0.25rem',
                          }}>
                            (이 상품은 더 이상 판매되지 않습니다)
                          </div>
                        )}
                        <div style={{ 
                          color: '#999',
                          fontSize: '0.75rem',
                          marginTop: '0.5rem',
                        }}>
                          {new Date(item.createdAt).toLocaleString('ko-KR')}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

export default NotificationCenterPage;
