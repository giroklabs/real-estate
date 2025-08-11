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
- Gunicorn (프로덕션 서버)

### Frontend
- React.js
- Chart.js (데이터 시각화)
- Axios (API 통신)
- Custom CSS (스타일링)

### 배포
- Fly.io (백엔드)
- Docker 컨테이너
- GitHub Actions (CI/CD)

## 설치 및 실행

### 1. 로컬 개발 환경

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
cd frontend

# 의존성 설치
npm install

# 프론트엔드 실행
npm start
```

## 배포

### Fly.io 배포

#### 자동 배포 (권장)
```bash
# 배포 스크립트 실행
./deploy.sh
```

#### 수동 배포
```bash
# 1. Fly CLI 설치
curl -L https://fly.io/install.sh | sh

# 2. 로그인
fly auth login

# 3. 앱 생성 (최초 1회)
fly apps create realstate-app --org personal

# 4. 볼륨 생성 (최초 1회)
fly volumes create realstate_data --size 10 --region nrt

# 5. 환경 변수 설정
fly secrets set MOBILE_API_KEY="your_key"
fly secrets set MOBILE_API_SECRET="your_secret"
fly secrets set REB_API_KEY="your_key"

# 6. 배포
fly deploy
```

### 환경 변수 설정

`env.example` 파일을 참고하여 필요한 환경 변수를 설정하세요:

```bash
# API 키들
MOBILE_API_KEY=your_mobile_api_key
MOBILE_API_SECRET=your_mobile_api_secret
REB_API_KEY=your_reb_api_key

# 앱 설정
FLASK_APP=app.py
FLASK_ENV=production
PORT=5001
```

## 프로젝트 구조

```
realstate/
├── app.py                 # Flask 백엔드 메인
├── crawlers/             # API 모듈
│   ├── reb_api_crawler.py
│   ├── molit_api_crawler.py
│   └── web_scraper.py
├── database/             # 데이터베이스 관련
│   └── models.py
├── frontend/             # React 프론트엔드
├── services/             # 비즈니스 로직
├── collected_data/       # 수집된 데이터
├── requirements.txt      # Python 의존성
├── Dockerfile           # Docker 설정
├── fly.toml             # Fly.io 설정
├── deploy.sh            # 배포 스크립트
└── README.md
```

## CI/CD

GitHub Actions를 통해 자동 배포가 설정되어 있습니다:

- `main` 브랜치에 푸시 시 자동 배포
- 테스트 및 빌드 검증
- Fly.io 자동 배포

## 모니터링

```bash
# 앱 상태 확인
fly status

# 로그 확인
fly logs

# SSH 접속
fly ssh console

# 앱 URL
https://realstate-app.fly.dev
```

## 주의사항

- 부동산통계정보 Open API의 이용약관을 준수해주세요
- API 호출 제한을 고려하여 적절한 간격을 두고 요청해주세요
- 네트워크 연결이 필요합니다
- 개인정보 보호를 위해 민감한 정보는 수집하지 않습니다
- 프로덕션 환경에서는 환경 변수를 secrets로 관리하세요 