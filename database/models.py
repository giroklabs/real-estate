import sqlite3
from datetime import datetime

def init_db():
    """데이터베이스 초기화 및 테이블 생성"""
    conn = sqlite3.connect('realstate.db')
    cursor = conn.cursor()
    
    # 지역 테이블
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS regions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            region_name TEXT NOT NULL,
            region_code TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 거래 데이터 테이블
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            region_name TEXT NOT NULL,
            complex_name TEXT NOT NULL,
            transaction_count INTEGER DEFAULT 0,
            avg_price REAL DEFAULT 0,
            source TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 가격변동률 테이블
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS price_changes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            region_name TEXT NOT NULL,
            avg_price REAL DEFAULT 0,
            price_change_rate REAL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 기본 지역 데이터 삽입
    default_regions = [
        ('서울특별시', 'SEOUL'),
        ('부산광역시', 'BUSAN'),
        ('대구광역시', 'DAEGU'),
        ('인천광역시', 'INCHEON'),
        ('광주광역시', 'GWANGJU'),
        ('대전광역시', 'DAEJEON'),
        ('울산광역시', 'ULSAN'),
        ('세종특별자치시', 'SEJONG'),
        ('경기도', 'GYEONGGI'),
        ('강원도', 'GANGWON'),
        ('충청북도', 'CHUNGBUK'),
        ('충청남도', 'CHUNGNAM'),
        ('전라북도', 'JEONBUK'),
        ('전라남도', 'JEONNAM'),
        ('경상북도', 'GYEONGBUK'),
        ('경상남도', 'GYEONGNAM'),
        ('제주특별자치도', 'JEJU')
    ]
    
    cursor.execute('SELECT COUNT(*) FROM regions')
    if cursor.fetchone()[0] == 0:
        cursor.executemany('''
            INSERT INTO regions (region_name, region_code) 
            VALUES (?, ?)
        ''', default_regions)
    
    conn.commit()
    conn.close()

def save_transaction_data(data_list):
    """거래 데이터 저장"""
    conn = sqlite3.connect('realstate.db')
    cursor = conn.cursor()
    
    for data in data_list:
        cursor.execute('''
            INSERT INTO transactions 
            (date, region_name, complex_name, transaction_count, avg_price, source)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            data['date'],
            data['region_name'],
            data['complex_name'],
            data['transaction_count'],
            data['avg_price'],
            data['source']
        ))
    
    conn.commit()
    conn.close()

def save_price_change_data(data_list):
    """가격변동률 데이터 저장"""
    conn = sqlite3.connect('realstate.db')
    cursor = conn.cursor()
    
    for data in data_list:
        cursor.execute('''
            INSERT INTO price_changes 
            (date, region_name, avg_price, price_change_rate)
            VALUES (?, ?, ?, ?)
        ''', (
            data['date'],
            data['region_name'],
            data['avg_price'],
            data['price_change_rate']
        ))
    
    conn.commit()
    conn.close()

def get_latest_price_data(region_name, days=30):
    """최근 가격 데이터 조회"""
    conn = sqlite3.connect('realstate.db')
    cursor = conn.cursor()
    
    query = '''
        SELECT date, avg_price 
        FROM price_changes 
        WHERE region_name = ? 
        ORDER BY date DESC 
        LIMIT ?
    '''
    
    cursor.execute(query, (region_name, days))
    results = cursor.fetchall()
    conn.close()
    
    return [{'date': row[0], 'avg_price': row[1]} for row in results]

def calculate_price_change_rate(region_name):
    """가격변동률 계산"""
    conn = sqlite3.connect('realstate.db')
    cursor = conn.cursor()
    
    # 최근 30일과 이전 30일 평균 가격 비교
    cursor.execute('''
        SELECT 
            AVG(CASE WHEN date >= date('now', '-30 days') THEN avg_price END) as recent_avg,
            AVG(CASE WHEN date >= date('now', '-60 days') AND date < date('now', '-30 days') THEN avg_price END) as previous_avg
        FROM price_changes 
        WHERE region_name = ?
    ''', (region_name,))
    
    result = cursor.fetchone()
    conn.close()
    
    if result[0] and result[1] and result[1] > 0:
        return ((result[0] - result[1]) / result[1]) * 100
    return 0.0 