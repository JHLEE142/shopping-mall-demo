import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Heart,
  Loader2,
  Package,
  RefreshCw,
  Ruler,
  ShieldCheck,
  ShoppingBag,
  Star,
  Store,
  Truck,
} from 'lucide-react';
import { fetchProductById } from '../services/productService';
import { addItemToCart } from '../services/cartService';

const FALLBACK_PRODUCT = {
  id: null,
  name: '패스트 앤 프리 라인드 러닝 쇼츠 5"',
  category: '남성 · 쇼츠',
  activity: '활동용도: 러닝',
  price: 125000,
  priceSale: 100000,
  rating: 4.8,
  reviewCount: 78,
  description:
    '소재를 설계 넓고 가볍게 할 수 있는 수분감과 디자인한 러닝 쇼츠예요. 스마트한 디테일과 함께 자유롭게 질주해 보세요.',
  colors: [
    {
      name: 'Black',
      value: '#0f0f11',
      image: 'https://images.lululemon.com/is/image/lululemon/LM3EKIS_0001_1?wid=1200&hei=1200',
    },
    {
      name: 'Graphite Grey',
      value: '#696c71',
      image: 'https://images.lululemon.com/is/image/lululemon/LM3EKIS_031066_1?wid=1200&hei=1200',
    },
    {
      name: 'Silver Drop',
      value: '#d5d7db',
      image: 'https://images.lululemon.com/is/image/lululemon/LM3EKIS_069030_1?wid=1200&hei=1200',
    },
    {
      name: 'Fog Green',
      value: '#a0a58f',
      image: 'https://images.lululemon.com/is/image/lululemon/LM3EKIS_044875_1?wid=1200&hei=1200',
    },
  ],
  sizes: [
    { label: 'XS (KR 90)', value: 'XS', available: true },
    { label: 'S (KR 95)', value: 'S', available: true },
    { label: 'M (KR 100)', value: 'M', available: true },
    { label: 'L (KR 105)', value: 'L', available: true },
    { label: 'XL (KR 110)', value: 'XL', available: false },
    { label: 'XXL (KR 115)', value: 'XXL', available: false },
  ],
  gallery: [
    'https://images.lululemon.com/is/image/lululemon/LM3EKIS_0001_1?wid=1600&hei=1600',
    'https://images.lululemon.com/is/image/lululemon/LM3EKIS_0001_4?wid=1600&hei=1600',
    'https://images.lululemon.com/is/image/lululemon/LM3EKIS_0001_5?wid=1600&hei=1600',
    'https://images.lululemon.com/is/image/lululemon/LM3EKIS_0001_7?wid=1600&hei=1600',
  ],
  story: {
    title: '비하인드 스토리',
    description:
      '소재를 설계 넓고 가볍게 할 수 있는 수분감과 디자인한 러닝 쇼츠예요. 스마트한 디테일과 함께 자유롭게 질주해 보세요.',
    bullets: [
      '초경량 나일론 소재로 통기성과 속건성이 뛰어나요.',
      '라이너 쇼츠가 함께 있어 마찰을 줄이고 안정적인 착용감을 제공합니다.',
      '허리 밴드 안쪽에 파우치 포켓을 더해 두 손은 자유롭게 달릴 수 있어요.',
    ],
    images: [
      'https://images.lululemon.com/is/image/lululemon/LM3EKIS_0001_8?wid=1280&hei=1280',
      'https://images.lululemon.com/is/image/lululemon/LM3EKIS_0001_6?wid=1280&hei=1280',
    ],
  },
  materials: ['나일론 71%', '라이크라® 엘라스틴 29%'],
  care: '동일 컬러와 세탁망 사용을 권장합니다. 염소 표백제 사용은 피해주세요.',
};

const FALLBACK_REVIEW_SUMMARY = [
  { stars: 5, count: 70 },
  { stars: 4, count: 5 },
  { stars: 3, count: 0 },
  { stars: 2, count: 2 },
  { stars: 1, count: 1 },
];

const FALLBACK_REVIEW_MEDIA = [
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1612810806695-30ba0b38fa67?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1600180758890-6b94519a8ba6?auto=format&fit=crop&w=600&q=80',
];

