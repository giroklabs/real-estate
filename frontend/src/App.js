import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Header from './components/Header';
import MonthlyVolumeChart from './components/MonthlyVolumeChart';
// import PriceChangeChart from './components/PriceChangeChart';
import MarketCharts from './components/MarketCharts';
import TrendingInsights from './components/TrendingInsights';
import TrendingDashboard from './components/TrendingDashboard';
import TrendingByRegion from './components/TrendingByRegion';
import ApartmentRankings from './components/ApartmentRankings';
import LoadingSpinner from './components/LoadingSpinner';
import CitySelector from './components/CitySelector';
import MobileMessage from './components/MobileMessage';
import realEstateDB from './utils/indexedDB';
import './index.styles.css';
import './App.styles.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';
const IS_LOCAL = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

// axios 기본 설정 - Gzip 압축 요청
axios.defaults.headers.common['Accept-Encoding'] = 'gzip, deflate, br';
axios.defaults.headers.common['Accept'] = 'application/json, text/plain, */*';

function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [allData, setAllData] = useState(null);
  const [selectedCity, setSelectedCity] = useState('seoul');
  const [dataTimestamp, setDataTimestamp] = useState(null);
  const [activeTab, setActiveTab] = useState('rankings');

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      
      // 먼저 캐시 확인 (빠른 응답)
      const cachedResult = await realEstateDB.loadDataCompressed();
      if (cachedResult) {
        setAllData(cachedResult.data);
        setDataTimestamp(cachedResult.timestamp);
        setLoading(false);
        
        // 백그라운드에서 최신 데이터 확인
        setTimeout(() => checkForUpdates(), 100);
        return;
      }
      
      // 캐시가 없으면 점진적 로딩 시작
      await loadDataProgressively();
      
    } catch (error) {
      setError('데이터 로딩 실패');
      setLoading(false);
    }
  }, []);

  const loadDataProgressively = async () => {
    try {
      // 새로운 최적화된 로딩 전략 시도
      try {
        const metadataStartTime = performance.now();
        const metadataResponse = await axios.get(`${API_BASE_URL}/metadata`);
        const metadataLoadTime = performance.now() - metadataStartTime;
        
        if (metadataResponse.data.status === 'success') {
          console.log(`✅ 메타데이터 로드 완료: ${metadataLoadTime.toFixed(2)}ms`);
          
          // 선택된 도시 데이터만 먼저 로드
          const cityStartTime = performance.now();
          const cityResponse = await axios.get(`${API_BASE_URL}/cities/${selectedCity}`);
          const cityLoadTime = performance.now() - cityStartTime;
          
          if (cityResponse.data.status === 'success') {
            const cityData = cityResponse.data.data;
            setAllData(cityData);
            setLoading(false);
            console.log(`🚀 ${selectedCity} 데이터 로드 완료: ${cityLoadTime.toFixed(2)}ms`);
            
            // 백그라운드에서 전체 데이터 로드
            setTimeout(async () => {
              try {
                const fullStartTime = performance.now();
                const fullDataResponse = await axios.get(`${API_BASE_URL}/integrated-data`);
                const fullLoadTime = performance.now() - fullStartTime;
                if (fullDataResponse.data.status === 'success') {
                  const fullData = fullDataResponse.data.data;
                  const timestamp = fullDataResponse.data.metadata?.collection_date;
                  setAllData(fullData);
                  setDataTimestamp(timestamp || null);
                  await realEstateDB.saveDataCompressed(fullData, timestamp || new Date().toISOString());
                  console.log(`🚀 전체 데이터 로드 완료: ${fullLoadTime.toFixed(2)}ms`);
                }
              } catch (e) {
                console.log('전체 데이터 로드 실패, 도시 데이터로 계속 진행');
              }
            }, 500);
            return; // 새로운 최적화된 로딩 경로 종료
          }
        }
      } catch (e) {
        console.log('새로운 최적화된 로딩 실패, 기존 경로로 진행');
      }

      // 로컬 환경에서는 서울시 1개월 우선 데이터를 먼저 제공
      if (IS_LOCAL) {
        try {
          const priorityResp = await axios.get(`${API_BASE_URL}/seoul-priority-data`);
          if (priorityResp.data && priorityResp.data.status === 'success') {
            const seoulPriority = priorityResp.data.data;
            setAllData(seoulPriority); // 우선 데이터 즉시 반영
            setLoading(false);

            // 전체 통합 데이터는 백그라운드에서 로드 후 캐시에 저장
            setTimeout(async () => {
              try {
                const fullStartTime = performance.now();
                const fullDataResponse = await axios.get(`${API_BASE_URL}/integrated-data`);
                const fullLoadTime = performance.now() - fullStartTime;
                if (fullDataResponse.data.status === 'success') {
                  const fullData = fullDataResponse.data.data;
                  const timestamp = fullDataResponse.data.metadata?.collection_date;
                  setAllData(fullData);
                  setDataTimestamp(timestamp || null);
                  await realEstateDB.saveDataCompressed(fullData, timestamp || new Date().toISOString());
                  console.log(`🚀 (LOCAL) 전체 데이터 로드 완료: ${fullLoadTime.toFixed(2)}ms`);
                }
              } catch (e) {
                console.log('(LOCAL) 전체 데이터 로드 실패, 우선 데이터로 계속 진행');
              }
            }, 300);
            return; // 로컬 우선 로딩 경로 종료
          }
        } catch (e) {
          console.log('서울시 우선 데이터 로드 실패, 기본 경로로 진행');
        }
      }

      // 기본 경로: 요약 데이터 → 전체 데이터 (기존 로직 유지)
      const startTime = performance.now();
      const summaryResponse = await axios.get(`${API_BASE_URL}/integrated-data?type=summary`);
      const summaryLoadTime = performance.now() - startTime;
      
      if (summaryResponse.data.status === 'success') {
        const summaryData = summaryResponse.data.data;
        setAllData(summaryData); // 기본 정보 표시
        setLoading(false);
        console.log(`✅ 요약 데이터 로드 완료: ${summaryLoadTime.toFixed(2)}ms`);
        
        // 2단계: 백그라운드에서 전체 데이터 로드
        setTimeout(async () => {
          try {
            const fullStartTime = performance.now();
            const fullDataResponse = await axios.get(`${API_BASE_URL}/integrated-data`);
            const fullLoadTime = performance.now() - fullStartTime;
            
            if (fullDataResponse.data.status === 'success') {
              const fullData = fullDataResponse.data.data;
              const timestamp = fullDataResponse.data.metadata.collection_date;
              
              setAllData(fullData);
              setDataTimestamp(timestamp);
              await realEstateDB.saveDataCompressed(fullData, timestamp);
              
              console.log(`🚀 전체 데이터 로드 완료: ${fullLoadTime.toFixed(2)}ms`);
              console.log(`📊 데이터 크기: ${JSON.stringify(fullDataResponse.data.metadata)}`);
            }
          } catch (error) {
            console.log('전체 데이터 로드 실패, 요약 데이터로 계속');
          }
        }, 500);
      }
    } catch (error) {
      // 폴백: 기존 방식
      await loadFallbackData();
    }
  };

  const loadFallbackData = async () => {
    // 기존 폴백 로직 유지
    try {
      let dataResponse = await axios.get(`${API_BASE_URL}/busan-incheon-seoul-daegu-bucheon-data`);
      
      if (dataResponse.data.status === 'success') {
        const data = dataResponse.data.data;
        const timestamp = '2025-08-11 17:20:31';
        
        setAllData(data);
        setDataTimestamp(timestamp);
        await realEstateDB.saveDataCompressed(data, timestamp);
        console.log('부산+인천+서울+대구+부천 데이터 로드 및 캐시 완료');
      } else {
        // 부천 데이터가 없으면 기존 데이터로 폴백
        dataResponse = await axios.get(`${API_BASE_URL}/busan-incheon-seoul-daegu-data`);
        if (dataResponse.data.status === 'success') {
          const data = dataResponse.data.data;
          const timestamp = '2025-08-11 12:24:45'; // 대구 데이터 수집 일시
          
          setAllData(data);
          setDataTimestamp(timestamp);
          
          // IndexedDB에 데이터 캐시
          await realEstateDB.saveDataCompressed(data, timestamp);
          console.log('부산+인천+서울+대구 데이터 로드 및 캐시 완료 (부천 데이터 없음)');
        } else {
          // 대구 데이터도 없으면 기존 데이터로 폴백
          dataResponse = await axios.get(`${API_BASE_URL}/busan-incheon-seoul-data`);
          if (dataResponse.data.status === 'success') {
            const data = dataResponse.data.data;
            const timestamp = '2025-08-11 12:24:45'; // 서울 데이터 수집 일시
            
            setAllData(data);
            setDataTimestamp(timestamp);
            
            // IndexedDB에 데이터 캐시
            await realEstateDB.saveDataCompressed(data, timestamp);
            console.log('부산+인천+서울 데이터 로드 및 캐시 완료 (대구, 부천 데이터 없음)');
          } else {
            // 서울 데이터도 없으면 기존 데이터로 폴백
            dataResponse = await axios.get(`${API_BASE_URL}/busan-incheon-data`);
            if (dataResponse.data.status === 'success') {
              const data = dataResponse.data.data;
              const timestamp = '2025-08-11 12:24:45'; // 인천 데이터 수집 일시
              
              setAllData(data);
              setDataTimestamp(timestamp);
              
              // IndexedDB에 데이터 캐시
              await realEstateDB.saveDataCompressed(data, timestamp);
              console.log('부산+인천 데이터 로드 및 캐시 완료 (서울, 대구, 부천 데이터 없음)');
            } else {
              // 인천 데이터도 없으면 기존 데이터로 폴백
              dataResponse = await axios.get(`${API_BASE_URL}/busan-data`);
              if (dataResponse.data.status === 'success') {
                const data = dataResponse.data.data;
                const timestamp = '2025-08-11 12:24:45'; // 부산 데이터 수집 일시
                
                setAllData(data);
                setDataTimestamp(timestamp);
                
                // IndexedDB에 데이터 캐시
                await realEstateDB.saveDataCompressed(data, timestamp);
                console.log('부산 데이터 로드 및 캐시 완료 (인천, 서울, 대구, 부천 데이터 없음)');
              } else {
                throw new Error('사용 가능한 데이터가 없습니다');
              }
            }
          }
        }
      }
    } catch (error) {
      setError('데이터 로딩 실패');
    } finally {
      setLoading(false);
    }
  };

  const checkForUpdates = async () => {
    try {
      const integratedResponse = await axios.get(`${API_BASE_URL}/integrated-data`);
      if (integratedResponse.data.status === 'success') {
        const data = integratedResponse.data.data;
        const timestamp = integratedResponse.data.metadata.collection_date;
        
        setAllData(data);
        setDataTimestamp(timestamp);
        await realEstateDB.saveDataCompressed(data, timestamp);
        console.log('백그라운드에서 최신 데이터 업데이트 완료');
      }
    } catch (error) {
      console.log('백그라운드 데이터 업데이트 실패');
    }
  };

  // 카카오 애드핏 Web 배너 SDK 로드
  useEffect(() => {
    // 광고 스크립트 동적 로드
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = '//t1.daumcdn.net/kas/static/ba.min.js';
    script.async = true;
    
    script.onload = () => {
      console.log('카카오 애드핏 Web 배너 SDK 로드 완료');
    };
    
    script.onerror = () => {
      console.log('카카오 애드핏 Web 배너 SDK 로드 실패');
    };
    
    document.head.appendChild(script);
    
    // 컴포넌트 언마운트 시 스크립트 제거
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    // 먼저 캐시된 데이터 확인 (비동기)
    const checkCache = async () => {
      try {
        const cachedResult = await realEstateDB.loadDataCompressed();
        if (cachedResult) {
          setAllData(cachedResult.data);
          setDataTimestamp(cachedResult.timestamp);
          console.log('IndexedDB에서 캐시된 데이터 로드 완료');
          return;
        }
        
        // 캐시된 데이터가 없으면 API에서 새로 로드
        console.log('캐시된 데이터 없음, API에서 새로 로드');
        fetchAllData();
      } catch (error) {
        console.error('캐시 확인 오류:', error);
        // 오류 발생 시 API에서 새로 로드
        fetchAllData();
      }
    };
    
    checkCache();
  }, [fetchAllData]);

  // 통계 탭용: 현재 도시 데이터 변경 시 기본으로 모든 지역 선택
  useEffect(() => {
    const data = getCurrentCityData();
    const regions = Object.keys(data || {});
    // setStatsSelectedRegions(regions); // 이 부분은 사용하지 않으므로 제거
  }, [selectedCity, allData]);

  const handleCityChange = async (cityId) => {
    setSelectedCity(cityId);
    console.log('선택된 도시:', cityId);
    
    const supportedCities = ['busan', 'incheon', 'seoul', 'daegu', 'daejeon', 'gwangju', 'ulsan', 'bucheon', 'seongnam', 'guri'];
    
    if (supportedCities.includes(cityId)) {
      const cityNames = {
        'busan': '부산시',
        'incheon': '인천시', 
        'seoul': '서울시',
        'daegu': '대구시',
        'daejeon': '대전시',
        'gwangju': '광주시',
        'ulsan': '울산시',
        'bucheon': '부천시',
        'seongnam': '성남시',
        'guri': '구리시'
      };
      console.log(`${cityNames[cityId]} 데이터 사용`);
    } else {
      setLoading(true);
      setError(null);
      
      try {
        console.log(`${cityId} 도시 데이터 수집 시작`);
        alert(`${cityId} 데이터 수집을 시작합니다.\n현재는 부산시, 인천시, 서울시, 대구시, 대전시, 광주시, 울산시, 부천시, 성남시, 구리시 데이터만 사용 가능합니다.`);
        
        const response = await axios.post(`${API_BASE_URL}/collect-data`, { city: cityId });
        
        if (response.data.status === 'success') {
          console.log(`${cityId} 데이터 수집 완료`);
          await fetchAllData(); // 데이터 새로고침
        } else {
          setError(`${cityId} 데이터 수집에 실패했습니다.`);
        }
      } catch (error) {
        console.error('데이터 수집 오류:', error);
        setError(`${cityId} 데이터 수집 중 오류가 발생했습니다.`);
      } finally {
        setLoading(false);
      }
    }
  };

  const getCurrentCityData = () => {
    if (!allData) return {};
    
    // 도시별 데이터 필터링 매핑
    const cityFilters = {
      'busan': '부산',
      'incheon': '인천', 
      'seoul': '서울',
      'daegu': '대구',
      'daejeon': '대전',
      'gwangju': '광주',
      'ulsan': '울산',
      'bucheon': '경기 부천시',
      'seongnam': '경기 성남시',
      'guri': '경기 구리시'
    };

    const filterPrefix = cityFilters[selectedCity];
    
    if (filterPrefix) {
      const filteredData = {};
      Object.keys(allData).forEach(key => {
        if (key.startsWith(filterPrefix)) {
          filteredData[key] = allData[key];
        }
      });
      console.log(`${selectedCity} 데이터 (${filterPrefix}):`, Object.keys(filteredData));
      return filteredData;
    }
    
    console.log('모든 데이터 반환');
    return allData;
  };

  const getStatsFilteredData = () => {
    const data = getCurrentCityData();
    if (!data) return {};
    return data; // 모든 지역 데이터 반환
  };

  const toggleStatsRegion = (regionName) => {
    // setStatsSelectedRegions((prev) => { // 이 부분은 사용하지 않으므로 제거
    //   if (prev.includes(regionName)) {
    //     return prev.filter((r) => r !== regionName);
    //   }
    //   return [...prev, regionName];
    // });
  };

  return (
    <div className="App">
      {/* 데스크톱 전용 헤더 */}
      <Header activeTab={activeTab} onTabChange={setActiveTab} className="desktop-only" />
      
      {/* 모바일 전용 메시지 */}
      <MobileMessage />
      
      {error && (
        <div className="error-message">
          <p>⚠️ {error}</p>
        </div>
      )}

      {loading && <LoadingSpinner />}

      {/* 데스크톱 전용 메인 콘텐츠 */}
      <main className="main-content desktop-only">
        <div className="sidebar">
          <div className="city-selector-wrapper">
            <CitySelector 
              onCityChange={handleCityChange}
              selectedCity={selectedCity}
              loading={loading}
            />
          </div>
          
          {/* 카카오 애드핏 Web 배너 광고 영역 */}
          <div className="ad-section sidebar-ad">
            <div className="ad-label">광고</div>
            <ins 
              className="kakao_ad_area" 
              style={{display: 'none'}}
              data-ad-unit="DAN-LTtp6pEFWcOf7Ma5"
              data-ad-width="250"
              data-ad-height="250"
            />
          </div>
        </div>
        
        <div className="main-panel">
          {activeTab === 'rankings' && (
            <ApartmentRankings 
              allData={allData}
              currentCityData={getCurrentCityData()}
              selectedCity={selectedCity}
              dataTimestamp={dataTimestamp}
            />
          )}
          {activeTab === 'stats' && (
            <div style={{ padding: '1rem' }}>
              <MarketCharts currentCityData={getCurrentCityData()} />
            </div>
          )}
          {activeTab === 'trending' && (
            <div style={{ padding: '1rem' }}>
              <TrendingByRegion allData={allData} />
            </div>
          )}
          
        </div>
      </main>
      
      {/* 푸터 */}
      <footer className="footer desktop-only">
        <hr className="footer-divider" />
        <div className="footer-content">
          <div className="footer-info">
            <div className="footer-top">
              <p className="copyright">© 2025 GIROK Labs. All rights reserved.</p>
              <span className="footer-separator">  </span>
              <p className="contact-info">
                문의사항: <a href="mailto:greego86@naver.com" className="contact-link">greego86@naver.com</a>
              </p>
            </div>
            <div className="footer-legal">
              <p className="legal-text">본 사이트는 부동산 거래 정보 제공 목적이며, 공개된 정보를 기반으로 합니다. 투자 시 전문가 상담을 권장합니다.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;