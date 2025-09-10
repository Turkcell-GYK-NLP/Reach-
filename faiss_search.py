#!/usr/bin/env python3
"""
FAISS Arama Scripti
WebSearchTool için FAISS index'inde arama yapar.
"""

import sys
import json
import os
from pathlib import Path

# FAISS indexer'ı import et
sys.path.append(str(Path(__file__).parent))
from faiss_indexer import ToplanmaAlanlariIndexer

def fallback_search(query: str) -> list:
    """FAISS başarısız olursa JSON dosyalarından direkt arama"""
    import glob
    import re
    
    query_lower = query.lower()
    results = []
    
    # Tüm JSON dosyalarını tara
    for json_file in glob.glob("new_datas/*.json"):
        if json_file.endswith("00_ozet.json"):
            continue
            
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            ilce = data.get('ilce', '').lower()
            toplanma_alanlari = data.get('toplanma_alanlari', [])
            
            # İlçe eşleşmesi kontrol et
            if query_lower in ilce or ilce in query_lower:
                for alan in toplanma_alanlari:
                    alan_adi = alan.get('ad', '').lower()
                    mahalle = alan.get('mahalle', '').lower()
                    
                    # Alan adı veya mahalle eşleşmesi
                    if (query_lower in alan_adi or query_lower in mahalle or 
                        'toplanma' in query_lower or 'alan' in query_lower):
                        
                        result = {
                            'rank': len(results) + 1,
                            'distance': 0.0,
                            'similarity': 1.0,
                            'document': f"İlçe: {data.get('ilce', '')} | Alan adı: {alan.get('ad', '')} | Mahalle: {alan.get('mahalle', '')}",
                            'metadata': {
                                'ilce': data.get('ilce', ''),
                                'alan_id': alan.get('id', ''),
                                'alan_adi': alan.get('ad', ''),
                                'mahalle': alan.get('mahalle', ''),
                                'koordinat': alan.get('koordinat', {}),
                                'alan_bilgileri': alan.get('alan_bilgileri', {}),
                                'altyapi': alan.get('altyapi', {}),
                                'ulasim': alan.get('ulasim', {}),
                                'ozellikler': alan.get('ozellikler', {}),
                                'full_data': alan
                            }
                        }
                        results.append(result)
                        
                        if len(results) >= 5:  # Maksimum 5 sonuç
                            break
        except Exception as e:
            continue
    
    return results

def main():
    if len(sys.argv) != 2:
        print(json.dumps([]))
        return
    
    query = sys.argv[1]
    
    try:
        # Indexer'ı başlat
        indexer = ToplanmaAlanlariIndexer()
        
        # Index'i yükle
        if not indexer.load_index():
            # Index yoksa fallback kullan
            results = fallback_search(query)
            print(json.dumps(results, ensure_ascii=False))
            return
        
        # Arama yap
        results = indexer.search(query, k=20)  # Daha fazla sonuç al
        
        # İlçe adına göre filtreleme yap
        query_lower = query.lower()
        district_matches = []
        other_results = []
        
        # Önce ilçe eşleşmelerini bul
        for result in results:
            ilce = result['metadata'].get('ilce', '').lower()
            if ilce in query_lower:
                district_matches.append(result)
            else:
                other_results.append(result)
        
        # İlçe eşleşmelerini önce, diğerlerini sonra ekle
        results = district_matches + other_results
        
        # İlk 5 sonucu al
        results = results[:5]
        
        # Eğer ilçe eşleşmesi yoksa fallback kullan
        if not district_matches:
            results = fallback_search(query)
        
        # Sonuçları JSON olarak döndür (indent olmadan)
        print(json.dumps(results, ensure_ascii=False))
        
    except Exception as e:
        # Hata durumunda fallback kullan
        results = fallback_search(query)
        print(json.dumps(results, ensure_ascii=False))

if __name__ == "__main__":
    main()
