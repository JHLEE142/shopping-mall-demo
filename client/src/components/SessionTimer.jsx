import { useEffect, useState } from 'react';
import { getRemainingTime, updateActivityTime } from '../utils/sessionStorage';

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function SessionTimer({ onExpired }) {
  const [remainingTime, setRemainingTime] = useState(getRemainingTime());
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    // 초기 시간 설정
    setRemainingTime(getRemainingTime());

    // 1초마다 업데이트
    const interval = setInterval(() => {
      const time = getRemainingTime();
      setRemainingTime(time);

      if (time <= 0 && !isExpired) {
        setIsExpired(true);
        if (onExpired) {
          onExpired();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [onExpired, isExpired]);

  if (remainingTime <= 0) {
    return null;
  }

  return (
    <span className="session-timer" title="세션 남은 시간">
      {formatTime(remainingTime)}
    </span>
  );
}

export default SessionTimer;

