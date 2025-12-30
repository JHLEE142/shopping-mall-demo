const axios = require('axios');

/**
 * OpenAI API를 통해 채팅 메시지 처리
 */
async function sendChatMessage(req, res) {
  try {
    const { messages, isLoggedIn } = req.body;
    const apiKey = req.headers['x-openai-api-key'] || req.body.apiKey;

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

    // 로그인 상태에 따라 시스템 프롬프트 설정
    const systemPrompt = isLoggedIn
      ? `당신은 한국 온라인 쇼핑몰 "Caurora"의 AI 쇼핑 비서입니다. 
사용자가 상품을 찾거나 쇼핑에 대한 질문을 할 때 친절하고 도움이 되는 답변을 제공하세요.
상품 추천, 가격 정보, 배송 정보, 할인 정보 등에 대해 도움을 줄 수 있습니다.
답변은 한국어로 작성하고, 친근하고 전문적인 톤을 유지하세요.`
      : `당신은 한국 온라인 쇼핑몰 "Caurora"의 로그인/회원가입 도우미입니다.
사용자가 로그인이나 회원가입에 대해 질문할 때 친절하고 도움이 되는 답변을 제공하세요.
로그인 방법, 회원가입 절차, 비밀번호 찾기, 이메일 인증 등에 대해 안내할 수 있습니다.
답변은 한국어로 작성하고, 친근하고 전문적인 톤을 유지하세요.`;

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

