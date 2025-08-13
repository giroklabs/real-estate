import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Header from './components/Header';
import ApartmentRankings from './components/ApartmentRankings';
import LoadingSpinner from './components/LoadingSpinner';
import CitySelector from './components/CitySelector';
import './index.styles.css';
import './App.styles.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [allData, setAllData] = useState(null);
  const [selectedCity, setSelectedCity] = useState('busan');
  const [dataTimestamp, setDataTimestamp] = useState(null);

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      
      // 먼저 통합 데이터를 시도
      try {
        const integratedResponse = await axios.get(`${API_BASE_URL}/integrated-data`);
        if (integratedResponse.data.status === 'success') {
          setAllData(integratedResponse.data.data);
          setDataTimestamp(integratedResponse.data.metadata.collection_date);
          console.log('통합 데이터 로드 완료');
          return;
        }
      } catch (error) {
        console.log('통합 데이터 로드 실패, 기존 API로 폴백');
      }
      
      // 통합 데이터가 없으면 기존 API로 폴백
      let dataResponse = await axios.get(`${API_BASE_URL}/busan-incheon-seoul-daegu-bucheon-data`);
      
      if (dataResponse.data.status === 'success') {
        setAllData(dataResponse.data.data);
        setDataTimestamp('2025-08-11 17:20:31'); // 부천 데이터 수집 일시
        console.log('부산+인천+서울+대구+부천 데이터 로드 완료');
      } else {
        // 부천 데이터가 없으면 기존 데이터로 폴백
        dataResponse = await axios.get(`${API_BASE_URL}/busan-incheon-seoul-daegu-data`);
        if (dataResponse.data.status === 'success') {
          setAllData(dataResponse.data.data);
          setDataTimestamp('2025-08-11 12:24:45'); // 대구 데이터 수집 일시
          console.log('부산+인천+서울+대구 데이터 로드 완료 (부천 데이터 없음)');
        } else {
          // 대구 데이터도 없으면 기존 데이터로 폴백
          dataResponse = await axios.get(`${API_BASE_URL}/busan-incheon-seoul-data`);
          if (dataResponse.data.status === 'success') {
            setAllData(dataResponse.data.data);
            setDataTimestamp('2025-08-10 16:48:52'); // 서울 데이터 수집 일시
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
    fetchAllData();
  }, [fetchAllData]);

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

  return (
    <div className="App">
      <Header />
      
      {error && (
        <div className="error-message">
          <p>⚠️ {error}</p>
        </div>
      )}

      {loading && <LoadingSpinner />}

      <main className="main-content">
        <div className="sidebar">
          <CitySelector 
            onCityChange={handleCityChange}
            selectedCity={selectedCity}
            loading={loading}
          />
        </div>
        
        <div className="main-panel">
          <ApartmentRankings 
            allData={allData}
            currentCityData={getCurrentCityData()}
            selectedCity={selectedCity}
            dataTimestamp={dataTimestamp}
          />
        </div>
      </main>
      
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