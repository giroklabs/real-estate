# 카페24 배포 가이드

## 📋 배포 완료 상태

### ✅ 완료된 작업
1. **GitHub 업로드 완료**
   - 최신 코드가 GitHub에 업로드됨
   - 커밋 ID: `99c290d`
   - 모든 도시 데이터 수집기 및 통합 시스템 포함

2. **프론트엔드 빌드 완료**
   - React 앱이 성공적으로 빌드됨
   - 빌드 파일 위치: `frontend/build/`
   - 배포 준비 완료된 정적 파일 생성

## 🚀 카페24 배포 방법

### 방법 1: 프론트엔드만 카페24에 배포 (권장)

#### 1단계: 카페24 파일매니저에 업로드
1. 카페24 관리자 페이지 로그인
2. 파일매니저 접속
3. `frontend/build/` 폴더의 모든 파일을 웹 디렉토리에 업로드
   ```
   build/
   ├── static/
   │   ├── css/
   │   ├── js/
   │   └── media/
   ├── index.html
   ├── manifest.json
   └── robots.txt
   ```

#### 2단계: API 서버 별도 배포
- **추천 플랫폼**: Railway, Render, PythonAnywhere
- **현재 API 서버**: Flask 앱 (`app.py`)
- **배포 시 필요한 파일들**:
  - `app.py`
  - `requirements.txt`
  - `Procfile`
  - `crawlers/` 폴더
  - `database/` 폴더
  - `services/` 폴더

#### 3단계: API 엔드포인트 설정
프론트엔드에서 API 서버 URL을 별도 배포된 서버로 변경

### 방법 2: 전체 애플리케이션을 다른 플랫폼에 배포

#### Railway 배포 (추천)
1. Railway 계정 생성
2. GitHub 연동
3. 프로젝트 배포
4. 환경변수 설정

#### Render 배포
1. Render 계정 생성
2. GitHub 연동
3. Web Service로 배포
4. 환경변수 설정

## 🔧 현재 프로젝트 구조

```
realstate/
├── app.py                    # Flask API 서버
├── requirements.txt          # Python 의존성
├── Procfile                 # 웹서버 설정
├── frontend/
│   └── build/               # 배포용 정적 파일 (✅ 생성완료)
├── crawlers/                # 데이터 수집 모듈
├── database/                # 데이터베이스 모델
├── services/                # 비즈니스 로직
└── collected_data/          # 수집된 데이터
```

## 📊 수집된 데이터 현황

### 포함된 도시 데이터
- 서울 (25개 구)
- 부산 (16개 구/군)
- 인천 (10개 구/군)
- 대구 (8개 구/군)
- 부천 (3개 구)
- 성남 (3개 구)
- 구리시
- 수원시
- 안양시
- 대전시
- 광주시
- 용인시

### 데이터 특징
- 아파트 실거래가 정보
- 지역별 평균가격 및 거래량
- 월별 가격 변동률
- 아파트 단지별 상세 정보

## 🌐 API 엔드포인트

### 주요 API
- `/api/health` - 서버 상태 확인
- `/api/integrated-data` - 통합 데이터 조회
- `/api/all-cities-data` - 모든 도시 데이터
- `/api/apartments/rankings` - 아파트 순위
- `/api/regions` - 지역 목록
- `/api/statistics` - 통계 정보

## 💡 추천 배포 전략

### 단계별 배포
1. **1단계**: 프론트엔드만 카페24에 배포하여 UI 테스트
2. **2단계**: API 서버를 Railway/Render에 배포
3. **3단계**: 도메인 연결 및 HTTPS 설정
4. **4단계**: CDN 설정 및 성능 최적화

### 비용 고려사항
- **카페24**: 프론트엔드 호스팅 (기존 요금제 내)
- **Railway**: API 서버 호스팅 (월 $5~ / 무료 티어 있음)
- **총 비용**: 월 5-10달러 예상

## 🔒 보안 및 환경 설정

### 필요한 환경변수
```
FLASK_ENV=production
PORT=5000
DATABASE_URL=sqlite:///realstate.db
```

### API 키 설정 (필요시)
- 국토교통부 API 키
- 공공데이터포털 API 키

## 📝 다음 단계

1. **배포 방법 선택**
   - 카페24 + 별도 API 서버
   - 또는 전체를 다른 플랫폼에 배포

2. **API 서버 배포** (카페24 + 별도 서버 선택 시)
   - Railway/Render 계정 생성
   - GitHub 연동
   - 환경변수 설정

3. **도메인 연결**
   - 서브도메인 설정
   - HTTPS 인증서 설정

4. **모니터링 설정**
   - 서버 상태 모니터링
   - 오류 로깅 설정

## 📞 지원

배포 과정에서 문제가 발생하면:
1. GitHub Issues에 문제 등록
2. 로그 파일 확인
3. API 서버 상태 점검

---

**배포 준비 완료!** 🎉
- GitHub: ✅ 업로드 완료
- 프론트엔드 빌드: ✅ 완료
- 배포 가이드: ✅ 작성 완료
