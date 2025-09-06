import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../apiBase';

const SentimentGauge = ({ city }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchIndex = async () => {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams();
        if (city) params.append('city', city);
        params.append('days', '30');
        const res = await axios.get(`${API_BASE_URL}/sentiment-index?${params.toString()}`);
        setData(res.data);
      } catch (e) {
        setError('지수 로딩 실패');
      } finally {
        setLoading(false);
      }
    };
    fetchIndex();
  }, [city]);

  const color = useMemo(() => {
    const v = (data?.index ?? 50);
    if (v >= 65) return '#16a34a';
    if (v <= 35) return '#ef4444';
    return '#64748b';
  }, [data]);

  if (loading) {
    return (
      <div style={{ padding: '0.5rem 0', color: '#6b7280', fontSize: '0.9rem' }}>심리지수 로딩…</div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '0.5rem 0', color: '#ef4444', fontSize: '0.9rem' }}>{error}</div>
    );
  }

  const value = Math.max(0, Math.min(100, Number(data?.index ?? 50)));
  const gradient = `linear-gradient(90deg, #ef4444 0%, #ef4444 35%, #64748b 35%, #64748b 65%, #16a34a 65%, #16a34a 100%)`;
  const pricePct = Number(data?.components?.price_change_pct ?? 0);
  const volRatio = Number(data?.components?.volume_delta_ratio ?? 0);
  const breadth = Number(data?.components?.breadth_ratio ?? 0);
  const scoreP = data?.components?.scores?.price ?? '—';
  const scoreV = data?.components?.scores?.volume ?? '—';
  const scoreB = data?.components?.scores?.breadth ?? '—';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, margin: '0 auto 1.25rem', textAlign: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827' }}>부동산 심리지수</div>
        <div style={{ fontSize: '1rem', color: color, fontWeight: 800 }}>{data?.regime ?? '중립'}</div>
        <div style={{ fontSize: '1rem', color: '#111827', fontWeight: 800 }}>{value.toFixed(1)}</div>
      </div>
      <div style={{ position: 'relative', width: '100%', maxWidth: 820, margin: '0 auto' }}>
        <div aria-label="sentiment-bar"
             style={{ height: 24, borderRadius: 12, background: gradient, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.06)' }} />
        {/* 구간 라벨 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7280', marginTop: 6 }}>
          <span>공포(0–35)</span>
          <span>중립(35–65)</span>
          <span>탐욕(65–100)</span>
        </div>
        {/* 마커 */}
        <div style={{ position: 'absolute', left: `${value}%`, top: 0, transform: 'translateX(-50%)' }}>
          <div style={{ width: 3, height: 32, background: color, borderRadius: 2, marginTop: -4, boxShadow: '0 0 0 2px #fff' }} />
        </div>
      </div>
      <div style={{ width: '100%', maxWidth: 820, margin: '0 auto', textAlign: 'left', fontSize: '0.92rem', color: '#4b5563' }}>
        기간: 최근 {data?.days ?? 30}일 · 가격 {scoreP} / 거래 {scoreV} / 확산 {scoreB}
      </div>
      {/* 계산 기준 상세 */}
      <div style={{ marginTop: 6, padding: '14px 18px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, lineHeight: 1.6, maxWidth: 820, textAlign: 'left' }}>
        <div style={{ fontSize: '0.98rem', fontWeight: 700, color: '#111827', marginBottom: 8 }}>계산 기준</div>
        <div style={{ fontSize: '0.9rem', color: '#374151' }}>가격 모멘텀(40%): 최근 기간 평균 변동률. −3.0% → 0점, 0.0% → 50점, +3.0% → 100점. 현재 {isNaN(pricePct)?'—':pricePct.toFixed(2)+'%'}</div>
        <div style={{ fontSize: '0.9rem', color: '#374151' }}>거래 모멘텀(35%): 최근 거래량/직전 거래량 − 1. −80% → 0점, 0% → 50점, +80% → 100점. 현재 {isNaN(volRatio)?'—':(volRatio*100).toFixed(1)+'%'}</div>
        <div style={{ fontSize: '0.9rem', color: '#374151' }}>상승 확산(25%): 평균가 상승 지역 비중. 0.0 → 0점, 0.5 → 50점, 1.0 → 100점. 현재 {isNaN(breadth)?'—':(breadth*100).toFixed(1)+'%'}</div>
        <div style={{ fontSize: '0.88rem', color: '#6b7280', marginTop: 6 }}>구간 해석: 0–35 공포 · 35–65 중립 · 65–100 탐욕</div>
      </div>
    </div>
  );
};

export default SentimentGauge;
