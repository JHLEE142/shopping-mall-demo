import { useState, useEffect } from 'react';
import { ArrowLeft, Package, Truck, CheckCircle, ExternalLink } from 'lucide-react';
import './TrackingPage.css';

function TrackingPage({ order, trackingNumber, carrier, onBack }) {
  const [trackingUrl, setTrackingUrl] = useState('');
  const [trackingStatus, setTrackingStatus] = useState('');

  useEffect(() => {
    if (trackingNumber && carrier) {
      // CJ 대한통운인 경우
      if (carrier === 'CJ대한통운' || carrier === 'CJ' || carrier.toLowerCase().includes('cj')) {
        const url = `https://trace.cjlogistics.com/next/tracking.html?wblNo=${encodeURIComponent(trackingNumber)}`;
        setTrackingUrl(url);
      } else {
        // 기타 택배사는 기본 URL 패턴
        setTrackingUrl('');
      }
    }
  }, [trackingNumber, carrier]);

  // 주문 상태에 따른 배송 상태 표시
  useEffect(() => {
    if (order) {
      if (order.shipping?.deliveredAt) {
        setTrackingStatus('delivered');
      } else if (order.shipping?.dispatchedAt) {
        setTrackingStatus('shipping');
      } else if (order.status === 'paid') {
        setTrackingStatus('preparing');
      } else {
        setTrackingStatus('pending');
      }
    }
  }, [order]);

  const getStatusLabel = (status) => {
    switch (status) {
      case 'delivered':
        return '배송완료';
      case 'shipping':
        return '배송중';
      case 'preparing':
        return '상품준비중';
      default:
        return '배송대기';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="tracking-page__status-icon tracking-page__status-icon--delivered" />;
      case 'shipping':
        return <Truck className="tracking-page__status-icon tracking-page__status-icon--shipping" />;
      case 'preparing':
        return <Package className="tracking-page__status-icon tracking-page__status-icon--preparing" />;
      default:
        return <Package className="tracking-page__status-icon tracking-page__status-icon--pending" />;
    }
  };

  if (!order) {
    return (
      <div className="tracking-page">
        <div className="tracking-page__container">
          <button className="tracking-page__back-button" onClick={onBack} type="button">
            <ArrowLeft size={20} />
            뒤로가기
          </button>
          <div className="tracking-page__empty">
            <p>주문 정보를 찾을 수 없습니다.</p>
          </div>
        </div>
      </div>
    );
  }

  const orderTrackingNumber = trackingNumber || order.shipping?.trackingNumber;
  const orderCarrier = carrier || order.shipping?.carrier || 'CJ대한통운';

  return (
    <div className="tracking-page">
      <div className="tracking-page__container">
        <button className="tracking-page__back-button" onClick={onBack} type="button">
          <ArrowLeft size={20} />
          뒤로가기
        </button>

        <header className="tracking-page__header">
          <h1 className="tracking-page__title">배송 추적</h1>
          <div className="tracking-page__order-info">
            <span className="tracking-page__order-number">주문번호: {order.orderNumber || order._id}</span>
          </div>
        </header>

        <div className="tracking-page__content">
          {/* 배송 상태 */}
          <section className="tracking-page__status-section">
            <div className="tracking-page__status">
              {getStatusIcon(trackingStatus)}
              <h2 className="tracking-page__status-title">{getStatusLabel(trackingStatus)}</h2>
            </div>

            {order.shipping?.dispatchedAt && (
              <div className="tracking-page__date-info">
                <span className="tracking-page__date-label">배송 시작일</span>
                <span className="tracking-page__date-value">
                  {new Date(order.shipping.dispatchedAt).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            )}

            {order.shipping?.estimatedDelivery && !order.shipping?.deliveredAt && (
              <div className="tracking-page__date-info">
                <span className="tracking-page__date-label">예상 도착일</span>
                <span className="tracking-page__date-value">
                  {new Date(order.shipping.estimatedDelivery).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            )}

            {order.shipping?.deliveredAt && (
              <div className="tracking-page__date-info">
                <span className="tracking-page__date-label">배송 완료일</span>
                <span className="tracking-page__date-value">
                  {new Date(order.shipping.deliveredAt).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            )}
          </section>

          {/* 배송 정보 */}
          <section className="tracking-page__info-section">
            <h3 className="tracking-page__section-title">배송 정보</h3>
            <div className="tracking-page__info-grid">
              <div className="tracking-page__info-item">
                <span className="tracking-page__info-label">택배사</span>
                <span className="tracking-page__info-value">{orderCarrier}</span>
              </div>
              {orderTrackingNumber && (
                <div className="tracking-page__info-item">
                  <span className="tracking-page__info-label">운송장 번호</span>
                  <span className="tracking-page__info-value tracking-page__info-value--mono">
                    {orderTrackingNumber}
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* 배송 추적 링크 */}
          {orderTrackingNumber && trackingUrl && (
            <section className="tracking-page__link-section">
              <a
                href={trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="tracking-page__tracking-link"
              >
                <ExternalLink size={20} />
                CJ대한통운 상세 조회하기
              </a>
            </section>
          )}

          {orderTrackingNumber && !trackingUrl && (
            <section className="tracking-page__link-section">
              <div className="tracking-page__info-note">
                <p>운송장 번호가 입력되었습니다. 택배사 웹사이트에서 직접 조회해주세요.</p>
                <p className="tracking-page__info-note--small">택배사: {orderCarrier}</p>
                <p className="tracking-page__info-note--small">운송장 번호: {orderTrackingNumber}</p>
              </div>
            </section>
          )}

          {!orderTrackingNumber && (
            <section className="tracking-page__link-section">
              <div className="tracking-page__info-note">
                <p>운송장 번호가 아직 입력되지 않았습니다. 상품 준비가 완료되면 운송장 번호가 등록됩니다.</p>
              </div>
            </section>
          )}

          {/* 배송지 정보 */}
          {order.shipping?.address && (
            <section className="tracking-page__address-section">
              <h3 className="tracking-page__section-title">배송지</h3>
              <div className="tracking-page__address">
                <p className="tracking-page__address-name">{order.shipping.address.name}</p>
                <p className="tracking-page__address-phone">{order.shipping.address.phone}</p>
                <p className="tracking-page__address-full">
                  [{order.shipping.address.postalCode}] {order.shipping.address.address1} {order.shipping.address.address2}
                </p>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

export default TrackingPage;

