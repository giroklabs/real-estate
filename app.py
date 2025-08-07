from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
import json
from datetime import datetime, timedelta
import os
from database.models import init_db
from crawlers.reb_api_crawler import REBAPICrawler

app = Flask(__name__)
CORS(app)

# 데이터베이스 초기화
init_db()

@app.route('/api/health', methods=['GET'])
def health_check():
    """서버 상태 확인"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

@app.route('/api/regions', methods=['GET'])
def get_regions():
    """지역 목록 조회"""
    conn = sqlite3.connect('realstate.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT DISTINCT region_name, region_code 
        FROM regions 
        ORDER BY region_name
    ''')
    
    regions = [{'name': row[0], 'code': row[1]} for row in cursor.fetchall()]
    conn.close()
    
    return jsonify(regions)

@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    """거래 데이터 조회"""
    region = request.args.get('region', '')
    start_date = request.args.get('start_date', '')
    end_date = request.args.get('end_date', '')
    
    conn = sqlite3.connect('realstate.db')
    cursor = conn.cursor()
    
    query = '''
        SELECT 
            t.date,
            t.region_name,
            t.complex_name,
            t.transaction_count,
            t.avg_price,
            t.source
        FROM transactions t
        WHERE 1=1
    '''
    params = []
    
    if region:
        query += ' AND t.region_name = ?'
        params.append(region)
    
    if start_date:
        query += ' AND t.date >= ?'
        params.append(start_date)
    
    if end_date:
        query += ' AND t.date <= ?'
        params.append(end_date)
    
    query += ' ORDER BY t.date DESC'
    
    cursor.execute(query, params)
    transactions = []
    
    for row in cursor.fetchall():
        transactions.append({
            'date': row[0],
            'region_name': row[1],
            'complex_name': row[2],
            'transaction_count': row[3],
            'avg_price': row[4],
            'source': row[5]
        })
    
    conn.close()
    return jsonify(transactions)

@app.route('/api/price-changes', methods=['GET'])
def get_price_changes():
    """가격변동률 데이터 조회"""
    region = request.args.get('region', '')
    period = request.args.get('period', '30')  # 기본 30일
    
    conn = sqlite3.connect('realstate.db')
    cursor = conn.cursor()
    
    query = '''
        SELECT 
            date,
            region_name,
            avg_price,
            price_change_rate
        FROM price_changes
        WHERE 1=1
    '''
    params = []
    
    if region:
        query += ' AND region_name = ?'
        params.append(region)
    
    query += ' ORDER BY date DESC LIMIT ?'
    params.append(int(period))
    
    cursor.execute(query, params)
    price_changes = []
    
    for row in cursor.fetchall():
        price_changes.append({
            'date': row[0],
            'region_name': row[1],
            'avg_price': row[2],
            'price_change_rate': row[3]
        })
    
    conn.close()
    return jsonify(price_changes)

@app.route('/api/crawl', methods=['POST'])
def start_crawling():
    """크롤링 작업 시작"""
    try:
        data = request.get_json()
        sources = data.get('sources', ['reb_api'])
        regions = data.get('regions', [])
        
        # REB API 크롤러 사용
        reb_crawler = REBAPICrawler()
        results = reb_crawler.crawl_all_regions(regions)
        
        return jsonify({
            'status': 'success',
            'message': 'REB API 데이터 수집이 완료되었습니다.',
            'results': results
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/statistics', methods=['GET'])
def get_statistics():
    """통계 데이터 조회"""
    region = request.args.get('region', '')
    
    conn = sqlite3.connect('realstate.db')
    cursor = conn.cursor()
    
    # 전체 거래량
    query = '''
        SELECT 
            COUNT(*) as total_transactions,
            AVG(avg_price) as avg_price,
            SUM(transaction_count) as total_count
        FROM transactions
        WHERE 1=1
    '''
    params = []
    
    if region:
        query += ' AND region_name = ?'
        params.append(region)
    
    cursor.execute(query, params)
    stats = cursor.fetchone()
    
    # 최근 30일 가격변동률
    cursor.execute('''
        SELECT AVG(price_change_rate) 
        FROM price_changes 
        WHERE date >= date('now', '-30 days')
    ''')
    price_change = cursor.fetchone()[0] or 0
    
    conn.close()
    
    return jsonify({
        'total_transactions': stats[0],
        'avg_price': stats[1],
        'total_count': stats[2],
        'price_change_30d': price_change
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(debug=False, host='0.0.0.0', port=port) 