import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import './LoyaltyHallPage.css';

// 입고 예정 상품 데이터 (이미지 설명 기반)
const UPCOMING_PRODUCTS = [
  {
    id: 'wedgwood-turquoise-plate-26cm',
    name: '웨지우드 터콰즈 원형 접시 26CM',
    price: 208000,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop',
    brand: 'Wedgwood',
    status: 'upcoming'
  },
  {
    id: 'wedgwood-turquoise-plate-18cm',
    name: '웨지우드 터콰즈 집시 접시 18CM',
    price: 89800,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop',
    brand: 'Wedgwood',
    status: 'upcoming'
  },
  {
    id: 'wedgwood-turquoise-plate-27cm',
    name: '웨지우드 터콰즈 진시 접시 27CM',
    price: 149800,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop',
    brand: 'Wedgwood',
    status: 'upcoming'
  },
  {
    id: 'corelle-rosemont-24pc',
    name: '코렐 코디네이츠 로즈몬트 홈세트 24종',
    price: 125000,
    image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&h=400&fit=crop',
    brand: 'Corelle',
    status: 'upcoming'
  },
  {
    id: 'wedgwood-mellory-ribbon-cake-stand',
    name: '웨지우드 멜로우리본 2단 케이크 스탠드',
    price: 139500,
    image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&h=400&fit=crop',
    brand: 'Wedgwood',
    status: 'upcoming'
  },
  {
    id: 'wedgwood-turquoise-bowl',
    name: '웨지우드 터콰즈 공기',
    price: 89800,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop',
    brand: 'Wedgwood',
    status: 'upcoming'
  },
  {
    id: 'wedgwood-turquoise-cereal-bowl',
    name: '웨지우드 터콰즈 시리얼볼 15.5CM',
    price: 119500,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop',
    brand: 'Wedgwood',
    status: 'upcoming'
  },
  {
    id: 'wedgwood-turquoise-sugar',
    name: '웨지우드 터콰즈 슈가볼',
    price: 189500,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop',
    brand: 'Wedgwood',
    status: 'upcoming'
  }
];

function LoyaltyHallPage({ onBack }) {
  const formatter = new Intl.NumberFormat('ko-KR');

  return (
    <div className="loyalty-hall-page">
      <div className="loyalty-hall-page__container">
        {/* 헤더 */}
        <header className="loyalty-hall-page__header">
          <button
            type="button"
            className="loyalty-hall-page__back-button"
            onClick={onBack}
            aria-label="뒤로가기"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="loyalty-hall-page__title">로열관</h1>
          <div className="loyalty-hall-page__subtitle">
            프리미엄 식기류 입고 예정 상품
          </div>
        </header>

        {/* 상품 그리드 */}
        <div className="loyalty-hall-page__products">
          {UPCOMING_PRODUCTS.map((product) => (
            <div
              key={product.id}
              className="loyalty-hall-card loyalty-hall-card--upcoming"
            >
              <div className="loyalty-hall-card__media">
                <img src={product.image} alt={product.name} loading="lazy" />
                <div className="loyalty-hall-card__badge">
                  <span className="loyalty-hall-card__badge-text">입고 예정</span>
                </div>
              </div>
              <div className="loyalty-hall-card__body">
                <div className="loyalty-hall-card__brand">{product.brand}</div>
                <h3 className="loyalty-hall-card__title">{product.name}</h3>
                <div className="loyalty-hall-card__price">
                  {formatter.format(product.price)}원
                </div>
                <div className="loyalty-hall-card__status">
                  입고 예정일: 추후 공지
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default LoyaltyHallPage;

