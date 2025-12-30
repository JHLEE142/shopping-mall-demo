import { useState, useEffect } from 'react'
import ProductCard from './ProductCard'
import './ProductGrid.css'

/**
 * ProductGrid - 격자형 상품 나열 컴포넌트
 * 
 * @param {Array} products - 상품 배열
 * @param {Function} onProductClick - 상품 클릭 핸들러
 * @param {Object} options - 옵션 객체
 * @param {number} options.columns - 그리드 컬럼 수 (기본값: auto-fill)
 * @param {string} options.gap - 그리드 간격 (기본값: 1.5rem)
 */
function ProductGrid({ products = [], onProductClick, options = {} }) {
  const { columns, gap = '1.5rem' } = options

  if (products.length === 0) {
    return (
      <div className="product-grid-empty">
        <p>등록된 상품이 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="product-grid-container">
      <div 
        className="product-grid"
        style={{
          gridTemplateColumns: columns ? `repeat(${columns}, 1fr)` : 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: gap
        }}
      >
        {products.map((product, index) => {
          // 가격 정보 처리: price, originalPrice, discountRate 사용
          const currentPrice = product.price || 0;
          const originalPrice = product.originalPrice || null;
          const discountRate = product.discountRate || 0;
          const hasDiscount = discountRate > 0 && originalPrice && originalPrice > currentPrice;
          
          return (
          <div
            key={product._id || product.id || index}
            className="product-grid-item"
            onClick={() => onProductClick?.(product)}
          >
            <div className="product-grid-image-wrapper">
              <img 
                src={product.imageUrl || (product.images && product.images[0]?.url) || product.image || '/placeholder-product.jpg'} 
                alt={product.name}
                className="product-grid-image"
              />
              {hasDiscount && (
                <span className="product-grid-discount">
                  {Math.round(discountRate)}%
                </span>
              )}
            </div>
            <div className="product-grid-info">
              <h3 className="product-grid-name">{product.name}</h3>
              <div className="product-grid-price-row">
                <span className="product-grid-price">
                  {new Intl.NumberFormat('ko-KR').format(currentPrice)}원
                </span>
                {hasDiscount && (
                  <span className="product-grid-original-price">
                    {new Intl.NumberFormat('ko-KR').format(originalPrice)}원
                  </span>
                )}
              </div>
              <div className="product-grid-rating">
                <span className="product-grid-stars">★★★★★</span>
                <span className="product-grid-rating-value">4.5</span>
                <span className="product-grid-sold">({Math.floor(Math.random() * 5000) + 1000}+ 판매)</span>
              </div>
              {product.shipping?.isFree && (
                <div className="product-grid-shipping">무료배송</div>
              )}
            </div>
          </div>
          );
        })}
      </div>
    </div>
  )
}

export default ProductGrid

