const axios = require('axios');
const { getSystemPrompt } = require('../prompts/assistantPrompt');

/**
 * OpenAI API를 통해 채팅 메시지 처리
 */
async function sendChatMessage(req, res) {
  try {
    const { messages, isLoggedIn, currentView } = req.body;
    // 환경 변수에서 기본 API 키 가져오기, 없으면 요청에서 가져오기
    const apiKey = req.headers['x-openai-api-key'] || req.body.apiKey || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(400).json({
        message: 'OpenAI API 키가 필요합니다. API 키를 설정해주세요.',
      });
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        message: '메시지가 필요합니다.',
      });
    }

    // 상황별 시스템 프롬프트 생성
    const systemPrompt = getSystemPrompt(isLoggedIn, currentView);

    // OpenAI API 호출
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 1000,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const aiMessage = response.data.choices[0]?.message?.content;

    if (!aiMessage) {
      return res.status(500).json({
        message: 'AI 응답을 받을 수 없습니다.',
      });
    }

    res.json({
      message: aiMessage,
      response: aiMessage, // 호환성을 위해 두 필드 모두 제공
    });
  } catch (error) {
    console.error('OpenAI API error:', error.response?.data || error.message);

    // OpenAI API 에러 처리
    if (error.response?.status === 401) {
      return res.status(401).json({
        message: 'OpenAI API 키가 유효하지 않습니다. API 키를 확인해주세요.',
      });
    } else if (error.response?.status === 429) {
      return res.status(429).json({
        message: 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
      });
    } else if (error.response?.status === 500) {
      return res.status(500).json({
        message: 'OpenAI 서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      });
    }

    res.status(500).json({
      message: error.response?.data?.error?.message || '채팅 메시지 처리 중 오류가 발생했습니다.',
    });
  }
}

module.exports = {
  sendChatMessage,
};

