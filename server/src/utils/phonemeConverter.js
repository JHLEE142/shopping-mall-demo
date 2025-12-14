/**
 * 한국어 텍스트를 phoneme(음소) 문자열로 변환
 * g2pk 패키지가 없을 경우 간단한 변환 로직 사용
 * @param {string} text - 변환할 텍스트
 * @returns {string} - phoneme 문자열
 */
function convertToPhoneme(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  try {
    // g2pk 패키지가 있으면 사용, 없으면 간단한 변환
    let g2pk;
    try {
      g2pk = require('g2pk');
      const phoneme = g2pk.convert(text);
      return phoneme.toLowerCase().replace(/\s+/g, ' ').trim();
    } catch (moduleError) {
      // g2pk가 없으면 간단한 한글-로마자 변환 사용
      return simpleKoreanToRoman(text);
    }
  } catch (error) {
    console.error('Phoneme conversion error:', error);
    // 변환 실패 시 원본 텍스트 반환
    return text.toLowerCase().trim();
  }
}

/**
 * 간단한 한글-로마자 변환 (g2pk 대체)
 * 기본적인 한글 자모를 로마자로 변환
 */
function simpleKoreanToRoman(text) {
  // 한글 유니코드 범위: AC00-D7AF
  // 간단한 변환 테이블 (주요 자모)
  const koreanToRoman = {
    '가': 'ga', '나': 'na', '다': 'da', '라': 'ra', '마': 'ma', '바': 'ba', '사': 'sa', '아': 'a',
    '자': 'ja', '차': 'cha', '카': 'ka', '타': 'ta', '파': 'pa', '하': 'ha',
    '크': 'keu', '롬': 'rom', '롬': 'rom',
    // 더 많은 매핑 추가 가능
  };
  
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (koreanToRoman[char]) {
      result += koreanToRoman[char];
    } else if (/[가-힣]/.test(char)) {
      // 한글이지만 매핑이 없으면 간단히 처리
      result += char;
    } else {
      result += char;
    }
  }
  
  return result.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * 영어 텍스트를 phoneme 형태로 변환 (간단한 변환)
 * @param {string} text - 변환할 영어 텍스트
 * @returns {string} - phoneme 형태의 문자열
 */
function convertEnglishToPhoneme(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // 영어를 소문자로 변환하고 공백 정리
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * 텍스트가 한국어인지 확인
 * @param {string} text - 확인할 텍스트
 * @returns {boolean} - 한국어 여부
 */
function isKorean(text) {
  if (!text || typeof text !== 'string') {
    return false;
  }
  // 한글 유니코드 범위: AC00-D7AF
  return /[가-힣]/.test(text);
}

/**
 * 문자열 유사도 계산 (Levenshtein distance 기반)
 * @param {string} str1 - 첫 번째 문자열
 * @param {string} str2 - 두 번째 문자열
 * @returns {number} - 유사도 점수 (0-1, 1이 가장 유사)
 */
function calculateStringSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;
  
  // 부분 문자열 포함 여부 확인
  if (s1.includes(s2) || s2.includes(s1)) {
    return 0.8;
  }
  
  // Levenshtein distance 계산
  const maxLen = Math.max(s1.length, s2.length);
  const distance = levenshteinDistance(s1, s2);
  return 1 - distance / maxLen;
}

/**
 * Levenshtein distance 계산
 */
function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

module.exports = {
  convertToPhoneme,
  convertEnglishToPhoneme,
  isKorean,
  calculateStringSimilarity,
};

