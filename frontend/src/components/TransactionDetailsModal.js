import React, { useState, useEffect } from 'react';
import './TransactionDetailsModal.css';

const TransactionDetailsModal = ({ region, onClose }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (region) {
      fetchTransactionDetails();
    }
  }, [region]);

  const fetchTransactionDetails = async () => {
    try {
      setLoading(true);
      // 실제 API 호출을 위한 URL 구성
      const regionName = encodeURIComponent(region.region_name);
      const response = await fetch(`/api/transactions/${regionName}`);
      
      if (!response.ok) {
        throw new Error('거래 데이터를 불러올 수 없습니다.');
      }
      
      const data = await response.json();
      setTransactions(data.transactions || []);
    } catch (err) {
      console.error('거래 데이터 조회 오류:', err);
      setError(err.message);
      // 개발 환경에서는 샘플 데이터 사용
      setTransactions(generateSampleData());
    } finally {
      setLoading(false);
    }
  };

  // 개발 환경용 샘플 데이터 생성
  const generateSampleData = () => {
    const sampleTransactions = [];
    const apartmentNames = [
      '푸르지오', '래미안', '자이', 'e편한세상', '롯데캐슬', 
      '힐스테이트', '더샵', '아이파크', '래미안', '푸르지오'
    ];
    
    for (let i = 0; i < 15; i++) {
      const randomDate = new Date();
      randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 365));
      
      sampleTransactions.push({
        id: i + 1,
        apartment_name: apartmentNames[Math.floor(Math.random() * apartmentNames.length)],
        transaction_date: randomDate.toISOString().split('T')[0],
        price: Math.floor(Math.random() * 500000000) + 200000000, // 2억~7억
                        area: Math.floor(Math.random() * 30) + 60, // 60~90㎡
        floor: Math.floor(Math.random() * 20) + 1, // 1~20층
        region_name: region.region_name
      });
    }
    
    return sampleTransactions.sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date));
  };

  const formatPrice = (price) => {
    if (price >= 100000000) {
      return (price / 100000000).toFixed(1) + '억원';
    } else if (price >= 10000) {
      return (price / 10000).toFixed(1) + '만원';
    }
    return price.toLocaleString() + '원';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString || '-';
    const y = String(date.getFullYear()).padStart(4, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}.${m}.${d}.`;
  };

  const formatArea = (area) => {
    if (!area) return '-';
    const value = Number(area);
    if (!isFinite(value) || value <= 0) return '-';
    const pyeong = value / 3.305785;
    return `${value.toFixed(1)}㎡ (${pyeong.toFixed(1)}평)`;
  };

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h3>{region.region_name} 상세 거래 정보</h3>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
          <div className="modal-body">
            <div className="loading">데이터를 불러오는 중...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h3>{region.region_name} 상세 거래 정보</h3>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
          <div className="modal-body">
            <div className="error">오류가 발생했습니다: {error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{region.region_name} 상세 거래 정보</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="transaction-summary">
            <p className="summary-text">
              <strong>{region.region_name}</strong> 지역의 
              총 <strong>{transactions.length}건</strong>의 거래 정보를 확인할 수 있습니다.
            </p>
          </div>
          
          {transactions.length > 0 ? (
            <div className="transactions-table">
              <table>
                <thead>
                  <tr>
                    <th>아파트명</th>
                    <th>거래일자</th>
                    <th>거래금액</th>
                    <th>전용면적(㎡)</th>
                    <th>층수</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="apartment-cell">{transaction.apartment_name}</td>
                      <td className="date-cell">{formatDate(transaction.transaction_date)}</td>
                      <td className="price-cell">{formatPrice(transaction.price)}</td>
                      <td className="area-cell">{formatArea(transaction.area)}</td>
                      <td className="floor-cell">{transaction.floor}층</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="no-data">
              <p>해당 지역의 거래 데이터가 없습니다.</p>
            </div>
          )}
        </div>
        
        <div className="modal-footer">
          <button className="modal-button" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetailsModal;
