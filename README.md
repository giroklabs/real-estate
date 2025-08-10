# 한국 부동산 데이터 분석 웹사이트

부동산통계정보(reb.or.kr)의 Open API를 활용하여 지역별 아파트 거래량과 가격변동률을 분석하는 웹사이트입니다.

## 주요 기능

- 부동산통계정보 Open API 활용
- 지역별 아파트 실거래가 데이터 수집
- 가격지수 및 변동률 분석
- 실시간 데이터 시각화
- 반응형 웹 인터페이스

## 기술 스택

### Backend
- Python Flask
- Requests (API 호출)
- XML 파싱
- SQLite (데이터 저장)
- Pandas (데이터 처리)

### Frontend
- React.js
- Chart.js (데이터 시각화)
- Axios (API 통신)
- Custom CSS (스타일링)

## 설치 및 실행

### 1. 백엔드 설정

```bash
# Python 가상환경 생성
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 백엔드 실행
python app.py
```

### 2. 프론트엔드 설정

```bash
# React 앱 생성
npx create-react-app frontend
cd frontend

# 의존성 설치
npm install axios chart.js react-chartjs-2

# 프론트엔드 실행
npm start
```

## 프로젝트 구조

```
realstate/
├── app.py                 # Flask 백엔드 메인
├── crawlers/             # API 모듈
│   └── reb_api_crawler.py
├── database/             # 데이터베이스 관련
│   └── models.py
├── frontend/             # React 프론트엔드
├── requirements.txt      # Python 의존성
└── README.md
```

## 환경변수 설정

### API 키 관리

프로젝트에서 사용하는 API 키는 환경변수로 관리됩니다. `.env` 파일을 생성하고 다음 내용을 추가하세요:

```bash
# 공공데이터포털 API 키
PUBLIC_DATA_API_KEY=your_api_key_here

# REB API 키  
REB_API_KEY=your_reb_api_key_here
```

### 환경변수 로드

`python-dotenv`가 자동으로 `.env` 파일을 로드합니다. 별도 설정이 필요하지 않습니다.

## 주의사항

- 부동산통계정보 Open API의 이용약관을 준수해주세요
- API 호출 제한을 고려하여 적절한 간격을 두고 요청해주세요
- 네트워크 연결이 필요합니다
- 개인정보 보호를 위해 민감한 정보는 수집하지 않습니다
- **중요**: `.env` 파일은 Git에 커밋하지 마세요. `.gitignore`에 이미 포함되어 있습니다. 