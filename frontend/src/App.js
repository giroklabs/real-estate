import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Header from './components/Header';
import MonthlyVolumeChart from './components/MonthlyVolumeChart';
import ApartmentRankings from './components/ApartmentRankings';
import LoadingSpinner from './components/LoadingSpinner';
import CitySelector from './components/CitySelector';
import realEstateDB from './utils/indexedDB';
import './index.styles.css';
import './App.styles.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [allData, setAllData] = useState(null);
  const [selectedCity, setSelectedCity] = useState('busan');
  const [dataTimestamp, setDataTimestamp] = useState(null);
  const [activeTab, setActiveTab] = useState('rankings');
  const [statsSelectedRegions, setStatsSelectedRegions] = useState([]);
  const [loadedCities, setLoadedCities] = useState(new Set(['busan'])); // 로드된 도시들 추적
  const [cityDataCache, setCityDataCache] = useState({}); // 도시별 데이터 캐시
  const [cityLoadingStates, setCityLoadingStates] = useState({}); // 도시별 로딩 상태

  // 선택된 도시의 데이터만 로드 (지연 로딩)
  const fetchCityData = useCallback(async (cityId) => {
    if (cityDataCache[cityId]) {
      console.log(`${cityId} 도시 데이터는 이미 캐시되어 있습니다.`);
      return cityDataCache[cityId];
    }

    try {
      console.log(`${cityId} 도시 데이터 로드 시작...`);
      setCityLoadingStates(prev => ({ ...prev, [cityId]: true }));
      
      const response = await axios.get(`${API_BASE_URL}/city-data/${cityId}`);
      
      if (response.data && response.data.status === 'success') {
        // 청크 데이터를 하나로 합치기
        let cityData = {};
        let metadata = null;
        
        // 응답이 청크 형태인지 확인
        if (response.data.chunk_index) {
          // 단일 청크 응답
          cityData = response.data.data;
          metadata = {
            city: cityId,
            total_regions: response.data.total_regions,
            total_transactions: response.data.total_transactions
          };
        } else {
          // 스트림 응답 처리
          const lines = response.data.split('\n').filter(line => line.trim());
          for (const line of lines) {
            try {
              const chunk = JSON.parse(line);
              if (chunk.metadata) {
                metadata = chunk.metadata;
              } else if (chunk.data) {
                cityData = { ...cityData, ...chunk.data };
              }
            } catch (e) {
              console.warn('청크 파싱 실패:', e);
            }
          }
        }
        
        // 도시별 캐시에 저장
        setCityDataCache(prev => ({
          ...prev,
          [cityId]: cityData
        }));
        
        console.log(`${cityId} 도시 데이터 로드 완료: ${Object.keys(cityData).length}개 지역`);
        return cityData;
      }
    } catch (error) {
      console.error(`${cityId} 도시 데이터 로드 오류:`, error);
      return null;
    } finally {
      setCityLoadingStates(prev => ({ ...prev, [cityId]: false }));
    }
  }, [cityDataCache]);

  // 전체 데이터 로드 (기존 방식 - 폴백용)
  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      
      // 먼저 통합 데이터를 시도
      try {
        const integratedResponse = await axios.get(`${API_BASE_URL}/integrated-data`);
        if (integratedResponse.data.status === 'success') {
          const data = integratedResponse.data.data;
          const timestamp = integratedResponse.data.metadata.collection_date;
          
          setAllData(data);
          setDataTimestamp(timestamp);
          
          // IndexedDB에 데이터 캐시
          await realEstateDB.saveData(data, timestamp);
          console.log('통합 데이터 로드 및 캐시 완료');
          return;
        }
      } catch (error) {
        console.log('통합 데이터 로드 실패, 기존 API로 폴백');
      }
      
      // 통합 데이터가 없으면 기존 API로 폴백
      let dataResponse = await axios.get(`${API_BASE_URL}/busan-incheon-seoul-daegu-bucheon-data`);
      
      if (dataResponse.data.status === 'success') {
        const data = dataResponse.data.data;
        const timestamp = '2025-08-11 17:20:31'; // 부천 데이터 수집 일시
        
        setAllData(data);
        setDataTimestamp(timestamp);
        
        // IndexedDB에 데이터 캐시
        await realEstateDB.saveData(data, timestamp);
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
          await realEstateDB.saveData(data, timestamp);
          console.log('부산+인천+서울+대구 데이터 로드 완료 (부천 데이터 없음)');
        } else {
          // 대구 데이터도 없으면 기존 데이터로 폴백
          dataResponse = await axios.get(`${API_BASE_URL}/busan-incheon-seoul-data`);
          if (dataResponse.data.status === 'success') {
            const data = dataResponse.data.data;
            const timestamp = '2025-08-10 16:48:52'; // 서울 데이터 수집 일시
            
            setAllData(data);
            setDataTimestamp(timestamp);
            
            // IndexedDB에 데이터 캐시
            await realEstateDB.saveData(data, timestamp);
            console.log('부산+인천+서울 데이터 로드 완료 (대구, 부천 데이터 없음)');
          } else {
            setError('데이터를 불러오는데 실패했습니다.');
          }
        }
      }
    } catch (error) {
      console.error('데이터 로드 오류:', error);
      setError('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // 먼저 캐시된 데이터 확인 (비동기)
    const checkCache = async () => {
      try {
        const cachedResult = await realEstateDB.loadData();
        if (cachedResult) {
          setAllData(cachedResult.data);
          setDataTimestamp(cachedResult.timestamp);
          console.log('IndexedDB에서 캐시된 데이터 로드 완료');
          
          // 기본 도시(부산) 데이터를 캐시에 추가
          const busanData = getCityDataFromAllData(cachedResult.data, 'busan');
          if (busanData) {
            setCityDataCache(prev => ({
              ...prev,
              'busan': busanData
            }));
          }
          return;
        }
        
        // 캐시된 데이터가 없으면 기본 도시만 먼저 로드
        console.log('캐시된 데이터 없음, 기본 도시(부산) 데이터만 먼저 로드');
        await fetchCityData('busan');
      } catch (error) {
        console.error('캐시 확인 오류:', error);
        // 오류 발생 시 기본 도시만 먼저 로드
        await fetchCityData('busan');
      }
    };
    
    checkCache();
  }, [fetchCityData]);

  // 전체 데이터에서 특정 도시 데이터 추출하는 헬퍼 함수
  const getCityDataFromAllData = (allData, cityId) => {
    if (!allData) return null;
    
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
    
    const filterPrefix = cityFilters[cityId];
    if (!filterPrefix) return null;
    
    const cityData = {};
    Object.keys(allData).forEach(key => {
      if (key.startsWith(filterPrefix)) {
        cityData[key] = allData[key];
      }
    });
    
    return cityData;
  };

  // 통계 탭용: 현재 도시 데이터 변경 시 기본으로 모든 지역 선택
  useEffect(() => {
    const data = getCurrentCityData();
    const regions = Object.keys(data || {});
    setStatsSelectedRegions(regions);
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
      
      // 도시 데이터가 이미 캐시되어 있는지 확인
      if (!cityDataCache[cityId]) {
        console.log(`${cityId} 도시 데이터 로드 시작...`);
        setLoading(true);
        
        try {
          const cityData = await fetchCityData(cityId);
          if (cityData) {
            setLoadedCities(prev => new Set([...prev, cityId]));
            console.log(`${cityId} 도시 데이터 로드 완료`);
          } else {
            console.error(`${cityId} 도시 데이터 로드 실패`);
          }
        } catch (error) {
          console.error(`${cityId} 도시 데이터 로드 오류:`, error);
        } finally {
          setLoading(false);
        }
      } else {
        console.log(`${cityId} 도시 데이터는 이미 캐시되어 있습니다.`);
      }
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
    // 먼저 도시별 캐시에서 데이터 확인
    if (cityDataCache[selectedCity]) {
      return cityDataCache[selectedCity];
    }
    
    // 캐시에 없으면 전체 데이터에서 추출
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
      
      // 추출된 데이터를 캐시에 저장
      if (Object.keys(filteredData).length > 0) {
        setCityDataCache(prev => ({
          ...prev,
          [selectedCity]: filteredData
        }));
      }
      
      return filteredData;
    }
    
    return {};
  };

  const getStatsFilteredData = () => {
    const data = getCurrentCityData();
    if (!data) return {};
    if (!statsSelectedRegions || statsSelectedRegions.length === 0) return {};
    const selectedSet = new Set(statsSelectedRegions);
    const filtered = {};
    Object.keys(data).forEach((k) => {
      if (selectedSet.has(k)) filtered[k] = data[k];
    });
    return filtered;
  };

  const toggleStatsRegion = (regionName) => {
    setStatsSelectedRegions((prev) => {
      if (prev.includes(regionName)) {
        return prev.filter((r) => r !== regionName);
      }
      return [...prev, regionName];
    });
  };

  // 현재 도시가 로딩 중인지 확인
  const isCurrentCityLoading = cityLoadingStates[selectedCity] || false;
  
  // 전체 로딩 상태 또는 현재 도시 로딩 상태
  const showLoading = loading || isCurrentCityLoading;

  return (
    <div className="App">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="main-content">
        <CitySelector 
          selectedCity={selectedCity} 
          onCityChange={handleCityChange}
          loadedCities={loadedCities}
          cityLoadingStates={cityLoadingStates}
        />
        
        {showLoading && <LoadingSpinner />}
        
        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}
        
        {!showLoading && allData && (
          <>
            {activeTab === 'rankings' && (
              <ApartmentRankings 
                allData={allData}
                currentCityData={getCurrentCityData()}
                selectedCity={selectedCity}
                dataTimestamp={dataTimestamp}
              />
            )}
            
            {activeTab === 'stats' && (
              <div className="stats-container">
                <h2>거래량 통계</h2>
                <p>선택된 도시: {selectedCity}</p>
                <p>로드된 도시: {Array.from(loadedCities).join(', ')}</p>
                <p>캐시된 도시: {Object.keys(cityDataCache).join(', ')}</p>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* 푸터 */}
      <footer className="footer">
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