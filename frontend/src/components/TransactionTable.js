import React, { useState } from 'react';
import TransactionDetailsModal from './TransactionDetailsModal';

const TransactionTable = ({ transactions }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const formatPrice = (price) => {
    if (!price) return '0원';
    const billion = Math.floor(price / 100000000);
    const million = Math.floor((price % 100000000) / 10000);
    return `${billion}억 ${million}만원`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString || '-';
    const y = String(date.getFullYear()).padStart(4, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}.${m}.${d}.`;
  };

  const getSourceLabel = (source) => {
    const sourceMap = {
      'naver': '네이버부동산',
      'daum': '다음부동산',
      'hogang': '호갱노노',
      'reb_api': '부동산통계정보 API'
    };
    return sourceMap[source] || source;
  };

  const handleShowDetails = (transaction) => {
    setSelectedTransaction(transaction);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedTransaction(null);
  };

  // 페이지네이션
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = transactions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(transactions.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        거래 내역이 없습니다.
      </div>
    );
  }

  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>날짜</th>
              <th>지역</th>
              <th>아파트명</th>
              <th>거래량</th>
              <th>평균가격</th>
              <th>출처</th>
              <th>상세정보</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((transaction, index) => (
              <tr key={index}>
                <td>{formatDate(transaction.date)}</td>
                <td>{transaction.region_name}</td>
                <td>{transaction.complex_name}</td>
                <td>{transaction.transaction_count}건</td>
                <td>{formatPrice(transaction.avg_price)}</td>
                <td>
                  <span className={`badge ${
                    transaction.source === 'naver' ? 'badge-naver' :
                    transaction.source === 'daum' ? 'badge-daum' :
                    transaction.source === 'reb_api' ? 'badge-reb' :
                    'badge-naver'
                  }`}>
                    {getSourceLabel(transaction.source)}
                  </span>
                </td>
                <td>
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => handleShowDetails(transaction)}
                    style={{
                      fontSize: '0.8rem',
                      padding: '0.25rem 0.5rem',
                      border: '1px solid #007bff',
                      borderRadius: '0.25rem',
                      backgroundColor: 'transparent',
                      color: '#007bff',
                      cursor: 'pointer'
                    }}
                  >
                    상세정보
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="pagination">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p className="pagination-info">
                <span style={{ fontWeight: '500' }}>{(currentPage - 1) * itemsPerPage + 1}</span>
                {' '}~{' '}
                <span style={{ fontWeight: '500' }}>
                  {Math.min(currentPage * itemsPerPage, transactions.length)}
                </span>
                {' '}of{' '}
                <span style={{ fontWeight: '500' }}>{transactions.length}</span>
                {' '}결과
              </p>
            </div>
            <div>
              <nav className="pagination-nav">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="pagination-button"
                >
                  이전
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`pagination-button ${currentPage === page ? 'active' : ''}`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="pagination-button"
                >
                  다음
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* 상세정보 모달 */}
      {showModal && selectedTransaction && (
        <TransactionDetailsModal
          region={selectedTransaction}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default TransactionTable; 