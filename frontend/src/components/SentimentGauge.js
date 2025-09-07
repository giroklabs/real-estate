import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../apiBase';

const SentimentGauge = ({ city }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetchIndex = async () => {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams();
        if (city) params.append('city', city);
        params.append('days', '30');
        params.append('v', '2');
        const res = await axios.get(`${API_BASE_URL}/sentiment-index?${params.toString()}`);
        if (!mounted) return;
        setData(res.data);
      } catch (e) {
        if (!mounted) return;
        setError('지수 로딩 실패');
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };
    fetchIndex();
    return () => { mounted = false; };
  }, [city]);

  const color = useMemo(() => {
    const v = (data?.index ?? 50);
    if (v >= 65) return '#16a34a'; // 탐욕
    if (v <= 35) return '#ef4444'; // 공포
    return '#64748b'; // 중립
  }, [data]);

  const regimeText = useMemo(() => {
    const v = (data?.index ?? 50);
    if (v >= 65) return '탐욕';
    if (v <= 35) return '공포';
    return '중립';
  }, [data]);

  if (loading) return <div style={{ padding: '0.5rem 0', color: '#6b7280', fontSize: '0.9rem' }}>심리지수 로딩 중...</div>;
  if (error)   return <div style={{ padding: '0.5rem 0', color: '#ef4444', fontSize: '0.9rem' }}>{error}</div>;

  const barWidth = Math.min(820, (typeof window !== 'undefined' ? window.innerWidth : 1200) * 0.9);
  const markerPosition = (data?.index ?? 50); // 0-100
  const markerLeft = (markerPosition / 100) * barWidth;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem' }}>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginBottom: '0.75rem', textAlign: 'center' }}>
        부동산 공포탐욕지수
      </h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem', flexDirection: 'column' }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 800, color, textAlign: 'center' }}>
          {regimeText} ({data?.index?.toFixed?.(1) ?? '—'})
        </div>
        <div
          aria-label="sentiment-bar"
          style={{
            width: barWidth, height: 20, borderRadius: 10,
            background: `linear-gradient(to right, #ef4444 0%, #ef4444 35%, #64748b 35%, #64748b 65%, #16a34a 65%, #16a34a 100%)`,
            position: 'relative', boxShadow: '0 2px 4px rgba(0,0,0,0.08)'
          }}
        >
          <div
            style={{
              position: 'absolute', left: `calc(${markerLeft}px - 3px)`, top: 0,
              width: 6, height: '100%', backgroundColor: '#fff', borderRadius: 3,
              boxShadow: '0 0 0 1px rgba(0,0,0,0.25)'
            }}
          />
        </div>
      </div>

      {(() => {
        const fmtYM = (s) => {
          if (!s) return '';
          try {
            const [y,m] = s.split('-');
            return `${y}년 ${m.padStart(2,'0')}월`;
          } catch { return s; }
        };
        const rangeText = data?.meta?.window_start && data?.meta?.window_end
          ? `${fmtYM(data.meta.window_start)} ~ ${fmtYM(data.meta.window_end)}`
          : `최근 ${data?.days ?? 30}일`;
        return null;
      })()}

      <div style={{
        width: barWidth, maxWidth: 820, backgroundColor: '#f8f9fa', borderRadius: 8,
        padding: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginTop: '0.75rem', textAlign: 'left'
      }}>
        <div style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '0.6rem' }}>
          {(() => {
            const fmtYM = (s) => {
              if (!s) return '';
              try { const [y,m] = s.split('-'); return `${y}년 ${m.padStart(2,'0')}월`; } catch { return s; }
            };
            if (data?.meta?.window_start && data?.meta?.window_end) {
              return `계산 기준 (${fmtYM(data.meta.window_start)} ~ ${fmtYM(data.meta.window_end)})`;
            }
            return `계산 기준 (최근 ${data?.days ?? 30}일)`;
          })()}
        </div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.85rem', color: '#4b5563' }}>
          <li style={{ marginBottom: '0.4rem' }}>
            <span style={{ fontWeight: 600, color: '#374151' }}>가격 모멘텀 (40%):</span> 최근 기간 평균 가격 변동률.
            <br />
            <span style={{ marginLeft: 10, fontSize: '0.8rem', color: '#6b7280' }}>
              (-3.0% → 0점 / 0.0% → 50점 / +3.0% → 100점)
              현재: {data?.components?.price_change_pct?.toFixed?.(2) ?? '—'}%
            </span>
          </li>
          <li style={{ marginBottom: '0.4rem' }}>
            <span style={{ fontWeight: 600, color: '#374151' }}>거래 모멘텀 (35%):</span> 최근 기간 거래량 변화율 (최근/직전 기간 대비).
            <br />
            <span style={{ marginLeft: 10, fontSize: '0.8rem', color: '#6b7280' }}>
              (-80% → 0점 / 0% → 50점 / +80% → 100점)
              현재: {data?.components?.volume_delta_ratio ? (data.components.volume_delta_ratio * 100).toFixed(2) : '—'}%
            </span>
          </li>
          <li>
            <span style={{ fontWeight: 600, color: '#374151' }}>상승 확산 (25%):</span> 가격이 상승한 지역의 비중.
            <br />
            <span style={{ marginLeft: 10, fontSize: '0.8rem', color: '#6b7280' }}>
              (0.0 → 0점 / 0.5 → 50점 / 1.0 → 100점)
              현재: {data?.components?.breadth_ratio ? (data.components.breadth_ratio * 100).toFixed(2) : '—'}%
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default SentimentGauge;