const FALLBACK_REGION_REVIEWS = [
  {
    id: 1,
    region: '서울',
    title: '러닝 쇼츠 고민할 것 없음 !!',
    rating: 5,
    nickname: '룰루퀸즈',
    date: '4일 전',
    body: '러닝 여행 필수템 패스트 앤 프리 쇼츠로 종결. 너무 좋아 경량감 하나 더 구입했어요. 허벅지를 짱짱하게 감싸주는 느낌이 인상적이네요. ^^',
    fit: '사이즈 정사이즈',
    purchaseSize: '구매 사이즈: M',
    image:
      'https://images.unsplash.com/photo-1580052614034-c55d20bfee3b?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 2,
    region: '부산',
    title: '통기성 최고에요',
    rating: 5,
    nickname: '러너맨',
    date: '1주 전',
    body: '야간 러닝 때도 밴드가 안정적으로 잡아주고, 땀이 나도 금방 말라요. 내부 포켓에 카드 넣고 뛰기 좋아요.',
    fit: '사이즈 정사이즈',
    purchaseSize: '구매 사이즈: L',
    image:
      'https://images.unsplash.com/photo-1517832207067-4db24a2ae47c?auto=format&fit=crop&w=600&q=80',
  },
];

const FALLBACK_RECOMMENDATIONS = [
  {
    id: 'rec-1',
    name: '라이슨스 투 트레인 라인드 쇼츠 7"',
    priceRange: '108,000원 - 135,000원',
    image:
      'https://images.lululemon.com/is/image/lululemon/LM3AXVS_0001_1?wid=1200&hei=1200',
  },
  {
    id: 'rec-2',
    name: '제로드 인 라인드 쇼츠 7"',
    priceRange: '87,000원 - 109,000원',
    image:
      'https://images.lululemon.com/is/image/lululemon/LM3FG8S_0001_1?wid=1200&hei=1200',
  },
  {
    id: 'rec-3',
    name: '페이스 브레이커 라인드 쇼츠 5" 멀티에이트',
    priceRange: '74,000원 - 93,000원',
    image:
      'https://images.lululemon.com/is/image/lululemon/LM3GNAS_0001_1?wid=1200&hei=1200',
  },
  {
    id: 'rec-4',
    name: '마일 메이커 리플렉티브 라인러스 쇼츠 6"',
    priceRange: '97,000원',
    image:
      'https://images.lululemon.com/is/image/lululemon/LM3GI2S_0001_1?wid=1200&hei=1200',
  },
];

function buildProductData(source) {
  if (!source) {
    return { ...FALLBACK_PRODUCT };
  }

  const base = { ...FALLBACK_PRODUCT };
  const mergedPrice = Number(source.price ?? base.price);

  return {
    ...base,
    ...source,
    category: source.category || base.category,
    activity: source.activity || base.activity,
    price: mergedPrice || base.price,
    priceSale: Number(source.priceSale ?? source.price ?? base.priceSale ?? mergedPrice),
    rating: source.rating || base.rating,
    reviewCount: source.reviewCount || base.reviewCount,
    description: source.description || base.description,
    colors:
      Array.isArray(source.colors) && source.colors.length
        ? source.colors
        : base.colors,
    sizes:
      Array.isArray(source.sizes) && source.sizes.length ? source.sizes : base.sizes,
    gallery:
      Array.isArray(source.gallery) && source.gallery.length
        ? source.gallery
        : [
            source.image || base.gallery[0],
            ...(base.gallery.slice(1) ?? []),
          ],
    story: source.story || base.story,
    materials:
      Array.isArray(source.materials) && source.materials.length
        ? source.materials
        : base.materials,
    care: source.care || base.care,
  };
}

function calculateReviewTotal(summary) {
  return summary.reduce((total, item) => total + item.count, 0);
}

