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
            print(json.dumps([]))
            return
        
        # Arama yap
        results = indexer.search(query, k=5)
        
        # Sonuçları JSON olarak döndür (indent olmadan)
        print(json.dumps(results, ensure_ascii=False))
        
    except Exception as e:
        print(json.dumps([]))

if __name__ == "__main__":
    main()
