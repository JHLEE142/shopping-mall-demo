import { useState, useEffect } from 'react';
import { ArrowLeft, Star, X, Upload } from 'lucide-react';
import { createReview } from '../services/reviewService';
import { fetchProductById } from '../services/productService';
import './ReviewWritePage.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:6500';

function ReviewWritePage({ onBack, user, productId: initialProductId }) {
  const [productId, setProductId] = useState(initialProductId);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: '',
    body: '',
    images: [],
  });

  // URL에서 productId 읽기
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlProductId = urlParams.get('productId');
    if (urlProductId && !productId) {
      setProductId(urlProductId);
    }
  }, [productId]);

  // 상품 정보 로드
  useEffect(() => {
    if (!productId) {
      setLoading(false);
      return;
    }

    async function loadProduct() {
      try {
        setLoading(true);
        const productData = await fetchProductById(productId);
        setProduct(productData);
      } catch (error) {
        console.error('상품 정보 로드 실패:', error);
        alert('상품 정보를 불러올 수 없습니다.');
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [productId]);

  // 이미지 업로드
  const uploadImageToCloudinary = async (file) => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'shopping_mall');

      const xhr = new XMLHttpRequest();
      xhr.open('POST', 'https://api.cloudinary.com/v1_1/demo/image/upload');
      xhr.onload = () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          resolve(response.secure_url);
        } else {
          reject(new Error('이미지 업로드 실패'));
        }
      };
      xhr.onerror = () => reject(new Error('이미지 업로드 실패'));
      xhr.send(formData);
    });
  };

  const handleImageUpload = async (e) => {
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

  const handleRemoveImage = (index) => {
    setReviewForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    if (!productId) {
      alert('상품 정보를 찾을 수 없습니다.');
      return;
    }

    if (!reviewForm.title.trim() || !reviewForm.body.trim()) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }

    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      setSubmitting(true);
      await createReview(productId, reviewForm);
      alert('리뷰가 등록되었습니다.');
      if (onBack) {
        onBack();
      } else {
        window.history.back();
      }
    } catch (err) {
      alert(err.message || '리뷰 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="review-write-page">
        <div className="review-write-page__loading">로딩 중...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="review-write-page">
        <div className="review-write-page__error">
          <p>상품 정보를 찾을 수 없습니다.</p>
          <button onClick={onBack || (() => window.history.back())}>돌아가기</button>
        </div>
      </div>
    );
  }

  return (
    <div className="review-write-page">
      <div className="review-write-page__header">
        <button 
          className="review-write-page__back-button"
          onClick={onBack || (() => window.history.back())}
          type="button"
        >
          <ArrowLeft size={20} />
          뒤로가기
        </button>
        <h1 className="review-write-page__title">리뷰 작성</h1>
      </div>

      <div className="review-write-page__content">
        {/* 상품 정보 */}
        <div className="review-write-page__product">
          <img 
            src={product.image || product.images?.[0] || '/placeholder.png'} 
            alt={product.name}
            className="review-write-page__product-image"
          />
          <div className="review-write-page__product-info">
            <h3>{product.name}</h3>
            {product.sku && <p className="review-write-page__product-sku">상품코드: {product.sku}</p>}
          </div>
        </div>

        {/* 평점 */}
        <div className="review-write-page__section">
          <label className="review-write-page__label">평점 *</label>
          <div className="review-write-page__rating">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`review-write-page__star ${reviewForm.rating >= star ? 'active' : ''}`}
                onClick={() => setReviewForm((prev) => ({ ...prev, rating: star }))}
              >
                <Star size={32} fill={reviewForm.rating >= star ? '#fbbf24' : 'none'} />
              </button>
            ))}
          </div>
        </div>

        {/* 제목 */}
        <div className="review-write-page__section">
          <label className="review-write-page__label">제목 *</label>
          <input
            type="text"
            value={reviewForm.title}
            onChange={(e) => setReviewForm((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="리뷰 제목을 입력하세요"
            className="review-write-page__input"
            maxLength={100}
          />
        </div>

        {/* 내용 */}
        <div className="review-write-page__section">
          <label className="review-write-page__label">내용 *</label>
          <textarea
            value={reviewForm.body}
            onChange={(e) => setReviewForm((prev) => ({ ...prev, body: e.target.value }))}
            placeholder="리뷰 내용을 입력하세요"
            rows={8}
            className="review-write-page__textarea"
            maxLength={1000}
          />
          <p className="review-write-page__char-count">{reviewForm.body.length}/1000</p>
        </div>

        {/* 이미지 업로드 */}
        <div className="review-write-page__section">
          <label className="review-write-page__label">사진 첨부 (선택, 최대 5장)</label>
          <div className="review-write-page__images">
            {reviewForm.images.map((url, index) => (
              <div key={index} className="review-write-page__image-item">
                <img src={url} alt={`리뷰 이미지 ${index + 1}`} />
                <button
                  type="button"
                  className="review-write-page__image-remove"
                  onClick={() => handleRemoveImage(index)}
                >
                  <X size={20} />
                </button>
              </div>
            ))}
            {reviewForm.images.length < 5 && (
              <label className="review-write-page__image-upload">
                <Upload size={24} />
                <span>사진 추가</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
              </label>
            )}
          </div>
        </div>

        {/* 제출 버튼 */}
        <div className="review-write-page__actions">
          <button
            type="button"
            className="review-write-page__submit"
            onClick={handleSubmit}
            disabled={submitting || !reviewForm.title.trim() || !reviewForm.body.trim()}
          >
            {submitting ? '등록 중...' : '리뷰 등록'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReviewWritePage;

