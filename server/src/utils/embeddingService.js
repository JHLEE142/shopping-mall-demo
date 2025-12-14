// Embedding 모델 캐싱
let embeddingModel = null;
let modelLoading = false;
let transformersAvailable = false;

// @xenova/transformers 모듈 로드 시도
try {
  require('@xenova/transformers');
  transformersAvailable = true;
} catch (error) {
  console.warn('@xenova/transformers 모듈을 찾을 수 없습니다. Embedding 기능이 비활성화됩니다.');
  console.warn('설치하려면: npm install @xenova/transformers');
  transformersAvailable = false;
}

const { pipeline } = transformersAvailable ? require('@xenova/transformers') : null;

/**
 * Embedding 모델 로드 (한국어 지원 모델)
 */
async function loadEmbeddingModel() {
  if (!transformersAvailable) {
    throw new Error('@xenova/transformers 모듈이 설치되지 않았습니다. npm install @xenova/transformers를 실행하세요.');
  }

  if (embeddingModel) {
    return embeddingModel;
  }

  if (modelLoading) {
    // 모델이 로딩 중이면 대기
    while (modelLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return embeddingModel;
  }

  try {
    modelLoading = true;
    console.log('Loading embedding model...');
    
    // 한국어를 지원하는 multilingual 모델 사용
    // 'Xenova/paraphrase-multilingual-MiniLM-L12-v2' 또는 'Xenova/multilingual-e5-base'
    embeddingModel = await pipeline(
      'feature-extraction',
      'Xenova/paraphrase-multilingual-MiniLM-L12-v2',
      {
        quantized: true, // 메모리 사용량 감소
      }
    );
    
    console.log('Embedding model loaded successfully');
    modelLoading = false;
    return embeddingModel;
  } catch (error) {
    console.error('Error loading embedding model:', error);
    modelLoading = false;
    throw error;
  }
}

/**
 * 텍스트를 embedding 벡터로 변환
 * @param {string} text - 변환할 텍스트
 * @returns {Promise<number[]>} - embedding 벡터
 */
async function getEmbedding(text) {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    throw new Error('Invalid text input');
  }

  if (!transformersAvailable) {
    throw new Error('@xenova/transformers 모듈이 설치되지 않았습니다. Embedding 기능을 사용할 수 없습니다.');
  }

  try {
    const model = await loadEmbeddingModel();
    const result = await model(text, {
      pooling: 'mean',
      normalize: true,
    });
    
    // 텐서를 배열로 변환
    const embedding = Array.from(result.data);
    return embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * 두 embedding 벡터의 cosine similarity 계산
 * @param {number[]} vec1 - 첫 번째 벡터
 * @param {number[]} vec2 - 두 번째 벡터
 * @returns {number} - cosine similarity (-1 ~ 1)
 */
function cosineSimilarity(vec1, vec2) {
  if (!vec1 || !vec2 || vec1.length !== vec2.length) {
    return 0;
  }

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    norm1 += vec1[i] * vec1[i];
    norm2 += vec2[i] * vec2[i];
  }

  const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

/**
 * 여러 텍스트에 대한 embedding을 일괄 생성
 * @param {string[]} texts - 변환할 텍스트 배열
 * @returns {Promise<number[][]>} - embedding 벡터 배열
 */
async function getEmbeddings(texts) {
  if (!Array.isArray(texts) || texts.length === 0) {
    return [];
  }

  const embeddings = [];
  for (const text of texts) {
    try {
      const embedding = await getEmbedding(text);
      embeddings.push(embedding);
    } catch (error) {
      console.error(`Error generating embedding for text: ${text}`, error);
      embeddings.push(null);
    }
  }

  return embeddings;
}

module.exports = {
  getEmbedding,
  getEmbeddings,
  cosineSimilarity,
  loadEmbeddingModel,
};

