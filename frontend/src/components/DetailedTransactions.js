import React, { useState, useEffect } from 'react';

const DetailedTransactions = ({ regionName }) => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(20);

    useEffect(() => {
        if (regionName) {
            fetchDetailedTransactions();
        }
    }, [regionName]);

    const fetchDetailedTransactions = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/detailed-transactions?region=${encodeURIComponent(regionName)}&limit=100`);
            if (response.ok) {
                const data = await response.json();
                setTransactions(data);
            }
        } catch (error) {
            console.error('상세 거래 정보 조회 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price) => {
        if (price >= 100000000) {
            return `${(price / 100000000).toFixed(1)}억원`;
        } else if (price >= 10000) {
            return `${(price / 10000).toFixed(0)}만원`;
        }
        return `${price.toLocaleString()}원`;
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('ko-KR');
    };

    // 페이지네이션
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = transactions.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(transactions.length / itemsPerPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    if (loading) {
        return <div className="loading">상세 거래 정보를 불러오는 중...</div>;
    }

    if (!transactions || transactions.length === 0) {
        return <div className="no-data">상세 거래 정보가 없습니다.</div>;
    }

    return (
        <div className="detailed-transactions">
            <h3>상세 거래 정보 (면적/층수 포함)</h3>
            
            <div className="transactions-table">
                <table>
                    <thead>
                        <tr>
                            <th>거래일자</th>
                            <th>아파트명</th>
                            <th>동</th>
                            <th>지번</th>
                            <th>면적</th>
                            <th>층수</th>
                            <th>면적구분</th>
                            <th>층수구분</th>
                            <th>거래가격</th>
                            <th>데이터출처</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.map((transaction, index) => (
                            <tr key={index}>
                                <td>{formatDate(transaction.date)}</td>
                                <td className="complex-name">{transaction.complex_name}</td>
                                <td>{transaction.dong || '-'}</td>
                                <td>{transaction.jibun || '-'}</td>
                                <td className="area">
                                    {transaction.area > 0 ? `${transaction.area}㎡` : '-'}
                                </td>
                                <td className="floor">
                                    {transaction.floor > 0 ? `${transaction.floor}층` : '-'}
                                </td>
                                <td className="area-category">
                                    <span className={`category-badge area-${transaction.area_category?.replace(/[^가-힣]/g, '')}`}>
                                        {transaction.area_category || '-'}
                                    </span>
                                </td>
                                <td className="floor-type">
                                    <span className={`category-badge floor-${transaction.floor_type?.replace(/[^가-힣]/g, '')}`}>
                                        {transaction.floor_type || '-'}
                                    </span>
                                </td>
                                <td className="price">{formatPrice(transaction.avg_price)}</td>
                                <td className="source">{transaction.source}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
                <div className="pagination">
                    <button 
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="page-btn"
                    >
                        이전
                    </button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`page-btn ${currentPage === page ? 'active' : ''}`}
                        >
                            {page}
                        </button>
                    ))}
                    
                    <button 
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="page-btn"
                    >
                        다음
                    </button>
                </div>
            )}

            <div className="summary-stats">
                <h4>거래 정보 요약</h4>
                <div className="stats-summary">
                    <div className="stat-item">
                        <span>총 거래건수:</span>
                        <strong>{transactions.length}건</strong>
                    </div>
                    <div className="stat-item">
                        <span>평균 거래가격:</span>
                        <strong>{formatPrice(transactions.reduce((sum, t) => sum + t.avg_price, 0) / transactions.length)}</strong>
                    </div>
                    <div className="stat-item">
                        <span>평균 면적:</span>
                        <strong>
                            {(transactions.filter(t => t.area > 0).reduce((sum, t) => sum + t.area, 0) / 
                              transactions.filter(t => t.area > 0).length || 0).toFixed(1)}㎡
                        </strong>
                    </div>
                    <div className="stat-item">
                        <span>평균 층수:</span>
                        <strong>
                            {(transactions.filter(t => t.floor > 0).reduce((sum, t) => sum + t.floor, 0) / 
                              transactions.filter(t => t.floor > 0).length || 0).toFixed(1)}층
                        </strong>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DetailedTransactions;
