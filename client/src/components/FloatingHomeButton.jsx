import React from 'react';
import HomeButtonImage from '../assets/HomeButton.png';
import './FloatingHomeButton.css';

const FloatingHomeButton = ({ onClick }) => {
  return (
    <button 
      className="floating-home-button" 
      onClick={onClick} 
      type="button"
      aria-label="Go to Home"
    >
      <img src={HomeButtonImage} alt="Home" />
    </button>
  );
};

export default FloatingHomeButton;


