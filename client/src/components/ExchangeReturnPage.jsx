import { useState } from 'react';
import { ChevronRight, ChevronLeft, AlertCircle } from 'lucide-react';
import { createExchangeReturn } from '../services/exchangeReturnService';
import './ExchangeReturnPage.css';

const STEPS = [
  { id: 1, title: '상품 선택' },
  { id: 2, title: '사유 선택' },
  { id: 3, title: '해결방법 선택' },
];

const RETURN_REASONS = [
  {
    category: '단순 변심',
    reasons: [
      { id: 'not-satisfied', label: '상품이 마음에 들지 않음' },
      { id: 'cheaper-found', label: '더 저렴한 상품을 발견함' },
    ],
  },
  {
    category: '배송문제',
    reasons: [
      { id: 'wrong-product', label: '다른 상품이 배송됨' },
      { id: 'box-lost', label: '배송된 장소에 박스가 분실됨' },
      { id: 'wrong-address', label: '다른 주소로 배송됨' },
    ],
  },
  {
    category: '상품문제',
    reasons: [
      { id: 'partial-problem', label: '상품 일부에 문제가 있음' },
      { id: 'missing-parts', label: '상품의 구성품/부속품이 들어있지 않음' },
      { id: 'different-description', label: '상품이 설명과 다름' },
      { id: 'damaged', label: '상품이 파손되어 배송됨' },
      { id: 'defect', label: '상품 결함/기능에 이상이 있음' },
    ],
  },
];

const SOLUTION_OPTIONS = [
  { id: 'return-refund', label: '반품 후 환불' },
  { id: 'exchange', label: '교환' },
];

