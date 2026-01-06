import { useState, useRef, useEffect, useMemo } from 'react';
import { MessageCircle, X, Send, Minimize2, Maximize2, ShoppingCart } from 'lucide-react';
import { sendChatMessage } from '../services/chatService';
import './ChatWidget.css';

function ChatWidget({ user = null, onMoveToLogin = null, onMoveToSignUp = null, currentView = 'home', onViewProduct = null, onAddToCart = null }) {
  const isLoggedIn = !!user;
  const isHomePage = currentView === 'home';
  const isLoginPage = currentView === 'login';
  
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [addingToCart, setAddingToCart] = useState(null);
  
  // 로그인 상태에 따라 초기 메시지 설정
  const initialMessage = useMemo(() => {
    if (isLoggedIn) {
      return {
        id: 1,
        text: `안녕하세요! AI 쇼핑 비서입니다. 어떤 상품을 찾고 계신가요?`,
        sender: 'bot',
        timestamp: new Date(),
      };
    } else if (isHomePage && !isLoggedIn) {
      // 로그인 전 메인페이지: 로그인 유도 메시지
      return {
        id: 1,
        text: `채팅 기능은 로그인 후 이용 가능합니다.\n\n로그인하시면 AI 쇼핑 비서를 통해 상품 추천, 검색, 주문 도움 등을 받으실 수 있습니다.\n\n지금 로그인하시겠어요?`,
        sender: 'bot',
        timestamp: new Date(),
        action: 'login_prompt',
      };
    } else {
      // 로그인/회원가입 페이지 등: 로그인 도우미
      return {
        id: 1,
        text: `안녕하세요! 로그인/회원가입 도우미입니다. 로그인이나 회원가입에 대해 궁금한 점이 있으시면 언제든지 물어보세요!`,
        sender: 'bot',
        timestamp: new Date(),
      };
    }
  }, [isLoggedIn, isHomePage]);
  
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
  }, [isLoggedIn, initialMessage, isHomePage]);

  // API 키는 서버에서 관리하므로 클라이언트에서 제거됨

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    // 로그인 전 메인페이지에서는 채팅 차단 및 로그인 유도
    if (isHomePage && !isLoggedIn) {
      if (onMoveToLogin) {
        onMoveToLogin();
        setIsOpen(false);
      }
      return;
    }

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
    
    // 검색 의도가 있는지 확인하여 로딩 메시지 표시
    const hasSearchIntent = /(검색|찾아|추천|보여줘|보여|알려줘|알려|search|find|recommend|show|tell)/i.test(currentInput);
    if (hasSearchIntent) {
      // 검색 중 메시지 표시
      setMessages((prev) => {
        const searchingMessage = {
          id: prev.length + 1,
          text: '🔍 검색 중...',
          sender: 'bot',
          timestamp: new Date(),
          isSearching: true,
        };
        return [...prev, searchingMessage];
      });
    }

    // 사용자 메시지에서 정보 추출
    if (currentInput) {
      try {
        // 로그인 페이지일 때: 이메일, 비밀번호 추출
        if (currentView === 'login') {
          const loginInfo = {};
          
          // 이메일 패턴
          const emailMatch = currentInput.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/i);
          if (emailMatch && emailMatch[1]) {
            loginInfo.email = emailMatch[1].trim();
          }
          
          // 비밀번호 패턴
          // 이메일이 포함되어 있지 않고, 특수문자나 숫자가 포함된 경우 비밀번호로 간주
          // 또는 명시적으로 "비밀번호"라는 단어가 포함된 경우
          if (!emailMatch && currentInput.trim().length > 0) {
            const passwordPattern = /(?:비밀번호|password)[은는]?\s*[:：]?\s*(.+)/i;
            const passwordMatch = currentInput.match(passwordPattern);
            if (passwordMatch && passwordMatch[1]) {
              loginInfo.password = passwordMatch[1].trim();
            } else if (currentInput.trim().length >= 4) {
              // 이메일이 아니고 길이가 4자 이상이면 비밀번호로 간주
              loginInfo.password = currentInput.trim();
            }
          }
          
          // 추출한 정보가 있으면 localStorage에 저장
          if (Object.keys(loginInfo).length > 0) {
            const existingInfo = JSON.parse(localStorage.getItem('loginFormData') || '{}');
            const updatedInfo = { ...existingInfo, ...loginInfo };
            localStorage.setItem('loginFormData', JSON.stringify(updatedInfo));
            
            // 이메일과 비밀번호가 모두 있으면 자동 로그인 트리거
            if (updatedInfo.email && updatedInfo.password) {
              localStorage.setItem('autoLoginTrigger', 'true');
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('autoLoginTrigger'));
              }, 300);
            }
          }
        }
        
        // 회원가입 페이지일 때: 이름, 이메일, 주소 추출
        if (currentView === 'signup') {
          const extractedInfo = {};
          
          // 주소 패턴 (한국 주소 형식)
          const addressPatterns = [
            /([가-힣]+(?:시|도)\s+[가-힣]+(?:시|구|군)\s+[가-힣\s\d\-]+(?:동|로|길|번지)[가-힣\s\d\-]*(?:\s*,\s*\d+층)?)/,
            /(경기|서울|부산|인천|대구|광주|대전|울산|세종|강원|충북|충남|전북|전남|경북|경남|제주)[가-힣\s\d\-]+(?:시|구|동|로|길|번지)[가-힣\s\d\-]*(?:\s*,\s*\d+층)?/,
          ];
          for (const pattern of addressPatterns) {
            const match = currentInput.match(pattern);
            if (match && match[0] && match[0].trim().length > 5) {
              extractedInfo.address = match[0].trim();
              break;
            }
          }
          
          // 이메일 패턴
          const emailMatch = currentInput.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/i);
          if (emailMatch && emailMatch[1]) {
            extractedInfo.email = emailMatch[1].trim();
          }
          
          // 이름 패턴 (한글 이름만, 2-4자)
          const namePatterns = [
            /^([가-힣]{2,4})$/,
            /(?:이름|성함)[은는]?\s*[:：]?\s*([가-힣]{2,4})/i,
          ];
          for (const pattern of namePatterns) {
            const match = currentInput.match(pattern);
            if (match && match[1] && match[1].length >= 2 && match[1].length <= 4) {
              extractedInfo.name = match[1].trim();
              break;
            }
          }
          
          // 추출한 정보가 있으면 localStorage에 저장
          if (Object.keys(extractedInfo).length > 0) {
            const existingInfo = JSON.parse(localStorage.getItem('signupFormData') || '{}');
            const updatedInfo = { ...existingInfo, ...extractedInfo };
            localStorage.setItem('signupFormData', JSON.stringify(updatedInfo));
          }
        }
      } catch (error) {
        console.error('사용자 메시지에서 정보 추출 실패:', error);
      }
    }

    try {
      // OpenAI API 호출
      const response = await sendChatMessage([...messages, userMessage], isLoggedIn, currentView);
      const botResponse = typeof response === 'string' ? response : response.message || response.response || '';
      const productCards = response.productCards || null;
      
      setMessages((prev) => {
        // 검색 중 메시지 제거 (검색 결과가 도착했으므로)
        const filteredPrev = prev.filter(msg => !msg.isSearching);
        
        // TOOL_CALL 파싱 및 실행
        const toolCallPatterns = [
          /\*\*TOOL_CALL\*\*:\s*(\w+)\s*\(([^)]*)\)/i,
          /TOOL_CALL:\s*(\w+)\s*\(([^)]*)\)/i,
          /\[TOOL_CALL\]\s*(\w+)\s*\(([^)]*)\)/i,
        ];
        
        let toolCallMatch = null;
        for (const pattern of toolCallPatterns) {
          toolCallMatch = botResponse.match(pattern);
          if (toolCallMatch) break;
        }
        
        if (toolCallMatch) {
          const toolName = toolCallMatch[1].toLowerCase();
          const toolParams = toolCallMatch[2];
          
          if (toolName === '로그인' || toolName === 'login') {
            // 로그인 TOOL_CALL 파싱: 로그인 (email, password)
            // 파라미터 추출 (쉼표로 구분, 따옴표 제거)
            const params = toolParams
              .split(',')
              .map(p => p.trim().replace(/^["'`]|["'`]$/g, ''))
              .filter(p => p.length > 0);
            
            if (params.length >= 2) {
              const loginData = {
                email: params[0].trim(),
                password: params[1].trim(),
              };
              
              // 이메일 형식 검증
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (emailRegex.test(loginData.email) && loginData.password.length > 0) {
                localStorage.setItem('loginFormData', JSON.stringify(loginData));
                localStorage.setItem('autoLoginTrigger', 'true');
                
                // 로그인 페이지로 이동하거나 자동 로그인 실행
                if (currentView === 'login') {
                  // 이미 로그인 페이지에 있으므로 자동 로그인 트리거만 설정
                  setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('autoLoginTrigger'));
                  }, 100);
                } else if (onMoveToLogin) {
                  onMoveToLogin();
                  setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('autoLoginTrigger'));
                  }, 500);
                }
              }
            }
          }
        }
        
        const botMessage = {
          id: filteredPrev.length + 1,
          text: botResponse,
          sender: 'bot',
          timestamp: new Date(),
          productCards: productCards, // 상품 카드 데이터
        };
        const newMessages = [...filteredPrev, botMessage];
        
        // 사용자 메시지에서 장바구니 추가 의도 파악
        if (isLoggedIn && currentInput && productCards && productCards.length > 0) {
          const addToCartPatterns = [
            /(.+?)\s*(?:장바구니|장바구니에|담아|담아줘|담기|추가|추가해줘)/i,
            /(?:장바구니|장바구니에|담아|담아줘|담기|추가|추가해줘)\s*(.+?)/i,
          ];
          
          for (const pattern of addToCartPatterns) {
            const match = currentInput.match(pattern);
            if (match && match[1]) {
              const productName = match[1].trim();
              // 상품 카드에서 해당 상품 찾기
              const matchedProduct = productCards.find(p => 
                p.name && p.name.toLowerCase().includes(productName.toLowerCase())
              );
              if (matchedProduct) {
                // 장바구니에 추가
                setTimeout(() => {
                  handleAddToCart(matchedProduct.id || matchedProduct._id);
                }, 500);
                break;
              }
            }
          }
        }
        
        // AI 응답 및 사용자 메시지에서 회원가입 정보 추출 (이름, 이메일, 주소 등)
        if (currentView === 'signup' && (botResponse || currentInput)) {
          try {
            const extractedInfo = {};
            const textToParse = (botResponse || '') + ' ' + (currentInput || '');
            
            // 이름 추출 (한글 이름 패턴)
            const namePatterns = [
              /(?:이름|성함)[은는]?\s*[:：]?\s*([가-힣]{2,4})/i,
              /([가-힣]{2,4})(?:님|씨|입니다|이에요|예요|입니다)/,
              /(?:제\s*이름은|내\s*이름은|이름은)\s*([가-힣]{2,4})/i,
            ];
            for (const pattern of namePatterns) {
              const match = textToParse.match(pattern);
              if (match && match[1] && match[1].length >= 2 && match[1].length <= 4) {
                extractedInfo.name = match[1].trim();
                break;
              }
            }
            
            // 이메일 추출
            const emailMatch = textToParse.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/i);
            if (emailMatch && emailMatch[1]) {
              extractedInfo.email = emailMatch[1].trim();
            }
            
            // 주소 추출 (한국 주소 패턴)
            const addressPatterns = [
              /(?:주소|배송지)[은는]?\s*[:：]?\s*([가-힣\s\d\-]+(?:시|구|동|로|길|번지)[가-힣\s\d\-]*)/i,
              /(경기|서울|부산|인천|대구|광주|대전|울산|세종|강원|충북|충남|전북|전남|경북|경남|제주)[가-힣\s\d\-]+(?:시|구|동|로|길|번지)[가-힣\s\d\-]*/,
              /([가-힣]+(?:시|도)\s+[가-힣]+(?:시|구|군)\s+[가-힣\s\d\-]+(?:동|로|길|번지)[가-힣\s\d\-]*)/,
            ];
            for (const pattern of addressPatterns) {
              const match = textToParse.match(pattern);
              if (match && match[1] && match[1].trim().length > 5) {
                extractedInfo.address = match[1].trim();
                break;
              }
            }
            
            // 추출한 정보가 있으면 localStorage에 저장
            if (Object.keys(extractedInfo).length > 0) {
              const existingInfo = JSON.parse(localStorage.getItem('signupFormData') || '{}');
              const updatedInfo = { ...existingInfo, ...extractedInfo };
              localStorage.setItem('signupFormData', JSON.stringify(updatedInfo));
            }
          } catch (error) {
            console.error('회원가입 정보 추출 실패:', error);
          }
        }
        
        // AI 응답에서 로그인 정보 추출
        if (currentView === 'login' && botResponse) {
          try {
            const loginInfo = {};
            const textToParse = botResponse;
            
            // 이메일 추출
            const emailMatch = textToParse.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/i);
            if (emailMatch && emailMatch[1]) {
              loginInfo.email = emailMatch[1].trim();
            }
            
            // 추출한 정보가 있으면 localStorage에 저장
            if (Object.keys(loginInfo).length > 0) {
              const existingInfo = JSON.parse(localStorage.getItem('loginFormData') || '{}');
              const updatedInfo = { ...existingInfo, ...loginInfo };
              localStorage.setItem('loginFormData', JSON.stringify(updatedInfo));
            }
          } catch (error) {
            console.error('로그인 정보 추출 실패:', error);
          }
        }
        
        // 로그인/회원가입 관련 키워드가 있고 해당 함수가 있으면 제안 (중복 방지)
        if (!isLoggedIn) {
          // 최근 메시지 중에 이미 같은 action의 제안이 있는지 확인
          const hasRecentSuggestion = newMessages.some(msg => 
            msg.action === 'login' || msg.action === 'signup'
          );
          
          // AI 응답 자체에 이미 회원가입/로그인 제안이 포함되어 있는지 확인
          const botResponseHasSuggestion = botResponse.includes('회원가입') || 
                                           botResponse.includes('로그인') ||
                                           botResponse.includes('이동하시겠어요');
          
          if (!hasRecentSuggestion && !botResponseHasSuggestion) {
            if ((messageText.includes('로그인') || messageText.includes('로그') || messageText.includes('login')) && onMoveToLogin) {
              setTimeout(() => {
                setMessages((current) => {
                  // 다시 한 번 중복 체크
                  const hasDuplicate = current.some(msg => msg.action === 'login');
                  if (hasDuplicate) return current;
                  
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
                  // 다시 한 번 중복 체크
                  const hasDuplicate = current.some(msg => msg.action === 'signup');
                  if (hasDuplicate) return current;
                  
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

  // handleSaveApiKey 함수는 서버에서 API 키를 관리하므로 제거됨

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

  const handleAddToCart = async (productId) => {
    if (!isLoggedIn || !productId) return;
    
    setAddingToCart(productId);
    try {
      await addItemToCart(productId, 1);
      setMessages((prev) => {
        const successMessage = {
          id: prev.length + 1,
          text: '✅ 장바구니에 상품을 추가했습니다!',
          sender: 'bot',
          timestamp: new Date(),
        };
        return [...prev, successMessage];
      });
      if (onAddToCart) {
        onAddToCart();
      }
    } catch (error) {
      console.error('장바구니 추가 실패:', error);
      setMessages((prev) => {
        const errorMessage = {
          id: prev.length + 1,
          text: `❌ 장바구니 추가 실패: ${error.message || '알 수 없는 오류'}`,
          sender: 'bot',
          timestamp: new Date(),
          isError: true,
        };
        return [...prev, errorMessage];
      });
    } finally {
      setAddingToCart(null);
    }
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
              {/* API 키 설정 버튼 비활성화 (서버 .env 사용) */}
              {/* <button
                className="chat-widget__action-button"
                onClick={() => setShowApiKeySettings(!showApiKeySettings)}
                aria-label="API 키 설정"
                title="API 키 설정"
              >
                <Settings size={18} strokeWidth={2} />
              </button> */}
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
              {/* API 키 설정 UI는 서버에서 관리하므로 제거됨 */}

              <div className="chat-widget__messages">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`chat-widget__message chat-widget__message--${message.sender}`}
                  >
                    <div className={`chat-widget__message-content ${message.isError ? 'chat-widget__message-content--error' : ''} ${message.isSearching ? 'chat-widget__message-content--searching' : ''}`}>
                      <p className="chat-widget__message-text">
                        {message.isSearching ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ 
                              display: 'inline-block',
                              width: '12px',
                              height: '12px',
                              border: '2px solid #111827',
                              borderTopColor: 'transparent',
                              borderRadius: '50%',
                              animation: 'spin 0.8s linear infinite'
                            }}></span>
                            {message.text}
                          </span>
                        ) : (
                          message.text
                        )}
                      </p>
                      
                      {/* 상품 카드 표시 */}
                      {message.productCards && message.productCards.length > 0 && (
                        <div className="chat-widget__product-cards" style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem' }}>
                          {message.productCards.map((product, idx) => (
                            <div
                              key={product.id || idx}
                              className="chat-widget__product-card"
                              style={{
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                background: 'white',
                              }}
                              onClick={() => {
                                if (onViewProduct) {
                                  onViewProduct({ _id: product.id, id: product.id, ...product });
                                }
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = '#111827';
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = '#e5e7eb';
                                e.currentTarget.style.boxShadow = 'none';
                              }}
                            >
                              {product.image && (
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  style={{
                                    width: '100%',
                                    height: '100px',
                                    objectFit: 'cover',
                                  }}
                                  onError={(e) => {
                                    e.target.src = 'https://via.placeholder.com/140x100?text=No+Image';
                                  }}
                                />
                              )}
                              <div style={{ padding: '0.5rem' }}>
                                <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.75rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {product.name}
                                </h4>
                                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.7rem', color: '#111827', fontWeight: 600 }}>
                                  {new Intl.NumberFormat('ko-KR').format(product.price)}원
                                </p>
                                {isLoggedIn && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAddToCart(product.id || product._id);
                                    }}
                                    disabled={addingToCart === (product.id || product._id)}
                                    style={{
                                      width: '100%',
                                      padding: '0.25rem 0.5rem',
                                      fontSize: '0.7rem',
                                      background: addingToCart === (product.id || product._id) ? '#d1d5db' : '#111827',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: addingToCart === (product.id || product._id) ? 'not-allowed' : 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: '0.25rem',
                                    }}
                                  >
                                    {addingToCart === (product.id || product._id) ? (
                                      <>추가 중...</>
                                    ) : (
                                      <>
                                        <ShoppingCart size={12} />
                                        담기
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {message.action && (
                        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                          {(message.action === 'login' || message.action === 'login_prompt') && onMoveToLogin && (
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
                  placeholder={
                    isHomePage && !isLoggedIn 
                      ? "로그인 후 채팅 기능을 이용하세요..." 
                      : isLoggedIn 
                        ? "원하시는 상품이나 질문을 입력하세요..." 
                        : "로그인이나 회원가입에 대해 물어보세요..."
                  }
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  disabled={isHomePage && !isLoggedIn}
                  style={isHomePage && !isLoggedIn ? { cursor: 'not-allowed', opacity: 0.6 } : {}}
                  onClick={() => {
                    if (isHomePage && !isLoggedIn && onMoveToLogin) {
                      onMoveToLogin();
                      setIsOpen(false);
                    }
                  }}
                />
                <button
                  type="submit"
                  className="chat-widget__send-button"
                  disabled={!inputMessage.trim() || isLoading || (isHomePage && !isLoggedIn)}
                  aria-label="전송"
                  style={(isHomePage && !isLoggedIn) ? { cursor: 'not-allowed', opacity: 0.6 } : {}}
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

