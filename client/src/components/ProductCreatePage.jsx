import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Upload, Trash2 } from 'lucide-react';
import { createProduct, updateProduct, deleteProduct } from '../services/productService';
import { fetchCategoryHierarchy } from '../services/categoryService';
import './ProductCreatePage.css';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const EMPTY_FORM = {
  name: '',
  sku: '',
  description: '',
  category: '',
  price: '',
  image: '',
  images: [],
  colors: [],
  sizes: [],
  stockManagement: 'track',
  totalStock: 0,
  status: 'draft',
  shipping: {
    isFree: false,
    fee: 0,
    estimatedDays: 3,
  },
  returnPolicy: {
    isReturnable: true,
    returnDays: 30,
    returnFee: 0,
  },
};

function ProductCreatePage({ onBack, product = null, onSubmitSuccess = () => {} }) {
  const isEditMode = Boolean(product?._id);
  const [loading, setLoading] = useState(false);
  const [categoryHierarchy, setCategoryHierarchy] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [selectedMainCategory, setSelectedMainCategory] = useState('');
  const [selectedMidCategory, setSelectedMidCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [previewImages, setPreviewImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadingDescriptionImage, setUploadingDescriptionImage] = useState(false);
  const [descriptionImageProgress, setDescriptionImageProgress] = useState(0);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (isEditMode && product && categoryHierarchy.length > 0) {
      // 수정 모드: categoryId가 있으면 우선 사용, 없으면 기존 방식 사용
      if (product.categoryId) {
        // categoryId로 카테고리 찾기
        let foundCategory = null;
        let foundMain = null;
        let foundMid = null;
        
        // 전체 계층 구조를 탐색하여 categoryId와 일치하는 카테고리 찾기
        for (const mainCat of categoryHierarchy) {
          if (mainCat._id?.toString() === product.categoryId?.toString()) {
            foundCategory = mainCat;
            foundMain = mainCat;
            setSelectedMainCategory(mainCat._id);
            break;
          }
          
          for (const midCat of mainCat.children || []) {
            if (midCat._id?.toString() === product.categoryId?.toString()) {
              foundCategory = midCat;
              foundMain = mainCat;
              foundMid = midCat;
              setSelectedMainCategory(mainCat._id);
              setSelectedMidCategory(midCat._id);
              break;
            }
            
            for (const subCat of midCat.children || []) {
              if (subCat._id?.toString() === product.categoryId?.toString()) {
                foundCategory = subCat;
                foundMain = mainCat;
                foundMid = midCat;
                setSelectedMainCategory(mainCat._id);
                setSelectedMidCategory(midCat._id);
                setSelectedSubCategory(subCat._id);
                break;
              }
            }
            
            if (foundCategory) break;
          }
          
          if (foundCategory) break;
        }
      } else if (product.categoryMain) {
        // 하위 호환성: categoryMain, categoryMid, categorySub로 찾기
        findAndSetCategoryFromName(product.categoryMain, product.categoryMid, product.categorySub);
      } else if (product.category) {
        // 하위 호환성: 기존 category 필드로 찾기
        findAndSetCategoryFromName(product.category);
      }
      const productImages = product.images && Array.isArray(product.images) && product.images.length > 0
        ? product.images
        : (product.image ? [product.image] : []);
      
      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        description: product.description || '',
        category: product.category || '',
        categoryMain: product.categoryMain || '',
        categoryMid: product.categoryMid || '',
        categorySub: product.categorySub || '',
        price: product.price?.toString() || '',
        image: productImages[0] || product.image || '',
        images: productImages,
        colors: product.colors && Array.isArray(product.colors) ? product.colors : [],
        sizes: product.sizes && Array.isArray(product.sizes) ? product.sizes : [],
        stockManagement: product.stockManagement || 'track',
        totalStock: product.totalStock || 0,
        status: product.status || 'draft',
        shipping: {
          isFree: product.shipping?.isFree || false,
          fee: product.shipping?.fee || 0,
          estimatedDays: product.shipping?.estimatedDays || 3,
        },
        returnPolicy: {
          isReturnable: product.returnPolicy?.isReturnable !== false,
          returnDays: product.returnPolicy?.returnDays || 30,
          returnFee: product.returnPolicy?.returnFee || 0,
        },
      });
      setPreviewImages(productImages);
    }
  }, [isEditMode, product, categoryHierarchy]);

  const loadCategories = async () => {
    setCategoriesLoading(true);
    try {
      const hierarchyData = await fetchCategoryHierarchy();
      const hierarchy = Array.isArray(hierarchyData) ? hierarchyData : [];
      console.log('카테고리 계층 구조 로드:', hierarchy);
      setCategoryHierarchy(hierarchy);
    } catch (error) {
      console.error('Failed to load categories:', error);
      setCategoryHierarchy([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  // 카테고리 이름으로부터 계층 구조 찾기 (children 구조 사용)
  const findAndSetCategoryFromName = (categoryMainOrName, categoryMid, categorySub) => {
    if (!categoryHierarchy.length) return;
    
    // 3개 파라미터가 모두 있으면 계층 구조로 찾기
    if (categoryMainOrName && categoryMid !== undefined && categorySub !== undefined) {
      const mainCat = categoryHierarchy.find(m => m.name === categoryMainOrName);
      if (!mainCat) return;
      
      setSelectedMainCategory(mainCat._id);
      
      if (categoryMid) {
        // children 구조 사용 (중분류는 대분류의 children)
        const midCat = mainCat.children?.find(m => m.name === categoryMid);
        if (midCat) {
          setSelectedMidCategory(midCat._id);
          
          if (categorySub) {
            // 소분류는 중분류의 children
            const subCat = midCat.children?.find(s => s.name === categorySub);
            if (subCat) {
              setSelectedSubCategory(subCat._id);
            }
          }
        }
      }
      return;
    }
    
    // 하위 호환성: categoryName만 있는 경우
    const categoryName = categoryMainOrName;
    if (!categoryName) return;
    
    for (const mainCat of categoryHierarchy) {
      if (mainCat.name === categoryName) {
        setSelectedMainCategory(mainCat._id);
        return;
      }
      
      // children 구조 사용
      for (const midCat of mainCat.children || []) {
        if (midCat.name === categoryName) {
          setSelectedMainCategory(mainCat._id);
          setSelectedMidCategory(midCat._id);
          return;
        }
        
        for (const subCat of midCat.children || []) {
          if (subCat.name === categoryName) {
            setSelectedMainCategory(mainCat._id);
            setSelectedMidCategory(midCat._id);
            setSelectedSubCategory(subCat._id);
            return;
          }
        }
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.startsWith('shipping.')) {
      const field = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        shipping: {
          ...prev.shipping,
          [field]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value) || 0 : value,
        },
      }));
    } else if (name.startsWith('returnPolicy.')) {
      const field = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        returnPolicy: {
          ...prev.returnPolicy,
          [field]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value) || 0 : value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'number' ? (value === '' ? '' : parseInt(value)) : value,
      }));
    }
  };

  const uploadToCloudinary = async (file, onProgress) => {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      throw new Error('Cloudinary 설정이 없습니다. 환경 변수를 확인해주세요.');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', 'products');

    const xhr = new XMLHttpRequest();
    return new Promise((resolve, reject) => {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const percentComplete = (e.loaded / e.total) * 100;
          onProgress(percentComplete);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          resolve(response.secure_url);
        } else {
          reject(new Error('이미지 업로드에 실패했습니다.'));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('네트워크 오류가 발생했습니다.'));
      });

      xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`);
      xhr.send(formData);
    });
  };

  const handleImageFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // 최대 4개 제한 확인
    const currentImageCount = formData.images.length;
    if (currentImageCount + files.length > 4) {
      alert(`이미지는 최대 4개까지 업로드할 수 있습니다. (현재: ${currentImageCount}개)`);
      e.target.value = '';
      return;
    }

    // 파일 유효성 검사
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.');
        e.target.value = '';
      return;
    }

      if (file.size > 5 * 1024 * 1024) {
        alert('파일 크기는 5MB 이하여야 합니다.');
        e.target.value = '';
      return;
      }
    }

    setUploading(true);
    const newImages = [...formData.images];
    const newPreviewImages = [...previewImages];
    const uploadProgressMap = { ...uploadProgress };

    try {
      // 각 파일을 순차적으로 업로드
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileId = `file-${Date.now()}-${i}`;
        
        // 로컬 미리보기 추가
        const localPreview = URL.createObjectURL(file);
        newPreviewImages.push(localPreview);
        setPreviewImages([...newPreviewImages]);

        try {
          const imageUrl = await uploadToCloudinary(file, (progress) => {
            uploadProgressMap[fileId] = progress;
            setUploadProgress({ ...uploadProgressMap });
          });

          // 업로드 성공 시 실제 URL로 교체
          newImages.push(imageUrl);
          const previewIndex = newPreviewImages.indexOf(localPreview);
          if (previewIndex >= 0) {
            newPreviewImages[previewIndex] = imageUrl;
          }
          
          URL.revokeObjectURL(localPreview);
          
          setFormData((prev) => ({
            ...prev,
            image: prev.image || imageUrl, // 첫 번째 이미지는 image 필드에도 저장
            images: newImages,
          }));
          setPreviewImages([...newPreviewImages]);
        } catch (error) {
          console.error(`Image ${i + 1} upload error:`, error);
          // 실패한 파일의 미리보기 제거
          const previewIndex = newPreviewImages.indexOf(localPreview);
          if (previewIndex >= 0) {
            newPreviewImages.splice(previewIndex, 1);
            setPreviewImages([...newPreviewImages]);
          }
          URL.revokeObjectURL(localPreview);
          alert(`이미지 ${i + 1} 업로드에 실패했습니다: ${error.message}`);
        }
      }
    } finally {
      setUploading(false);
      setUploadProgress({});
      e.target.value = '';
    }
  };

  const handleImageUrlChange = (e) => {
    setImageUrlInput(e.target.value);
  };

  const handleImageUrlSubmit = () => {
    const url = imageUrlInput.trim();
    if (!url) return;
    
    if (formData.images.length >= 4) {
      alert('이미지는 최대 4개까지 업로드할 수 있습니다.');
      setImageUrlInput('');
      return;
    }

    const newImages = [...formData.images, url];
    setFormData((prev) => ({
      ...prev,
      image: prev.image || url,
      images: newImages,
    }));
    setPreviewImages([...previewImages, url]);
    setImageUrlInput('');
  };

  const handleRemoveImage = (index) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    const newPreviewImages = previewImages.filter((_, i) => i !== index);
    
    setFormData((prev) => ({
      ...prev,
      image: newImages[0] || '',
      images: newImages,
    }));
    setPreviewImages(newPreviewImages);
  };

  const uploadDescriptionImageToCloudinary = async (file) => {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      throw new Error('Cloudinary 설정이 없습니다. 환경 변수를 확인해주세요.');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', 'products/description');

    const xhr = new XMLHttpRequest();
    return new Promise((resolve, reject) => {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setDescriptionImageProgress(percentComplete);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          resolve(response.secure_url);
        } else {
          reject(new Error('이미지 업로드에 실패했습니다.'));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('네트워크 오류가 발생했습니다.'));
      });

      xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`);
      xhr.send(formData);
    });
  };

  const handleDescriptionImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('파일 크기는 5MB 이하여야 합니다.');
          return;
        }

    setUploadingDescriptionImage(true);
    setDescriptionImageProgress(0);

    try {
      const imageUrl = await uploadDescriptionImageToCloudinary(file);
      
      // 현재 커서 위치에 이미지 삽입
      const textarea = document.getElementById('description');
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const textBefore = formData.description.substring(0, start);
        const textAfter = formData.description.substring(end);
        const imageMarkdown = `\n![이미지](${imageUrl})\n`;
        const newDescription = textBefore + imageMarkdown + textAfter;
        
        setFormData((prev) => ({ ...prev, description: newDescription }));
        
        // 커서 위치 조정
        setTimeout(() => {
          textarea.focus();
          const newCursorPos = start + imageMarkdown.length;
          textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
      } else {
        // textarea가 없으면 끝에 추가
        setFormData((prev) => ({
          ...prev,
          description: prev.description + `\n![이미지](${imageUrl})\n`,
        }));
      }
    } catch (error) {
      console.error('Description image upload error:', error);
      alert(error.message || '이미지 업로드에 실패했습니다.');
    } finally {
      setUploadingDescriptionImage(false);
      setDescriptionImageProgress(0);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // 카테고리 정보 가져오기
    const selectedMain = categoryHierarchy.find(m => {
      const mainId = m._id?.toString() || m._id;
      return mainId === (selectedMainCategory?.toString() || selectedMainCategory);
    });

    if (!selectedMain) {
      setError('대분류를 선택해주세요.');
      return;
    }

    // children 구조 사용
    const selectedMid = selectedMidCategory ? selectedMain?.children?.find(m => {
      const midId = m._id?.toString() || m._id;
      return midId === (selectedMidCategory?.toString() || selectedMidCategory);
    }) : null;

    const selectedSub = selectedSubCategory && selectedMid ? selectedMid?.children?.find(s => {
      const subId = s._id?.toString() || s._id;
      return subId === (selectedSubCategory?.toString() || selectedSubCategory);
    }) : null;

    // 최종 카테고리: 소분류가 있으면 소분류, 없으면 중분류, 둘 다 없으면 대분류
    // 소분류는 isLeaf=true이므로 소분류를 categoryId로 사용
    const finalCategory = selectedSub?.name || selectedMid?.name || selectedMain?.name;
    const categoryMain = selectedMain.name;
    const categoryMid = selectedMid?.name || null;
    const categorySub = selectedSub?.name || null;
    
    // categoryId는 최종 선택된 카테고리의 ID (우선순위: 소분류 > 중분류 > 대분류)
    // 상품은 소분류에만 연결되어야 하지만, 소분류가 없을 수도 있으므로 유연하게 처리
    const finalCategoryId = selectedSub?._id || selectedMid?._id || selectedMain?._id;
    
    // categoryPathIds 계산 (경로상의 모든 카테고리 ID)
    const categoryPathIds = [];
    if (selectedMain?._id) {
      categoryPathIds.push(selectedMain._id);
      if (selectedMid?._id) {
        categoryPathIds.push(selectedMid._id);
        if (selectedSub?._id) {
          categoryPathIds.push(selectedSub._id);
        }
      }
    }
    
    // categoryPathText 계산
    const pathParts = [selectedMain?.name];
    if (selectedMid?.name) pathParts.push(selectedMid.name);
    if (selectedSub?.name) pathParts.push(selectedSub.name);
    const categoryPathText = pathParts.join(' > ');

    if (!formData.name || !categoryMain || !formData.price || !formData.image) {
      setError('필수 항목(상품명, 카테고리, 가격, 이미지)을 모두 입력해주세요.');
      return;
    }

    setLoading(true);

    try {
      const productImages = formData.images.length > 0 
        ? formData.images.filter(img => img && img.trim())
        : (formData.image ? [formData.image.trim()] : []);

      const payload = {
        sku: formData.sku.trim().toUpperCase(),
        name: formData.name.trim(),
        price: Number(formData.price),
        categoryId: finalCategoryId, // 최종 선택된 카테고리 ID (필수)
        categoryPathIds: categoryPathIds, // 경로상의 모든 카테고리 ID 배열
        categoryPathText: categoryPathText, // 경로 텍스트 (표시용)
        // 하위 호환성 유지
        category: finalCategory,
        categoryMain: categoryMain,
        categoryMid: categoryMid,
        categorySub: categorySub,
        image: productImages[0] || formData.image.trim(),
        images: productImages,
        description: formData.description.trim(),
        colors: formData.colors.filter(c => c.name && c.value),
        sizes: formData.sizes.filter(s => s.label && s.value),
        stockManagement: formData.stockManagement,
        totalStock: formData.stockManagement === 'track' ? Number(formData.totalStock) : undefined,
        status: formData.status,
        shipping: formData.shipping,
        returnPolicy: formData.returnPolicy,
      };

      let result;
      if (isEditMode) {
        result = await updateProduct(product._id, payload);
      } else {
        result = await createProduct(payload);
      }

      setSuccess(true);
      setError('');
      onSubmitSuccess(result);
    } catch (submitError) {
      setError(submitError.message || `상품 ${isEditMode ? '수정' : '등록'}에 실패했습니다.`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditMode || !product?._id) return;

    if (!window.confirm('정말로 이 상품을 삭제하시겠습니까? 삭제된 상품은 복구할 수 없습니다.')) {
      return;
    }

    setLoading(true);
    try {
      await deleteProduct(product._id);
      alert('상품이 삭제되었습니다.');
      onBack();
    } catch (error) {
      alert(error.message || '상품 삭제에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode && !product) {
    return (
      <div className="product-register">
        <div className="product-register-header">
          <button className="product-register-back" onClick={onBack}>
            <ArrowLeft className="icon" />
            관리자 대시보드로
          </button>
          <div className="product-register-title">
            <h1>상품 수정</h1>
            <p>상품 정보를 불러오는 중...</p>
          </div>
        </div>
        <div className="product-register-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="loading-spinner"></div>
            <p>상품 정보를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="product-register">
      <div className="product-register-header">
        <button className="product-register-back" onClick={onBack}>
          <ArrowLeft className="icon" />
          관리자 대시보드로
        </button>
        <div className="product-register-title">
          <h1>{isEditMode ? '상품 수정' : '새 상품 등록'}</h1>
          <p>
            {isEditMode
              ? '상품 정보를 수정하고 저장하세요.'
              : 'SKU, 가격, 카테고리 등 핵심 정보를 입력하고 쇼핑몰에 상품을 추가하세요.'}
          </p>
        </div>
      </div>

      <div className="product-register-content">
        <div className="product-register-main">
          <form onSubmit={handleSubmit} className="product-register-form">
            <section className="product-register-section">
              <h2>{isEditMode ? '상품 수정' : '상품 기본 정보'}</h2>
              <p className="section-subtitle">
                {isEditMode ? '상품 정보를 수정하세요.' : '판매에 필요한 핵심 정보를 입력하세요.'}
              </p>

              <div className="form-group">
                <label htmlFor="sku">
                  SKU (고유코드) <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="sku"
                  name="sku"
                  value={formData.sku}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase().replace(/\s/g, '');
                    setFormData((prev) => ({ ...prev, sku: value }));
                  }}
                  placeholder="예: TOP-001"
                  maxLength={50}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="name">
                  상품명 <span className="required">*</span>
              </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="상품명을 입력하세요"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="price">
                  판매가 (₩) <span className="required">*</span>
              </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  카테고리 <span className="required">*</span>
                </label>
                {categoriesLoading ? (
                  <div style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>
                    카테고리를 불러오는 중...
                  </div>
                ) : categoryHierarchy.length === 0 ? (
                  <div className="form-hint" style={{ color: '#dc3545', marginTop: '0.5rem' }}>
                    <p style={{ margin: '0 0 0.5rem' }}>카테고리가 없습니다. 서버에서 카테고리를 생성해주세요.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {/* 대분류 선택 */}
                    <div>
                      <label htmlFor="mainCategory" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                        대분류
                      </label>
                      <select
                        id="mainCategory"
                        name="mainCategory"
                        value={selectedMainCategory}
                        onChange={(e) => {
                          const mainId = e.target.value;
                          const selectedMain = categoryHierarchy.find(m => {
                            const mainIdStr = m._id?.toString() || m._id;
                            return mainIdStr === mainId;
                          });
                          setSelectedMainCategory(mainId);
                          setSelectedMidCategory('');
                          setSelectedSubCategory('');
                          setFormData((prev) => ({ 
                            ...prev, 
                            category: selectedMain ? selectedMain.name : '',
                            categoryMain: selectedMain ? selectedMain.name : '',
                            categoryMid: '',
                            categorySub: ''
                          }));
                        }}
                        required
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.75rem',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '1rem',
                        }}
                      >
                        <option value="">대분류를 선택하세요</option>
                        {categoryHierarchy.map((mainCat) => (
                          <option key={mainCat._id} value={mainCat._id}>
                            {mainCat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 중분류 선택 */}
                    {selectedMainCategory && (() => {
                      const selectedMain = categoryHierarchy.find(m => {
                        const mainId = m._id?.toString() || m._id;
                        const selectedId = selectedMainCategory?.toString() || selectedMainCategory;
                        return mainId === selectedId;
                      });
                      // children 구조 사용 (중분류는 대분류의 children)
                      const midCategories = selectedMain?.children || [];
                      
                      return (
                        <div>
                          <label htmlFor="midCategory" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                            중분류 {midCategories.length > 0 ? `(${midCategories.length}개)` : '(없음)'}
                          </label>
                          <select
                            id="midCategory"
                            name="midCategory"
                            value={selectedMidCategory}
                            onChange={(e) => {
                              const midId = e.target.value;
                              setSelectedMidCategory(midId);
                              setSelectedSubCategory('');
                              const selectedMid = midCategories.find(m => {
                                const midIdStr = m._id?.toString() || m._id;
                                return midIdStr === midId;
                              });
                              setFormData((prev) => ({ 
                                ...prev, 
                                category: selectedMid ? selectedMid.name : (selectedMain ? selectedMain.name : ''),
                                categoryMain: selectedMain ? selectedMain.name : prev.categoryMain,
                                categoryMid: selectedMid ? selectedMid.name : '',
                                categorySub: ''
                              }));
                            }}
                            disabled={midCategories.length === 0}
                            style={{
                              width: '100%',
                              padding: '0.65rem 0.75rem',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              fontSize: '1rem',
                              opacity: midCategories.length === 0 ? 0.6 : 1,
                            }}
                          >
                            <option value="">
                              {midCategories.length === 0 
                                ? '중분류가 없습니다' 
                                : '중분류를 선택하세요 (선택사항)'}
                            </option>
                            {midCategories.map((midCat) => (
                              <option key={midCat._id} value={midCat._id}>
                                {midCat.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    })()}

                    {/* 소분류 선택 */}
                    {selectedMidCategory && (() => {
                      const selectedMain = categoryHierarchy.find(m => {
                        const mainId = m._id?.toString() || m._id;
                        return mainId === (selectedMainCategory?.toString() || selectedMainCategory);
                      });
                      // children 구조 사용
                      const selectedMid = selectedMain?.children?.find(m => {
                        const midId = m._id?.toString() || m._id;
                        return midId === (selectedMidCategory?.toString() || selectedMidCategory);
                      });
                      // 소분류는 중분류의 children
                      const subCategories = selectedMid?.children || [];
                      
                      return (
                        <div>
                          <label htmlFor="subCategory" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                            소분류 {subCategories.length > 0 ? `(${subCategories.length}개)` : '(없음)'}
                          </label>
                          <select
                            id="subCategory"
                            name="subCategory"
                            value={selectedSubCategory}
                            onChange={(e) => {
                              const subId = e.target.value;
                              setSelectedSubCategory(subId);
                              const selectedSub = subCategories.find(s => {
                                const subIdStr = s._id?.toString() || s._id;
                                return subIdStr === subId;
                              });
                              setFormData((prev) => ({ 
                                ...prev, 
                                category: selectedSub ? selectedSub.name : (selectedMid ? selectedMid.name : (selectedMain ? selectedMain.name : '')),
                                categoryMain: selectedMain ? selectedMain.name : prev.categoryMain,
                                categoryMid: selectedMid ? selectedMid.name : prev.categoryMid,
                                categorySub: selectedSub ? selectedSub.name : ''
                              }));
                            }}
                            disabled={subCategories.length === 0}
                            style={{
                              width: '100%',
                              padding: '0.65rem 0.75rem',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              fontSize: '1rem',
                              opacity: subCategories.length === 0 ? 0.6 : 1,
                            }}
                          >
                            <option value="">
                              {subCategories.length === 0 
                                ? '소분류가 없습니다' 
                                : '소분류를 선택하세요 (선택사항)'}
                            </option>
                            {subCategories.map((subCat) => (
                              <option key={subCat._id} value={subCat._id}>
                                {subCat.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    })()}

                    {/* 선택된 카테고리 표시 */}
                    {formData.category && (
                      <div style={{ 
                        padding: '0.75rem', 
                        background: '#f0f9ff', 
                        border: '1px solid #bae6fd', 
                        borderRadius: '4px',
                        fontSize: '0.875rem',
                        color: '#0369a1'
                      }}>
                        선택된 카테고리: <strong>{formData.category}</strong>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="stockManagement">재고 관리</label>
                <select
                  id="stockManagement"
                  name="stockManagement"
                  value={formData.stockManagement}
                  onChange={handleInputChange}
                >
                  <option value="track">재고 추적</option>
                  <option value="unlimited">무제한</option>
                </select>
              </div>

              {formData.stockManagement === 'track' && (
                <div className="form-group">
                  <label htmlFor="totalStock">재고 수량</label>
                  <input
                    type="number"
                    id="totalStock"
                    name="totalStock"
                    value={formData.totalStock}
                    onChange={handleInputChange}
                    min="0"
                  />
                </div>
              )}

              <div className="form-group">
                <label htmlFor="status">판매 상태</label>
                <select id="status" name="status" value={formData.status} onChange={handleInputChange}>
                  <option value="draft">임시저장</option>
                  <option value="active">판매중</option>
                  <option value="inactive">판매중지</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="imageFile">
                  상품 이미지 <span className="required">*</span> (최대 4개)
                </label>
                <input
                  type="file"
                  id="imageFile"
                  name="imageFile"
                  accept="image/*"
                  multiple
                  onChange={handleImageFileSelect}
                  disabled={uploading || formData.images.length >= 4}
                  style={{ display: 'none' }}
                />
                <label 
                  htmlFor="imageFile" 
                  className="image-upload-button-large"
                  style={{
                    opacity: (uploading || formData.images.length >= 4) ? 0.6 : 1,
                    cursor: (uploading || formData.images.length >= 4) ? 'not-allowed' : 'pointer',
                  }}
                >
                  <Upload className="icon" size={24} />
                  {uploading 
                    ? `업로드 중...` 
                    : formData.images.length >= 4 
                      ? '이미지 최대 개수 도달 (4개)'
                      : `이미지 업로드 (${formData.images.length}/4)`}
                </label>
                {Object.keys(uploadProgress).length > 0 && (
                  <div className="upload-progress" style={{ marginTop: '0.5rem' }}>
                    {Object.entries(uploadProgress).map(([fileId, progress]) => (
                      <div key={fileId} style={{ marginBottom: '0.25rem' }}>
                        <div className="upload-progress-bar" style={{ width: `${progress}%` }} />
                      </div>
                    ))}
                  </div>
                )}
                {previewImages.length > 0 && (
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', 
                    gap: '1rem', 
                    marginTop: '1rem' 
                  }}>
                    {previewImages.map((imageUrl, index) => (
                      <div key={`${imageUrl}-${index}`} style={{ position: 'relative', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
                        <img 
                          src={imageUrl} 
                          alt={`상품 이미지 ${index + 1}`}
                          style={{ 
                            width: '100%', 
                            height: '150px', 
                            objectFit: 'cover',
                            display: 'block'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          style={{
                            position: 'absolute',
                            top: '0.5rem',
                            right: '0.5rem',
                            background: 'rgba(0, 0, 0, 0.7)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '28px',
                            height: '28px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '18px',
                            lineHeight: 1,
                          }}
                          aria-label="이미지 제거"
                        >
                          ×
                        </button>
                        {index === 0 && (
                          <div style={{
                            position: 'absolute',
                            bottom: '0.5rem',
                            left: '0.5rem',
                            background: 'rgba(99, 102, 241, 0.9)',
                            color: 'white',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                          }}>
                            대표 이미지
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <p className="form-hint">
                  Cloudinary 업로드를 통해 이미지를 추가하세요. 최대 4개, 각 5MB 이하 JPG, PNG, WebP 지원.
                </p>
                <details style={{ marginTop: '0.5rem' }}>
                  <summary style={{ cursor: 'pointer', color: '#666', fontSize: '0.85rem' }}>
                    URL로 직접 입력하기
                  </summary>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <input
                      type="url"
                      id="imageUrl"
                      name="imageUrl"
                      value={imageUrlInput}
                      onChange={handleImageUrlChange}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleImageUrlSubmit();
                        }
                      }}
                      placeholder="https://example.com/image.jpg"
                      disabled={formData.images.length >= 4}
                      style={{
                        flex: 1,
                        padding: '0.65rem 0.75rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleImageUrlSubmit}
                      disabled={formData.images.length >= 4 || !imageUrlInput.trim()}
                      style={{
                        padding: '0.65rem 1rem',
                        background: formData.images.length >= 4 || !imageUrlInput.trim() ? '#ccc' : '#6366f1',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: formData.images.length >= 4 || !imageUrlInput.trim() ? 'not-allowed' : 'pointer',
                      }}
                    >
                      추가
                    </button>
                  </div>
                </details>
              </div>

              <div className="form-group">
                <label htmlFor="description">
                  상세 설명 <span className="required">*</span>
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input
                    type="file"
                    id="descriptionImageFile"
                    name="descriptionImageFile"
                    accept="image/*"
                    onChange={handleDescriptionImageUpload}
                    disabled={uploadingDescriptionImage}
                    style={{ display: 'none' }}
                  />
                  <label
                    htmlFor="descriptionImageFile"
                    className="image-upload-button"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      background: '#6366f1',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: uploadingDescriptionImage ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem',
                      opacity: uploadingDescriptionImage ? 0.6 : 1,
                    }}
                  >
                    <Upload className="icon" size={16} />
                    {uploadingDescriptionImage
                      ? `업로드 중... ${Math.round(descriptionImageProgress)}%`
                      : '이미지 추가'}
                  </label>
                  {uploadingDescriptionImage && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                      <div
                        style={{
                          width: '100px',
                          height: '4px',
                          background: '#e5e7eb',
                          borderRadius: '2px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${descriptionImageProgress}%`,
                            height: '100%',
                            background: '#6366f1',
                            transition: 'width 0.3s',
                          }}
                        />
                      </div>
                    </div>
                  )}
            </div>
              <textarea
                  id="description"
                name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="상품 특징, 소재, 배송 정보 등을 입력하세요. 이미지를 추가하려면 위의 '이미지 추가' 버튼을 클릭하세요."
                  rows="8"
                  required
                  style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
                />
                <p className="form-hint" style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
                  이미지를 추가하면 마크다운 형식으로 삽입됩니다. 예: ![이미지](이미지URL)
                </p>
              </div>

              <div className="form-section">
                <h3>상품 옵션 (선택사항)</h3>
                <div className="form-group">
                  <label htmlFor="colors">컬러 옵션</label>
                  <div style={{ marginBottom: '1rem' }}>
                    {formData.colors.map((color, index) => (
                      <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                        <input
                          type="text"
                          placeholder="컬러 이름 (예: Black)"
                          value={color.name || ''}
                          onChange={(e) => {
                            const newColors = [...formData.colors];
                            newColors[index] = { ...newColors[index], name: e.target.value };
                            setFormData((prev) => ({ ...prev, colors: newColors }));
                          }}
                          style={{ flex: 1, padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                        />
                        <input
                          type="color"
                          value={color.value || '#000000'}
                          onChange={(e) => {
                            const newColors = [...formData.colors];
                            newColors[index] = { ...newColors[index], value: e.target.value };
                            setFormData((prev) => ({ ...prev, colors: newColors }));
                          }}
                          style={{ width: '60px', height: '40px', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}
                        />
                        <input
                          type="url"
                          placeholder="컬러별 이미지 URL (선택)"
                          value={color.image || ''}
                          onChange={(e) => {
                            const newColors = [...formData.colors];
                            newColors[index] = { ...newColors[index], image: e.target.value };
                            setFormData((prev) => ({ ...prev, colors: newColors }));
                          }}
                          style={{ flex: 1, padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newColors = formData.colors.filter((_, i) => i !== index);
                            setFormData((prev) => ({ ...prev, colors: newColors }));
                          }}
                          style={{
                            padding: '0.5rem 1rem',
                            background: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
                        >
                          삭제
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          colors: [...prev.colors, { name: '', value: '#000000', image: '' }],
                        }));
                      }}
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#6366f1',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                      }}
                    >
                      + 컬러 추가
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="sizes">사이즈 옵션</label>
                  <div style={{ marginBottom: '1rem' }}>
                    {formData.sizes.map((size, index) => (
                      <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                        <input
                          type="text"
                          placeholder="사이즈 라벨 (예: XS (KR 90))"
                          value={size.label || ''}
                          onChange={(e) => {
                            const newSizes = [...formData.sizes];
                            newSizes[index] = { ...newSizes[index], label: e.target.value };
                            setFormData((prev) => ({ ...prev, sizes: newSizes }));
                          }}
                          style={{ flex: 1, padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                        />
                        <input
                          type="text"
                          placeholder="사이즈 값 (예: XS)"
                          value={size.value || ''}
                          onChange={(e) => {
                            const newSizes = [...formData.sizes];
                            newSizes[index] = { ...newSizes[index], value: e.target.value };
                            setFormData((prev) => ({ ...prev, sizes: newSizes }));
                          }}
                          style={{ flex: 1, padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                        />
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={size.available !== false}
                            onChange={(e) => {
                              const newSizes = [...formData.sizes];
                              newSizes[index] = { ...newSizes[index], available: e.target.checked };
                              setFormData((prev) => ({ ...prev, sizes: newSizes }));
                            }}
                          />
                          <span style={{ fontSize: '0.875rem' }}>재고 있음</span>
            </label>
                        <button
                          type="button"
                          onClick={() => {
                            const newSizes = formData.sizes.filter((_, i) => i !== index);
                            setFormData((prev) => ({ ...prev, sizes: newSizes }));
                          }}
                          style={{
                            padding: '0.5rem 1rem',
                            background: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
                        >
                          삭제
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          sizes: [...prev.sizes, { label: '', value: '', available: true }],
                        }));
                      }}
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#6366f1',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                      }}
                    >
                      + 사이즈 추가
                    </button>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>배송 정보</h3>
                <div className="form-group">
                  <label htmlFor="shipping.estimatedDays">예상 배송일 (일)</label>
                  <input
                    type="number"
                    id="shipping.estimatedDays"
                    name="shipping.estimatedDays"
                    value={formData.shipping.estimatedDays}
                    onChange={handleInputChange}
                    min="1"
                  />
                </div>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="shipping.isFree"
                      checked={formData.shipping.isFree}
                      onChange={handleInputChange}
                    />
                    <span>무료배송</span>
                  </label>
                </div>
                {!formData.shipping.isFree && (
                  <div className="form-group">
                    <label htmlFor="shipping.fee">배송비 (₩)</label>
                    <input
                      type="number"
                      id="shipping.fee"
                      name="shipping.fee"
                      value={formData.shipping.fee}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>
                )}
              </div>

              <div className="form-section">
                <h3>반품/환불 정책</h3>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="returnPolicy.isReturnable"
                      checked={formData.returnPolicy.isReturnable}
                      onChange={handleInputChange}
                    />
                    <span>반품 가능</span>
                  </label>
                </div>
                {formData.returnPolicy.isReturnable && (
                  <>
                    <div className="form-group">
                      <label htmlFor="returnPolicy.returnDays">반품 가능 기간 (일)</label>
                      <input
                        type="number"
                        id="returnPolicy.returnDays"
                        name="returnPolicy.returnDays"
                        value={formData.returnPolicy.returnDays}
                        onChange={handleInputChange}
                        min="1"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="returnPolicy.returnFee">반품 배송비 (₩)</label>
                      <input
                        type="number"
                        id="returnPolicy.returnFee"
                        name="returnPolicy.returnFee"
                        value={formData.returnPolicy.returnFee}
                        onChange={handleInputChange}
                        min="0"
                      />
                    </div>
                  </>
                )}
              </div>

              {error && <p className="status-message error">{error}</p>}
              {success && (
                <p className="status-message success">
                  상품이 성공적으로 {isEditMode ? '수정' : '등록'}되었어요.
                </p>
              )}

              <div className="form-actions">
                {isEditMode && (
                  <button type="button" className="btn btn-delete" onClick={handleDelete} disabled={loading}>
                    <Trash2 size={18} />
                    삭제
                  </button>
                )}
                <div className="btn-group">
              <button
                type="button"
                    className="btn btn-cancel"
                onClick={onBack}
                    disabled={loading}
              >
                    취소
              </button>
                  <button type="submit" className="btn btn-submit" disabled={loading}>
                    {loading
                  ? isEditMode
                    ? '수정 중...'
                    : '등록 중...'
                  : isEditMode
                    ? '상품 수정하기'
                    : '상품 등록하기'}
              </button>
            </div>
              </div>
            </section>
          </form>
        </div>

        <div className="product-register-sidebar">
          <div className="sidebar-section">
            <h3>등록 가이드</h3>
            <ul className="guide-list">
              <li>SKU는 대문자/숫자 조합으로 고유하게 등록하세요.</li>
              <li>가격은 숫자만 입력하며, 통화 기호는 자동으로 처리됩니다.</li>
              <li>이미지 URL은 외부 스토리지 혹은 CDN 링크를 입력할 수 있습니다.</li>
              <li>상세 설명에는 소재, 관리 방법, 배송 안내 등 고객이 궁금해할 내용을 담으세요.</li>
            </ul>
          </div>

          <div className="sidebar-section">
            <h3>이미지 미리보기</h3>
            <div className="image-preview">
              {previewImages[0] || formData.image ? (
                <img src={previewImages[0] || formData.image} alt="상품 미리보기" />
              ) : (
                <div className="image-preview-placeholder">
                  <Upload className="icon" />
                  <p>이미지를 업로드하면 미리보기가 표시됩니다.</p>
                </div>
              )}
              {formData.name && <p className="preview-product-name">{formData.name}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductCreatePage;
