import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../apiBase';

const nf = new Intl.NumberFormat('ko-KR');

const Card = ({ title, value, sub }) => (
  <div style={{
    flex: '1 1 160px',
    minWidth: 160,
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    padding: '14px 16px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
  }}>
    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>{title}</div>
    <div style={{ fontSize: 20, fontWeight: 800, color: '#111827' }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{sub}</div>}
  </div>
);

const IndicesCards = ({ city }) => {
  const [sent, setSent] = useState(null);
  const [ov, setOv] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true); setError(null);
        const params = new URLSearchParams();
        if (city) params.append('city', city);
        params.append('days', '30');
        const [sRes, oRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/sentiment-index?${params.toString()}`),
          axios.get(`${API_BASE_URL}/market-overview`)
        ]);
        setSent(sRes.data);
        setOv(oRes.data);
      } catch (e) {
        setError('지표 로딩 실패');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [city]);

  if (loading) return <div style={{ color: '#6b7280', fontSize: 13 }}>지표 로딩…</div>;
  if (error) return <div style={{ color: '#ef4444', fontSize: 13 }}>{error}</div>;

  const idx = sent?.index ?? null;
  const regime = sent?.regime ?? '-';
  const breadthPct = sent?.components?.breadth_ratio != null ? (sent.components.breadth_ratio * 100).toFixed(1) + '%' : '-';
  const totalVol = ov?.total_volume != null ? nf.format(ov.total_volume) + ' 건' : '-';
  const avgPrice = ov?.avg_price != null ? nf.format(Math.round(ov.avg_price)) + ' 원' : '-';
  const volChg = ov?.volume_change != null ? (ov.volume_change.toFixed ? ov.volume_change.toFixed(1) : ov.volume_change) + '%' : '-';

  return (
    <div style={{ width: '100%', maxWidth: 820, margin: '8px auto 0' }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Card title="심리지수" value={idx != null ? idx.toFixed(1) : '-'} sub={regime} />
        <Card title="상승 확산" value={breadthPct} sub="상승 지역 비중" />
        <Card title="30일 거래량" value={totalVol} />
        <Card title="30일 평균가격" value={avgPrice} />
        <Card title="거래량 변화율" value={volChg} sub="최근 30일 vs 직전 30일" />
      </div>
    </div>
  );
};

export default IndicesCards;


