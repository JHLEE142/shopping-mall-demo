import { useState, useEffect } from 'react';
import { ArrowLeft, Bell, Search } from 'lucide-react';
import { getNotices, getNoticeById } from '../services/noticeService';
import './NoticePage.css';

function NoticePage({ onBack }) {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotice, setSelectedNotice] = useState(null);

  useEffect(() => {
    async function loadNotices() {
      try {
        setLoading(true);
        setError('');
        const data = await getNotices({ page: 1, limit: 100, search: searchQuery || undefined });
        setNotices(data.items || []);
      } catch (err) {
        console.error('공지사항 목록 로드 실패:', err);
        setError(err.message || '공지사항 목록을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    }

    loadNotices();
  }, [searchQuery]);

  const handleNoticeClick = async (notice) => {
    try {
      const data = await getNoticeById(notice._id);
      setSelectedNotice(data);
    } catch (err) {
      alert('공지사항을 불러오지 못했습니다.');
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      general: '일반',
      event: '이벤트',
      maintenance: '점검',
      policy: '정책',
      important: '중요',
    };
    return labels[type] || type;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).replace(/\. /g, '.').replace(/\.$/, '');
  };

  if (selectedNotice) {
    return (
      <div className="notice-page">
        <div className="notice-page__container">
          <button
            type="button"
            className="notice-page__back-button"
            onClick={() => setSelectedNotice(null)}
          >
            <ArrowLeft size={18} />
            목록으로
          </button>
          <div className="notice-page__detail">
            <div className="notice-page__detail-header">
              <div>
                {selectedNotice.isImportant && (
                  <span className="notice-page__important-badge">중요</span>
                )}
                <span className="notice-page__type-badge">{getTypeLabel(selectedNotice.type)}</span>
              </div>
              <div className="notice-page__detail-date">{formatDate(selectedNotice.createdAt)}</div>
            </div>
            <h1 className="notice-page__detail-title">{selectedNotice.title}</h1>
            <div className="notice-page__detail-content">
              {selectedNotice.content.split('\n').map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="notice-page">
      <div className="notice-page__container">
        <button
          type="button"
          className="notice-page__back-button"
          onClick={onBack}
        >
          <ArrowLeft size={18} />
          뒤로가기
        </button>

        <h1 className="notice-page__title">공지사항</h1>

        <div className="notice-page__search">
          <input
            type="text"
            placeholder="공지사항을 검색할 수 있어요!"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="notice-page__search-input"
          />
          <Search size={20} className="notice-page__search-icon" />
        </div>

        {loading && <div className="notice-page__loading">로딩 중...</div>}
        {error && <div className="notice-page__error">{error}</div>}

        {!loading && !error && notices.length === 0 && (
          <div className="notice-page__empty">
            <Bell size={48} />
            <p>공지사항이 없습니다.</p>
          </div>
        )}

        <div className="notice-page__list">
          {notices.map((notice) => (
            <div
              key={notice._id}
              className="notice-page__card"
              onClick={() => handleNoticeClick(notice)}
            >
              <div className="notice-page__card-header">
                <div>
                  {notice.isPinned && (
                    <span className="notice-page__pinned-badge">고정</span>
                  )}
                  {notice.isImportant && (
                    <span className="notice-page__important-badge">중요</span>
                  )}
                  <span className="notice-page__type-badge">{getTypeLabel(notice.type)}</span>
                </div>
                <div className="notice-page__card-date">{formatDate(notice.createdAt)}</div>
              </div>
              <h3 className="notice-page__card-title">{notice.title}</h3>
              <div className="notice-page__card-preview">
                {notice.content.substring(0, 100)}
                {notice.content.length > 100 && '...'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default NoticePage;

