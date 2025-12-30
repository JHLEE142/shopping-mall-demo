import { useState, useRef, useEffect, useMemo } from 'react';
import { MessageCircle, X, Send, Minimize2, Maximize2, Settings } from 'lucide-react';
import { sendChatMessage, getOpenAIApiKey, setOpenAIApiKey } from '../services/chatService';
import './ChatWidget.css';

function ChatWidget({ user = null, onMoveToLogin = null, onMoveToSignUp = null }) {
  const isLoggedIn = !!user;
  
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showApiKeySettings, setShowApiKeySettings] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [apiKeyError, setApiKeyError] = useState('');
  
  // 로그인 상태에 따라 초기 메시지 설정
  const initialMessage = useMemo(() => {
    const hasApiKey = !!getOpenAIApiKey();
    const apiKeyNotice = !hasApiKey ? '\n\n💡 OpenAI API 키를 설정해야 AI 쇼핑 비서를 사용할 수 있습니다. 설정 버튼(⚙️)을 클릭하여 API 키를 입력해주세요.' : '';
    
    if (isLoggedIn) {
      return {
        id: 1,
        text: `안녕하세요! AI 쇼핑 비서입니다. 어떤 상품을 찾고 계신가요?${apiKeyNotice}`,
        sender: 'bot',
        timestamp: new Date(),
      };
    } else {
      return {
        id: 1,
        text: `안녕하세요! 로그인/회원가입 도우미입니다. 로그인이나 회원가입에 대해 궁금한 점이 있으시면 언제든지 물어보세요!${apiKeyNotice}`,
        sender: 'bot',
        timestamp: new Date(),
      };
    }
  }, [isLoggedIn]);
  
  const [messages, setMessages] = useState([initialMessage]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [messages, isOpen, isMinimized]);

  // 로그인 상태가 변경되면 초기 메시지 업데이트 (대화가 시작되지 않은 경우만)
  useEffect(() => {
    if (messages.length === 1) {
      // 초기 메시지만 있는 경우에만 업데이트
      setMessages([initialMessage]);
    }
  }, [isLoggedIn, initialMessage]);

  // 컴포넌트 마운트 시 저장된 API 키 확인
  useEffect(() => {
    const storedApiKey = getOpenAIApiKey();
    if (storedApiKey) {
      setApiKeyInput(storedApiKey);
    }
  }, []);

  // API 키가 변경되면 초기 메시지 업데이트
  useEffect(() => {
    if (messages.length === 1) {
      const hasApiKey = !!getOpenAIApiKey();
      const apiKeyNotice = !hasApiKey ? '\n\n💡 OpenAI API 키를 설정해야 AI 쇼핑 비서를 사용할 수 있습니다. 설정 버튼(⚙️)을 클릭하여 API 키를 입력해주세요.' : '';
      
      if (isLoggedIn) {
        setMessages([{
          id: 1,
          text: `안녕하세요! AI 쇼핑 비서입니다. 어떤 상품을 찾고 계신가요?${apiKeyNotice}`,
          sender: 'bot',
          timestamp: new Date(),
        }]);
      } else {
        setMessages([{
          id: 1,
          text: `안녕하세요! 로그인/회원가입 도우미입니다. 로그인이나 회원가입에 대해 궁금한 점이 있으시면 언제든지 물어보세요!${apiKeyNotice}`,
          sender: 'bot',
          timestamp: new Date(),
        }]);
      }
    }
  }, [apiKeyInput, isLoggedIn]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: messages.length + 1,
      text: inputMessage.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageText = inputMessage.trim().toLowerCase();
    const currentInput = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    try {
      // OpenAI API 호출
      const botResponse = await sendChatMessage([...messages, userMessage], isLoggedIn);
      
      setMessages((prev) => {
        const botMessage = {
          id: prev.length + 1,
          text: botResponse,
          sender: 'bot',
          timestamp: new Date(),
        };
        const newMessages = [...prev, botMessage];
        
        // 로그인/회원가입 관련 키워드가 있고 해당 함수가 있으면 제안
        if (!isLoggedIn) {
          if ((messageText.includes('로그인') || messageText.includes('로그') || messageText.includes('login')) && onMoveToLogin) {
            setTimeout(() => {
              setMessages((current) => {
                const suggestionMessage = {
                  id: current.length + 1,
                  text: '로그인 페이지로 이동하시겠어요?',
                  sender: 'bot',
                  timestamp: new Date(),
                  action: 'login',
                };
                return [...current, suggestionMessage];
              });
            }, 500);
          } else if ((messageText.includes('회원가입') || messageText.includes('가입') || messageText.includes('signup') || messageText.includes('회원')) && onMoveToSignUp) {
            setTimeout(() => {
              setMessages((current) => {
                const suggestionMessage = {
                  id: current.length + 1,
                  text: '회원가입 페이지로 이동하시겠어요?',
                  sender: 'bot',
                  timestamp: new Date(),
                  action: 'signup',
                };
                return [...current, suggestionMessage];
              });
            }, 500);
          }
        }
        
        return newMessages;
      });
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = error.message || '메시지 전송 중 오류가 발생했습니다.';
      
      // API 키 관련 오류인 경우 설정 UI 표시 제안
      if (errorMessage.includes('API 키') || errorMessage.includes('api key')) {
        setShowApiKeySettings(true);
      }
      
      setMessages((prev) => {
        const errorBotMessage = {
          id: prev.length + 1,
          text: errorMessage,
          sender: 'bot',
          timestamp: new Date(),
          isError: true,
        };
        return [...prev, errorBotMessage];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveApiKey = () => {
    if (!apiKeyInput.trim()) {
      setApiKeyError('API 키를 입력해주세요.');
      return;
    }

    setOpenAIApiKey(apiKeyInput.trim());
    setApiKeyError('');
    setShowApiKeySettings(false);
    
    // 성공 메시지 표시
    setMessages((prev) => {
      const successMessage = {
        id: prev.length + 1,
        text: '✅ API 키가 저장되었습니다. 이제 AI 쇼핑 비서를 사용하실 수 있습니다!',
        sender: 'bot',
        timestamp: new Date(),
      };
      return [...prev, successMessage];
    });
  };

  const handleToggle = () => {
    if (isOpen && isMinimized) {
      setIsMinimized(false);
    } else if (isOpen) {
      setIsMinimized(true);
    } else {
      setIsOpen(true);
      setIsMinimized(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      {/* 채팅 버튼 */}
      <button
        className={`chat-widget__button ${isOpen ? 'is-open' : ''}`}
        onClick={handleToggle}
        aria-label={isLoggedIn ? "AI 쇼핑 비서 열기" : "로그인/회원가입 도우미 열기"}
      >
        <MessageCircle size={24} />
        {!isOpen && <span className="chat-widget__button-badge">1</span>}
      </button>

      {/* 채팅 창 */}
      {isOpen && (
        <div className={`chat-widget__container ${isMinimized ? 'is-minimized' : ''}`}>
          <div className="chat-widget__header">
            <div className="chat-widget__header-info">
              <h3 className="chat-widget__title">
                {isLoggedIn ? 'AI 쇼핑 비서' : '로그인/회원가입 도우미'}
              </h3>
              <span className="chat-widget__status">대기 중</span>
            </div>
            <div className="chat-widget__header-actions">
              <button
                className="chat-widget__action-button"
                onClick={() => setShowApiKeySettings(!showApiKeySettings)}
                aria-label="API 키 설정"
                title="API 키 설정"
              >
                <Settings size={18} strokeWidth={2} />
              </button>
              <button
                className="chat-widget__action-button"
                onClick={() => setIsMinimized(!isMinimized)}
                aria-label={isMinimized ? '최대화' : '최소화'}
                title={isMinimized ? '최대화' : '최소화'}
              >
                {isMinimized ? (
                  <Maximize2 size={18} strokeWidth={2} />
                ) : (
                  <Minimize2 size={18} strokeWidth={2} />
                )}
              </button>
              <button
                className="chat-widget__action-button"
                onClick={handleClose}
                aria-label="닫기"
                title="닫기"
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* API 키 설정 UI */}
              {showApiKeySettings && (
                <div className="chat-widget__api-key-settings">
                  <div className="chat-widget__api-key-header">
                    <h4>OpenAI API 키 설정</h4>
                    <button
                      className="chat-widget__action-button"
                      onClick={() => {
                        setShowApiKeySettings(false);
                        setApiKeyError('');
                      }}
                      aria-label="닫기"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="chat-widget__api-key-content">
                    <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.75rem' }}>
                      OpenAI API 키를 입력하세요. API 키는 로컬에 저장되며, OpenAI에서 발급받을 수 있습니다.
                    </p>
                    <input
                      type="password"
                      className="chat-widget__api-key-input"
                      placeholder="sk-..."
                      value={apiKeyInput}
                      onChange={(e) => {
                        setApiKeyInput(e.target.value);
                        setApiKeyError('');
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveApiKey();
                        }
                      }}
                    />
                    {apiKeyError && (
                      <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.5rem' }}>
                        {apiKeyError}
                      </p>
                    )}
                    <button
                      className="chat-widget__api-key-save-button"
                      onClick={handleSaveApiKey}
                    >
                      저장
                    </button>
                  </div>
                </div>
              )}

              <div className="chat-widget__messages">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`chat-widget__message chat-widget__message--${message.sender}`}
                  >
                    <div className={`chat-widget__message-content ${message.isError ? 'chat-widget__message-content--error' : ''}`}>
                      <p className="chat-widget__message-text">{message.text}</p>
                      {message.action && (
                        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                          {message.action === 'login' && onMoveToLogin && (
                            <button
                              type="button"
                              onClick={() => {
                                onMoveToLogin();
                                setIsOpen(false);
                              }}
                              style={{
                                padding: '0.5rem 1rem',
                                background: '#111827',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                fontWeight: 500,
                              }}
                            >
                              로그인하기
                            </button>
                          )}
                          {message.action === 'signup' && onMoveToSignUp && (
                            <button
                              type="button"
                              onClick={() => {
                                onMoveToSignUp();
                                setIsOpen(false);
                              }}
                              style={{
                                padding: '0.5rem 1rem',
                                background: '#111827',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                fontWeight: 500,
                              }}
                            >
                              회원가입하기
                            </button>
                          )}
                        </div>
                      )}
                      <span className="chat-widget__message-time">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form className="chat-widget__input-form" onSubmit={handleSendMessage}>
                <input
                  ref={inputRef}
                  type="text"
                  className="chat-widget__input"
                  placeholder={isLoggedIn ? "원하시는 상품이나 질문을 입력하세요..." : "로그인이나 회원가입에 대해 물어보세요..."}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                />
                <button
                  type="submit"
                  className="chat-widget__send-button"
                  disabled={!inputMessage.trim() || isLoading}
                  aria-label="전송"
                >
                  {isLoading ? (
                    <span style={{ fontSize: '0.75rem' }}>전송 중...</span>
                  ) : (
                    <Send size={20} />
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}

export default ChatWidget;

