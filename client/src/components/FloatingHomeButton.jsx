import React from 'react';
import HomeButtonImage from '../assets/고귀몰_로고_이미지.png';
import './FloatingHomeButton.css';

const FloatingHomeButton = ({ onClick }) => {
  return (
    <button 
      className="floating-home-button" 
      onClick={onClick} 
      type="button"
      aria-label="Go to Home"
    >
      <img src={HomeButtonImage} alt="고귀몰 홈" />
    </button>
  );
};

export default FloatingHomeButton;


