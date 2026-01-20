import { useState } from 'react'
import './ProductCard.css'

function ProductCard({ product, onSwipe, isGridItem = false, isCircle = false, size = 'small', isFocused = false }) {
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(product.likeCount || 0)

  const handleLike = (e) => {
    e.stopPropagation()
    setIsLiked(!isLiked)
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1)
  }

  const handleComment = (e) => {
    e.stopPropagation()
    window.alert('댓글 기능은 준비 중입니다.')
  }

  const handleShare = async (e) => {
    e.stopPropagation()
    const shareUrl = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, url: shareUrl })
      } catch {
        // ignore
      }
      return
    }
    try {
      await navigator.clipboard.writeText(shareUrl)
      window.alert('링크가 복사되었습니다.')
    } catch {
      window.alert('공유에 실패했습니다.')
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ko-KR').format(price) + '원'
  }

  if (isCircle) {
    return (
      <div 
        className={`product-card circle ${size} ${isFocused ? 'focused' : ''}`}
        style={{
          '--product-color': product.color || '#FF6B6B'
        }}
      >
        <div className="circle-image-container">
          <img 
            src={product.imageUrl || (product.images && product.images[0]?.url) || product.image || '/placeholder-product.jpg'} 
            alt={product.name}
            className="circle-image"
          />
        </div>
        <div className="circle-overlay">
          <div className="circle-info">
            <h3 className="circle-name">{product.name}</h3>
            <p className="circle-price">{formatPrice(product.price || product.basePrice)}</p>
          </div>
        </div>
      </div>
    )
  }

  // 기존 그리드 아이템용 코드
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)

  const minSwipeDistance = 50

  const onTouchStart = (e) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe || isRightSwipe) {
      onSwipe?.(isLeftSwipe ? 'left' : 'right')
    }
  }

  return (
    <div 
      className={`product-card ${isGridItem ? 'grid-item' : ''}`}
      onTouchStart={!isGridItem ? onTouchStart : undefined}
      onTouchMove={!isGridItem ? onTouchMove : undefined}
      onTouchEnd={!isGridItem ? onTouchEnd : undefined}
    >
      <div className="product-image-container">
        <img 
          src={product.imageUrl || (product.images && product.images[0]?.url) || product.image || '/placeholder-product.jpg'} 
          alt={product.name}
          className="product-image"
        />
        <div className="product-overlay">
          <div className="product-info">
            <h3 className="product-name">{product.name}</h3>
            <p className="product-price">{formatPrice(product.price || product.basePrice || product.salePrice)}</p>
            {(product.sellerName || (product.sellerId && product.sellerId.businessName)) && (
              <p className="product-seller">{product.sellerName || (product.sellerId && product.sellerId.businessName)}</p>
            )}
          </div>
        </div>
      </div>

      <div className="product-actions">
        <button 
          className={`action-button like-button ${isLiked ? 'liked' : ''}`}
          onClick={handleLike}
          aria-label="Like"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
          <span>{likeCount > 0 ? formatCount(likeCount) : ''}</span>
        </button>
        
        <button className="action-button comment-button" aria-label="Comment" onClick={handleComment}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <span>{product.commentCount || 0}</span>
        </button>
        
        <button className="action-button share-button" aria-label="Share" onClick={handleShare}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
            <polyline points="16 6 12 2 8 6"></polyline>
            <line x1="12" y1="2" x2="12" y2="15"></line>
          </svg>
        </button>
      </div>
    </div>
  )
}

function formatCount(count) {
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + '천'
  }
  return count.toString()
}

export default ProductCard

