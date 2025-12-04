import { useState, useEffect, useRef } from 'react'
import ProductCard from './ProductCard'
import './ProductSphere.css'

/**
 * ProductSphere - 원형 나열식 상품 표시 컴포넌트 (3D 구체 배치)
 * 
 * @param {Array} products - 상품 배열
 * @param {Function} onProductClick - 상품 클릭 핸들러
 * @param {Object} options - 옵션 객체
 * @param {boolean} options.enableFocus - 포커스 기능 활성화 (기본값: true)
 * @param {number} options.minRadius - 최소 반지름 (기본값: 300)
 * @param {number} options.maxRadius - 최대 반지름 (기본값: 800)
 */
function ProductSphere({ products = [], onProductClick, options = {} }) {
  const {
    enableFocus = true,
    minRadius = 300,
    maxRadius = 800
  } = options

  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 })
  const [velocity, setVelocity] = useState({ x: 0, y: 0 })
  const [focusedProduct, setFocusedProduct] = useState(null)
  const [hoveredProduct, setHoveredProduct] = useState(null)
  const [focusEnabled, setFocusEnabled] = useState(enableFocus)
  const [cameraRotation, setCameraRotation] = useState({ x: 0, y: 0 })
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight })
  const lastPositionRef = useRef({ x: 0, y: 0 })
  const lastTimeRef = useRef(Date.now())
  const animationFrameRef = useRef(null)
  const containerRef = useRef(null)
  const centerRef = useRef(null)

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight })
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // 관성 회전 애니메이션
  useEffect(() => {
    if (!isDragging && (Math.abs(velocity.x) > 0.1 || Math.abs(velocity.y) > 0.1)) {
      const animate = () => {
        const sensitivity = 0.0025
        const normalizeAngle = (angle) => {
          return ((angle % (Math.PI * 2)) + (Math.PI * 2)) % (Math.PI * 2)
        }
        
        setCameraRotation(prev => ({
          x: prev.x - velocity.y * sensitivity,
          y: normalizeAngle(prev.y + velocity.x * sensitivity)
        }))
        
        setVelocity(prev => ({
          x: prev.x * 0.95,
          y: prev.y * 0.95
        }))
        
        if (Math.abs(velocity.x) > 0.1 || Math.abs(velocity.y) > 0.1) {
          animationFrameRef.current = requestAnimationFrame(animate)
        } else {
          setVelocity({ x: 0, y: 0 })
        }
      }
      
      animationFrameRef.current = requestAnimationFrame(animate)
      
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
      }
    }
  }, [isDragging, velocity])

  // 중앙 포커스 영역 감지
  useEffect(() => {
    if (products.length === 0 || !focusEnabled) {
      if (focusedProduct) {
        setFocusedProduct(null)
      }
      return
    }

    let animationFrameId = null

    const checkFocus = () => {
      if (!centerRef.current) {
        animationFrameId = requestAnimationFrame(checkFocus)
        return
      }

      const centerRect = centerRef.current.getBoundingClientRect()
      const centerX = centerRect.left + centerRect.width / 2
      const centerY = centerRect.top + centerRect.height / 2
      const focusRadius = 120

      let closestProduct = null
      let minDistance = Infinity

      products.forEach((product, index) => {
        const item = document.querySelector(`[data-product-id="${product._id || product.id || index}"]`)
        if (!item) return

        const itemRect = item.getBoundingClientRect()
        const itemX = itemRect.left + itemRect.width / 2
        const itemY = itemRect.top + itemRect.height / 2

        const distance = Math.sqrt(
          Math.pow(itemX - centerX, 2) + Math.pow(itemY - centerY, 2)
        )

        if (distance < focusRadius && distance < minDistance) {
          minDistance = distance
          closestProduct = product
        }
      })

      if (closestProduct && closestProduct._id !== focusedProduct?._id) {
        setFocusedProduct(closestProduct)
      } else if (!closestProduct && focusedProduct) {
        setFocusedProduct(null)
      }

      animationFrameId = requestAnimationFrame(checkFocus)
    }

    animationFrameId = requestAnimationFrame(checkFocus)

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [products, cameraRotation.x, cameraRotation.y, focusedProduct, focusEnabled])

  const handleProductClick = (product) => {
    setFocusedProduct(product)
    onProductClick?.(product)
  }

  const toggleFocus = () => {
    setFocusEnabled(prev => !prev)
    if (focusEnabled) {
      setFocusedProduct(null)
    }
  }

  // 드래그 시작
  const handleMouseDown = (e) => {
    if (e.button !== 0) return
    if (e.target.closest('.product-sphere-item') || e.target.closest('.center-focus') || e.target.closest('.focus-toggle')) return
    
    setIsDragging(true)
    setVelocity({ x: 0, y: 0 })
    lastPositionRef.current = { x: e.clientX, y: e.clientY }
    lastTimeRef.current = Date.now()
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      rotationX: cameraRotation.x,
      rotationY: cameraRotation.y
    })
    e.preventDefault()
  }

  // 드래그 중
  const handleMouseMove = (e) => {
    if (!isDragging) return
    
    const now = Date.now()
    const deltaTime = now - lastTimeRef.current
    const deltaX = e.clientX - lastPositionRef.current.x
    const deltaY = e.clientY - lastPositionRef.current.y
    
    if (deltaTime > 0) {
      setVelocity({
        x: deltaX / deltaTime * 16,
        y: deltaY / deltaTime * 16
      })
    }
    
    lastPositionRef.current = { x: e.clientX, y: e.clientY }
    lastTimeRef.current = now
    
    const sensitivity = 0.0025
    const newRotationY = dragStart.rotationY + (e.clientX - dragStart.x) * sensitivity
    const newRotationX = dragStart.rotationX - (e.clientY - dragStart.y) * sensitivity
    
    const normalizeAngle = (angle) => {
      return ((angle % (Math.PI * 2)) + (Math.PI * 2)) % (Math.PI * 2)
    }
    
    setCameraRotation({
      x: newRotationX,
      y: normalizeAngle(newRotationY)
    })
  }

  // 드래그 종료
  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // 터치 시작
  const handleTouchStart = (e) => {
    if (e.target.closest('.product-sphere-item') || e.target.closest('.center-focus') || e.target.closest('.focus-toggle')) return
    
    const touch = e.touches[0]
    setIsDragging(true)
    setVelocity({ x: 0, y: 0 })
    lastPositionRef.current = { x: touch.clientX, y: touch.clientY }
    lastTimeRef.current = Date.now()
    setDragStart({
      x: touch.clientX,
      y: touch.clientY,
      rotationX: cameraRotation.x,
      rotationY: cameraRotation.y
    })
  }

  // 터치 이동
  const handleTouchMove = (e) => {
    if (!isDragging) return
    
    const touch = e.touches[0]
    const now = Date.now()
    const deltaTime = now - lastTimeRef.current
    const deltaX = touch.clientX - lastPositionRef.current.x
    const deltaY = touch.clientY - lastPositionRef.current.y
    
    if (deltaTime > 0) {
      setVelocity({
        x: deltaX / deltaTime * 16,
        y: deltaY / deltaTime * 16
      })
    }
    
    lastPositionRef.current = { x: touch.clientX, y: touch.clientY }
    lastTimeRef.current = now
    
    const sensitivity = 0.0025
    const newRotationY = dragStart.rotationY + (touch.clientX - dragStart.x) * sensitivity
    const newRotationX = dragStart.rotationX - (touch.clientY - dragStart.y) * sensitivity
    
    const normalizeAngle = (angle) => {
      return ((angle % (Math.PI * 2)) + (Math.PI * 2)) % (Math.PI * 2)
    }
    
    setCameraRotation({
      x: newRotationX,
      y: normalizeAngle(newRotationY)
    })
  }

  // 터치 종료
  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  // 3D 구체 배치 계산
  const getSpherePosition = (index, total) => {
    const baseWidth = 1920
    const baseHeight = 1080
    
    const screenDiagonal = Math.sqrt(windowSize.width ** 2 + windowSize.height ** 2)
    const baseDiagonal = Math.sqrt(baseWidth ** 2 + baseHeight ** 2)
    const sizeRatio = Math.min(screenDiagonal / baseDiagonal, 1.5)
    
    const minDimension = Math.min(windowSize.width, windowSize.height)
    const baseMinDimension = Math.min(baseWidth, baseHeight)
    const dimensionRatio = minDimension / baseMinDimension
    
    const combinedRatio = (sizeRatio + dimensionRatio) / 2
    const baseRadius = minRadius + (maxRadius - minRadius) * Math.min(combinedRatio, 1.2)
    
    const yMin = -0.85
    const yMax = 0.85
    const yRange = yMax - yMin
    
    const normalizedIndex = index / Math.max(1, total - 1)
    const y = yMin + normalizedIndex * yRange
    
    const radius = Math.sqrt(1 - y * y)
    
    const goldenAngle = Math.PI * (3 - Math.sqrt(5))
    const theta = goldenAngle * index
    
    const x3d = Math.cos(theta) * radius
    const z3d = Math.sin(theta) * radius
    const y3d = y
    
    const cosX = Math.cos(cameraRotation.x)
    const sinX = Math.sin(cameraRotation.x)
    const cosY = Math.cos(cameraRotation.y)
    const sinY = Math.sin(cameraRotation.y)
    
    let x = x3d * cosY - z3d * sinY
    let z = x3d * sinY + z3d * cosY
    let y2 = y3d
    
    const yFinal = y2 * cosX - z * sinX
    const zFinal = y2 * sinX + z * cosX
    
    const distanceMultiplier = 0.7 + (zFinal + 1) * 0.3
    const adjustedRadius = baseRadius * distanceMultiplier
    
    const perspective = 1000
    const scale = perspective / (perspective + zFinal * adjustedRadius)
    
    const screenX = x * adjustedRadius * scale
    const screenY = yFinal * adjustedRadius * scale
    
    return { 
      x: screenX, 
      y: screenY,
      z: zFinal,
      scale: Math.max(0.3, scale)
    }
  }

  const getScale = (isFocused, isHovered, sphereData) => {
    if (isFocused) return 1.8
    if (isHovered) return 1.3
    return sphereData?.scale || 1
  }

  if (products.length === 0) {
    return (
      <div className="product-sphere-empty">
        <p>등록된 상품이 없습니다.</p>
      </div>
    )
  }

  return (
    <div 
      className="product-sphere"
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
    >
      {/* 컨트롤 버튼 섹션 */}
      <div className="product-sphere-controls">
        {/* 포커스 on/off 버튼 */}
        {enableFocus && (
          <button
            className={`focus-toggle ${focusEnabled ? 'active' : ''}`}
            onClick={toggleFocus}
            aria-label="Toggle Focus"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <circle cx="12" cy="12" r="4"></circle>
            </svg>
          </button>
        )}
      </div>

      {/* 중앙 포커스 프레임 */}
      {enableFocus && focusEnabled && (
        <div 
          ref={centerRef}
          className="center-focus"
          style={{
            width: `${Math.min(Math.min(windowSize.width, windowSize.height) * 0.25, 240)}px`,
            height: `${Math.min(Math.min(windowSize.width, windowSize.height) * 0.25, 240)}px`
          }}
        >
          <div className="focus-ring"></div>
          {focusedProduct && (
            <div className="focus-product">
              <ProductCard 
                product={focusedProduct}
                isCircle={true}
                size="uniform"
                isFocused={true}
              />
            </div>
          )}
        </div>
      )}

      {/* 3D 구체 뷰 */}
      <div 
        className="products-container"
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          minHeight: 'calc(100vh - 200px)',
          transform: 'translate3d(0, 0, 0)',
          transition: 'none'
        }}
      >
        {products.map((product, index) => {
          const sphereData = getSpherePosition(index, products.length)
          const isFocused = focusEnabled && focusedProduct?._id === product._id
          const isHovered = hoveredProduct?._id === product._id
          const scale = getScale(isFocused, isHovered, sphereData)
          
          const isBehind = sphereData.z < 0
          
          const minSize = 120
          const maxSize = 240
          const minDimension = Math.min(windowSize.width, windowSize.height)
          const baseMinDimension = 768
          const sizeRatio = Math.min(minDimension / baseMinDimension, 1.5)
          const productSize = minSize + (maxSize - minSize) * Math.min(sizeRatio, 1.2)
          
          return (
            <div
              key={product._id || product.id || index}
              data-product-id={product._id || product.id || index}
              className={`product-sphere-item ${isFocused ? 'focused' : ''} ${isBehind ? 'behind' : ''}`}
              style={{
                position: 'absolute',
                left: `calc(50% + ${sphereData.x}px)`,
                top: `calc(50% + ${sphereData.y}px)`,
                width: `${productSize}px`,
                height: `${productSize}px`,
                animationDelay: `${index * 0.02}s`,
                transform: `translate3d(-50%, -50%, 0) scale(${scale})`,
                transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                zIndex: Math.round((sphereData.z + 1) * 100),
                opacity: isBehind ? 0 : 1,
                pointerEvents: isBehind ? 'none' : 'auto',
                '--product-color': product.color || '#FF6B6B'
              }}
              onClick={isBehind ? undefined : () => handleProductClick(product)}
              onMouseEnter={isBehind ? undefined : () => setHoveredProduct(product)}
              onMouseLeave={isBehind ? undefined : () => setHoveredProduct(null)}
            >
              <ProductCard 
                product={product}
                isCircle={true}
                size="small"
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ProductSphere

