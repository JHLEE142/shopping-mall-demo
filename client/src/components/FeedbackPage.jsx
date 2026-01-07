import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Search, MessageSquare } from 'lucide-react';
import { getFeedbacks, createFeedback } from '../services/feedbackService';
import './FeedbackPage.css';

function FeedbackPage({ user, onBack }) {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type: 'suggestion',
    title: '',
    content: '',
    category: '',
    priority: 'medium',
  });

  useEffect(() => {
    if (!user) return;

    async function loadFeedbacks() {
      try {
        setLoading(true);
        setError('');
        const data = await getFeedbacks({ page: 1, limit: 100 });
        setFeedbacks(data.items || []);
      } catch (err) {
        console.error('개선 의견 목록 로드 실패:', err);
        setError(err.message || '개선 의견 목록을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    }

    loadFeedbacks();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createFeedback(formData);
      alert('개선 의견이 등록되었습니다.');
      setShowForm(false);
      setFormData({
        type: 'suggestion',
        title: '',
        content: '',
        category: '',
        priority: 'medium',
      });
      // 목록 새로고침
      const data = await getFeedbacks({ page: 1, limit: 100 });
      setFeedbacks(data.items || []);
    } catch (err) {
      alert(err.message || '개선 의견 등록에 실패했습니다.');
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: '검토 대기',
      reviewing: '검토 중',
      accepted: '수락됨',
      rejected: '거절됨',
      implemented: '구현됨',
    };
    return labels[status] || status;
  };

  const getTypeLabel = (type) => {
    const labels = {
      suggestion: '건의사항',
      bug: '버그 신고',
      feature: '기능 제안',
      research: '리서치 참여',
      other: '기타',
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

  return (
    <div className="feedback-page">
      <div className="feedback-page__container">
        <button
          type="button"
          className="feedback-page__back-button"
          onClick={onBack}
        >
          <ArrowLeft size={18} />
          뒤로가기
        </button>

        <div className="feedback-page__header">
          <h1 className="feedback-page__title">개선 의견/리서치 참여</h1>
          <button
            type="button"
            className="feedback-page__add-button"
            onClick={() => setShowForm(!showForm)}
          >
            <Plus size={18} />
            의견 등록
          </button>
        </div>

        {showForm && (
          <form className="feedback-page__form" onSubmit={handleSubmit}>
            <div className="feedback-page__form-group">
              <label>유형</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                required
              >
                <option value="suggestion">건의사항</option>
                <option value="bug">버그 신고</option>
                <option value="feature">기능 제안</option>
                <option value="research">리서치 참여</option>
                <option value="other">기타</option>
              </select>
            </div>
            <div className="feedback-page__form-group">
              <label>제목</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="feedback-page__form-group">
              <label>내용</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={6}
                required
              />
            </div>
            <div className="feedback-page__form-actions">
              <button type="button" onClick={() => setShowForm(false)}>
                취소
              </button>
              <button type="submit">등록</button>
            </div>
          </form>
        )}

        {loading && <div className="feedback-page__loading">로딩 중...</div>}
        {error && <div className="feedback-page__error">{error}</div>}

        {!loading && !error && feedbacks.length === 0 && (
          <div className="feedback-page__empty">
            <MessageSquare size={48} />
            <p>등록된 개선 의견이 없습니다.</p>
          </div>
        )}

        <div className="feedback-page__list">
          {feedbacks.map((feedback) => (
            <div key={feedback._id} className="feedback-page__card">
              <div className="feedback-page__card-header">
                <div>
                  <span className="feedback-page__type-badge">{getTypeLabel(feedback.type)}</span>
                  <span className={`feedback-page__status-badge feedback-page__status-badge--${feedback.status}`}>
                    {getStatusLabel(feedback.status)}
                  </span>
                </div>
                <div className="feedback-page__card-date">{formatDate(feedback.createdAt)}</div>
              </div>
              <h3 className="feedback-page__card-title">{feedback.title}</h3>
              <p className="feedback-page__card-content">{feedback.content}</p>
              {feedback.response?.content && (
                <div className="feedback-page__response">
                  <strong>관리자 답변:</strong> {feedback.response.content}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default FeedbackPage;

