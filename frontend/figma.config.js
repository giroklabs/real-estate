// Figma 연동 설정 파일
module.exports = {
  // 피그마 파일 ID (실제 피그마 파일 ID로 교체 필요)
  figmaFileId: 'YOUR_FIGMA_FILE_ID',
  
  // 피그마 액세스 토큰 (환경변수에서 가져옴)
  figmaAccessToken: process.env.REACT_APP_FIGMA_ACCESS_TOKEN,
  
  // 디자인 토큰 설정
  designTokens: {
    colors: true,
    typography: true,
    spacing: true,
    shadows: true,
    borders: true
  },
  
  // 컴포넌트 매핑
  componentMapping: {
    'Header': 'header-component',
    'CitySelector': 'city-selector',
    'Dashboard': 'dashboard-layout',
    'TransactionTable': 'data-table',
    'MonthlyVolumeChart': 'chart-component'
  },
  
  // 출력 설정
  output: {
    cssVariables: true,
    scssVariables: false,
    jsonTokens: true,
    reactComponents: false
  }
};