function ProductDetailPage({
  productId,
  product: initialProduct = null,
  onBack,
  onAddToCartSuccess = () => {},
  onViewCart = () => {},
}) {
  const [product, setProduct] = useState(buildProductData(initialProduct));
  const [status, setStatus] = useState(initialProduct ? 'success' : 'loading');
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(product.colors[0]);
  const [selectedSize, setSelectedSize] = useState(null);
  const [addStatus, setAddStatus] = useState('idle');
  const [addError, setAddError] = useState('');
  const [addMessage, setAddMessage] = useState('');
  const [showCartModal, setShowCartModal] = useState(false);

  useEffect(() => {
    const normalized = buildProductData(initialProduct);
    setProduct(normalized);
    setSelectedColor(normalized.colors[0]);
    setSelectedSize(null);
    setActiveImage(0);
  }, [initialProduct]);

  useEffect(() => {
    let isMounted = true;

    async function loadProduct() {
      if (!productId) {
        setStatus('success');
        return;
      }

      try {
        setStatus('loading');
        setError('');
        const data = await fetchProductById(productId);
        if (!isMounted) return;
        const normalized = buildProductData(data);
        setProduct(normalized);
        setSelectedColor(normalized.colors[0]);
        setSelectedSize(null);
        setActiveImage(0);
        setStatus('success');
      } catch (err) {
        if (!isMounted) return;
        setStatus('error');
        setError(err.message || '상품 정보를 불러오지 못했습니다.');
      }
    }

    loadProduct();

    return () => {
      isMounted = false;
    };
  }, [productId]);

  const formattedPrice = useMemo(() => {
    const formatter = new Intl.NumberFormat('ko-KR');
    return `${formatter.format(product.priceSale || product.price)}원`;
  }, [product.priceSale, product.price]);

  const formattedComparePrice = useMemo(() => {
    if (!product.price || product.price === product.priceSale) {
      return null;
    }
    const formatter = new Intl.NumberFormat('ko-KR');
    return `${formatter.format(product.price)}원`;
  }, [product.price, product.priceSale]);

  const reviewSummary = FALLBACK_REVIEW_SUMMARY;
  const reviewTotal = calculateReviewTotal(reviewSummary);

  const handleAddToCart = async () => {
    if (addStatus === 'loading') return;

    const resolvedProductId = product?._id || product?.id || productId;
    if (!resolvedProductId) {
      setAddError('상품 정보를 확인할 수 없습니다.');
      return;
    }

    if (product?.sizes?.length && !selectedSize) {
      setAddError('사이즈를 선택해주세요.');
      return;
    }

    setAddStatus('loading');
    setAddError('');
    setAddMessage('');

    try {
      const selectedOptions = {};
      if (selectedColor?.name) {
        selectedOptions.color = selectedColor.name;
      }
      if (selectedSize) {
        selectedOptions.size = selectedSize;
      }

      const data = await addItemToCart(resolvedProductId, 1, selectedOptions);
      setAddStatus('success');
      setAddMessage('장바구니에 상품이 담겼어요.');
      onAddToCartSuccess(data.cart?.items?.length ?? 0);
      setShowCartModal(true);
    } catch (err) {
      setAddStatus('error');
      setAddError(err.message || '장바구니에 담는 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="product-page">
      <button type="button" className="product-page__back" onClick={onBack}>
        <ArrowLeft size={18} />
        쇼핑 계속하기
      </button>

      {status === 'loading' && (
        <div className="product-page__loading">
          <Loader2 className="product-page__loading-icon" />
          <p>상품 정보를 불러오는 중입니다...</p>
        </div>
      )}

      {status === 'error' && (
        <div className="product-page__error">
          <p>{error}</p>
          <button type="button" onClick={onBack}>
            다른 상품 보러가기
          </button>
        </div>
      )}

      {status === 'success' && (
        <>
          {showCartModal && (
            <div className="product-cart-modal" role="dialog" aria-modal="true">
              <div className="product-cart-modal__content">
                <h3>장바구니에 담겼습니다.</h3>
                <p>장바구니를 확인해보시겠습니까?</p>
                <div className="product-cart-modal__actions">
                  <button
                    type="button"
                    className="product-cart-modal__secondary"
                    onClick={() => {
                      setShowCartModal(false);
                      setAddMessage('');
                      setAddError('');
                    }}
                  >
                    계속 쇼핑하기
                  </button>
                  <button
                    type="button"
                    className="product-cart-modal__primary"
                    onClick={() => {
                      setShowCartModal(false);
                      onViewCart();
                    }}
                  >
                    장바구니로 이동
                  </button>
                </div>
              </div>
            </div>
          )}
          <section className="product-hero">
            <div className="product-gallery">
              <div className="product-gallery__main">
                <button
                  type="button"
                  className="product-gallery__nav product-gallery__nav--prev"
                  onClick={() =>
                    setActiveImage((prev) => (prev - 1 + product.gallery.length) % product.gallery.length)
                  }
                >
                  <ChevronLeft size={20} />
                </button>
                <img src={product.gallery[activeImage]} alt={`${product.name} 이미지 ${activeImage + 1}`} />
                <button
                  type="button"
                  className="product-gallery__nav product-gallery__nav--next"
                  onClick={() => setActiveImage((prev) => (prev + 1) % product.gallery.length)}
                >
                  <ChevronRight size={20} />
                </button>
                <button type="button" className="product-gallery__wishlist" aria-label="관심상품 추가">
                  <Heart size={18} />
                </button>
              </div>
              <div className="product-gallery__thumbnails">
                {product.gallery.map((image, index) => (
                  <button
                    type="button"
                    key={`${image}-${index}`}
                    className={`product-gallery__thumbnail ${activeImage === index ? 'is-active' : ''}`}
                    onClick={() => setActiveImage(index)}
                  >
                    <img src={image} alt={`${product.name} 썸네일 ${index + 1}`} />
                  </button>
                ))}
              </div>
              <div className="product-gallery__note">
                <span>Ade의 키는 191cm로 L (KR 105) 사이즈를 착용했어요.</span>
                <button type="button">사이즈 가이드 보기</button>
              </div>
            </div>

            <div className="product-info">
              <p className="product-info__category">{product.activity}</p>
              <h1 className="product-info__title">{product.name}</h1>
              <div className="product-info__rating">
                <Star size={18} fill="#111" strokeWidth={0} />
                <span>
                  {product.rating?.toFixed(1)} ({product.reviewCount} 상품평)
              </span>
                <button type="button" className="product-info__rating-link">
                  상품평 보기
                </button>
              </div>

              <div className="product-info__prices">
                <span className="product-info__price--sale">{formattedPrice}</span>
                {formattedComparePrice && (
                  <span className="product-info__price--compare">{formattedComparePrice}</span>
                )}
              </div>

              <div className="product-info__colors">
                <div className="product-info__colors-header">
                  <p>
                    컬러: <strong>{selectedColor?.name}</strong>
                  </p>
                  <button type="button" className="product-info__colors-link">
                    모든 컬러 보기
                  </button>
                </div>
                <div className="product-info__color-swatches">
                  {product.colors.map((color) => (
                    <button
                      type="button"
                      key={color.name}
                      className={`product-info__color ${selectedColor?.name === color.name ? 'is-active' : ''}`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => {
                        setSelectedColor(color);
                        if (color.image) {
                          const galleryIndex = product.gallery.findIndex((image) => image === color.image);
                          if (galleryIndex >= 0) {
                            setActiveImage(galleryIndex);
                          }
                        }
                      }}
                      aria-label={`${color.name} 컬러`}
                    />
                  ))}
            </div>
          </div>

              <div className="product-info__sizes">
                <div className="product-info__sizes-header">
                  <p>US (KR) 사이즈를 선택하세요</p>
                  <button type="button">사이즈 가이드</button>
                </div>
                <div className="product-info__size-grid">
                  {product.sizes.map((size) => (
                    <button
                      key={size.value}
                      type="button"
                      className={`product-info__size ${selectedSize === size.value ? 'is-active' : ''}`}
                      disabled={!size.available}
                      onClick={() => setSelectedSize(size.value)}
                    >
                      {size.label}
                    </button>
                  ))}
                </div>
                <button type="button" className="product-info__fit-button">
                  내게 꼭 맞는 사이즈는?
                </button>
              </div>

              <div className="product-info__cta">
                <button
                  type="button"
                  className="product-info__cta-primary"
                  onClick={handleAddToCart}
                  disabled={addStatus === 'loading'}
                >
                  <ShoppingBag size={18} />
                  {addStatus === 'loading' ? '담는 중...' : '장바구니 담기'}
                </button>
                <button type="button" className="product-info__cta-secondary">
                  바로 구매하기
                </button>
              </div>
              {(addError || addMessage) && (
                <p className={`product-info__add-status ${addError ? 'is-error' : 'is-success'}`}>
                  {addError || addMessage}
                </p>
              )}

              <div className="product-info__shipping">
                <div>
                  <Truck size={18} />
                  <p>무료배송 + 무료반품</p>
                </div>
                <div>
                  <RefreshCw size={18} />
                  <p>30일 이내 교환·환불 가능</p>
                </div>
                <div>
                  <ShieldCheck size={18} />
                  <p>품질 보증 서비스</p>
                </div>
              </div>

              <div className="product-info__store">
                <Store size={20} />
                <div>
                  <strong>오프라인 스토어에서 찾기</strong>
                  <p>재고 확인을 위해 사이즈를 선택해보세요.</p>
                </div>
                <button type="button">스토어 찾기</button>
              </div>

              <div className="product-info__meta">
                <div>
                  <Package size={18} />
                  <span>포켓: 후면 지퍼 포켓 1개, 내부 파우치 포켓 3개</span>
                </div>
                <div>
                  <Ruler size={18} />
                  <span>핏: 슬림</span>
                </div>
              </div>
            </div>
          </section>

          <section className="product-story">
            <div className="product-story__text">
              <h2>{product.story.title}</h2>
              <p>{product.story.description}</p>
              <ul>
                {product.story.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
              <div className="product-story__materials">
                <div>
                  <h3>소재</h3>
                  <p>{product.materials.join(', ')}</p>
                </div>
                <div>
                  <h3>관리 방법</h3>
                  <p>{product.care}</p>
                </div>
              </div>
            </div>
            <div className="product-story__media">
              {product.story.images.map((image, index) => (
                <img key={image} src={image} alt={`제품 디테일 이미지 ${index + 1}`} />
              ))}
            </div>
          </section>

          <section className="product-reviews">
            <header className="product-reviews__header">
              <div>
                <h2>상품평</h2>
                <p>평균 4.8점 · {product.reviewCount}개의 상품평이 있어요.</p>
              </div>
              <button type="button" className="product-reviews__write">
                상품평 쓰기
              </button>
            </header>

            <div className="product-reviews__summary">
              <div className="product-reviews__score">
                <strong>{product.rating.toFixed(1)}</strong>
                <div>
                  <div className="product-reviews__stars">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star key={index} size={16} fill="#111" strokeWidth={0} />
                    ))}
                  </div>
                  <span>{product.reviewCount}개 상품평</span>
                </div>
              </div>

              <ul className="product-reviews__breakdown">
                {reviewSummary.map((item) => (
                  <li key={item.stars}>
                    <span>{item.stars} 점</span>
                    <div className="product-reviews__bar">
                      <div style={{ width: `${(item.count / reviewTotal) * 100}%` }} />
                    </div>
                    <span>{item.count}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="product-reviews__media">
              {FALLBACK_REVIEW_MEDIA.map((image, index) => (
                <button type="button" key={image} className="product-reviews__media-item">
                  <img src={image} alt={`고객 이미지 ${index + 1}`} />
              </button>
              ))}
            </div>

            <div className="product-reviews__filters">
              <input type="search" placeholder="주제 및 상품평 검색" />
              <select defaultValue="평점">
                <option value="평점">평점</option>
                <option value="최신순">최신순</option>
              </select>
              <select defaultValue="성별">
                <option value="성별">성별</option>
                <option value="남성">남성</option>
                <option value="여성">여성</option>
              </select>
              <select defaultValue="용도">
                <option value="용도">용도</option>
                <option value="러닝">러닝</option>
                <option value="트레이닝">트레이닝</option>
              </select>
              <select defaultValue="평소 사이즈">
                <option value="평소 사이즈">평소 사이즈</option>
                <option value="작음">작음</option>
                <option value="정사이즈">정사이즈</option>
                <option value="큼">큼</option>
              </select>
              <select defaultValue="언어">
                <option value="언어">언어</option>
                <option value="한국어">한국어</option>
                <option value="English">English</option>
              </select>
              <button type="button">필터 초기화</button>
            </div>

            <div className="product-reviews__list">
              {FALLBACK_REGION_REVIEWS.map((review) => (
                <article key={review.id} className="review-card">
                  <div className="review-card__header">
                    <div className="review-card__stars">
                      {Array.from({ length: review.rating }).map((_, index) => (
                        <Star key={index} size={16} fill="#111" strokeWidth={0} />
                      ))}
                    </div>
                    <span className="review-card__region">{review.region}</span>
                  </div>
                  <h3>{review.title}</h3>
                  <p className="review-card__meta">
                    {review.nickname} · {review.date}
                  </p>
                  <p className="review-card__body">{review.body}</p>
                  <div className="review-card__tags">
                    <span>{review.fit}</span>
                    <span>{review.purchaseSize}</span>
                  </div>
                  {review.image && (
                    <div className="review-card__image">
                      <img src={review.image} alt={`${review.nickname} 리뷰 이미지`} />
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>

          <section className="product-recommendations">
            <h2>나를 위한 추천 제품</h2>
            <div className="product-recommendations__grid">
              {FALLBACK_RECOMMENDATIONS.map((item) => (
                <article key={item.id} className="product-recommendations__card">
                  <img src={item.image} alt={item.name} />
                  <div>
                    <h3>{item.name}</h3>
                    <p>{item.priceRange}</p>
                    <button type="button">구매 신청하기</button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="product-newsletter">
            <div className="product-newsletter__content">
          <h2>코로라 뉴스레터 구독 신청</h2>
          <p>코로라 신제품, 스웻라이프 컨텐츠 및 이벤트 소식을 제일 먼저 받아보세요. 구독은 언제든지 취소할 수 있어요.</p>
              <form>
                <input type="email" placeholder="이메일 주소를 입력하세요" />
                <button type="button">구독 신청하기</button>
              </form>
          </div>
          </section>
        </>
      )}
    </div>
  );
}

export default ProductDetailPage;


