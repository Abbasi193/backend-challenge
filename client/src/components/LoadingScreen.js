import React from 'react';
import './loading.css';

const LoadingScreen = ({ text }) => {
  return (
    <div className="loading-container">
      <p className="loading-text">{text}</p>
    </div>
  );
};

export default LoadingScreen;