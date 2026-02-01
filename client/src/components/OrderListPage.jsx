import { useState, useEffect } from 'react';
import { Search, ChevronRight, Package, Truck, CheckCircle } from 'lucide-react';
import { fetchOrders } from '../services/orderService';
import { addItemToCart } from '../services/cartService';
import './OrderListPage.css';

function OrderListPage({ user, onBack, onViewOrderDetail, onViewProduct, onExchangeReturn, onTrackOrder }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('최근 6개월');
  const [addingToCartItemId, setAddingToCartItemId] = useState(null);

  useEffect(() => {
    if (!user) return;

    async function loadOrders() {
      try {
        setLoading(true);
        setError('');
        // 현재 로그인한 사용자의 주문만 불러오기
        const userId = user._id || user.id;
        const data = await fetchOrders({ 
          page: 1, 
          limit: 100,
          userId: userId 
        });
        // 서버 응답 구조에 따라 items 또는 orders 필드 확인
        setOrders(data.items || data.orders || []);
      } catch (err) {
        console.error('주문 목록 로드 실패:', err);
        setError(err.message || '주문 목록을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, [user]);

  // 날짜별로 주문 그룹화
  const groupedOrders = orders.reduce((acc, order) => {
    const orderDate = new Date(order.createdAt);
    const dateKey = orderDate.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).replace(/\. /g, '.').replace(/\.$/, '');

    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(order);
    return acc;
  }, {});

  // 검색 필터링
  const filteredOrders = Object.entries(groupedOrders).reduce((acc, [date, dateOrders]) => {
    const filtered = dateOrders.filter(order => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return order.items?.some(item => 
        item.name?.toLowerCase().includes(query) ||
        item.sku?.toLowerCase().includes(query)
      );
    });
    if (filtered.length > 0) {
      acc[date] = filtered;
    }
    return acc;
  }, {});

  const getOrderStatus = (order) => {
    // 배송 완료 상태 확인 (fulfilled이고 deliveredAt이 있거나, deliveredAt이 있으면)
    if (order.status === 'fulfilled' || order.shipping?.deliveredAt) {
      const deliveredDate = order.shipping?.deliveredAt 
        ? new Date(order.shipping.deliveredAt) 
        : new Date(order.updatedAt);
      const today = new Date();
      const diffTime = today - deliveredDate;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return { text: '배송완료 · 오늘 도착', status: 'delivered' };
      if (diffDays === 1) return { text: '배송완료 · 어제 도착', status: 'delivered' };
      const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
      const weekday = weekdays[deliveredDate.getDay()];
      const dateStr = `${deliveredDate.getMonth() + 1}/${deliveredDate.getDate()}`;
      return { text: `배송완료 · ${dateStr}(${weekday}) 도착`, status: 'delivered' };
    }
    // 배송중 (fulfilled이고 dispatchedAt이 있지만 deliveredAt이 없으면)
    if (order.status === 'fulfilled' && order.shipping?.dispatchedAt && !order.shipping?.deliveredAt) {
      return { text: '배송중', status: 'shipping' };
    }
    // 결제완료 및 상품준비중
    if (order.status === 'paid') {
      return { text: '상품준비중', status: 'processing' };
    }
    if (order.status === 'cancelled') {
      return { text: '주문취소', status: 'cancelled' };
    }
    if (order.status === 'refunded') {
      return { text: '환불완료', status: 'refunded' };
    }
    return { text: '결제대기', status: 'pending' };
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).replace(/\. /g, '.').replace(/\.$/, '');
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ko-KR').format(price || 0);
  };

  const handleAddToCart = async (item) => {
    const productId = item.product?._id || item.product?.id;
    if (!productId) {
      alert('상품 정보를 찾을 수 없습니다.');
      return;
    }
    try {
      setAddingToCartItemId(productId);
      await addItemToCart(productId, 1);
      alert('장바구니에 담았습니다.');
    } catch (err) {
      alert(err.message || '장바구니 담기에 실패했습니다.');
    } finally {
      setAddingToCartItemId(null);
    }
  };

  const yearFilters = ['최근 6개월', '2025', '2024', '2023', '2022', '2021', '2020'];

  return (
    <div className="order-list-page">
      <div className="order-list-page__container">
        {/* 헤더 */}
        <header className="order-list-page__header">
          <h1 className="order-list-page__title">주문목록</h1>
          
          {/* 검색바 */}
          <div className="order-list-page__search">
            <input
              type="text"
              placeholder="주문한 상품을 검색할 수 있어요!"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="order-list-page__search-input"
            />
            <Search size={20} className="order-list-page__search-icon" />
          </div>

          {/* 연도 필터 */}
          <div className="order-list-page__year-filters">
            {yearFilters.map((year) => (
              <button
                key={year}
                type="button"
                className={`order-list-page__year-filter ${selectedYear === year ? 'is-active' : ''}`}
                onClick={() => setSelectedYear(year)}
              >
                {year}
              </button>
            ))}
          </div>
        </header>

        {/* 로딩 상태 */}
        {loading && (
          <div className="order-list-page__loading">
            주문 목록을 불러오는 중입니다...
          </div>
        )}

        {/* 에러 상태 */}
        {error && (
          <div className="order-list-page__error">
            {error}
          </div>
        )}

        {/* 주문 목록 */}
        {!loading && !error && Object.keys(filteredOrders).length === 0 && (
          <div className="order-list-page__empty">
            <Package size={48} />
            <p>주문 내역이 없습니다.</p>
          </div>
        )}

        {!loading && !error && Object.entries(filteredOrders).map(([date, dateOrders]) => (
          <section key={date} className="order-list-page__date-group">
            <h2 className="order-list-page__date-title">{date} 주문</h2>
            
            {dateOrders.map((order) => {
              const statusInfo = getOrderStatus(order);
              
              return (
                <div key={order._id} className="order-list-page__order-card">
                  <div className="order-list-page__order-header">
                    <div className="order-list-page__order-status">
                      {statusInfo.text}
                    </div>
                    <button
                      type="button"
                      className="order-list-page__order-detail-link"
                      onClick={() => onViewOrderDetail?.(order)}
                    >
                      주문 상세보기 <ChevronRight size={16} />
                    </button>
                  </div>

                  {order.items?.map((item, itemIndex) => (
                    <div key={itemIndex} className="order-list-page__order-item">
                      <div className="order-list-page__order-item-left">
                        <div className="order-list-page__order-item-image">
                          <img 
                            src={item.thumbnail || item.image || '/placeholder.png'} 
                            alt={item.name}
                            onError={(e) => {
                              e.target.src = '/placeholder.png';
                            }}
                          />
                          {item.quantity > 1 && (
                            <span className="order-list-page__order-item-quantity-badge">
                              {item.quantity}x
                            </span>
                          )}
                        </div>
                        <div className="order-list-page__order-item-info">
                          {order.shipping?.carrier && (
                            <div className="order-list-page__order-item-delivery-type">
                              <Truck size={16} />
                              <span>{order.shipping.carrier}</span>
                            </div>
                          )}
                          {order.shipping?.status && (
                            <div className="order-list-page__order-item-shipping-status">
                              <span>{order.shipping.status}</span>
                            </div>
                          )}
                          <div className="order-list-page__order-item-name">
                            {item.name}
                          </div>
                          <div className="order-list-page__order-item-price">
                            {formatPrice(item.unitPrice)} 원 {item.quantity > 1 ? `${item.quantity}개` : '1개'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="order-list-page__order-item-actions">
                        <button
                          type="button"
                          className="order-list-page__action-button order-list-page__action-button--primary"
                          onClick={() => {
                            if (onTrackOrder) {
                              onTrackOrder(order);
                            }
                          }}
                        >
                          배송 조회
                        </button>
                        <button
                          type="button"
                          className="order-list-page__action-button"
                          onClick={() => {
                            if (onExchangeReturn) {
                              onExchangeReturn(order, item);
                            }
                          }}
                        >
                          교환, 반품 신청
                        </button>
                        <button
                          type="button"
                          className="order-list-page__action-button"
                          onClick={() => {
                            if (onViewProduct && item.product) {
                              onViewProduct(item.product);
                            }
                          }}
                        >
                          리뷰 작성하기
                        </button>
                        <button
                          type="button"
                          className="order-list-page__action-button"
                          onClick={() => handleAddToCart(item)}
                          disabled={addingToCartItemId === (item.product?._id || item.product?.id)}
                        >
                          {addingToCartItemId === (item.product?._id || item.product?.id) ? '담는 중...' : '장바구니 담기'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </section>
        ))}
      </div>
    </div>
  );
}

export default OrderListPage;
