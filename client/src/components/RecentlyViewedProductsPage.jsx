import { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, Package, X } from 'lucide-react';
import { getRecentlyViewedProducts, deleteRecentlyViewedProduct, deleteAllRecentlyViewedProducts } from '../services/recentlyViewedProductService';
import './RecentlyViewedProductsPage.css';

function RecentlyViewedProductsPage({ user, onBack, onViewProduct }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;

    async function loadProducts() {
      try {
        setLoading(true);
        setError('');
        const data = await getRecentlyViewedProducts({ page: 1, limit: 100 });
        setProducts(data.items || []);
      } catch (err) {
        console.error('최근 본 상품 로드 실패:', err);
        setError(err.message || '최근 본 상품 목록을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, [user]);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await deleteRecentlyViewedProduct(id);
      setProducts(products.filter((item) => item._id !== id));
    } catch (err) {
      alert(err.message || '삭제에 실패했습니다.');
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm('모든 최근 본 상품을 삭제하시겠습니까?')) {
      return;
    }
    try {
      await deleteAllRecentlyViewedProducts();
      setProducts([]);
    } catch (err) {
      alert(err.message || '삭제에 실패했습니다.');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ko-KR').format(price || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '오늘';
    if (diffDays === 1) return '어제';
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString('ko-KR', {
      month: '2-digit',
      day: '2-digit',
    }).replace(/\. /g, '.').replace(/\.$/, '');
  };

  return (
    <div className="recently-viewed-products-page">
      <div className="recently-viewed-products-page__container">
        <div className="recently-viewed-products-page__header">
          <button
            type="button"
            className="recently-viewed-products-page__back-button"
            onClick={onBack}
          >
            <ArrowLeft size={18} />
            뒤로가기
          </button>
          <div className="recently-viewed-products-page__header-content">
            <h1 className="recently-viewed-products-page__title">최근 본 상품</h1>
            {products.length > 0 && (
              <button
                type="button"
                className="recently-viewed-products-page__delete-all-button"
                onClick={handleDeleteAll}
              >
                전체 삭제
              </button>
            )}
          </div>
        </div>

        {loading && (
          <div className="recently-viewed-products-page__loading">
            최근 본 상품을 불러오는 중입니다...
          </div>
        )}

        {error && (
          <div className="recently-viewed-products-page__error">
            {error}
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="recently-viewed-products-page__empty">
            <Package size={48} />
            <p>최근 본 상품이 없습니다.</p>
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <div className="recently-viewed-products-page__list">
            {products.map((item) => {
              const product = item.product;
              if (!product) return null;

              return (
                <div
                  key={item._id}
                  className="recently-viewed-products-page__card"
                  onClick={() => {
                    if (onViewProduct && product._id) {
                      onViewProduct(product);
                    }
                  }}
                >
                  <div className="recently-viewed-products-page__card-image">
                    <img
                      src={product.image || product.images?.[0] || '/placeholder.png'}
                      alt={product.name}
                      onError={(e) => {
                        e.target.src = '/placeholder.png';
                      }}
                    />
                  </div>
                  <div className="recently-viewed-products-page__card-content">
                    <div className="recently-viewed-products-page__card-header">
                      <h3 className="recently-viewed-products-page__card-title">
                        {product.name}
                      </h3>
                      <button
                        type="button"
                        className="recently-viewed-products-page__delete-button"
                        onClick={(e) => handleDelete(item._id, e)}
                        aria-label="삭제"
                      >
                        <X size={18} />
                      </button>
                    </div>
                    <div className="recently-viewed-products-page__card-price">
                      {product.priceSale ? (
                        <>
                          <span className="recently-viewed-products-page__price-sale">
                            {formatPrice(product.priceSale)}원
                          </span>
                          <span className="recently-viewed-products-page__price-original">
                            {formatPrice(product.price)}원
                          </span>
                        </>
                      ) : (
                        <span className="recently-viewed-products-page__price-sale">
                          {formatPrice(product.price)}원
                        </span>
                      )}
                    </div>
                    <div className="recently-viewed-products-page__card-date">
                      {formatDate(item.viewedAt)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default RecentlyViewedProductsPage;

