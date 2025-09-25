"""
Flask Web API Örneği
Hastane verilerini REST API olarak sunar
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import sys
import os

# Hospital API modüllerini import et
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from enhanced_hospital_fetcher import (
    get_all_istanbul_hospitals_detailed, 
    EnhancedHospitalFetcher,
    EXTENDED_TURKISH_CITIES
)

app = Flask(__name__)
CORS(app)  # CORS desteği

# Cache için basit global değişken
cached_hospitals = None

@app.route('/api/hospitals', methods=['GET'])
def get_hospitals():
    """Tüm İstanbul hastanelerini döner"""
    global cached_hospitals
    
    try:
        if cached_hospitals is None:
            hospitals = get_all_istanbul_hospitals_detailed()
            cached_hospitals = []
            
            for h in hospitals:
                cached_hospitals.append({
                    'id': h.osm_id,
                    'name': h.name,
                    'type': h.facility_type,
                    'phone': h.phone,
                    'address': h.address,
                    'coordinates': {
                        'latitude': h.latitude,
                        'longitude': h.longitude
                    },
                    'emergency': h.emergency,
                    'website': h.website,
                    'operator': h.operator,
                    'beds': h.beds
                })
        
        return jsonify({
            'success': True,
            'count': len(cached_hospitals),
            'data': cached_hospitals
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/hospitals/search', methods=['GET'])
def search_hospitals():
    """Hastane arama"""
    query = request.args.get('q', '').lower()
    
    if not query:
        return jsonify({
            'success': False,
            'error': 'Arama terimi gerekli'
        }), 400
    
    try:
        global cached_hospitals
        if cached_hospitals is None:
            # Cache yoksa önce yükle
            get_hospitals()
        
        # Arama yap
        results = [
            h for h in cached_hospitals 
            if query in h['name'].lower()
        ]
        
        return jsonify({
            'success': True,
            'query': query,
            'count': len(results),
            'data': results
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/hospitals/nearby', methods=['GET'])
def get_nearby_hospitals():
    """Koordinat çevresindeki hastaneler"""
    try:
        lat = float(request.args.get('lat'))
        lon = float(request.args.get('lon'))
        radius = float(request.args.get('radius', 5))  # 5km varsayılan
        
        fetcher = EnhancedHospitalFetcher()
        hospitals = fetcher.get_hospitals_around_point(lat, lon, radius)
        
        results = []
        for h in hospitals:
            results.append({
                'id': h.osm_id,
                'name': h.name,
                'phone': h.phone,
                'address': h.address,
                'coordinates': {
                    'latitude': h.latitude,
                    'longitude': h.longitude
                },
                'emergency': h.emergency,
                'distance_info': f"{radius}km yarıçap içinde"
            })
        
        return jsonify({
            'success': True,
            'center': {'lat': lat, 'lon': lon},
            'radius_km': radius,
            'count': len(results),
            'data': results
        })
        
    except ValueError:
        return jsonify({
            'success': False,
            'error': 'Geçersiz koordinat bilgileri'
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/hospitals/with-phone', methods=['GET'])
def get_hospitals_with_phone():
    """Sadece telefon numarası olan hastaneler"""
    try:
        global cached_hospitals
        if cached_hospitals is None:
            get_hospitals()
        
        with_phone = [h for h in cached_hospitals if h['phone']]
        
        return jsonify({
            'success': True,
            'count': len(with_phone),
            'data': with_phone
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/hospitals/emergency', methods=['GET'])
def get_emergency_hospitals():
    """Acil servisi olan hastaneler"""
    try:
        global cached_hospitals
        if cached_hospitals is None:
            get_hospitals()
        
        emergency_hospitals = [
            h for h in cached_hospitals 
            if h['emergency'] and h['emergency'].lower() in ['yes', 'true', '24/7']
        ]
        
        return jsonify({
            'success': True,
            'count': len(emergency_hospitals),
            'data': emergency_hospitals
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/cities', methods=['GET'])
def get_supported_cities():
    """Desteklenen şehirler"""
    return jsonify({
        'success': True,
        'cities': list(EXTENDED_TURKISH_CITIES.keys())
    })

@app.route('/api/refresh', methods=['POST'])
def refresh_cache():
    """Cache'i temizle"""
    global cached_hospitals
    cached_hospitals = None
    
    return jsonify({
        'success': True,
        'message': 'Cache temizlendi'
    })

@app.route('/', methods=['GET'])
def home():
    """API ana sayfa"""
    return jsonify({
        'message': 'Hospital API',
        'version': '1.0',
        'endpoints': {
            'GET /api/hospitals': 'Tüm hastaneler',
            'GET /api/hospitals/search?q=terme': 'Hastane arama',
            'GET /api/hospitals/nearby?lat=41.0&lon=29.0&radius=5': 'Çevredeki hastaneler',
            'GET /api/hospitals/with-phone': 'Telefon numarası olan hastaneler',
            'GET /api/hospitals/emergency': 'Acil servisi olan hastaneler',
            'GET /api/cities': 'Desteklenen şehirler',
            'POST /api/refresh': 'Cache temizle'
        }
    })

if __name__ == '__main__':
    print("🏥 Hospital API başlatılıyor...")
    print("📍 Endpoints:")
    print("   http://localhost:5000/api/hospitals")
    print("   http://localhost:5000/api/hospitals/search?q=florence")
    print("   http://localhost:5000/api/hospitals/nearby?lat=41.0369&lon=28.9850&radius=2")
    print("   http://localhost:5000/api/hospitals/with-phone")
    print("   http://localhost:5000/api/hospitals/emergency")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
