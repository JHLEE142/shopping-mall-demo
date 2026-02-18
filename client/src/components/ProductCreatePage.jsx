import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Upload, Trash2, FileSpreadsheet, CheckCircle, XCircle } from 'lucide-react';
import { createProduct, updateProduct, deleteProduct, importExcel, commitImport } from '../services/productService';
import { fetchCategoryHierarchy } from '../services/categoryService';
import * as XLSX from 'xlsx';
import './ProductCreatePage.css';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const EMPTY_FORM = {
  name: '',
  sku: '',
  description: '',
  category: '',
  price: '',
  discountRate: '',
  originalPrice: '',
  image: '',
  images: [],
  colors: [],
  sizes: [],
  stockManagement: 'track',
  totalStock: 0,
  status: 'draft',
  shipping: {
    isFree: false,
    fee: 3000,
    estimatedDays: 3,
  },
  returnPolicy: {
    isReturnable: true,
    returnDays: 15,
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
  const [categoryInputMode, setCategoryInputMode] = useState('select'); // 'select' or 'input'
  const [customCategoryMain, setCustomCategoryMain] = useState('');
  const [customCategoryMid, setCustomCategoryMid] = useState('');
  const [customCategorySub, setCustomCategorySub] = useState('');
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [previewImages, setPreviewImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadingDescriptionImage, setUploadingDescriptionImage] = useState(false);
  const [descriptionImageProgress, setDescriptionImageProgress] = useState(0);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // 엑셀 업로드 관련 상태
  const [excelUploadMode, setExcelUploadMode] = useState(false);
  const [excelPreview, setExcelPreview] = useState(null);
  const [excelUploading, setExcelUploading] = useState(false);
  const [excelCommitting, setExcelCommitting] = useState(false);
  const [excelResult, setExcelResult] = useState(null);
  const [excelFileName, setExcelFileName] = useState(null);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [duplicateSkus, setDuplicateSkus] = useState(new Set()); // 중복된 SKU 집합

  const normalizeOptionStock = (value) => {
    if (value === '' || value === null || value === undefined) {
      return null;
    }
    const parsed = Number(value);
    if (Number.isNaN(parsed) || parsed < 0) {
      return null;
    }
    return parsed;
  };
  
  // 배치 자동 실행 관련 상태
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, processed: 0, success: 0, failed: 0 });
  const [allExcelRows, setAllExcelRows] = useState(null); // 전체 엑셀 데이터 저장

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (isEditMode && product && categoryHierarchy.length > 0) {
      // 수정 모드: categoryId가 있으면 우선 사용, 없으면 기존 방식 사용
      let foundCategory = null;
      let foundMain = null;
      let foundMid = null;
      if (product.categoryId) {
        // categoryId로 카테고리 찾기
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

      if (foundCategory) {
        setCategoryInputMode('select');
      } else if (product.categoryMain || product.category) {
        setCategoryInputMode('input');
        setCustomCategoryMain(product.categoryMain || product.category || '');
        setCustomCategoryMid(product.categoryMid || '');
        setCustomCategorySub(product.categorySub || '');
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
        discountRate: product.discountRate?.toString() || '',
        originalPrice: product.originalPrice?.toString() || '',
        image: productImages[0] || product.image || '',
        images: productImages,
        colors: product.colors && Array.isArray(product.colors) ? product.colors : [],
        sizes: product.sizes && Array.isArray(product.sizes) ? product.sizes : [],
        stockManagement: product.stockManagement || 'track',
        totalStock: product.inventory?.stock ?? product.totalStock ?? 0,
        status: product.status || 'draft',
        shipping: {
          isFree: product.shipping?.isFree || false,
          fee: product.shipping?.fee || 3000,
          estimatedDays: product.shipping?.estimatedDays || 3,
        },
        returnPolicy: {
          isReturnable: product.returnPolicy?.isReturnable !== false,
          returnDays: product.returnPolicy?.returnDays || 15,
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
    } else if (name === 'price') {
      // 판매가 변경 시 할인율과 원래 가격 계산
      const price = value === '' ? '' : parseFloat(value);
      setFormData((prev) => {
        let discountRate = prev.discountRate;
        let originalPrice = prev.originalPrice;
        
        if (price !== '' && !isNaN(price) && price > 0) {
          const priceNum = price;
          const originalPriceNum = prev.originalPrice ? parseFloat(prev.originalPrice) : null;
          const discountRateNum = prev.discountRate ? parseFloat(prev.discountRate) : 0;
          
          // 원래 가격이 있고 할인율이 없으면 할인율 계산
          if (originalPriceNum && originalPriceNum > priceNum && discountRateNum === 0) {
            const calculatedDiscountRate = ((originalPriceNum - priceNum) / originalPriceNum) * 100;
            discountRate = Math.max(0, Math.min(100, Math.round(calculatedDiscountRate * 10) / 10));
          }
          // 할인율이 있으면 원래 가격 계산
          else if (discountRateNum > 0 && discountRateNum <= 100) {
            const calculatedOriginalPrice = priceNum / (1 - discountRateNum / 100);
            originalPrice = Math.floor(calculatedOriginalPrice / 100) * 100; // 100원 단위로 절삭
          }
        }
        
        return {
          ...prev,
          price: value,
          discountRate: discountRate === '' ? '' : discountRate.toString(),
          originalPrice: originalPrice === '' ? '' : originalPrice.toString(),
        };
      });
    } else if (name === 'discountRate') {
      // 할인율 변경 시 원래 가격 계산
      const discountRate = value === '' ? '' : parseFloat(value);
      setFormData((prev) => {
        let originalPrice = prev.originalPrice;
        if (prev.price && discountRate !== '' && !isNaN(discountRate) && discountRate > 0 && discountRate <= 100) {
          const price = parseFloat(prev.price);
          if (!isNaN(price) && price > 0) {
            // 원래 가격 = 현재 가격 / (1 - 할인율/100)
            const calculatedOriginalPrice = price / (1 - discountRate / 100);
            originalPrice = Math.floor(calculatedOriginalPrice / 100) * 100; // 100원 단위로 절삭
          }
        }
        return {
          ...prev,
          discountRate: value,
          originalPrice: originalPrice === '' ? '' : originalPrice.toString(),
        };
      });
    } else if (name === 'originalPrice') {
      // 원래 가격 변경 시 할인율 계산
      const originalPrice = value === '' ? '' : parseFloat(value);
      setFormData((prev) => {
        let discountRate = prev.discountRate;
        if (prev.price && originalPrice !== '' && !isNaN(originalPrice) && originalPrice > 0) {
          const price = parseFloat(prev.price);
          const originalPriceNum = originalPrice;
          if (!isNaN(price) && price > 0 && originalPriceNum > price) {
            // 할인율 = (원래 가격 - 현재 가격) / 원래 가격 * 100
            const calculatedDiscountRate = ((originalPriceNum - price) / originalPriceNum) * 100;
            discountRate = Math.max(0, Math.min(100, Math.round(calculatedDiscountRate * 10) / 10));
          } else if (originalPriceNum <= price) {
            // 원래 가격이 현재 가격보다 작거나 같으면 할인율 0
            discountRate = 0;
          }
        }
        return {
          ...prev,
          originalPrice: value,
          discountRate: discountRate === '' ? '' : discountRate.toString(),
        };
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'number' ? (value === '' ? '' : parseInt(value)) : value,
      }));
    }
  };

  const uploadToCloudinary = async (file, onProgress) => {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      const missingVars = [];
      if (!CLOUD_NAME) missingVars.push('VITE_CLOUDINARY_CLOUD_NAME');
      if (!UPLOAD_PRESET) missingVars.push('VITE_CLOUDINARY_UPLOAD_PRESET');
      throw new Error(`Cloudinary 설정이 없습니다. 다음 환경 변수를 확인해주세요: ${missingVars.join(', ')}`);
    }

    // 환경 변수 값 확인 (디버깅용)
    if (process.env.NODE_ENV !== 'production') {
      console.log('Cloudinary 설정 확인:', {
        cloudName: CLOUD_NAME ? `${CLOUD_NAME.substring(0, 4)}...` : '없음',
        uploadPreset: UPLOAD_PRESET ? `${UPLOAD_PRESET.substring(0, 4)}...` : '없음',
      });
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
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response.secure_url);
          } catch (parseError) {
            console.error('Cloudinary 응답 파싱 오류:', parseError);
            reject(new Error('서버 응답을 처리할 수 없습니다.'));
          }
        } else {
          // Cloudinary 오류 응답 파싱
          let errorMessage = '이미지 업로드에 실패했습니다.';
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            if (errorResponse.error) {
              errorMessage = errorResponse.error.message || errorResponse.error;
            } else if (xhr.status === 401) {
              errorMessage = '인증 실패: Cloudinary 업로드 프리셋을 확인해주세요. (Unsigned 프리셋이어야 합니다)';
            } else if (xhr.status === 400) {
              errorMessage = '잘못된 요청: 파일 형식이나 크기를 확인해주세요.';
            } else if (xhr.status === 404) {
              errorMessage = 'Cloudinary 클라우드 이름을 확인해주세요.';
            }
          } catch (parseError) {
            // JSON 파싱 실패 시 상태 코드 기반 메시지
            if (xhr.status === 401) {
              errorMessage = '인증 실패: Cloudinary 업로드 프리셋을 확인해주세요. (Unsigned 프리셋이어야 합니다)';
            } else if (xhr.status === 400) {
              errorMessage = '잘못된 요청입니다.';
            } else if (xhr.status === 404) {
              errorMessage = 'Cloudinary 클라우드 이름을 확인해주세요.';
            }
          }
          console.error('Cloudinary 업로드 실패:', {
            status: xhr.status,
            statusText: xhr.statusText,
            response: xhr.responseText,
          });
          reject(new Error(errorMessage));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.'));
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
      const missingVars = [];
      if (!CLOUD_NAME) missingVars.push('VITE_CLOUDINARY_CLOUD_NAME');
      if (!UPLOAD_PRESET) missingVars.push('VITE_CLOUDINARY_UPLOAD_PRESET');
      throw new Error(`Cloudinary 설정이 없습니다. 다음 환경 변수를 확인해주세요: ${missingVars.join(', ')}`);
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
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response.secure_url);
          } catch (parseError) {
            console.error('Cloudinary 응답 파싱 오류:', parseError);
            reject(new Error('서버 응답을 처리할 수 없습니다.'));
          }
        } else {
          // Cloudinary 오류 응답 파싱
          let errorMessage = '이미지 업로드에 실패했습니다.';
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            if (errorResponse.error) {
              errorMessage = errorResponse.error.message || errorResponse.error;
            } else if (xhr.status === 401) {
              errorMessage = '인증 실패: Cloudinary 업로드 프리셋을 확인해주세요. (Unsigned 프리셋이어야 합니다)';
            } else if (xhr.status === 400) {
              errorMessage = '잘못된 요청: 파일 형식이나 크기를 확인해주세요.';
            } else if (xhr.status === 404) {
              errorMessage = 'Cloudinary 클라우드 이름을 확인해주세요.';
            }
          } catch (parseError) {
            // JSON 파싱 실패 시 상태 코드 기반 메시지
            if (xhr.status === 401) {
              errorMessage = '인증 실패: Cloudinary 업로드 프리셋을 확인해주세요. (Unsigned 프리셋이어야 합니다)';
            } else if (xhr.status === 400) {
              errorMessage = '잘못된 요청입니다.';
            } else if (xhr.status === 404) {
              errorMessage = 'Cloudinary 클라우드 이름을 확인해주세요.';
            }
          }
          console.error('Cloudinary 업로드 실패:', {
            status: xhr.status,
            statusText: xhr.statusText,
            response: xhr.responseText,
          });
          reject(new Error(errorMessage));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.'));
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

    // 직접 입력 모드와 드롭다운 선택 모드 분기 처리
    let finalCategory, categoryMain, categoryMid, categorySub, finalCategoryId, categoryPathIds, categoryPathText;
    
    if (categoryInputMode === 'input') {
      // 직접 입력 모드: 대분류 입력 확인
      if (!customCategoryMain || !customCategoryMain.trim()) {
        setError('대분류를 입력해주세요.');
        return;
      }
      // 직접 입력 모드
      categoryMain = customCategoryMain.trim();
      categoryMid = customCategoryMid.trim() || null;
      categorySub = customCategorySub.trim() || null;
      finalCategory = categorySub || categoryMid || categoryMain;
      finalCategoryId = null; // 직접 입력 시 categoryId는 null
      categoryPathIds = []; // 직접 입력 시 categoryPathIds는 빈 배열
      
      const pathParts = [categoryMain];
      if (categoryMid) pathParts.push(categoryMid);
      if (categorySub) pathParts.push(categorySub);
      categoryPathText = pathParts.join(' > ');
    } else {
      // 드롭다운 선택 모드: 카테고리 정보 가져오기
      const selectedMain = categoryHierarchy.find(m => {
        const mainId = m._id?.toString() || m._id;
        return mainId === (selectedMainCategory?.toString() || selectedMainCategory);
      });

      if (!selectedMain) {
        if (isEditMode && (formData.categoryMain || product?.categoryMain || product?.category)) {
          categoryMain = formData.categoryMain || product?.categoryMain || product?.category || '';
          categoryMid = formData.categoryMid || product?.categoryMid || null;
          categorySub = formData.categorySub || product?.categorySub || null;
          finalCategory = formData.category || categorySub || categoryMid || categoryMain;
          finalCategoryId = product?.categoryId || null;
          categoryPathIds = Array.isArray(product?.categoryPathIds) ? product.categoryPathIds : [];
          if (product?.categoryPathText) {
            categoryPathText = product.categoryPathText;
          } else {
            const pathParts = [categoryMain];
            if (categoryMid) pathParts.push(categoryMid);
            if (categorySub) pathParts.push(categorySub);
            categoryPathText = pathParts.join(' > ');
          }
        } else {
          setError('대분류를 선택해주세요.');
          return;
        }
      } else {
        // children 구조 사용
        const selectedMid = selectedMidCategory && selectedMain ? selectedMain?.children?.find(m => {
          const midId = m._id?.toString() || m._id;
          return midId === (selectedMidCategory?.toString() || selectedMidCategory);
        }) : null;

        const selectedSub = selectedSubCategory && selectedMid ? selectedMid?.children?.find(s => {
          const subId = s._id?.toString() || s._id;
          return subId === (selectedSubCategory?.toString() || selectedSubCategory);
        }) : null;

        // 최종 카테고리: 소분류가 있으면 소분류, 없으면 중분류, 둘 다 없으면 대분류
        finalCategory = selectedSub?.name || selectedMid?.name || selectedMain?.name;
        categoryMain = selectedMain?.name;
        categoryMid = selectedMid?.name || null;
        categorySub = selectedSub?.name || null;
        
        // categoryId는 최종 선택된 카테고리의 ID (우선순위: 소분류 > 중분류 > 대분류)
        finalCategoryId = selectedSub?._id || selectedMid?._id || selectedMain?._id;
        
        // categoryPathIds 계산 (경로상의 모든 카테고리 ID)
        categoryPathIds = [];
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
        categoryPathText = pathParts.join(' > ');
      }
    }

    // 카테고리 검증: 직접 입력 모드일 때는 customCategoryMain도 확인
    // 수정 모드일 때는 기존 product의 categoryMain도 확인
    let isValidCategory;
    if (categoryInputMode === 'input') {
      isValidCategory = (customCategoryMain && customCategoryMain.trim()) || categoryMain;
    } else {
      isValidCategory = categoryMain;
    }
    
    // 수정 모드일 때 기존 상품의 카테고리가 있으면 그것도 유효한 것으로 간주
    if (isEditMode && !isValidCategory && product) {
      isValidCategory = product.categoryMain || product.category || product.categoryPathText;
    }
    
    if (!formData.name || !isValidCategory || !formData.price) {
      setError('필수 항목(상품명, 카테고리, 가격)을 모두 입력해주세요.');
      return;
    }

    setLoading(true);

    try {
      const productImages = formData.images.length > 0 
        ? formData.images.filter(img => img && img.trim())
        : (formData.image ? [formData.image.trim()] : []);

      // 대표 이미지 결정: productImages의 첫 번째 이미지 또는 formData.image
      const mainImage = productImages[0] || formData.image?.trim() || null;

      // 할인율과 원래 가격 처리
      const discountRate = formData.discountRate ? Number(formData.discountRate) : 0;
      const originalPrice = formData.originalPrice ? Number(formData.originalPrice) : null;

      const payload = {
        sku: formData.sku.trim().toUpperCase(),
        name: formData.name.trim(),
        price: Number(formData.price),
        discountRate: discountRate >= 0 && discountRate <= 100 ? discountRate : 0,
        originalPrice: originalPrice && originalPrice > 0 ? originalPrice : null,
        // 직접 입력 모드일 때는 categoryId와 categoryPathIds를 null/빈 배열로 설정
        ...(finalCategoryId ? { categoryId: finalCategoryId } : {}),
        ...(categoryPathIds.length > 0 ? { categoryPathIds: categoryPathIds } : {}),
        categoryPathText: categoryPathText, // 경로 텍스트 (표시용)
        // 하위 호환성 유지
        category: finalCategory,
        categoryMain: categoryMain,
        categoryMid: categoryMid,
        categorySub: categorySub,
        // 대표 이미지: 유효한 값이 있을 때만 포함
        // 수정 모드에서 이미지가 없으면 필드를 보내지 않아서 기존 이미지가 유지됨
        ...(mainImage && mainImage.trim() !== '' ? { image: mainImage.trim() } : {}),
        images: productImages,
        description: formData.description?.trim() || '',
        colors: formData.colors
          .filter((c) => c.name && c.value)
          .map((c) => ({
            ...c,
            stock: normalizeOptionStock(c.stock),
          })),
        sizes: formData.sizes
          .filter((s) => s.label && s.value)
          .map((s) => ({
            ...s,
            stock: normalizeOptionStock(s.stock),
          })),
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

  // 행 선택/해제 핸들러
  const handleRowToggle = (rowIndex) => {
    setSelectedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(rowIndex)) {
        newSet.delete(rowIndex);
      } else {
        newSet.add(rowIndex);
      }
      return newSet;
    });
  };

      // 전체 선택/해제 핸들러
      const handleSelectAll = (checked) => {
        if (!excelPreview || !excelPreview.preview) return;
        
        if (checked) {
           // 유효한 행만 선택 (중복 제외, 최대 500개)
           const validRows = excelPreview.preview
             .filter((item) => {
               const sku = item.mapped?.sku;
               const isDuplicate = sku && duplicateSkus.has(sku);
               return item.validation.ok && !isDuplicate;
             })
             .slice(0, 500)
            .map((item) => item.rowIndex);
          setSelectedRows(new Set(validRows));
        } else {
          setSelectedRows(new Set());
        }
      };

  // 배치 자동 실행 처리 함수
  const processBatchAuto = async (file, allRowsData, headers) => {
    const MAX_TOTAL_ROWS = 10000; // 최대 1만 건
    const BATCH_SIZE = 500; // 배치 크기
    const maxRowsToProcess = Math.min(allRowsData.length, MAX_TOTAL_ROWS);
    
    // 전체 데이터를 500건씩 청크로 분할
    const chunks = [];
    for (let i = 0; i < maxRowsToProcess; i += BATCH_SIZE) {
      chunks.push({
        start: i,
        end: Math.min(i + BATCH_SIZE, maxRowsToProcess),
        rows: allRowsData.slice(i, Math.min(i + BATCH_SIZE, maxRowsToProcess))
      });
    }
    
    console.log(`🔄 [Batch Auto] Starting batch processing: ${chunks.length} chunks, ${maxRowsToProcess} total rows`);
    
    // 배치 시작 전 토큰 검증 및 갱신
    try {
      const { getRemainingTime } = await import('../utils/sessionStorage');
      const { refreshToken } = await import('../services/authService');
      const remainingTime = getRemainingTime();
      if (remainingTime < 10 * 60 * 1000) { // 10분 이하 남았으면 갱신
        console.log('[Batch Auto] Token expires soon, refreshing before batch start...');
        await refreshToken();
        console.log('[Batch Auto] Token refreshed successfully');
      }
    } catch (tokenError) {
      console.error('[Batch Auto] Token refresh failed before batch start:', tokenError);
      throw new Error('토큰 갱신에 실패했습니다. 다시 로그인해주세요.');
    }
    
    setBatchProcessing(true);
    setBatchProgress({ current: 0, total: chunks.length, processed: 0, success: 0, failed: 0 });
    
    let totalSuccess = 0;
    let totalFailed = 0;
    
    // 각 청크를 순차적으로 처리
    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const chunk = chunks[chunkIndex];
      console.log(`📦 [Batch Auto] Processing chunk ${chunkIndex + 1}/${chunks.length} (rows ${chunk.start + 1}-${chunk.end})`);
      
      setBatchProgress(prev => ({ ...prev, current: chunkIndex + 1 }));
      
      // 각 청크 처리 전 토큰 검증 (5개 청크마다)
      if (chunkIndex > 0 && chunkIndex % 5 === 0) {
        try {
          const { getRemainingTime } = await import('../utils/sessionStorage');
          const { refreshToken } = await import('../services/authService');
          const remainingTime = getRemainingTime();
          if (remainingTime < 10 * 60 * 1000) { // 10분 이하 남았으면 갱신
            console.log(`[Batch Auto] Token expires soon at chunk ${chunkIndex + 1}, refreshing...`);
            await refreshToken();
            console.log(`[Batch Auto] Token refreshed successfully`);
          }
        } catch (tokenError) {
          console.error(`[Batch Auto] Token refresh failed at chunk ${chunkIndex + 1}:`, tokenError);
          // 토큰 갱신 실패해도 계속 진행 (각 요청에서 재시도됨)
        }
      }
      
      try {
        // 청크 데이터를 임시 엑셀 파일로 변환
        const chunkWorkbook = XLSX.utils.book_new();
        const chunkWorksheet = XLSX.utils.aoa_to_sheet([headers, ...chunk.rows]);
        XLSX.utils.book_append_sheet(chunkWorkbook, chunkWorksheet, 'Sheet1');
        const chunkFileBuffer = XLSX.write(chunkWorkbook, { type: 'array', bookType: 'xlsx' });
        const chunkBlob = new Blob([chunkFileBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const chunkFile = new File([chunkBlob], `chunk_${chunkIndex + 1}.xlsx`, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        
        // 서버에 미리보기 요청 (기존 상품 자동 필터링됨)
        console.log(`📤 [Batch Auto] Chunk ${chunkIndex + 1}: Sending to server for preview...`);
        const previewResult = await importExcel(chunkFile);
        
        if (!previewResult || !previewResult.preview || previewResult.preview.length === 0) {
          console.log(`⏭️ [Batch Auto] Chunk ${chunkIndex + 1}: No new products found, skipping...`);
          setBatchProgress(prev => ({ ...prev, processed: prev.processed + chunk.rows.length }));
          continue;
        }
        
        // 신규 상품만 추출 (validation.ok인 항목만)
        const newProducts = previewResult.preview.filter(item => item.validation && item.validation.ok);
        
        if (newProducts.length === 0) {
          console.log(`⏭️ [Batch Auto] Chunk ${chunkIndex + 1}: No valid new products, skipping...`);
          setBatchProgress(prev => ({ ...prev, processed: prev.processed + chunk.rows.length }));
          continue;
        }
        
        console.log(`✅ [Batch Auto] Chunk ${chunkIndex + 1}: Found ${newProducts.length} new products, auto-committing...`);
        
        // 자동으로 커밋 실행
        const commitResult = await commitImport(newProducts);
        
        if (commitResult && commitResult.successCount) {
          totalSuccess += commitResult.successCount;
          totalFailed += commitResult.failCount || 0;
          console.log(`✅ [Batch Auto] Chunk ${chunkIndex + 1}: Committed ${commitResult.successCount} products successfully`);
          setBatchProgress(prev => ({ 
            ...prev, 
            processed: prev.processed + chunk.rows.length,
            success: prev.success + (commitResult.successCount || 0),
            failed: prev.failed + (commitResult.failCount || 0)
          }));
        } else {
          console.warn(`⚠️ [Batch Auto] Chunk ${chunkIndex + 1}: Commit result unexpected:`, commitResult);
          setBatchProgress(prev => ({ ...prev, processed: prev.processed + chunk.rows.length }));
        }
        
        // 청크 간 짧은 딜레이 (서버 부하 방지)
        if (chunkIndex < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
      } catch (chunkError) {
        console.error(`❌ [Batch Auto] Chunk ${chunkIndex + 1}: Error:`, chunkError);
        totalFailed += chunk.rows.length;
        setBatchProgress(prev => ({ 
          ...prev, 
          processed: prev.processed + chunk.rows.length,
          failed: prev.failed + chunk.rows.length
        }));
        // 에러가 발생해도 다음 청크 계속 처리
      }
    }
    
    console.log(`🎉 [Batch Auto] Batch processing completed! Total: ${totalSuccess} success, ${totalFailed} failed`);
    setBatchProcessing(false);
    
    // 최종 결과 표시
    setExcelResult({
      successCount: totalSuccess,
      failCount: totalFailed,
      processedCount: maxRowsToProcess,
      message: `배치 처리 완료: ${totalSuccess}개 성공, ${totalFailed}개 실패`
    });
  };

  // 엑셀 파일 업로드 핸들러
  const handleExcelUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      console.log('[Excel Upload] No file selected');
      return;
    }

    console.log('[Excel Upload] File selected:', {
      name: file.name,
      size: file.size,
      type: file.type,
      sizeMB: (file.size / 1024 / 1024).toFixed(2) + ' MB'
    });

    // 파일 확장자 검증
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      console.log('[Excel Upload] Invalid file type:', file.name);
      alert('Only Excel files (.xlsx, .xls) are allowed.');
      e.target.value = '';
      return;
    }

    // 파일명 저장
    setExcelFileName(file.name);

    console.log('[Excel Upload] Starting upload...');
    setExcelUploading(true);
    setExcelPreview(null);
    setExcelResult(null);
    setError('');
    setSelectedRows(new Set()); // 파일 업로드 시 선택 초기화
    setDuplicateSkus(new Set());
    setBatchProcessing(false);
    setBatchProgress({ current: 0, total: 0, processed: 0, success: 0, failed: 0 });

    const uploadStartTime = Date.now();

    try {
      // 클라이언트에서 Excel 파일 읽기
      console.log('[Excel Upload] Reading file locally...');
      const fileData = await file.arrayBuffer();
      const workbook = XLSX.read(fileData, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // 헤더 포함 전체 데이터 가져오기
      const data = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        defval: null
      });
      
      const headers = data[0] || [];
      const allRows = data.slice(1);
      
      console.log(`[Excel Upload] Total rows in file: ${allRows.length}`);
      
      // 배치 자동 실행 시작
      console.log('[Excel Upload] Starting batch auto-processing...');
      await processBatchAuto(file, allRows, headers);
      
      const uploadDuration = Date.now() - uploadStartTime;
      console.log('[Excel Upload] Batch processing completed in', uploadDuration + 'ms');
    } catch (uploadError) {
      const uploadDuration = Date.now() - uploadStartTime;
      console.error('[Excel Upload] Upload failed after', uploadDuration + 'ms:', uploadError);
      console.error('[Excel Upload] Error details:', {
        message: uploadError.message,
        stack: uploadError.stack,
        name: uploadError.name
      });
      
      // 네트워크 타임아웃 등 체크
      let errorMessage = uploadError.message || 'Failed to upload Excel file. Please try again.';
      if (uploadError.name === 'TypeError' && uploadError.message.includes('fetch')) {
        errorMessage = 'Network error: Unable to connect to server. Please check your connection.';
      } else if (uploadDuration > 30000) {
        errorMessage = 'Upload timeout: The server took too long to respond. The file might be too large or the server is busy.';
      }
      
      setError(errorMessage);
      setExcelFileName(null); // 에러 시 파일명 제거
    } finally {
      console.log('[Excel Upload] Setting uploading to false');
      setExcelUploading(false);
      e.target.value = '';
    }
  };

  // 엑셀 상품 등록 커밋 핸들러
  const handleExcelCommit = async () => {
    if (!excelPreview || !excelPreview.preview || excelPreview.preview.length === 0) {
      setError('No preview data to commit.');
      return;
    }

    // 선택된 행이 있으면 선택된 행만, 없으면 모든 유효한 행 사용 (중복 제외, 최대 500개)
    let rowsToCommit = excelPreview.preview;
    if (selectedRows.size > 0) {
      rowsToCommit = excelPreview.preview.filter((item) => selectedRows.has(item.rowIndex));
    } else {
      // 선택된 행이 없으면 모든 유효한 행 처리 (중복 제외, 최대 500개)
      const skuSet = new Set();
      rowsToCommit = excelPreview.preview
        .filter((item) => {
          if (!item.validation.ok) return false;
          const sku = item.mapped?.sku;
          if (sku && duplicateSkus.has(sku)) return false; // 중복 제외
          if (sku && skuSet.has(sku)) return false; // 엑셀 내 중복 제외
          if (sku) skuSet.add(sku);
          return true;
        })
        .slice(0, 500);
    }

    if (rowsToCommit.length === 0) {
      setError('No valid rows selected to commit.');
      return;
    }

    setExcelCommitting(true);
    setExcelResult(null);
    setError('');
    setSelectedRows(new Set()); // 커밋 시 선택 초기화

    try {
      const result = await commitImport(rowsToCommit);
      setExcelResult(result);
      setSuccess(true);
    } catch (commitError) {
      setError(commitError.message || 'Failed to commit products. Please try again.');
      console.error('Excel commit error:', commitError);
    } finally {
      setExcelCommitting(false);
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

      {/* 모드 전환 버튼 (수정 모드가 아닐 때만) */}
      {!isEditMode && (
        <div style={{ 
          padding: '1rem 2rem', 
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          gap: '1rem',
          alignItems: 'center'
        }}>
          <button
            type="button"
            onClick={() => {
              setExcelUploadMode(false);
              setExcelPreview(null);
              setExcelResult(null);
              setExcelFileName(null);
              setDuplicateSkus(new Set());
            }}
            style={{
              padding: '0.5rem 1rem',
              background: !excelUploadMode ? '#6366f1' : '#e5e7eb',
              color: !excelUploadMode ? 'white' : '#666',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            Manual Entry
          </button>
          <button
            type="button"
            onClick={() => {
              setExcelUploadMode(true);
              setExcelPreview(null);
              setExcelResult(null);
              setExcelFileName(null);
              setDuplicateSkus(new Set());
            }}
            style={{
              padding: '0.5rem 1rem',
              background: excelUploadMode ? '#6366f1' : '#e5e7eb',
              color: excelUploadMode ? 'white' : '#666',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            Excel Upload
          </button>
        </div>
      )}

      <div className="product-register-content">
        {/* 엑셀 업로드 모드 */}
        {!isEditMode && excelUploadMode ? (
          <>
          <div className="product-register-main">
            <section className="product-register-section">
              <h2>Excel Upload Based Product Registration</h2>
              <p className="section-subtitle">
                Upload an Excel file to automatically register products. Only the first 5 valid items will be registered in test mode.
              </p>

              {/* 처리 범위 안내 */}
              <div style={{
                padding: '1rem',
                background: '#dbeafe',
                border: '1px solid #3b82f6',
                borderRadius: '8px',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}>
                <span style={{ fontSize: '1.25rem' }}>ℹ️</span>
                 <span style={{ fontWeight: 600, color: '#1e40af' }}>
                   최대 500개까지 처리 가능합니다. 중복된 상품은 자동으로 제외됩니다.
                 </span>
              </div>

              {/* 파일 업로드 */}
              <div className="form-group">
                <label htmlFor="excelFile" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Excel File (.xlsx, .xls)
                </label>
                <input
                  type="file"
                  id="excelFile"
                  accept=".xlsx,.xls"
                  onChange={handleExcelUpload}
                  disabled={excelUploading}
                  style={{ display: 'none' }}
                />
                <label
                  htmlFor="excelFile"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    background: excelUploading ? '#f59e0b' : (excelFileName && excelPreview ? '#10b981' : '#6366f1'),
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: excelUploading ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                  }}
                >
                  {excelUploading ? (
                    <>
                      <div className="loading-spinner" style={{ width: '20px', height: '20px', borderWidth: '2px', borderColor: 'white transparent white transparent' }}></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet size={20} />
                      {excelFileName && excelPreview ? '✓ Uploaded' : 'Select Excel File'}
                    </>
                  )}
                </label>
                <p className="form-hint" style={{ marginTop: '0.5rem' }}>
                  Required columns: 바코드 (Barcode), 상품명 (Product Name), 우수회원5 (VIP5 Price), 카테고리 (Category)
                </p>
              </div>

              {/* 업로드된 파일명 표시 */}
              {excelFileName && (
                <div style={{
                  marginTop: '1rem',
                  padding: '0.75rem 1rem',
                  background: batchProcessing ? '#fef3c7' : (excelUploading ? '#fef3c7' : (excelPreview ? '#f0fdf4' : '#f0f9ff')),
                  border: batchProcessing ? '1px solid #fbbf24' : (excelUploading ? '1px solid #fbbf24' : (excelPreview ? '1px solid #86efac' : '1px solid #bae6fd')),
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}>
                  {batchProcessing || excelUploading ? (
                    <div className="loading-spinner" style={{ width: '20px', height: '20px', borderWidth: '2px', borderColor: '#f59e0b #f59e0b transparent #f59e0b' }}></div>
                  ) : (
                    <FileSpreadsheet size={20} color={excelPreview ? "#059669" : "#0369a1"} />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500, color: batchProcessing ? '#92400e' : (excelUploading ? '#92400e' : (excelPreview ? '#059669' : '#0369a1')) }}>
                      {batchProcessing ? '🔄 배치 처리 중...' : (excelUploading ? '⏳ 파일 업로드 중...' : (excelPreview ? '✓ 파일 업로드 완료' : '📤 파일 선택됨'))}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: batchProcessing ? '#78350f' : (excelUploading ? '#78350f' : (excelPreview ? '#047857' : '#075985')), marginTop: '0.25rem' }}>
                      {excelFileName}
                    </div>
                  </div>
                  {excelPreview && !batchProcessing && (
                    <div style={{
                      padding: '0.25rem 0.75rem',
                      background: '#10b981',
                      color: 'white',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}>
                      ✓ 준비 완료
                    </div>
                  )}
                </div>
              )}

              {/* 배치 처리 진행 상황 표시 */}
              {batchProcessing && batchProgress.total > 0 && (
                <div style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  background: '#fef3c7',
                  border: '1px solid #fbbf24',
                  borderRadius: '6px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#92400e' }}>
                      배치 처리 진행 중...
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#78350f' }}>
                      {batchProgress.current} / {batchProgress.total} 청크
                    </div>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    background: '#fde68a',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    marginBottom: '0.5rem',
                  }}>
                    <div style={{
                      width: `${(batchProgress.current / batchProgress.total) * 100}%`,
                      height: '100%',
                      background: '#f59e0b',
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#78350f' }}>
                    <span>처리된 행: {batchProgress.processed.toLocaleString()}</span>
                    <span>성공: {batchProgress.success.toLocaleString()} | 실패: {batchProgress.failed.toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* 미리보기 테이블 */}
              {excelPreview && excelPreview.preview && excelPreview.preview.length > 0 && (
                <div style={{ marginTop: '2rem' }}>
                  <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem', fontWeight: 600 }}>
                    Preview ({excelPreview.validRows - duplicateSkus.size} available, {duplicateSkus.size} duplicates, {excelPreview.invalidRows} invalid)
                  </h3>
                  <div style={{
                    overflowX: 'auto',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    maxHeight: '500px',
                    overflowY: 'auto',
                  }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                      <thead style={{ background: '#f9fafb', position: 'sticky', top: 0, zIndex: 10 }}>
                        <tr>
                          <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #e5e7eb', fontWeight: 600, width: '50px' }}>
                            <input
                              type="checkbox"
                              checked={excelPreview.preview.filter((item) => {
                                const sku = item.mapped?.sku;
                                const isDuplicate = sku && duplicateSkus.has(sku);
                                return item.validation.ok && !isDuplicate;
                              }).length > 0 && 
                               excelPreview.preview.filter((item) => {
                                 const sku = item.mapped?.sku;
                                 const isDuplicate = sku && duplicateSkus.has(sku);
                                 return item.validation.ok && !isDuplicate;
                               })
                                 .every((item) => selectedRows.has(item.rowIndex))}
                              onChange={(e) => handleSelectAll(e.target.checked)}
                              style={{ cursor: 'pointer' }}
                            />
                          </th>
                          <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600 }}>Row</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600 }}>Status</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600 }}>SKU</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600 }}>Name</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600 }}>Price</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600 }}>Original Price</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600 }}>Discount Rate</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600 }}>Category</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600 }}>Errors</th>
                        </tr>
                      </thead>
                      <tbody>
                        {excelPreview.preview.map((item, index) => {
                          const isValidRow = item.validation.ok;
                          const sku = item.mapped?.sku;
                          const isDuplicate = sku && duplicateSkus.has(sku);
                          const isSelectable = isValidRow && !isDuplicate;
                          const isSelected = selectedRows.has(item.rowIndex);
                          
                          return (
                            <tr
                              key={index}
                              style={{
                                background: isSelected ? '#dbeafe' : (isDuplicate ? '#fef3c7' : (isValidRow ? '#f0fdf4' : '#fef2f2')),
                                borderBottom: '1px solid #e5e7eb',
                                opacity: isSelectable ? 1 : 0.6,
                              }}
                            >
                              <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleRowToggle(item.rowIndex)}
                                  disabled={!isSelectable}
                                  style={{ cursor: isSelectable ? 'pointer' : 'not-allowed' }}
                                />
                              </td>
                              <td style={{ padding: '0.75rem' }}>{item.rowIndex}</td>
                            <td style={{ padding: '0.75rem' }}>
                              {isDuplicate ? (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#f59e0b' }}>
                                  <XCircle size={16} />
                                  중복
                                </span>
                              ) : isValidRow ? (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#059669' }}>
                                  <CheckCircle size={16} />
                                  판매중
                                </span>
                              ) : (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#dc2626' }}>
                                  <XCircle size={16} />
                                  오류
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '0.75rem', fontFamily: 'monospace', position: 'relative' }}>
                              {item.mapped.sku || '-'}
                              {isDuplicate && (
                                <span style={{
                                  position: 'absolute',
                                  right: '0.25rem',
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                  background: '#f59e0b',
                                  color: 'white',
                                  fontSize: '0.7rem',
                                  padding: '0.15rem 0.4rem',
                                  borderRadius: '4px',
                                  fontWeight: 600,
                                  whiteSpace: 'nowrap',
                                }}>
                                  중복
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '0.75rem' }}>{item.mapped.name || '-'}</td>
                            <td style={{ padding: '0.75rem' }}>
                              {item.mapped.price !== null ? `₩${item.mapped.price.toLocaleString()}` : '-'}
                            </td>
                            <td style={{ padding: '0.75rem' }}>
                              {item.mapped.originalPrice !== null && item.mapped.originalPrice !== undefined 
                                ? `₩${item.mapped.originalPrice.toLocaleString()}` 
                                : '-'}
                            </td>
                            <td style={{ padding: '0.75rem' }}>
                              {item.mapped.discountRate !== null && item.mapped.discountRate !== undefined 
                                ? `${item.mapped.discountRate}%` 
                                : '-'}
                            </td>
                            <td style={{ padding: '0.75rem', fontSize: '0.75rem' }}>
                              {item.mapped.category.l1 && (
                                <div>
                                  {item.mapped.category.l1}
                                  {item.mapped.category.l2 && ` > ${item.mapped.category.l2}`}
                                  {item.mapped.category.l3 && ` > ${item.mapped.category.l3}`}
                                </div>
                              )}
                              {!item.mapped.category.l1 && '-'}
                            </td>
                            <td style={{ padding: '0.75rem', fontSize: '0.75rem', color: isDuplicate ? '#f59e0b' : '#dc2626' }}>
                              {isDuplicate ? (
                                <span style={{ color: '#f59e0b', fontWeight: 600 }}>중복된 SKU: {item.mapped.sku}</span>
                              ) : item.validation.errors && item.validation.errors.length > 0 ? (
                                <ul style={{ margin: 0, paddingLeft: '1rem' }}>
                                  {item.validation.errors.map((err, errIdx) => (
                                    <li key={errIdx}>{err}</li>
                                  ))}
                                </ul>
                              ) : (
                                '-'
                              )}
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                </div>
              )}

              {/* 결과 리포트 */}
              {excelResult && (
                <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                  <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem', fontWeight: 600 }}>
                    Import Result
                  </h3>
                  <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
                    <div>
                      <span style={{ fontSize: '0.875rem', color: '#666' }}>Processed: </span>
                      <span style={{ fontWeight: 600 }}>{excelResult.processedCount}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.875rem', color: '#666' }}>Success: </span>
                      <span style={{ fontWeight: 600, color: '#059669' }}>{excelResult.successCount}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.875rem', color: '#666' }}>Failed: </span>
                      <span style={{ fontWeight: 600, color: '#dc2626' }}>{excelResult.failCount}</span>
                    </div>
                  </div>
                  {excelResult.message && (
                    <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1rem' }}>
                      {excelResult.message}
                    </p>
                  )}
                  {excelResult.duplicateItems && excelResult.duplicateItems.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#f59e0b' }}>
                        중복된 상품 ({excelResult.duplicateItems.length}개):
                      </h4>
                      <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.875rem', maxHeight: '200px', overflowY: 'auto' }}>
                        {excelResult.duplicateItems.map((item, idx) => (
                          <li key={idx} style={{ marginBottom: '0.25rem', color: '#f59e0b' }}>
                            Row {item.rowIndex}: {item.name} (SKU: {item.sku}) - {item.reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {excelResult.failItems && excelResult.failItems.length > excelResult.duplicateItems?.length && (
                    <div>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>실패한 항목:</h4>
                      <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.875rem', maxHeight: '200px', overflowY: 'auto' }}>
                        {excelResult.failItems
                          .filter(item => !excelResult.duplicateItems?.some(dup => dup.rowIndex === item.rowIndex && dup.sku === item.sku))
                          .map((item, idx) => (
                            <li key={idx} style={{ marginBottom: '0.25rem', color: '#dc2626' }}>
                              Row {item.rowIndex}: {item.name} (SKU: {item.sku}) - {item.reason}
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {error && <p className="status-message error">{error}</p>}
              {success && !excelResult && (
                <p className="status-message success">
                  Excel file processed successfully.
                </p>
              )}
            </section>
          </div>

          {/* 엑셀 업로드 모드용 사이드바 (미리보기 및 실행 버튼) */}
          {excelPreview && excelPreview.preview && excelPreview.preview.length > 0 && (
            <div className="product-register-sidebar">
              <div className="sidebar-section">
                <h3>추가될 상품 미리보기</h3>
                <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#666' }}>
                  {selectedRows.size > 0 ? (
                    <span><strong>{selectedRows.size}개</strong> 상품이 선택되었습니다.</span>
                  ) : (
                     <span>
                       <strong>{Math.min(excelPreview.validRows - duplicateSkus.size, 500)}개</strong> 상품이 추가됩니다.
                      {duplicateSkus.size > 0 && (
                        <span style={{ color: '#f59e0b', marginLeft: '0.5rem' }}>
                          (중복 {duplicateSkus.size}개 제외)
                        </span>
                      )}
                    </span>
                  )}
                </div>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {excelPreview.preview
                    .filter((item) => {
                      const sku = item.mapped?.sku;
                      const isDuplicate = sku && duplicateSkus.has(sku);
                      if (selectedRows.size > 0) {
                        return selectedRows.has(item.rowIndex);
                      }
                      return item.validation.ok && !isDuplicate;
                    })
                     .slice(0, 500)
                    .map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '0.75rem',
                          marginBottom: '0.75rem',
                          background: '#f9fafb',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                        }}
                      >
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem', color: '#111827' }}>
                          {item.mapped.name || `Row ${item.rowIndex}`}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.25rem' }}>
                          <strong>SKU:</strong> {item.mapped.sku || '-'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.25rem' }}>
                          <strong>가격:</strong> {item.mapped.price !== null ? `₩${item.mapped.price.toLocaleString()}` : '-'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#666' }}>
                          <strong>카테고리:</strong>{' '}
                          {item.mapped.category.l1 && (
                            <span>
                              {item.mapped.category.l1}
                              {item.mapped.category.l2 && ` > ${item.mapped.category.l2}`}
                              {item.mapped.category.l3 && ` > ${item.mapped.category.l3}`}
                            </span>
                          )}
                          {!item.mapped.category.l1 && '-'}
                        </div>
                        {item.validation.ok && (
                          <div style={{
                            marginTop: '0.5rem',
                            padding: '0.25rem 0.5rem',
                            background: '#dbeafe',
                            color: '#1e40af',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            display: 'inline-block',
                          }}>
                            ✓ 검증 완료
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>

              <div className="sidebar-section">
                <h3>실행</h3>
                <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#666' }}>
                  미리보기에 표시된 상품들을 등록하시겠습니까?
                </div>
                <button
                  type="button"
                  onClick={handleExcelCommit}
                  disabled={excelCommitting || (excelPreview.validRows - duplicateSkus.size) === 0}
                  style={{
                    width: '100%',
                    padding: '0.875rem 1.5rem',
                    background: excelCommitting || (excelPreview.validRows - duplicateSkus.size) === 0 ? '#ccc' : '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: excelCommitting || excelPreview.validRows === 0 ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: excelCommitting || excelPreview.validRows === 0 ? 'none' : '0 4px 6px rgba(16, 185, 129, 0.3)',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={(e) => {
                    if (!excelCommitting && (excelPreview.validRows - duplicateSkus.size) > 0) {
                      e.currentTarget.style.boxShadow = '0 6px 8px rgba(16, 185, 129, 0.4)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!excelCommitting && (excelPreview.validRows - duplicateSkus.size) > 0) {
                      e.currentTarget.style.boxShadow = '0 4px 6px rgba(16, 185, 129, 0.3)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  {excelCommitting ? (
                    <>
                      <div className="loading-spinner" style={{ width: '18px', height: '18px', borderWidth: '2px', borderColor: 'white transparent white transparent' }}></div>
                      실행 중...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      실행하기
                    </>
                  )}
                </button>
                {selectedRows.size > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedRows(new Set())}
                    disabled={excelCommitting}
                    style={{
                      width: '100%',
                      marginTop: '0.5rem',
                      padding: '0.5rem 1rem',
                      background: 'transparent',
                      color: '#666',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      cursor: excelCommitting ? 'not-allowed' : 'pointer',
                      fontSize: '0.75rem',
                    }}
                  >
                    선택 해제
                  </button>
                )}
              </div>
            </div>
          )}
          </>
        ) : (
          <>
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
                <label htmlFor="discountRate">
                  할인율 (%)
                </label>
                <input
                  type="number"
                  id="discountRate"
                  name="discountRate"
                  value={formData.discountRate}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="예: 20 (20% 할인)"
                />
                <p className="form-hint" style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
                  할인율을 입력하면 원래 가격이 자동으로 계산됩니다.
                </p>
              </div>

              <div className="form-group">
                <label htmlFor="originalPrice">
                  원래 가격 (₩)
                </label>
                <input
                  type="number"
                  id="originalPrice"
                  name="originalPrice"
                  value={formData.originalPrice}
                  onChange={handleInputChange}
                  min="0"
                  placeholder="할인율 입력 시 자동 계산되거나 직접 입력 가능"
                />
                <p className="form-hint" style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
                  할인 전 원래 가격입니다. 할인율 입력 시 자동 계산되며, 직접 수정할 수 있습니다.
                </p>
              </div>

              <div className="form-group">
                <label>
                  카테고리 <span className="required">*</span>
                </label>
                <div style={{ marginBottom: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setCategoryInputMode('select')}
                    style={{
                      padding: '0.5rem 1rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      background: categoryInputMode === 'select' ? '#111827' : '#fff',
                      color: categoryInputMode === 'select' ? '#fff' : '#111827',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                    }}
                  >
                    드롭다운 선택
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategoryInputMode('input')}
                    style={{
                      padding: '0.5rem 1rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      background: categoryInputMode === 'input' ? '#111827' : '#fff',
                      color: categoryInputMode === 'input' ? '#fff' : '#111827',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                    }}
                  >
                    직접 입력
                  </button>
                </div>
                {categoriesLoading ? (
                  <div style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>
                    카테고리를 불러오는 중...
                  </div>
                ) : categoryInputMode === 'input' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div>
                      <label htmlFor="customMainCategory" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                        대분류 <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        id="customMainCategory"
                        value={customCategoryMain}
                        onChange={(e) => {
                          const value = e.target.value;
                          setCustomCategoryMain(value);
                          setFormData((prev) => ({
                            ...prev,
                            categoryMain: value,
                            category: value,
                            categoryMid: customCategoryMid || '',
                            categorySub: customCategorySub || '',
                          }));
                        }}
                        placeholder="대분류를 입력하세요 (예: 상의)"
                        required
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.75rem',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '1rem',
                        }}
                      />
                    </div>
                    <div>
                      <label htmlFor="customMidCategory" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                        중분류 (선택사항)
                      </label>
                      <input
                        type="text"
                        id="customMidCategory"
                        value={customCategoryMid}
                        onChange={(e) => {
                          const value = e.target.value;
                          setCustomCategoryMid(value);
                          setFormData((prev) => ({
                            ...prev,
                            categoryMid: value,
                            category: value || prev.categoryMain,
                            categorySub: customCategorySub || '',
                          }));
                        }}
                        placeholder="중분류를 입력하세요 (예: 티셔츠)"
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.75rem',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '1rem',
                        }}
                      />
                    </div>
                    <div>
                      <label htmlFor="customSubCategory" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                        소분류 (선택사항)
                      </label>
                      <input
                        type="text"
                        id="customSubCategory"
                        value={customCategorySub}
                        onChange={(e) => {
                          const value = e.target.value;
                          setCustomCategorySub(value);
                          setFormData((prev) => ({
                            ...prev,
                            categorySub: value,
                            category: value || prev.categoryMid || prev.categoryMain,
                          }));
                        }}
                        placeholder="소분류를 입력하세요 (예: 반팔티)"
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.75rem',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '1rem',
                        }}
                      />
                    </div>
                  </div>
                ) : categoryHierarchy.length === 0 ? (
                  <div className="form-hint" style={{ color: '#dc3545', marginTop: '0.5rem' }}>
                    <p style={{ margin: '0 0 0.5rem' }}>카테고리가 없습니다. 직접 입력 모드를 사용하거나 서버에서 카테고리를 생성해주세요.</p>
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
                  상품 이미지 (최대 4개)
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
                  상세 설명
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
                        <input
                          type="number"
                          min="0"
                          placeholder="재고 (선택)"
                          value={color.stock ?? ''}
                          onChange={(e) => {
                            const newColors = [...formData.colors];
                            newColors[index] = { ...newColors[index], stock: e.target.value };
                            setFormData((prev) => ({ ...prev, colors: newColors }));
                          }}
                          style={{ width: '120px', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
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
                          colors: [...prev.colors, { name: '', value: '#000000', image: '', stock: '' }],
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
                        <input
                          type="number"
                          min="0"
                          placeholder="재고 (선택)"
                          value={size.stock ?? ''}
                          onChange={(e) => {
                            const newSizes = [...formData.sizes];
                            newSizes[index] = { ...newSizes[index], stock: e.target.value };
                            setFormData((prev) => ({ ...prev, sizes: newSizes }));
                          }}
                          style={{ width: '120px', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                        />
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
                          sizes: [...prev.sizes, { label: '', value: '', available: true, stock: '' }],
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
        </>
        )}
      </div>
    </div>
  );
}

export default ProductCreatePage;
