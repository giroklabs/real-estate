import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const FloorAnalysis = ({ regionName }) => {
    const [floorData, setFloorData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (regionName) {
            fetchFloorAnalysis();
        }
    }, [regionName]);

    const fetchFloorAnalysis = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/floor-analysis?region=${encodeURIComponent(regionName)}`);
            if (response.ok) {
                const data = await response.json();
                setFloorData(data);
            }
        } catch (error) {
            console.error('층수 분석 데이터 조회 실패:', error);
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

    const COLORS = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4'];

    if (loading) {
        return <div className="loading">층수 분석 데이터를 불러오는 중...</div>;
    }

    if (!floorData || floorData.length === 0) {
        return <div className="no-data">층수별 분석 데이터가 없습니다.</div>;
    }

    return (
        <div className="floor-analysis">
            <h3>층수별 가격 분석</h3>
            <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={floorData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="floor_type" />
                        <YAxis tickFormatter={(value) => formatPrice(value)} />
                        <Tooltip 
                            formatter={(value, name) => [
                                name === 'avg_price' ? formatPrice(value) : value,
                                name === 'avg_price' ? '평균가격' : '거래건수'
                            ]}
                        />
                        <Bar dataKey="avg_price" fill="#ff6b6b" name="평균가격">
                            {floorData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
            
            <div className="floor-stats">
                <h4>층수별 상세 통계</h4>
                <div className="stats-grid">
                    {floorData.map((item, index) => (
                        <div key={index} className="stat-card">
                            <h5>{item.floor_type}</h5>
                            <div className="stat-item">
                                <span>평균가격:</span>
                                <strong>{formatPrice(item.avg_price)}</strong>
                            </div>
                            <div className="stat-item">
                                <span>거래건수:</span>
                                <strong>{item.transaction_count}건</strong>
                            </div>
                            <div className="stat-item">
                                <span>평균층수:</span>
                                <strong>{item.avg_floor?.toFixed(1)}층</strong>
                            </div>
                            <div className="stat-item">
                                <span>가격범위:</span>
                                <strong>{formatPrice(item.min_price)} ~ {formatPrice(item.max_price)}</strong>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FloorAnalysis;
