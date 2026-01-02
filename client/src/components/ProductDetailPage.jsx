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
  Truck,
} from 'lucide-react';
import { fetchProductById, fetchSimilarProducts } from '../services/productService';
import { addItemToCart } from '../services/cartService';
import { getReviewsByProduct, getReviewStats, createReview } from '../services/reviewService';
import { 
  getInquiriesByProduct, 
  createInquiry, 
  answerInquiry, 
  updateInquiry, 
  deleteInquiry 
} from '../services/productInquiryService';
import { loadSession } from '../utils/sessionStorage';
import { X } from 'lucide-react';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

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
    title: '상세 설명',
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
  shipping: {
    isFree: false,
    fee: 3000,
    estimatedDays: 3,
  },
  returnPolicy: {
    isReturnable: true,
    returnDays: 30,
    returnFee: 0,
  },
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

  // 상품 갤러리 이미지 구성
  // 대표 이미지(image 필드)를 첫 번째로, 그 다음에 images 배열의 나머지 이미지들 추가
  const mainImage = source.image || '';
  const additionalImages = Array.isArray(source.images) ? source.images.filter(img => img && img !== mainImage) : [];
  
  // 갤러리: 대표 이미지(image)를 첫 번째로, 나머지 images 배열 추가
  const productGalleryImages = mainImage 
    ? [mainImage, ...additionalImages]
    : (additionalImages.length > 0 ? additionalImages : base.gallery);

  // description을 파싱하여 story와 materials, care 추출 시도
  const description = source.description || '';
  
  // description에서 마크다운 이미지 링크 추출
  const imageMatches = description.match(/!\[.*?\]\((.*?)\)/g) || [];
  const extractedImages = imageMatches.map(match => {
    const urlMatch = match.match(/\((.*?)\)/);
    return urlMatch ? urlMatch[1] : null;
  }).filter(Boolean);

  // description에서 텍스트만 추출 (마크다운 제거하지 않고 그대로 사용)
  const descriptionText = description;

  return {
    ...base,
    name: source.name || base.name,
    category: source.category || base.category,
    activity: `활동용도: ${source.category || base.category}`,
    price: mergedPrice || base.price,
    priceSale: Number(source.priceSale ?? source.price ?? base.priceSale ?? mergedPrice),
    originalPrice: source.originalPrice || null,
    discountRate: source.discountRate || 0,
    rating: source.rating || base.rating,
    reviewCount: source.reviewCount || base.reviewCount,
    description: descriptionText || base.description,
    colors:
      Array.isArray(source.colors) && source.colors.length
        ? source.colors
        : [],
    sizes:
      Array.isArray(source.sizes) && source.sizes.length ? source.sizes : [],
    gallery: productGalleryImages.length > 0 ? productGalleryImages : base.gallery,
    descriptionImages: extractedImages, // 상세 설명 이미지는 별도로 저장
    shipping: source.shipping || base.shipping || { isFree: false, fee: 0, estimatedDays: 3 },
    returnPolicy: source.returnPolicy || base.returnPolicy || { isReturnable: true, returnDays: 30, returnFee: 0 },
    story: {
      title: base.story.title,
      description: descriptionText || base.story.description,
      bullets: base.story.bullets, // 기본값 유지
      images: extractedImages.length > 0 ? extractedImages : [],
    },
    materials: base.materials, // 기본값 유지 (데이터베이스에 없음)
    care: base.care, // 기본값 유지 (데이터베이스에 없음)
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
  onDirectOrder = () => {},
  onViewShippingPolicy = null,
  onViewProduct = null,
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
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState('');
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [quantityOptions] = useState([1, 2, 4, 6]); // 수량 옵션
  const [activeDetailTab, setActiveDetailTab] = useState('detail'); // 'detail', 'reviews', 'inquiry', 'shipping'
  const [showMoreRequiredInfo, setShowMoreRequiredInfo] = useState(false);
  
  // 상품 문의 관련 상태
  const [inquiries, setInquiries] = useState([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(false);
  const [inquiriesError, setInquiriesError] = useState('');
  const [inquirySearch, setInquirySearch] = useState('');
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [newInquiry, setNewInquiry] = useState({ question: '', isSecret: false });
  const [answeringInquiryId, setAnsweringInquiryId] = useState(null);
  const [answerText, setAnswerText] = useState('');
  const [editingInquiryId, setEditingInquiryId] = useState(null);
  
  // 리뷰 작성 관련 상태
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: '',
    body: '',
    region: '',
    fit: '',
    purchaseSize: '',
    images: [],
    gender: '',
    purpose: '',
  });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  
  // 추천 상품 관련 상태
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);

  useEffect(() => {
    const normalized = buildProductData(initialProduct);
    setProduct(normalized);
    setSelectedColor(normalized.colors && normalized.colors.length > 0 ? normalized.colors[0] : null);
    setSelectedSize(null);
    setActiveImage(normalized.gallery.length > 0 ? 0 : 0);
    
    const targetId = initialProduct?._id || productId;
    if (targetId) {
      loadReviews(targetId);
      loadRecommendedProducts(targetId);
    }
  }, [initialProduct, productId]);

  const loadReviews = async (id) => {
    if (!id) return;
    
    try {
      setReviewsLoading(true);
      setReviewsError('');
      const [reviewsData, statsData] = await Promise.all([
        getReviewsByProduct(id, { page: 1, limit: 20 }),
        getReviewStats(id),
      ]);
      setReviews(reviewsData.items || []);
      setReviewStats(statsData);
    } catch (err) {
      console.error('Failed to load reviews:', err);
      setReviewsError(err.message || '리뷰를 불러오는데 실패했습니다.');
      setReviews([]);
      setReviewStats({
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        customerImages: [],
      });
    } finally {
      setReviewsLoading(false);
    }
  };

  const loadRecommendedProducts = async (id) => {
    if (!id) return;
    
    try {
      setRecommendationsLoading(true);
      const products = await fetchSimilarProducts(id, 4);
      setRecommendedProducts(products || []);
    } catch (err) {
      console.error('Failed to load recommended products:', err);
      setRecommendedProducts([]);
    } finally {
      setRecommendationsLoading(false);
    }
  };

  const loadInquiries = async (id) => {
    if (!id) return;
    
    try {
      setInquiriesLoading(true);
      setInquiriesError('');
      const data = await getInquiriesByProduct(id, { page: 1, limit: 50, search: inquirySearch });
      setInquiries(data.items || []);
    } catch (err) {
      console.error('Failed to load inquiries:', err);
      setInquiriesError(err.message || '문의 목록을 불러오는데 실패했습니다.');
      setInquiries([]);
    } finally {
      setInquiriesLoading(false);
    }
  };

  const handleCreateInquiry = async () => {
    if (!newInquiry.question.trim()) {
      alert('문의 내용을 입력해주세요.');
      return;
    }

    const targetProductId = productId || (initialProduct?._id) || product._id;
    if (!targetProductId) {
      alert('상품 정보를 찾을 수 없습니다.');
      return;
    }

    try {
      await createInquiry(targetProductId, newInquiry);
      setNewInquiry({ question: '', isSecret: false });
      setShowInquiryForm(false);
      await loadInquiries(targetProductId);
      alert('문의가 등록되었습니다.');
    } catch (err) {
      alert(err.message || '문의 등록에 실패했습니다.');
    }
  };

  const handleAnswerInquiry = async (inquiryId) => {
    if (!answerText.trim()) {
      alert('답변 내용을 입력해주세요.');
      return;
    }

    try {
      await answerInquiry(inquiryId, answerText);
      setAnswerText('');
      setAnsweringInquiryId(null);
      const targetProductId = productId || (initialProduct?._id) || product._id;
      if (targetProductId) {
        await loadInquiries(targetProductId);
      }
      alert('답변이 등록되었습니다.');
    } catch (err) {
      alert(err.message || '답변 등록에 실패했습니다.');
    }
  };

  const handleDeleteInquiry = async (inquiryId) => {
    if (!window.confirm('정말로 이 문의를 삭제하시겠습니까?')) return;

    try {
      await deleteInquiry(inquiryId);
      const targetProductId = productId || (initialProduct?._id) || product._id;
      if (targetProductId) {
        await loadInquiries(targetProductId);
      }
      alert('문의가 삭제되었습니다.');
    } catch (err) {
      alert(err.message || '문의 삭제에 실패했습니다.');
    }
  };

  // Cloudinary 이미지 업로드
  const uploadImageToCloudinary = async (file) => {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      throw new Error('Cloudinary 설정이 없습니다.');
    }

    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', UPLOAD_PRESET);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`);

      xhr.onload = () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          resolve(response.secure_url);
        } else {
          reject(new Error('이미지 업로드에 실패했습니다.'));
        }
      };

      xhr.onerror = () => reject(new Error('이미지 업로드 중 오류가 발생했습니다.'));
      xhr.send(formData);
    });
  };

  const handleReviewImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    try {
      const uploadPromises = files.map((file) => uploadImageToCloudinary(file));
      const urls = await Promise.all(uploadPromises);
      setReviewForm((prev) => ({
        ...prev,
        images: [...prev.images, ...urls],
      }));
    } catch (err) {
      alert(err.message || '이미지 업로드에 실패했습니다.');
    }
  };

  const handleRemoveReviewImage = (index) => {
    setReviewForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmitReview = async () => {
    if (!reviewForm.title.trim() || !reviewForm.body.trim()) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }

    const targetProductId = productId || (initialProduct?._id) || product._id;
    if (!targetProductId) {
      alert('상품 정보를 찾을 수 없습니다.');
      return;
    }

    try {
      setReviewSubmitting(true);
      await createReview(targetProductId, reviewForm);
      setShowReviewModal(false);
      setReviewForm({
        rating: 5,
        title: '',
        body: '',
        region: '',
        fit: '',
        purchaseSize: '',
        images: [],
        gender: '',
        purpose: '',
      });
      // 리뷰 목록 새로고침
      await loadReviews(targetProductId);
      alert('리뷰가 등록되었습니다.');
    } catch (err) {
      alert(err.message || '리뷰 등록에 실패했습니다.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function loadProduct() {
      // productId가 없으면 URL에서 읽어오기 시도
      let targetProductId = productId;
      if (!targetProductId) {
        const urlParams = new URLSearchParams(window.location.search);
        targetProductId = urlParams.get('productId');
      }

      if (!targetProductId) {
        // productId가 없고 initialProduct도 없으면 에러
        if (!initialProduct) {
          setStatus('error');
          setError('상품 ID가 없습니다.');
          return;
        }
        // initialProduct가 있으면 그것 사용
        setStatus('success');
        return;
      }

      try {
        setStatus('loading');
        setError('');
        const data = await fetchProductById(targetProductId);
        if (!isMounted) return;
        const normalized = buildProductData(data);
        setProduct(normalized);
        setSelectedColor(normalized.colors && normalized.colors.length > 0 ? normalized.colors[0] : null);
        setSelectedSize(null);
        setActiveImage(normalized.gallery.length > 0 ? 0 : 0);
        setStatus('success');
        
        // 리뷰 데이터 로드
        loadReviews(data._id || targetProductId);
        
        // 추천 상품 로드
        loadRecommendedProducts(data._id || targetProductId);
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
  }, [productId, initialProduct]);

  useEffect(() => {
    if (activeDetailTab === 'inquiry') {
      const targetProductId = productId || (initialProduct?._id) || product._id;
      if (targetProductId) {
        loadInquiries(targetProductId);
      }
    }
  }, [activeDetailTab, productId, initialProduct, inquirySearch]);

  const formattedPrice = useMemo(() => {
    const formatter = new Intl.NumberFormat('ko-KR');
    return `${formatter.format(product.priceSale || product.price)}원`;
  }, [product.priceSale, product.price]);

  const formattedComparePrice = useMemo(() => {
    // originalPrice가 있으면 그것을 사용, 없으면 기존 로직 사용
    const currentPrice = product.priceSale || product.price;
    if (product.originalPrice && product.originalPrice > currentPrice) {
      const formatter = new Intl.NumberFormat('ko-KR');
      return `${formatter.format(product.originalPrice)}원`;
    }
    if (!product.price || product.price === product.priceSale) {
      return null;
    }
    const formatter = new Intl.NumberFormat('ko-KR');
    return `${formatter.format(product.price)}원`;
  }, [product.price, product.priceSale, product.originalPrice]);

  // 수량별 가격 계산
  const quantityPrices = useMemo(() => {
    const basePrice = product.priceSale || product.price;
    const originalPrice = product.originalPrice || null;
    
    return quantityOptions.map((qty) => {
      const totalPrice = basePrice * qty;
      const originalTotalPrice = originalPrice ? originalPrice * qty : null;
      
      // 절약 금액 계산: (원래 가격 - 할인된 가격) * 수량
      // originalPrice가 있으면 정확한 절약 금액 계산
      let savings = 0;
      if (originalPrice && originalPrice > basePrice) {
        const perUnitSavings = originalPrice - basePrice;
        savings = Math.round(perUnitSavings * qty);
      }
      
      const discount = originalTotalPrice ? originalTotalPrice - totalPrice : 0;
      const discountPerUnit = qty > 1 && originalTotalPrice ? Math.floor(discount / qty) : 0;
      
      return {
        quantity: qty,
        price: totalPrice,
        originalPrice: originalTotalPrice,
        discount,
        discountPerUnit,
        savings,
        pricePerUnit: Math.floor(totalPrice / qty),
      };
    });
  }, [product.priceSale, product.price, product.originalPrice, quantityOptions]);

  // 선택된 수량의 가격 정보
  const selectedQuantityPrice = useMemo(() => {
    return quantityPrices.find(qp => qp.quantity === selectedQuantity) || quantityPrices[0];
  }, [quantityPrices, selectedQuantity]);

  // 총 할인율 계산 (discountRate가 있으면 우선 사용, 없으면 기존 로직)
  const discountPercentage = useMemo(() => {
    if (product.discountRate && product.discountRate > 0) {
      return product.discountRate;
    }
    if (!product.price || product.price === product.priceSale) return 0;
    return Math.round(((product.price - product.priceSale) / product.price) * 100);
  }, [product.price, product.priceSale, product.discountRate]);

  const reviewSummary = reviewStats
    ? [
        { stars: 5, count: reviewStats.ratingDistribution[5] || 0 },
        { stars: 4, count: reviewStats.ratingDistribution[4] || 0 },
        { stars: 3, count: reviewStats.ratingDistribution[3] || 0 },
        { stars: 2, count: reviewStats.ratingDistribution[2] || 0 },
        { stars: 1, count: reviewStats.ratingDistribution[1] || 0 },
      ]
    : FALLBACK_REVIEW_SUMMARY;
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

      const data = await addItemToCart(resolvedProductId, selectedQuantity, selectedOptions);
      setAddStatus('success');
      setAddMessage('장바구니에 상품이 담겼어요.');
      onAddToCartSuccess(data.cart?.items?.length ?? 0);
      setShowCartModal(true);
    } catch (err) {
      setAddStatus('error');
      setAddError(err.message || '장바구니에 담는 중 오류가 발생했습니다.');
    }
  };

  const handleDirectOrder = () => {
    const resolvedProductId = product?._id || product?.id || productId;
    if (!resolvedProductId) {
      alert('상품 정보를 확인할 수 없습니다.');
      return;
    }

    if (product?.sizes?.length && !selectedSize) {
      alert('사이즈를 선택해주세요.');
      return;
    }

    const selectedOptions = {};
    if (selectedColor?.name) {
      selectedOptions.color = selectedColor.name;
    }
    if (selectedSize) {
      selectedOptions.size = selectedSize;
    }

    // 상품 정보 구성
    const orderItem = {
      product: {
        _id: resolvedProductId,
        id: resolvedProductId,
        name: product.name,
        sku: product.sku || '',
        price: product.price,
        priceSale: product.priceSale || product.price,
        image: product.gallery?.[0] || product.image || '',
      },
      quantity: selectedQuantity,
      options: selectedOptions,
    };

    onDirectOrder(orderItem);
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
                {product.gallery.length > 1 && (
                  <button
                    type="button"
                    className="product-gallery__nav product-gallery__nav--prev"
                    onClick={() =>
                      setActiveImage((prev) => (prev - 1 + product.gallery.length) % product.gallery.length)
                    }
                  >
                    <ChevronLeft size={20} />
                  </button>
                )}
                {product.gallery.length > 0 && product.gallery[activeImage] && (
                  <img src={product.gallery[activeImage]} alt={`${product.name} 이미지 ${activeImage + 1}`} />
                )}
                {product.gallery.length > 1 && (
                  <button
                    type="button"
                    className="product-gallery__nav product-gallery__nav--next"
                    onClick={() => setActiveImage((prev) => (prev + 1) % product.gallery.length)}
                  >
                    <ChevronRight size={20} />
                  </button>
                )}
                <button type="button" className="product-gallery__wishlist" aria-label="관심상품 추가">
                  <Heart size={18} />
                </button>
              </div>
              {product.gallery.length > 1 && (
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
              )}
            </div>

            <div className="product-info">
              <p className="product-info__category">{product.activity}</p>
              <h1 className="product-info__title">{product.name}</h1>
              <div className="product-info__rating">
                <Star size={18} fill="#111" strokeWidth={0} />
                <span>
                  {reviewStats?.averageRating?.toFixed(1) || '0.0'} ({reviewStats?.totalReviews || 0} 상품평)
                </span>
                {reviewStats?.totalReviews > 0 && (
                  <button type="button" className="product-info__rating-link">
                    상품평 보기
                  </button>
                )}
              </div>

              <div className="product-info__prices">
                {discountPercentage > 0 && (
                  <span style={{ color: '#ef4444', fontSize: '1.3rem', fontWeight: 700, marginRight: '0.5rem' }}>
                    {discountPercentage}%
                  </span>
                )}
                {formattedComparePrice && (
                  <span className="product-info__price--compare" style={{ textDecoration: 'line-through', color: '#999', marginRight: '0.5rem' }}>
                    {formattedComparePrice}
                  </span>
                )}
                <span className="product-info__price--sale" style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                  {formattedPrice}
                </span>
                <span style={{ fontSize: '0.9rem', color: '#666', marginLeft: '0.5rem' }}>
                  (1개당 {new Intl.NumberFormat('ko-KR').format(product.priceSale || product.price)}원)
                </span>
              </div>

              {/* 수량 선택 옵션 */}
              <div style={{ marginTop: '2rem', padding: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#f9fafb' }}>
                <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#666' }}>
                  절약 금액 기준
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {quantityPrices.map((qtyPrice) => (
                    <label
                      key={qtyPrice.quantity}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '1rem',
                        border: selectedQuantity === qtyPrice.quantity ? '2px solid #6366f1' : '1px solid #e5e7eb',
                        borderRadius: '8px',
                        backgroundColor: selectedQuantity === qtyPrice.quantity ? '#f0f4ff' : '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      <input
                        type="radio"
                        name="quantity"
                        value={qtyPrice.quantity}
                        checked={selectedQuantity === qtyPrice.quantity}
                        onChange={() => setSelectedQuantity(qtyPrice.quantity)}
                        style={{ marginRight: '1rem', width: '20px', height: '20px', cursor: 'pointer' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <span style={{ fontWeight: 600, fontSize: '1rem' }}>
                            {qtyPrice.quantity}개
                          </span>
                          {qtyPrice.savings > 0 && (
                            <span style={{ color: '#dc3545', fontSize: '0.85rem', fontWeight: 600 }}>
                              {new Intl.NumberFormat('ko-KR').format(qtyPrice.savings)}원 할인
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
                          <span style={{ fontWeight: 600, color: '#111' }}>
                            {new Intl.NumberFormat('ko-KR').format(qtyPrice.price)}원
                          </span>
                          <span>
                            (1개당 {new Intl.NumberFormat('ko-KR').format(qtyPrice.pricePerUnit)}원)
                          </span>
                          {qtyPrice.savings > 0 && (
                            <span style={{ color: '#dc3545', marginLeft: '0.5rem' }}>
                              {qtyPrice.quantity}개 사면 {new Intl.NumberFormat('ko-KR').format(qtyPrice.savings)}원 절약
                            </span>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                <div style={{ marginTop: '1rem', textAlign: 'right' }}>
                  <button
                    type="button"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#6366f1',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    모든 옵션 보기 &gt;
                  </button>
                </div>
              </div>

              {product.colors && product.colors.length > 0 && (
                <div className="product-info__colors">
                  <div className="product-info__colors-header">
                    <p>
                      컬러: <strong>{selectedColor?.name || product.colors[0]?.name}</strong>
                    </p>
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
              )}

              {product.sizes && product.sizes.length > 0 && (
                <div className="product-info__sizes">
                  <div className="product-info__sizes-header">
                    <p>US (KR) 사이즈를 선택하세요</p>
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
                </div>
              )}

              

              {/* 배송 정보 */}
              <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Truck size={18} />
                  <p style={{ margin: 0, fontWeight: 600 }}>
                    {product.shipping?.isFree ? '무료배송' : `배송비 ${product.shipping?.fee?.toLocaleString() || 0}원`}
                    {product.returnPolicy?.isReturnable && product.returnPolicy?.returnFee === 0 && ' + 무료반품'}
                  </p>
                </div>
                {product.shipping?.estimatedDays && (
                  <p style={{ margin: '0.25rem 0 0 1.5rem', fontSize: '0.85rem', color: '#666' }}>
                    예상 배송일: {product.shipping.estimatedDays}일 이내
                  </p>
                )}
                {!product.shipping?.isFree && (
                  <p style={{ margin: '0.5rem 0 0 1.5rem', fontSize: '0.85rem', color: '#6366f1', fontWeight: 500 }}>
                    20,000원 이상 구매 시 배송비 무료
                  </p>
                )}
              </div>

              {/* 판매자 정보 */}
              <div style={{ marginTop: '1rem', padding: '1rem', borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb' }}>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
                  판매자: <span style={{ color: '#111', fontWeight: 600 }}>Caurora</span>
                </p>
              </div>


              

              {/* 수량 입력 및 구매 버튼 */}
              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}
                    style={{
                      padding: '0.5rem 0.75rem',
                      border: 'none',
                      background: '#f9fafb',
                      cursor: 'pointer',
                      fontSize: '1.2rem',
                    }}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={selectedQuantity}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 1;
                      setSelectedQuantity(Math.max(1, value));
                    }}
                    style={{
                      width: '60px',
                      padding: '0.5rem',
                      border: 'none',
                      textAlign: 'center',
                      fontSize: '1rem',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setSelectedQuantity(selectedQuantity + 1)}
                    style={{
                      padding: '0.5rem 0.75rem',
                      border: 'none',
                      background: '#f9fafb',
                      cursor: 'pointer',
                      fontSize: '1.2rem',
                    }}
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  className="product-info__cta-primary"
                  onClick={handleAddToCart}
                  disabled={addStatus === 'loading'}
                  style={{ flex: 1, padding: '0.75rem 1rem' }}
                >
                  <ShoppingBag size={18} />
                  {addStatus === 'loading' ? '담는 중...' : '장바구니 담기'}
                </button>
                <button
                  type="button"
                  className="product-info__cta-secondary"
                  onClick={handleDirectOrder}
                  style={{ flex: 1, padding: '0.75rem 1rem', backgroundColor: '#6366f1', color: '#fff' }}
                >
                  바로구매 &gt;
                </button>
              </div>
              {(addError || addMessage) && (
                <p className={`product-info__add-status ${addError ? 'is-error' : 'is-success'}`}>
                  {addError || addMessage}
                </p>
              )}

              {/* 상품 상세 요약 정보 */}
              <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '8px', fontSize: '0.85rem' }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>카테고리:</strong> {product.category}
                </div>
                {product.sku && (
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>상품번호:</strong> {product.sku}
                  </div>
                )}
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>총 수량:</strong> {selectedQuantity}개
                </div>
                <div>
                  <strong>총 금액:</strong> {new Intl.NumberFormat('ko-KR').format(selectedQuantityPrice.price)}원
                </div>
              </div>
            </div>
          </section>

          {/* 상품 상세 정보 탭 섹션 */}
          <section style={{ maxWidth: '1200px', margin: '3rem auto', padding: '0 1rem' }}>
            {/* 탭 메뉴 */}
            <div style={{ display: 'flex', borderBottom: '2px solid #e5e7eb', marginBottom: '2rem' }}>
              <button
                type="button"
                onClick={() => setActiveDetailTab('detail')}
                style={{
                  padding: '1rem 2rem',
                  border: 'none',
                  background: 'none',
                  borderBottom: activeDetailTab === 'detail' ? '3px solid #6366f1' : 'none',
                  color: activeDetailTab === 'detail' ? '#6366f1' : '#666',
                  fontWeight: activeDetailTab === 'detail' ? 600 : 400,
                  cursor: 'pointer',
                  fontSize: '1rem',
                }}
              >
                상품상세
              </button>
              <button
                type="button"
                onClick={() => setActiveDetailTab('reviews')}
                style={{
                  padding: '1rem 2rem',
                  border: 'none',
                  background: 'none',
                  borderBottom: activeDetailTab === 'reviews' ? '3px solid #6366f1' : 'none',
                  color: activeDetailTab === 'reviews' ? '#6366f1' : '#666',
                  fontWeight: activeDetailTab === 'reviews' ? 600 : 400,
                  cursor: 'pointer',
                  fontSize: '1rem',
                }}
              >
                상품평 ({reviewStats?.totalReviews || 0})
              </button>
              <button
                type="button"
                onClick={() => setActiveDetailTab('inquiry')}
                style={{
                  padding: '1rem 2rem',
                  border: 'none',
                  background: 'none',
                  borderBottom: activeDetailTab === 'inquiry' ? '3px solid #6366f1' : 'none',
                  color: activeDetailTab === 'inquiry' ? '#6366f1' : '#666',
                  fontWeight: activeDetailTab === 'inquiry' ? 600 : 400,
                  cursor: 'pointer',
                  fontSize: '1rem',
                }}
              >
                상품문의
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onViewShippingPolicy) {
                    onViewShippingPolicy();
                  } else {
                    setActiveDetailTab('shipping');
                  }
                }}
                style={{
                  padding: '1rem 2rem',
                  border: 'none',
                  background: 'none',
                  borderBottom: activeDetailTab === 'shipping' ? '3px solid #6366f1' : 'none',
                  color: activeDetailTab === 'shipping' ? '#6366f1' : '#666',
                  fontWeight: activeDetailTab === 'shipping' ? 600 : 400,
                  cursor: 'pointer',
                  fontSize: '1rem',
                }}
              >
                배송/교환/반품 안내
              </button>
            </div>

            {/* 탭 컨텐츠 */}
            {activeDetailTab === 'detail' && (
              <div>
                {/* 필수 표기 정보 */}
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem' }}>필수 표기 정보</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb', fontSize: '0.9rem' }}>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '0.75rem', backgroundColor: '#f9fafb', fontWeight: 600, width: '150px' }}>제조일자</td>
                        <td style={{ padding: '0.75rem' }}>상품 상세설명 참조</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '0.75rem', backgroundColor: '#f9fafb', fontWeight: 600 }}>유지기한</td>
                        <td style={{ padding: '0.75rem' }}>상품 상세설명 참조</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '0.75rem', backgroundColor: '#f9fafb', fontWeight: 600 }}>원산지</td>
                        <td style={{ padding: '0.75rem' }}>상품 상세설명 참조</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '0.75rem', backgroundColor: '#f9fafb', fontWeight: 600 }}>제조사</td>
                        <td style={{ padding: '0.75rem' }}>상품 상세설명 참조</td>
                      </tr>
                    </tbody>
                  </table>
                  <button
                    type="button"
                    onClick={() => setShowMoreRequiredInfo(!showMoreRequiredInfo)}
                    style={{
                      marginTop: '1rem',
                      padding: '0.5rem 1rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '4px',
                      background: '#fff',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                    }}
                  >
                    필수 표기 정보 {showMoreRequiredInfo ? '접기' : '더보기'}
                  </button>
                </div>

              

                {/* 상품 상세 설명 */}
                {product.description && (
                  <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div 
                      className="product-story__description"
                      style={{ 
                        textAlign: 'left', 
                        margin: '2rem auto',
                        maxWidth: '100%',
                        lineHeight: '1.8',
                        fontSize: '1rem'
                      }}
                      dangerouslySetInnerHTML={{ 
                        __html: product.description
                          .replace(/\n/g, '<br />')
                          .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto; margin: 1rem auto; border-radius: 8px; display: block;" />')
                      }} 
                    />
                  </div>
                )}
                
                {/* 상세 설명 이미지 */}
                {product.descriptionImages && product.descriptionImages.length > 0 && (
                  <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    {product.descriptionImages.map((image, index) => (
                      <img 
                        key={`${image}-${index}`} 
                        src={image} 
                        alt={`상세 설명 이미지 ${index + 1}`}
                        style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px', display: 'block' }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeDetailTab === 'reviews' && (
              <div>
                {/* 상품평 섹션 */}
                <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>상품평</h2>
                    <p style={{ color: '#666', fontSize: '0.9rem' }}>
                      {reviewStats?.totalReviews > 0
                        ? `평균 ${reviewStats.averageRating.toFixed(1)}점 · ${reviewStats.totalReviews}개의 상품평이 있어요.`
                        : '아직 상품평이 없습니다.'}
                    </p>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setShowReviewModal(true)}
                    style={{
                      padding: '0.75rem 1.5rem',
                      border: '1px solid #6366f1',
                      borderRadius: '4px',
                      background: '#fff',
                      color: '#6366f1',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    상품평 쓰기
                  </button>
                </header>

                {reviewStats?.totalReviews > 0 ? (
                  <>
                    <div style={{ display: 'flex', gap: '3rem', marginBottom: '2rem', padding: '2rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                      <div style={{ textAlign: 'center' }}>
                        <strong style={{ fontSize: '2.5rem', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>
                          {reviewStats.averageRating.toFixed(1)}
                        </strong>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.25rem', marginBottom: '0.5rem' }}>
                          {Array.from({ length: 5 }).map((_, index) => (
                            <Star key={index} size={20} fill="#111" strokeWidth={0} />
                          ))}
                        </div>
                        <span style={{ fontSize: '0.9rem', color: '#666' }}>{reviewStats.totalReviews}개 상품평</span>
                      </div>

                      <div style={{ flex: 1 }}>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                          {reviewSummary.map((item) => (
                            <li key={item.stars} style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                              <span style={{ width: '60px', fontSize: '0.9rem' }}>{item.stars}점</span>
                              <div style={{ flex: 1, height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                                <div 
                                  style={{ 
                                    height: '100%', 
                                    backgroundColor: '#6366f1',
                                    width: reviewTotal > 0 ? `${(item.count / reviewTotal) * 100}%` : '0%',
                                    transition: 'width 0.3s'
                                  }} 
                                />
                              </div>
                              <span style={{ width: '60px', textAlign: 'right', fontSize: '0.9rem' }}>{item.count}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {reviewStats.customerImages && reviewStats.customerImages.length > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.75rem', marginBottom: '2rem' }}>
                        {reviewStats.customerImages.slice(0, 10).map((image, index) => (
                          <button
                            key={`${image}-${index}`}
                            type="button"
                            style={{
                              padding: 0,
                              border: '1px solid #e5e7eb',
                              borderRadius: '4px',
                              overflow: 'hidden',
                              cursor: 'pointer',
                              background: 'none',
                            }}
                          >
                            <img 
                              src={image} 
                              alt={`고객 이미지 ${index + 1}`}
                              style={{ width: '100%', height: '120px', objectFit: 'cover', display: 'block' }}
                            />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* 필터 */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                      <input 
                        type="search" 
                        placeholder="주제 및 상품평 검색"
                        style={{
                          flex: 1,
                          minWidth: '200px',
                          padding: '0.5rem 0.75rem',
                          border: '1px solid #e5e7eb',
                          borderRadius: '4px',
                          fontSize: '0.9rem',
                        }}
                      />
                      <select 
                        defaultValue="평점"
                        style={{
                          padding: '0.5rem 0.75rem',
                          border: '1px solid #e5e7eb',
                          borderRadius: '4px',
                          fontSize: '0.9rem',
                        }}
                      >
                        <option value="평점">평점</option>
                        <option value="최신순">최신순</option>
                      </select>
                      <select 
                        defaultValue="성별"
                        style={{
                          padding: '0.5rem 0.75rem',
                          border: '1px solid #e5e7eb',
                          borderRadius: '4px',
                          fontSize: '0.9rem',
                        }}
                      >
                        <option value="성별">성별</option>
                        <option value="남성">남성</option>
                        <option value="여성">여성</option>
                      </select>
                      <button 
                        type="button"
                        style={{
                          padding: '0.5rem 1rem',
                          border: '1px solid #e5e7eb',
                          borderRadius: '4px',
                          background: '#fff',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                        }}
                      >
                        필터 초기화
                      </button>
                    </div>

                    {reviewsLoading ? (
                      <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <p>리뷰를 불러오는 중...</p>
                      </div>
                    ) : reviewsError ? (
                      <div style={{ textAlign: 'center', padding: '2rem', color: '#dc3545' }}>
                        <p>{reviewsError}</p>
                      </div>
                    ) : reviews.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {reviews.map((review) => (
                          <article 
                            key={review._id} 
                            style={{ 
                              padding: '1.5rem', 
                              border: '1px solid #e5e7eb', 
                              borderRadius: '8px',
                              backgroundColor: '#fff'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                              <div style={{ display: 'flex', gap: '0.25rem' }}>
                                {Array.from({ length: review.rating }).map((_, index) => (
                                  <Star key={index} size={16} fill="#111" strokeWidth={0} />
                                ))}
                              </div>
                              {review.region && (
                                <span style={{ fontSize: '0.85rem', color: '#666', padding: '0.25rem 0.5rem', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
                                  {review.region}
                                </span>
                              )}
                            </div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>{review.title}</h3>
                            <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.75rem' }}>
                              {review.userId?.name || '익명'} · {new Date(review.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                            <p style={{ lineHeight: '1.8', marginBottom: '0.75rem' }}>{review.body}</p>
                            {(review.fit || review.purchaseSize) && (
                              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                {review.fit && (
                                  <span style={{ padding: '0.25rem 0.5rem', backgroundColor: '#f9fafb', borderRadius: '4px', fontSize: '0.85rem' }}>
                                    {review.fit}
                                  </span>
                                )}
                                {review.purchaseSize && (
                                  <span style={{ padding: '0.25rem 0.5rem', backgroundColor: '#f9fafb', borderRadius: '4px', fontSize: '0.85rem' }}>
                                    {review.purchaseSize}
                                  </span>
                                )}
                              </div>
                            )}
                            {review.images && review.images.length > 0 && (
                              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {review.images.map((img, idx) => (
                                  <img 
                                    key={idx} 
                                    src={img} 
                                    alt={`${review.userId?.name || '익명'} 리뷰 이미지 ${idx + 1}`}
                                    style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '4px' }}
                                  />
                                ))}
                              </div>
                            )}
                          </article>
                        ))}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                        <p>표시할 리뷰가 없습니다.</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                    <p>아직 작성된 상품평이 없습니다.</p>
                    <p>첫 번째 상품평을 작성해주세요!</p>
                  </div>
                )}
              </div>
            )}

            {activeDetailTab === 'inquiry' && (
              <div style={{ padding: '2rem' }}>
                {/* 안내 사항 */}
                <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '8px', fontSize: '0.9rem', lineHeight: '1.8' }}>
                  <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#666' }}>
                    <li style={{ marginBottom: '0.5rem' }}>
                      구매한 상품의 취소/반품은 마이페이지 구매내역에서 신청 가능합니다.
                    </li>
                    <li style={{ marginBottom: '0.5rem' }}>
                      상품문의 및 후기게시판을 통해 취소나 환불, 반품 등은 처리되지 않습니다.
                    </li>
                    <li style={{ marginBottom: '0.5rem' }}>
                      가격, 판매자, 교환/환불 및 배송 등 해당 상품 자체와 관련 없는 문의는 고객센터 내 1:1 문의하기를 이용해주세요.
                    </li>
                    <li style={{ marginBottom: '0.5rem' }}>
                      "해당 상품 자체"와 관계없는 글, 양도, 광고성, 욕설, 비방, 도배 등의 글은 예고 없이 이동, 노출제한, 삭제 등의 조치가 취해질 수 있습니다.
                    </li>
                    <li>
                      공개 게시판이므로 전화번호, 메일 주소 등 고객님의 소중한 개인정보는 절대 남기지 말아주세요.
                    </li>
                  </ul>
                </div>

                {/* 검색 및 문의하기 버튼 */}
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem' }}>
                  <input
                    type="search"
                    placeholder="궁금한 내용을 단어나 키워드로 검색하세요."
                    value={inquirySearch}
                    onChange={(e) => setInquirySearch(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '0.75rem 1rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '4px',
                      fontSize: '0.9rem',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowInquiryForm(!showInquiryForm)}
                    style={{
                      padding: '0.75rem 1.5rem',
                      border: 'none',
                      borderRadius: '4px',
                      background: '#6366f1',
                      color: '#fff',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    문의하기
                  </button>
                </div>

                {/* 문의 작성 폼 */}
                {showInquiryForm && (
                  <div style={{ marginBottom: '2rem', padding: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#fff' }}>
                    <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 600 }}>문의 작성</h3>
                    <textarea
                      value={newInquiry.question}
                      onChange={(e) => setNewInquiry({ ...newInquiry, question: e.target.value })}
                      placeholder="문의 내용을 입력해주세요."
                      rows={5}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '4px',
                        fontSize: '0.9rem',
                        resize: 'vertical',
                        marginBottom: '1rem',
                      }}
                    />
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.9rem' }}>
                      <input
                        type="checkbox"
                        checked={newInquiry.isSecret}
                        onChange={(e) => setNewInquiry({ ...newInquiry, isSecret: e.target.checked })}
                      />
                      비밀글로 작성
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setShowInquiryForm(false);
                          setNewInquiry({ question: '', isSecret: false });
                        }}
                        style={{
                          padding: '0.5rem 1rem',
                          border: '1px solid #e5e7eb',
                          borderRadius: '4px',
                          background: '#fff',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                        }}
                      >
                        취소
                      </button>
                      <button
                        type="button"
                        onClick={handleCreateInquiry}
                        style={{
                          padding: '0.5rem 1rem',
                          border: 'none',
                          borderRadius: '4px',
                          background: '#6366f1',
                          color: '#fff',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: 600,
                        }}
                      >
                        등록
                      </button>
                    </div>
                  </div>
                )}

                {/* 문의 목록 */}
                {inquiriesLoading ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
                    <p>문의를 불러오는 중...</p>
                  </div>
                ) : inquiriesError ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: '#dc3545' }}>
                    <p>{inquiriesError}</p>
                  </div>
                ) : inquiries.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
                    <p>등록된 문의가 없습니다.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {inquiries.map((inquiry) => {
                      const session = loadSession();
                      const currentUserId = session?.user?._id || session?.user?.id || '';
                      const isOwner = inquiry.userId?._id?.toString() === currentUserId.toString();
                      const isAdmin = session?.user?.user_type === 'admin';
                      const canView = !inquiry.isSecret || isOwner || isAdmin;

                      return (
                        <div
                          key={inquiry._id}
                          style={{
                            padding: '1.5rem',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            backgroundColor: '#fff',
                          }}
                        >
                          {/* 질문 */}
                          <div style={{ marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                              <div>
                                <span style={{ fontSize: '0.85rem', color: '#666', marginRight: '0.5rem' }}>
                                  질문 {inquiry.isSecret && '🔒'}
                                </span>
                                <span style={{ fontSize: '0.85rem', color: '#666' }}>
                                  {inquiry.userId?.name || '익명'}
                                </span>
                              </div>
                              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.85rem', color: '#999' }}>
                                  {new Date(inquiry.createdAt).toLocaleString('ko-KR', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                  })}
                                </span>
                                {(isOwner || isAdmin) && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteInquiry(inquiry._id)}
                                    style={{
                                      padding: '0.25rem 0.5rem',
                                      border: 'none',
                                      background: 'transparent',
                                      color: '#dc3545',
                                      cursor: 'pointer',
                                      fontSize: '0.8rem',
                                    }}
                                  >
                                    삭제
                                  </button>
                                )}
                              </div>
                            </div>
                            <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: '#333' }}>
                              {canView ? inquiry.question : '비밀글입니다.'}
                            </p>
                          </div>

                          {/* 답변 */}
                          {inquiry.answer && inquiry.answer.content && (
                            <div
                              style={{
                                marginTop: '1rem',
                                padding: '1rem',
                                backgroundColor: '#f9fafb',
                                borderRadius: '4px',
                                borderLeft: '3px solid #6366f1',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                <div>
                                  <span style={{ fontSize: '0.85rem', color: '#6366f1', fontWeight: 600, marginRight: '0.5rem' }}>
                                    ↳ 답변
                                  </span>
                                  <span style={{ fontSize: '0.85rem', color: '#666' }}>
                                    {inquiry.answer.answeredBy?.name || '관리자'}
                                  </span>
                                </div>
                                <span style={{ fontSize: '0.85rem', color: '#999' }}>
                                  {inquiry.answer.answeredAt
                                    ? new Date(inquiry.answer.answeredAt).toLocaleString('ko-KR', {
                                        year: 'numeric',
                                        month: '2-digit',
                                        day: '2-digit',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit',
                                      })
                                    : ''}
                                </span>
                              </div>
                              <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: '#333' }}>
                                {canView ? inquiry.answer.content : '비밀글입니다.'}
                              </p>
                            </div>
                          )}

                          {/* 관리자 답변 작성 */}
                          {isAdmin && !inquiry.answer?.content && (
                            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f0f9ff', borderRadius: '4px' }}>
                              {answeringInquiryId === inquiry._id ? (
                                <div>
                                  <textarea
                                    value={answerText}
                                    onChange={(e) => setAnswerText(e.target.value)}
                                    placeholder="답변 내용을 입력해주세요."
                                    rows={3}
                                    style={{
                                      width: '100%',
                                      padding: '0.75rem',
                                      border: '1px solid #e5e7eb',
                                      borderRadius: '4px',
                                      fontSize: '0.9rem',
                                      resize: 'vertical',
                                      marginBottom: '0.5rem',
                                    }}
                                  />
                                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setAnsweringInquiryId(null);
                                        setAnswerText('');
                                      }}
                                      style={{
                                        padding: '0.5rem 1rem',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '4px',
                                        background: '#fff',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                      }}
                                    >
                                      취소
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleAnswerInquiry(inquiry._id)}
                                      style={{
                                        padding: '0.5rem 1rem',
                                        border: 'none',
                                        borderRadius: '4px',
                                        background: '#6366f1',
                                        color: '#fff',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                        fontWeight: 600,
                                      }}
                                    >
                                      답변 등록
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setAnsweringInquiryId(inquiry._id)}
                                  style={{
                                    padding: '0.5rem 1rem',
                                    border: '1px solid #6366f1',
                                    borderRadius: '4px',
                                    background: '#fff',
                                    color: '#6366f1',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                  }}
                                >
                                  답변 작성
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeDetailTab === 'shipping' && (
              <div style={{ padding: '2rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem' }}>배송 안내</h3>
                <div style={{ marginBottom: '1.5rem', lineHeight: '1.8' }}>
                  <p><strong>배송비:</strong> {product.shipping?.isFree ? '무료배송' : `${product.shipping?.fee?.toLocaleString() || 0}원`}</p>
                  <p><strong>예상 배송일:</strong> {product.shipping?.estimatedDays || 3}일 이내</p>
                </div>
                
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem' }}>교환/반품 안내</h3>
                <div style={{ marginBottom: '1.5rem', lineHeight: '1.8' }}>
                  {product.returnPolicy?.isReturnable ? (
                    <>
                      <p><strong>교환/반품 가능 기간:</strong> {product.returnPolicy?.returnDays || 30}일 이내</p>
                      <p><strong>반품 배송비:</strong> {product.returnPolicy?.returnFee === 0 ? '무료' : `${product.returnPolicy?.returnFee?.toLocaleString() || 0}원`}</p>
                    </>
                  ) : (
                    <p>교환/반품이 불가능한 상품입니다.</p>
                  )}
                </div>
              </div>
            )}
          </section>


          <section className="product-recommendations">
            <h2>나를 위한 추천 제품</h2>
            {recommendationsLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <p>추천 상품을 불러오는 중...</p>
              </div>
            ) : recommendedProducts.length > 0 ? (
              <div className="product-recommendations__grid">
                {recommendedProducts.map((item) => {
                  const productData = buildProductData(item);
                  const productId = item._id || item.id;
                  const price = productData.priceSale || productData.price;
                  const originalPrice = productData.price || productData.originalPrice;
                  const priceRange = originalPrice && originalPrice > price
                    ? `${new Intl.NumberFormat('ko-KR').format(price)}원 - ${new Intl.NumberFormat('ko-KR').format(originalPrice)}원`
                    : `${new Intl.NumberFormat('ko-KR').format(price)}원`;
                  
                  return (
                    <article 
                      key={productId} 
                      className="product-recommendations__card"
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        if (onViewProduct) {
                          onViewProduct(item);
                        } else {
                          // onViewProduct가 없으면 URL로 이동
                          const url = `/product-detail?productId=${productId}`;
                          window.location.href = url;
                        }
                      }}
                    >
                      <img 
                        src={productData.gallery?.[0] || productData.image || 'https://via.placeholder.com/300'} 
                        alt={productData.name} 
                        style={{ width: '100%', height: 'auto', display: 'block' }}
                      />
                      <div>
                        <h3>{productData.name}</h3>
                        <p>{priceRange}</p>
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onViewProduct) {
                              onViewProduct(item);
                            }
                          }}
                        >
                          상품 보기
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                <p>추천 상품이 없습니다.</p>
              </div>
            )}
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

      {/* 리뷰 작성 모달 */}
      {showReviewModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '1rem',
          }}
          onClick={() => setShowReviewModal(false)}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              width: '100%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflow: 'auto',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '1.5rem',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>상품평 작성</h2>
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                style={{
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  padding: '0.25rem',
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              {/* 평점 선택 */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  평점 *
                </label>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setReviewForm((prev) => ({ ...prev, rating }))}
                      style={{
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      <Star
                        size={32}
                        fill={rating <= reviewForm.rating ? '#fbbf24' : '#e5e7eb'}
                        stroke={rating <= reviewForm.rating ? '#fbbf24' : '#e5e7eb'}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* 제목 */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  제목 *
                </label>
                <input
                  type="text"
                  value={reviewForm.title}
                  onChange={(e) => setReviewForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="리뷰 제목을 입력하세요"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              {/* 내용 */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  내용 *
                </label>
                <textarea
                  value={reviewForm.body}
                  onChange={(e) => setReviewForm((prev) => ({ ...prev, body: e.target.value }))}
                  placeholder="리뷰 내용을 입력하세요"
                  rows={6}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px',
                    fontSize: '0.9rem',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* 선택 항목들 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>
                    지역
                  </label>
                  <input
                    type="text"
                    value={reviewForm.region}
                    onChange={(e) => setReviewForm((prev) => ({ ...prev, region: e.target.value }))}
                    placeholder="예: 서울"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '4px',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>
                    사이즈 만족도
                  </label>
                  <select
                    value={reviewForm.fit}
                    onChange={(e) => setReviewForm((prev) => ({ ...prev, fit: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '4px',
                      fontSize: '0.9rem',
                    }}
                  >
                    <option value="">선택 안함</option>
                    <option value="작음">작음</option>
                    <option value="정사이즈">정사이즈</option>
                    <option value="큼">큼</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>
                    구매 사이즈
                  </label>
                  <input
                    type="text"
                    value={reviewForm.purchaseSize}
                    onChange={(e) => setReviewForm((prev) => ({ ...prev, purchaseSize: e.target.value }))}
                    placeholder="예: M"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '4px',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>
                    용도
                  </label>
                  <input
                    type="text"
                    value={reviewForm.purpose}
                    onChange={(e) => setReviewForm((prev) => ({ ...prev, purpose: e.target.value }))}
                    placeholder="예: 러닝"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '4px',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>
              </div>

              {/* 이미지 업로드 */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  이미지 (선택)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleReviewImageUpload}
                  style={{ marginBottom: '0.5rem' }}
                />
                {reviewForm.images.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                    {reviewForm.images.map((url, index) => (
                      <div key={index} style={{ position: 'relative' }}>
                        <img
                          src={url}
                          alt={`리뷰 이미지 ${index + 1}`}
                          style={{
                            width: '80px',
                            height: '80px',
                            objectFit: 'cover',
                            borderRadius: '4px',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveReviewImage(index)}
                          style={{
                            position: 'absolute',
                            top: '-8px',
                            right: '-8px',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            border: 'none',
                            background: '#dc3545',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 제출 버튼 */}
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px',
                    background: '#fff',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleSubmitReview}
                  disabled={reviewSubmitting}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: 'none',
                    borderRadius: '4px',
                    background: '#6366f1',
                    color: '#fff',
                    cursor: reviewSubmitting ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    opacity: reviewSubmitting ? 0.6 : 1,
                  }}
                >
                  {reviewSubmitting ? '등록 중...' : '등록하기'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductDetailPage;