function ExchangeReturnPage({ order, orderItem, user, onBack, onSubmit, onNavigateToPolicy }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedItems, setSelectedItems] = useState(
    orderItem
      ? [{ ...orderItem, quantity: orderItem.quantity || 1, selected: true }]
      : order?.items?.map((item, idx) => ({ ...item, originalIndex: idx, selected: true })) || []
  );
  const [selectedReason, setSelectedReason] = useState('');
  const [selectedSolution, setSelectedSolution] = useState('return-refund');
  const [collectionDate, setCollectionDate] = useState('tomorrow');
  const [customCollectionDate, setCustomCollectionDate] = useState('');
  const [collectionLocation, setCollectionLocation] = useState('door');
  const [customCollectionLocation, setCustomCollectionLocation] = useState('');

  const handleItemToggle = (itemIndex) => {
    setSelectedItems((prev) => {
      const newItems = [...prev];
      newItems[itemIndex].selected = !newItems[itemIndex].selected;
      return newItems;
    });
  };

  const handleQuantityChange = (itemIndex, delta) => {
    setSelectedItems((prev) => {
      const newItems = [...prev];
      const item = newItems[itemIndex];
      const newQuantity = Math.max(1, Math.min(item.quantity + delta, item.quantity || 1));
      newItems[itemIndex] = { ...item, quantity: newQuantity };
      return newItems;
    });
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      // 상품이 하나라도 선택되어 있는지 확인
      const hasSelected = selectedItems.some((item) => item.selected);
      if (!hasSelected) {
        alert('최소 하나의 상품을 선택해주세요.');
        return;
      }
    } else if (currentStep === 2) {
      // 사유가 선택되어 있는지 확인
      if (!selectedReason) {
        alert('사유를 선택해주세요.');
        return;
      }
    }
    setCurrentStep(currentStep + 1);
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    const selectedProducts = selectedItems.filter((item) => item.selected);
    if (selectedProducts.length === 0) {
      alert('최소 하나의 상품을 선택해주세요.');
      return;
    }

    if (!selectedReason) {
      alert('사유를 선택해주세요.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const refundAmount = selectedSolution === 'return-refund' ? calculateRefundAmount() : 0;
      const finalCollectionDate = collectionDate === 'tomorrow' ? getTomorrowDate() : customCollectionDate;
      
      const submitData = {
        orderId: order._id || order.id,
        items: selectedProducts.map((item) => ({
          productId: item.product?._id || item.product || item.productId,
          name: item.name,
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice,
        })),
        reason: selectedReason,
        solution: selectedSolution,
        collectionDate: finalCollectionDate,
        collectionLocation: {
          type: collectionLocation,
          customText: collectionLocation === 'other' ? customCollectionLocation : '',
        },
        refundAmount,
        refundMethod: '삼성카드 / 일시불', // 실제로는 주문 정보에서 가져와야 함
      };

      const result = await createExchangeReturn(submitData);
      
      if (onSubmit) {
        onSubmit(result);
      } else {
        alert('교환/반품 신청이 완료되었습니다.');
        if (onBack) onBack();
      }
    } catch (err) {
      console.error('교환/반품 신청 오류:', err);
      setError(err.message || '교환/반품 신청 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const formatCurrency = (price) => {
    return new Intl.NumberFormat('ko-KR').format(price || 0);
  };

  const calculateRefundAmount = () => {
    const selectedProducts = selectedItems.filter((item) => item.selected);
    const subtotal = selectedProducts.reduce((sum, item) => {
      return sum + (item.unitPrice || 0) * (item.quantity || 1);
    }, 0);
    // 할인은 주문의 할인 정보를 참조하거나 0으로 설정
    const discount = 0;
    const shippingFee = 0; // 반품 시 배송비는 0
    const returnFee = 0; // 회원은 무료 반품
    return Math.max(0, subtotal - discount - returnFee);
  };

  const selectedItemsCount = selectedItems.filter((item) => item.selected).length;
  const selectedReasonLabel = RETURN_REASONS.flatMap((cat) => cat.reasons).find((r) => r.id === selectedReason)?.label || '';

  return (
    <div className="exchange-return-page">
      <div className="exchange-return-page__container">
        {/* 헤더 */}
        <header className="exchange-return-page__header">
          <h1 className="exchange-return-page__title">교환, 반품 신청</h1>
          {onNavigateToPolicy && (
            <button
              type="button"
              className="exchange-return-page__policy-link"
              onClick={onNavigateToPolicy}
            >
              반품/교환 안내 보기
            </button>
          )}
        </header>

        {/* 진행 단계 표시 */}
        <div className="exchange-return-page__steps">
          {STEPS.map((step) => (
            <div
              key={step.id}
              className={`exchange-return-page__step ${currentStep >= step.id ? 'is-active' : ''} ${currentStep === step.id ? 'is-current' : ''}`}
            >
              <div className="exchange-return-page__step-circle">
                <span>{step.id}</span>
              </div>
              <span className="exchange-return-page__step-label">{step.title}</span>
            </div>
          ))}
        </div>

        {/* 단계별 컨텐츠 */}
        <div className="exchange-return-page__content">
          {/* 1단계: 상품 선택 */}
          {currentStep === 1 && (
            <div className="exchange-return-page__step-content">
              <h2 className="exchange-return-page__step-title">상품을 선택해 주세요</h2>
              <div className="exchange-return-page__product-list">
                {selectedItems.map((item, index) => (
                  <div key={index} className="exchange-return-page__product-item">
                    <label className="exchange-return-page__product-checkbox">
                      <input
                        type="checkbox"
                        checked={item.selected !== false}
                        onChange={() => handleItemToggle(index)}
                      />
                      <span className="exchange-return-page__checkbox-custom"></span>
                    </label>
                    <div className="exchange-return-page__product-image">
                      <img
                        src={item.thumbnail || item.image || '/placeholder.png'}
                        alt={item.name}
                        onError={(e) => {
                          e.target.src = '/placeholder.png';
                        }}
                      />
                      {item.quantity > 1 && (
                        <span className="exchange-return-page__product-quantity-badge">{item.quantity}x</span>
                      )}
                    </div>
                    <div className="exchange-return-page__product-info">
                      <div className="exchange-return-page__product-delivery">
                        <span>로켓 새벽</span>
                      </div>
                      <div className="exchange-return-page__product-name">{item.name}</div>
                      <div className="exchange-return-page__product-price">
                        {formatCurrency(item.unitPrice)} 원 {item.quantity > 1 ? `${item.quantity}개` : '1개'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2단계: 사유 선택 */}
          {currentStep === 2 && (
            <div className="exchange-return-page__step-content">
              <h2 className="exchange-return-page__step-title">어떤 문제가 있나요?</h2>
              <div className="exchange-return-page__reason-list">
                {RETURN_REASONS.map((category) => (
                  <div key={category.category} className="exchange-return-page__reason-category">
                    <h3 className="exchange-return-page__reason-category-title">{category.category}</h3>
                    {category.reasons.map((reason) => (
                      <label key={reason.id} className="exchange-return-page__reason-item">
                        <input
                          type="radio"
                          name="return-reason"
                          value={reason.id}
                          checked={selectedReason === reason.id}
                          onChange={(e) => setSelectedReason(e.target.value)}
                        />
                        <span className="exchange-return-page__radio-custom"></span>
                        <span>{reason.label}</span>
                      </label>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3단계: 해결방법 선택 */}
          {currentStep === 3 && (
            <div className="exchange-return-page__step-content">
              {/* 선택한 상품 정보 */}
              <div className="exchange-return-page__selected-summary">
                <h3 className="exchange-return-page__summary-title">
                  선택한 상품 {selectedItemsCount}건
                </h3>
                {selectedItems
                  .filter((item) => item.selected)
                  .map((item, index) => (
                    <div key={index} className="exchange-return-page__summary-item">
                      <div className="exchange-return-page__summary-item-image">
                        <img
                          src={item.thumbnail || item.image || '/placeholder.png'}
                          alt={item.name}
                          onError={(e) => {
                            e.target.src = '/placeholder.png';
                          }}
                        />
                      </div>
                      <div className="exchange-return-page__summary-item-info">
                        <div className="exchange-return-page__summary-item-name">{item.name}</div>
                        <div className="exchange-return-page__summary-item-details">
                          {item.quantity || 1}개 · {formatCurrency(item.unitPrice)} 원
                        </div>
                      </div>
                    </div>
                  ))}
                <div className="exchange-return-page__selected-reason">
                  <strong>선택한 사유</strong>
                  <p>{selectedReasonLabel}</p>
                </div>
              </div>

              {/* 해결방법 선택 */}
              <div className="exchange-return-page__solution-section">
                <h2 className="exchange-return-page__step-title">어떤 해결방법을 원하세요?</h2>
                <div className="exchange-return-page__solution-list">
                  {SOLUTION_OPTIONS.map((solution) => (
                    <label key={solution.id} className="exchange-return-page__solution-item">
                      <input
                        type="radio"
                        name="solution"
                        value={solution.id}
                        checked={selectedSolution === solution.id}
                        onChange={(e) => setSelectedSolution(e.target.value)}
                      />
                      <span className="exchange-return-page__radio-custom"></span>
                      <span>{solution.label}</span>
                    </label>
                  ))}
                </div>
                {selectedSolution === 'return-refund' && (
                  <div className="exchange-return-page__info-box">
                    <p>사용한 흔적이 없는 상품만 반품 가능합니다.</p>
                    <p>상품 포장, 태그 및 라벨 부착 등을 확인해주세요.</p>
                  </div>
                )}
                {selectedSolution === 'return-refund' && (
                  <div className="exchange-return-page__info-box exchange-return-page__info-box--blue">
                    <AlertCircle className="exchange-return-page__info-icon" />
                    <p>회수한 상품을 검수한 후 문제가 발견되면 고객님께 연락을 드립니다.</p>
                  </div>
                )}
              </div>

              {/* 회수지 선택 */}
              <div className="exchange-return-page__collection-section">
                <div className="exchange-return-page__collection-header">
                  <h3 className="exchange-return-page__section-title">상품 회수지</h3>
                  <button type="button" className="exchange-return-page__change-button">
                    변경하기 <ChevronRight size={16} />
                  </button>
                </div>
                <div className="exchange-return-page__collection-address">
                  <p>{user?.name || '이정현'}</p>
                  <p>{user?.address || '서울특별시 강남구 테헤란로 123'}</p>
                </div>
              </div>

              {/* 회수 예정일 */}
              <div className="exchange-return-page__collection-date-section">
                <h3 className="exchange-return-page__section-title">회수 예정일을 선택해주세요.</h3>
                <div className="exchange-return-page__date-options">
                  <label className="exchange-return-page__date-option">
                    <input
                      type="radio"
                      name="collection-date"
                      value="tomorrow"
                      checked={collectionDate === 'tomorrow'}
                      onChange={(e) => setCollectionDate(e.target.value)}
                    />
                    <span className="exchange-return-page__radio-custom"></span>
                    <span>내일</span>
                  </label>
                  <label className="exchange-return-page__date-option">
                    <input
                      type="radio"
                      name="collection-date"
                      value="custom"
                      checked={collectionDate === 'custom'}
                      onChange={(e) => setCollectionDate(e.target.value)}
                    />
                    <span className="exchange-return-page__radio-custom"></span>
                    <span>다른 날을 선택하세요</span>
                  </label>
                </div>
                {collectionDate === 'custom' && (
                  <input
                    type="date"
                    className="exchange-return-page__date-input"
                    value={customCollectionDate}
                    onChange={(e) => setCustomCollectionDate(e.target.value)}
                    min={getTomorrowDate()}
                  />
                )}
              </div>

              {/* 회수 요청사항 */}
              <div className="exchange-return-page__collection-location-section">
                <h3 className="exchange-return-page__section-title">회수 요청사항</h3>
                <div className="exchange-return-page__location-options">
                  <label className="exchange-return-page__location-option">
                    <input
                      type="radio"
                      name="collection-location"
                      value="door"
                      checked={collectionLocation === 'door'}
                      onChange={(e) => setCollectionLocation(e.target.value)}
                    />
                    <span className="exchange-return-page__radio-custom"></span>
                    <span>문앞</span>
                  </label>
                  <label className="exchange-return-page__location-option">
                    <input
                      type="radio"
                      name="collection-location"
                      value="security"
                      checked={collectionLocation === 'security'}
                      onChange={(e) => setCollectionLocation(e.target.value)}
                    />
                    <span className="exchange-return-page__radio-custom"></span>
                    <span>경비실</span>
                  </label>
                  <label className="exchange-return-page__location-option">
                    <input
                      type="radio"
                      name="collection-location"
                      value="other"
                      checked={collectionLocation === 'other'}
                      onChange={(e) => setCollectionLocation(e.target.value)}
                    />
                    <span className="exchange-return-page__radio-custom"></span>
                    <span>그 외 장소 (예: 계단 밑 옥상 등)</span>
                  </label>
                </div>
                {collectionLocation === 'other' && (
                  <input
                    type="text"
                    className="exchange-return-page__location-input"
                    placeholder="장소를 입력해주세요"
                    value={customCollectionLocation}
                    onChange={(e) => setCustomCollectionLocation(e.target.value)}
                  />
                )}
              </div>

              {/* 환불 정보 */}
              {selectedSolution === 'return-refund' && (
                <div className="exchange-return-page__refund-section">
                  <h3 className="exchange-return-page__section-title">결제 정보를 확인해주세요</h3>
                  <div className="exchange-return-page__refund-details">
                    <div className="exchange-return-page__refund-info">
                      <div className="exchange-return-page__refund-row">
                        <span>상품금액</span>
                        <span>
                          {formatCurrency(
                            selectedItems
                              .filter((item) => item.selected)
                              .reduce((sum, item) => sum + (item.unitPrice || 0) * (item.quantity || 1), 0)
                          )}{' '}
                          원
                        </span>
                      </div>
                      <div className="exchange-return-page__refund-row">
                        <span>즉시할인</span>
                        <span>- {formatCurrency(0)} 원</span>
                      </div>
                      <div className="exchange-return-page__refund-row exchange-return-page__refund-row--highlight">
                        <span>
                          <span>로켓와우 회원은 무료반품!</span>
                        </span>
                        <span>- {formatCurrency(5000)} 원</span>
                      </div>
                      <div className="exchange-return-page__refund-row">
                        <span>반품비용 차감</span>
                        <span>{formatCurrency(0)} 원</span>
                      </div>
                    </div>
                    <div className="exchange-return-page__refund-total">
                      <div className="exchange-return-page__refund-total-row">
                        <span>환불 예상금액</span>
                        <span className="exchange-return-page__refund-amount">{formatCurrency(calculateRefundAmount())} 원</span>
                      </div>
                      <div className="exchange-return-page__refund-method">
                        <span>환불 수단</span>
                        <span>삼성카드 / 일시불</span>
                      </div>
                    </div>
                  </div>
                  <p className="exchange-return-page__refund-note">
                    * 캐시 적립 혜택 한도 및 할인쿠폰은 환불요청 완료 후 복구됩니다. (복구에 시간이 소요될 수 있습니다.)
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="exchange-return-page__error">
            <AlertCircle className="exchange-return-page__error-icon" />
            <span>{error}</span>
          </div>
        )}

        {/* 하단 버튼 */}
        <div className="exchange-return-page__actions">
          {currentStep > 1 ? (
            <button 
              type="button" 
              className="exchange-return-page__button exchange-return-page__button--secondary" 
              onClick={handlePrevStep}
              disabled={isSubmitting}
            >
              <ChevronLeft size={20} />
              이전 단계
            </button>
          ) : (
            <button 
              type="button" 
              className="exchange-return-page__button exchange-return-page__button--secondary" 
              onClick={onBack}
              disabled={isSubmitting}
            >
              <ChevronLeft size={20} />
              주문 목록으로
            </button>
          )}
          {currentStep < 3 ? (
            <button
              type="button"
              className="exchange-return-page__button exchange-return-page__button--primary"
              onClick={handleNextStep}
              disabled={
                (currentStep === 1 && selectedItemsCount === 0) || 
                (currentStep === 2 && !selectedReason) ||
                isSubmitting
              }
            >
              다음 단계 <ChevronRight size={20} />
            </button>
          ) : (
            <button
              type="button"
              className="exchange-return-page__button exchange-return-page__button--primary"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? '신청 중...' : '신청하기'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ExchangeReturnPage;

