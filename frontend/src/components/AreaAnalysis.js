import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const AreaAnalysis = ({ regionName }) => {
    const [areaData, setAreaData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (regionName) {
            fetchAreaAnalysis();
        }
    }, [regionName]);

    const fetchAreaAnalysis = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/area-analysis?region=${encodeURIComponent(regionName)}`);
            if (response.ok) {
                const data = await response.json();
                setAreaData(data);
            }
        } catch (error) {
            console.error('면적 분석 데이터 조회 실패:', error);
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

    const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

    if (loading) {
        return <div className="loading">면적 분석 데이터를 불러오는 중...</div>;
    }

    if (!areaData || areaData.length === 0) {
        return <div className="no-data">면적별 분석 데이터가 없습니다.</div>;
    }

    return (
        <div className="area-analysis">
            <h3>면적별 가격 분석</h3>
            <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={areaData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="area_category" />
                        <YAxis tickFormatter={(value) => formatPrice(value)} />
                        <Tooltip 
                            formatter={(value, name) => [
                                name === 'avg_price' ? formatPrice(value) : value,
                                name === 'avg_price' ? '평균가격' : '거래건수'
                            ]}
                        />
                        <Bar dataKey="avg_price" fill="#8884d8" name="평균가격">
                            {areaData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
            
            <div className="area-stats">
                <h4>면적별 상세 통계</h4>
                <div className="stats-grid">
                    {areaData.map((item, index) => (
                        <div key={index} className="stat-card">
                            <h5>{item.area_category}</h5>
                            <div className="stat-item">
                                <span>평균가격:</span>
                                <strong>{formatPrice(item.avg_price)}</strong>
                            </div>
                            <div className="stat-item">
                                <span>거래건수:</span>
                                <strong>{item.transaction_count}건</strong>
                            </div>
                            <div className="stat-item">
                                <span>평균면적:</span>
                                <strong>{item.avg_area?.toFixed(1)}㎡</strong>
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

export default AreaAnalysis;
