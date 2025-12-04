import { useEffect, useState, useCallback, useMemo } from 'react';
import { Upload, ArrowLeft, CheckCircle2, AlertCircle, ImagePlus } from 'lucide-react';
import { createProduct, updateProduct } from '../services/productService';

const CATEGORY_OPTIONS = ['상의', '하의', '악세사리', '아우터', '신발', '기타'];

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const UPLOAD_FOLDER = import.meta.env.VITE_CLOUDINARY_UPLOAD_FOLDER || 'products';

const EMPTY_FORM = {
  sku: '',
  name: '',
  price: '',
  category: CATEGORY_OPTIONS[0],
  image: '',
  description: '',
};

function ProductCreatePage({ onBack, product = null, onSubmitSuccess = () => {} }) {
  const initialForm = useMemo(
    () =>
      product
        ? {
            sku: product.sku || '',
            name: product.name || '',
            price: product.price?.toString() || '',
            category: product.category || CATEGORY_OPTIONS[0],
            image: product.image || '',
            description: product.description || '',
          }
        : { ...EMPTY_FORM },
    [product]
  );

  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isWidgetReady, setIsWidgetReady] = useState(false);
  const isEditMode = Boolean(product?._id);

  useEffect(() => {
    setForm(initialForm);
  }, [initialForm]);

  useEffect(() => {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      setError(
        'Cloudinary 환경 변수가 설정되지 않았어요. .env 파일에서 VITE_CLOUDINARY_CLOUD_NAME과 VITE_CLOUDINARY_UPLOAD_PRESET 값을 확인해주세요.'
      );
      return;
    }

    if (window.cloudinary) {
      setIsWidgetReady(true);
      return;
    }

    const scriptId = 'cloudinary-widget-script';
    if (document.getElementById(scriptId)) {
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://widget.cloudinary.com/v2.0/global/all.js';
    script.async = true;
    script.onload = () => setIsWidgetReady(true);
    script.onerror = () => setError('이미지 업로드 도구를 불러오지 못했습니다. 새로고침 후 다시 시도해주세요.');
    document.body.appendChild(script);
  }, []);

  const openUploadWidget = useCallback(() => {
    if (!isWidgetReady || !window.cloudinary) {
      setError('이미지 업로드 도구가 아직 준비되지 않았어요.');
      return;
    }

    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      setError(
        'Cloudinary 환경 변수가 설정되지 않아 업로드할 수 없어요. 관리자에게 설정을 요청해주세요.'
      );
      return;
    }

    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: CLOUD_NAME,
        uploadPreset: UPLOAD_PRESET,
        sources: ['local', 'url', 'camera'],
        multiple: false,
        maxImageFileSize: 5_000_000,
        cropping: false,
        resourceType: 'image',
        clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
        folder: UPLOAD_FOLDER,
      },
      (errorResult, result) => {
        if (errorResult) {
          setError(
            errorResult.message || '이미지 업로드 중 문제가 발생했어요. 다시 시도해주세요.'
          );
          return;
        }

        if (result?.event === 'success' && result.info?.secure_url) {
          setForm((prev) => ({ ...prev, image: result.info.secure_url }));
          setError('');
        }
      }
    );

    widget.open();
  }, [isWidgetReady]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name === 'price') {
      const cleanValue = value.replace(/[^0-9.]/g, '');
      setForm((prev) => ({ ...prev, [name]: cleanValue }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess(false);

    if (!form.sku.trim() || !form.name.trim() || !form.price || !form.category || !form.image.trim()) {
      setError('필수 입력값을 모두 채워주세요.');
      return;
    }

    setStatus('loading');

    try {
      const payload = {
        sku: form.sku.trim(),
        name: form.name.trim(),
        price: Number(form.price),
        category: form.category,
        image: form.image.trim(),
        description: form.description.trim(),
      };

      let result;

      if (isEditMode) {
        result = await updateProduct(product._id, payload);
      } else {
        result = await createProduct(payload);
      }

      setSuccess(true);
      setStatus('idle');
      setError('');

      if (isEditMode) {
        setForm({
          sku: result.sku,
          name: result.name,
          price: result.price?.toString() || '',
          category: result.category,
          image: result.image,
          description: result.description || '',
        });
      } else {
        setForm(EMPTY_FORM);
      }

      onSubmitSuccess(result);
    } catch (submitError) {
      setStatus('idle');
      setError(submitError.message || '상품 등록 중 문제가 발생했어요.');
    }
  };

  return (
    <div className="product-create">
      <div className="product-create__header">
        <button type="button" className="product-create__back" onClick={onBack}>
          <ArrowLeft className="product-create__back-icon" />
          관리자 대시보드로
        </button>
        <div>
          <h1>{isEditMode ? '상품 정보 수정' : '새 상품 등록'}</h1>
          <p>
            {isEditMode
              ? '상품 정보를 수정하고 저장하면 목록에서 즉시 업데이트됩니다.'
              : 'SKU, 가격, 카테고리 등 주요 정보를 입력하고 쇼핑몰에 상품을 추가하세요.'}
          </p>
        </div>
      </div>

      <div className="product-create__layout">
        <section className="product-create__card">
          <header>
            <h2>상품 기본 정보</h2>
            <p>판매에 필요한 핵심 정보를 입력하세요.</p>
          </header>

          <form className="product-create__form" onSubmit={handleSubmit}>
            <div className="product-create__grid">
              <label className="product-create__field">
                <span>SKU (고유코드) *</span>
                <input
                  type="text"
                  name="sku"
                  placeholder="예: TOP-001"
                  value={form.sku}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="product-create__field">
                <span>상품명 *</span>
                <input
                  type="text"
                  name="name"
                  placeholder="상품명을 입력하세요"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="product-create__field">
                <span>판매가 (₩) *</span>
                <input
                  type="text"
                  name="price"
                  inputMode="decimal"
                  placeholder="0"
                  value={form.price}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="product-create__field">
                <span>카테고리 *</span>
                <select name="category" value={form.category} onChange={handleChange} required>
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="product-create__field">
              <span>상품 이미지 *</span>
              <div className="product-create__upload">
                <button
                  type="button"
                  className="product-create__upload-button"
                  onClick={openUploadWidget}
                  disabled={!isWidgetReady || !CLOUD_NAME || !UPLOAD_PRESET}
                >
                  <ImagePlus className="product-create__upload-icon" />
                  {!CLOUD_NAME || !UPLOAD_PRESET
                    ? '환경 설정 필요'
                    : isWidgetReady
                      ? '이미지 업로드'
                      : '업로드 도구 준비 중...'}
                </button>
                {form.image && (
                  <input
                    type="url"
                    name="image"
                    value={form.image}
                    onChange={handleChange}
                    placeholder="https://..."
                    className="product-create__upload-input"
                    required
                  />
                )}
              </div>
              <small>Cloudinary 업로드 위젯을 통해 이미지를 추가하세요. 5MB 이하 JPG, PNG, WebP 지원.</small>
            </div>

            <label className="product-create__field">
              <span>상세 설명</span>
              <textarea
                name="description"
                placeholder="상품 특징, 소재, 배송 정보 등을 입력하세요"
                rows={5}
                value={form.description}
                onChange={handleChange}
              />
            </label>

            {error && (
              <div className="product-create__alert product-create__alert--error">
                <AlertCircle className="product-create__alert-icon" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="product-create__alert product-create__alert--success">
                <CheckCircle2 className="product-create__alert-icon" />
                <span>상품이 성공적으로 등록되었어요.</span>
              </div>
            )}

            <div className="product-create__actions">
              <button
                type="button"
                className="product-create__button product-create__button--ghost"
                onClick={onBack}
              >
                {isEditMode ? '돌아가기' : '취소'}
              </button>
              <button
                type="submit"
                className="product-create__button product-create__button--primary"
                disabled={status === 'loading'}
              >
                {status === 'loading'
                  ? isEditMode
                    ? '수정 중...'
                    : '등록 중...'
                  : isEditMode
                    ? '상품 수정하기'
                    : '상품 등록하기'}
              </button>
            </div>
          </form>
        </section>

        <aside className="product-create__sidebar">
          <article className="product-create__card product-create__card--summary">
            <h3>등록 가이드</h3>
            <ul>
              <li>SKU는 대문자/숫자 조합으로 고유하게 등록하세요.</li>
              <li>가격은 숫자만 입력하며, 통화 기호는 자동으로 처리됩니다.</li>
              <li>이미지 URL은 외부 스토리지 혹은 CDN 링크를 입력할 수 있습니다.</li>
              <li>상세 설명에는 소재, 관리 방법, 배송 안내 등 고객이 궁금해할 내용을 담으세요.</li>
            </ul>
          </article>

          <article className="product-create__card product-create__preview">
            <h3>이미지 미리보기</h3>
            <div className="product-create__preview-frame">
              {form.image ? (
                <img src={form.image} alt={form.name || form.sku || '상품 이미지 미리보기'} />
              ) : (
                <div className="product-create__preview-empty">
                  <Upload className="product-create__placeholder-icon" />
                  <p>이미지를 업로드하면 미리보기가 표시됩니다.</p>
                </div>
              )}
            </div>
            <p>{form.name || '상품명을 입력하면 여기 표시돼요.'}</p>
          </article>
        </aside>
      </div>
    </div>
  );
}

export default ProductCreatePage;


