# 환경변수 설정 가이드

## 개인키 및 민감한 정보를 안전하게 관리하는 방법

### 1. 환경변수 파일 생성

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```bash
# 공공데이터포털 API 키
PUBLIC_DATA_API_KEY=ggUugQqwpC%2FkfXHvV9vkOBaq9LCD9XbNnzs3FZq%2FwiEOTPXZpz6cQZ1%2B2r7VWtTWTnkUaJhpdvPtGaHvtzw5xw%3D%3D

# REB API 키
REB_API_KEY=e1b390d074154e338da316499695b040

# 기타 설정
DEBUG=False
ENVIRONMENT=development
```

### 2. 환경변수 로드

Python에서 환경변수를 로드하려면 `python-dotenv`를 설치하고 사용하세요:

```bash
pip install python-dotenv
```

그리고 Python 코드 상단에 추가:

```python
from dotenv import load_dotenv
load_dotenv()
```

### 3. Git에 커밋하지 않기

`.env` 파일은 `.gitignore`에 이미 포함되어 있어 Git에 커밋되지 않습니다.

### 4. 배포 시 환경변수 설정

#### 로컬 개발
```bash
export PUBLIC_DATA_API_KEY="your_api_key_here"
export REB_API_KEY="your_reb_api_key_here"
```

#### Docker 사용 시
```bash
docker run -e PUBLIC_DATA_API_KEY="your_key" -e REB_API_KEY="your_key" your_image
```

#### 서버 배포 시
서버의 환경변수에 직접 설정하거나, 서비스 매니저(PM2, systemd 등)의 환경변수 설정을 사용하세요.

### 5. 보안 주의사항

- ✅ `.env` 파일을 Git에 커밋하지 마세요
- ✅ API 키를 코드에 하드코딩하지 마세요
- ✅ 환경변수 파일을 다른 개발자와 공유하지 마세요
- ✅ 프로덕션 환경에서는 더 강력한 보안 조치를 사용하세요

### 6. 문제 해결

환경변수가 로드되지 않는 경우:
1. `.env` 파일이 프로젝트 루트에 있는지 확인
2. `python-dotenv`가 설치되어 있는지 확인
3. `load_dotenv()`가 호출되었는지 확인
4. 환경변수 이름이 정확한지 확인
