import './MonochromePage.css';

function OrderDetailPage({ order, onBack }) {
  if (!order) {
    return (
      <div className="mono-page">
        <div className="mono-page__container">
          <header className="mono-header">
            <button type="button" className="mono-back" onClick={onBack}>
              ← 뒤로가기
            </button>
            <h1 className="mono-title">주문 상세</h1>
            <p className="mono-subtitle">주문 정보를 찾을 수 없습니다.</p>
          </header>
        </div>
      </div>
    );
  }

  return (
    <div className="mono-page">
      <div className="mono-page__container">
        <header className="mono-header">
          <button type="button" className="mono-back" onClick={onBack}>
            ← 뒤로가기
          </button>
          <h1 className="mono-title">주문 상세</h1>
          <p className="mono-subtitle">주문번호: {order.orderNumber || order._id}</p>
        </header>

        <section className="mono-section">
          <h2 className="mono-section__title">주문 정보</h2>
          <div className="mono-list">
            <div className="mono-list__item">상태: {order.status || 'processing'}</div>
            <div className="mono-list__item">
              결제 금액: {order.summary?.grandTotal?.toLocaleString() || 0}원
            </div>
            <div className="mono-list__item">
              결제 수단: {order.payment?.method || 'card'}
            </div>
          </div>
        </section>

        <section className="mono-section">
          <h2 className="mono-section__title">주문 상품</h2>
          <ul className="mono-list">
            {order.items?.map((item, index) => (
              <li key={`${item.name}-${index}`} className="mono-list__item">
                <strong>{item.name}</strong>
                <div className="mono-muted">
                  {item.quantity}개 · {item.unitPrice?.toLocaleString() || 0}원
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

export default OrderDetailPage;
