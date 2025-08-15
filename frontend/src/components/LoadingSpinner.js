import React from 'react';

const LoadingSpinner = () => {
  return (
    <div className="loading-spinner">
      <div className="spinner-large"></div>
      <div className="loading-text">데이터가 로딩중입니다</div>
    </div>
  );
};

export default LoadingSpinner; 