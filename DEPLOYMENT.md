# 배포 가이드

## 1. GitHub 저장소 생성

1. GitHub.com에 로그인
2. "New repository" 클릭
3. 저장소 이름: `korean-real-estate-analysis`
4. Public으로 설정
5. README, .gitignore, license 추가하지 않음
6. "Create repository" 클릭

## 2. 로컬에서 원격 저장소 연결

```bash
# YOUR_USERNAME을 실제 GitHub 사용자명으로 변경
git remote set-url origin https://github.com/YOUR_USERNAME/korean-real-estate-analysis.git
git push -u origin main
```

## 3. 백엔드 배포 (Heroku)

### Heroku CLI 설치
```bash
# macOS
brew install heroku/brew/heroku

# 또는 https://devcenter.heroku.com/articles/heroku-cli 에서 다운로드
```

### Heroku 앱 생성 및 배포
```bash
# Heroku 로그인
heroku login

# 새 앱 생성
heroku create your-app-name

# 환경 변수 설정
heroku config:set REB_API_KEY=e1b390d074154e338da316499695b040

# 배포
git push heroku main

# 앱 실행
heroku open
```

## 4. 프론트엔드 배포 (Vercel)

### Vercel CLI 설치
```bash
npm install -g vercel
```

### Vercel 배포
```bash
# Vercel 로그인
vercel login

# 프로젝트 배포
vercel

# 환경 변수 설정 (Vercel 대시보드에서)
REACT_APP_API_URL=https://your-backend-url.herokuapp.com/api
```

## 5. 프론트엔드 배포 (Netlify)

### Netlify CLI 설치
```bash
npm install -g netlify-cli
```

### Netlify 배포
```bash
# Netlify 로그인
netlify login

# 사이트 배포
netlify deploy --prod --dir=frontend/build

# 환경 변수 설정 (Netlify 대시보드에서)
REACT_APP_API_URL=https://your-backend-url.herokuapp.com/api
```

## 6. 환경 변수 설정

### 백엔드 (Heroku)
```bash
heroku config:set REB_API_KEY=e1b390d074154e338da316499695b040
```

### 프론트엔드 (Vercel/Netlify)
- `REACT_APP_API_URL`: 백엔드 API URL

## 7. CORS 설정

백엔드에서 프론트엔드 도메인을 허용하도록 CORS 설정을 업데이트하세요.

## 8. 데이터베이스

현재 SQLite를 사용하고 있지만, 프로덕션에서는 PostgreSQL을 권장합니다.

```bash
# Heroku PostgreSQL 추가
heroku addons:create heroku-postgresql:hobby-dev
```

## 9. 모니터링

### Heroku 로그 확인
```bash
heroku logs --tail
```

### Vercel 로그 확인
```bash
vercel logs
```

## 10. 도메인 설정

### 커스텀 도메인 (선택사항)
- Vercel/Netlify 대시보드에서 커스텀 도메인 설정
- DNS 레코드 업데이트

## 문제 해결

### 빌드 오류
- Node.js 버전 확인
- 의존성 패키지 업데이트
- 환경 변수 설정 확인

### API 연결 오류
- CORS 설정 확인
- API URL 확인
- 네트워크 연결 확인

### 데이터베이스 오류
- 데이터베이스 연결 확인
- 마이그레이션 실행
- 권한 설정 확인 