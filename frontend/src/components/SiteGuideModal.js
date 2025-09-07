import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

const SiteGuideModal = ({ visible = false, onClose = () => {}, onDontShowAgain = () => {} }) => {
  const [source, setSource] = useState('국토교통부 실거래가 정보');
  const [period, setPeriod] = useState({ from: null, to: null });

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/collection-period`);
        if (!cancelled && res.data && res.data.status === 'success') {
          setSource(res.data.source || '국토교통부 실거래가 정보');
          setPeriod({
            from: res.data.period?.from || null,
            to: res.data.period?.to || null
          });
        }
      } catch (e) {
        // 표시용이므로 실패해도 침묵
      }
    })();
    return () => { cancelled = true; };
  }, [visible]);

  if (!visible) return null;

  const content = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="사이트 사용 가이드"
      style={{
        position: 'fixed', inset: 0, backgroundColor: '#000',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2147483647
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 'min(820px, 92vw)', maxHeight: '86vh', overflowY: 'auto',
          background: '#ffffff', borderRadius: 12, boxShadow: '0 12px 28px rgba(0,0,0,0.18)',
          padding: '20px 24px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>사이트 가이드</h2>
          <button onClick={onClose} aria-label="닫기" style={{ background: 'transparent', border: 'none', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ color: '#374151', lineHeight: 1.6, fontSize: '0.95rem' }}>
          <p style={{ marginTop: 0 }}>APT Ranking은 공개 데이터를 바탕으로 지역별 아파트 거래 상황을 한눈에 볼 수 있게 정리한 서비스입니다.</p>

          <div style={{ marginTop: 14 }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.05rem', fontWeight: 700, color: '#111827' }}>이용 방법</h3>
            <ol style={{ paddingLeft: 20, margin: 0 }}>
              <li style={{ marginBottom: 6 }}>
                왼쪽 사이드의 <strong>도시 선택</strong>에서 보고 싶은 지역을 선택합니다.
              </li>
              <li style={{ marginBottom: 6 }}>
                상단 탭에서 <strong>지역별 아파트순위</strong>를 기본으로 확인할 수 있습니다. 원하는 <strong>월</strong>을 선택하고, <strong>검색창</strong>으로 아파트명을 빠르게 찾을 수 있습니다.
              </li>
              <li style={{ marginBottom: 6 }}>
                <strong>그래프&공포탐욕지수</strong> 탭에서는 거래량/평균가격 그래프와 함께 <strong>공포탐욕지수</strong>를 볼 수 있습니다.
              </li>
              <li style={{ marginBottom: 6 }}>
                <strong>HOT한 아파트</strong> 탭에서는 최근 거래가 활발한 단지를 요약해 보여줍니다.
              </li>
            </ol>
          </div>

          <div style={{ marginTop: 14 }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.05rem', fontWeight: 700, color: '#111827' }}>공포탐욕지수란?</h3>
            <ul style={{ paddingLeft: 20, margin: 0 }}>
              <li style={{ marginBottom: 4 }}>가격 모멘텀(40%), 거래 모멘텀(35%), 상승 확산(25%)을 합성해 0~100 점수로 표현합니다.</li>
              <li style={{ marginBottom: 4 }}>점수가 높을수록 <strong>탐욕(강한 매수 심리)</strong>, 낮을수록 <strong>공포(약한 매수 심리)</strong> 상태를 의미합니다.</li>
            </ul>
          </div>

          <div style={{ marginTop: 14 }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.05rem', fontWeight: 700, color: '#111827' }}>알아두기</h3>
            <ul style={{ paddingLeft: 20, margin: 0 }}>
              <li style={{ marginBottom: 4 }}>데이터는 최신 공개분에 따라 변동될 수 있습니다.</li>
              <li style={{ marginBottom: 4 }}>브라우저 캐시로 처음 로딩 후에는 더 빠르게 동작합니다.</li>
            </ul>
          </div>

          <div style={{ marginTop: 14 }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.05rem', fontWeight: 700, color: '#111827' }}>데이터 출처</h3>
            <ul style={{ paddingLeft: 20, margin: 0 }}>
              <li style={{ marginBottom: 4 }}>데이터 출처: <strong>{source}</strong></li>
            </ul>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 18 }}>
          <button
            onClick={onDontShowAgain}
            style={{
              background: '#f3f4f6', color: '#111827', border: '1px solid #e5e7eb',
              padding: '8px 12px', borderRadius: 8, cursor: 'pointer'
            }}
          >
            다시 보지 않기
          </button>
          <button
            onClick={onClose}
            style={{
              background: '#2563eb', color: '#ffffff', border: '1px solid #1d4ed8',
              padding: '8px 12px', borderRadius: 8, cursor: 'pointer'
            }}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
  
  if (typeof document === 'undefined') return null;
  return createPortal(content, document.body);
};

export default SiteGuideModal;


