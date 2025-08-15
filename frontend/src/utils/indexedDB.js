// IndexedDB 데이터베이스 관리
class RealEstateDB {
  constructor() {
    this.dbName = 'RealEstateDB';
    this.version = 1;
    this.storeName = 'realEstateData';
  }

  // 데이터베이스 열기
  async openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  // 데이터 저장
  async saveData(data, timestamp) {
    const db = await this.openDB();
    const transaction = db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    
    const dataToStore = {
      id: 'current',
      data: data,
      timestamp: timestamp,
      lastUpdated: Date.now()
    };
    
    await store.put(dataToStore);
    console.log('IndexedDB에 데이터 저장 완료');
  }

  // 데이터 로드
  async loadData() {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get('current');
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const result = request.result;
          if (result && this.isCacheValid(result.lastUpdated)) {
            console.log('IndexedDB에서 캐시된 데이터 로드');
            resolve({
              data: result.data,
              timestamp: result.timestamp
            });
          } else {
            resolve(null);
          }
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('IndexedDB 데이터 로드 오류:', error);
      return null;
    }
  }

  // 캐시 유효성 검사 (24시간)
  isCacheValid(lastUpdated) {
    const now = Date.now();
    const cacheAge = now - lastUpdated;
    const maxAge = 24 * 60 * 60 * 1000; // 24시간
    return cacheAge < maxAge;
  }

  // 캐시 삭제
  async clearCache() {
    const db = await this.openDB();
    const transaction = db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    await store.clear();
    console.log('IndexedDB 캐시 삭제 완료');
  }
}

export default new RealEstateDB();
