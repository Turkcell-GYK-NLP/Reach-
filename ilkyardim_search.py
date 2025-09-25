#!/usr/bin/env python3
"""
İlkyardım FAISS Arama Scripti
CoreAgent için İlkyardım index'inde arama yapar.
"""

import sys
import json
import os
from pathlib import Path

# İlkyardım indexer'ı import et
sys.path.append(str(Path(__file__).parent))
from ilkyardim_indexer import IlkyardimIndexer

def main():
    if len(sys.argv) != 2:
        print(json.dumps([]))
        return
    
    query = sys.argv[1]
    
    try:
        # Indexer'ı başlat
        indexer = IlkyardimIndexer()
        
        # Index'i yükle
        if not indexer.load_index():
            # Index yoksa boş sonuç döndür
            print(json.dumps([]))
            return
        
        # Arama yap
        results = indexer.search(query, k=5)
        
        # Sonuçları JSON olarak döndür (indent olmadan)
        print(json.dumps(results, ensure_ascii=False))
        
    except Exception as e:
        # Hata durumunda boş sonuç döndür
        print(json.dumps([]))

if __name__ == "__main__":
    main()
