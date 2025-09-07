#!/usr/bin/env python3
"""
FAISS Indexleme Sistemi
Toplanma alanları verilerini FAISS ile indexler ve arama yapar.
"""

import os
import json
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
from pathlib import Path
import logging
from typing import List, Dict, Any, Tuple
import pickle

# Logging ayarları
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ToplanmaAlanlariIndexer:
    def __init__(self, data_dir: str = "new_datas", index_dir: str = "faiss_index"):
        self.data_dir = Path(data_dir)
        self.index_dir = Path(index_dir)
        self.index_dir.mkdir(exist_ok=True)
        
        # Sentence transformer modeli
        self.model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
        
        # FAISS index
        self.index = None
        self.documents = []
        self.metadata = []
        
        # Index dosya yolları
        self.index_file = self.index_dir / "toplanma_alanlari.index"
        self.documents_file = self.index_dir / "documents.pkl"
        self.metadata_file = self.index_dir / "metadata.pkl"

    def load_json_data(self) -> List[Dict[str, Any]]:
        """JSON dosyalarından verileri yükler"""
        logger.info("JSON dosyaları yükleniyor...")
        
        all_data = []
        
        for json_file in self.data_dir.glob("*.json"):
            if json_file.name == "00_ozet.json":
                continue
                
            try:
                with open(json_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    all_data.append(data)
                    logger.info(f"Yüklendi: {json_file.name} - {len(data.get('toplanma_alanlari', []))} alan")
            except Exception as e:
                logger.error(f"Hata: {json_file.name} - {e}")
        
        return all_data

    def create_document_text(self, alan: Dict[str, Any], ilce: str) -> str:
        """Alan bilgisinden arama metni oluşturur"""
        text_parts = []
        
        # Temel bilgiler
        text_parts.append(f"İlçe: {ilce}")
        text_parts.append(f"Alan adı: {alan.get('ad', '')}")
        text_parts.append(f"Mahalle: {alan.get('mahalle', '')}")
        
        # Koordinat bilgisi
        koordinat = alan.get('koordinat', {})
        if koordinat.get('lat', 0) != 0 and koordinat.get('lng', 0) != 0:
            text_parts.append(f"Koordinat: {koordinat['lat']}, {koordinat['lng']}")
        
        # Alan bilgileri
        alan_bilgileri = alan.get('alan_bilgileri', {})
        if alan_bilgileri.get('toplam_alan', 0) > 0:
            text_parts.append(f"Toplam alan: {alan_bilgileri['toplam_alan']} m²")
        
        # Altyapı bilgileri
        altyapi = alan.get('altyapi', {})
        altyapi_list = []
        if altyapi.get('elektrik'):
            altyapi_list.append("elektrik")
        if altyapi.get('su'):
            altyapi_list.append("su")
        if altyapi.get('wc'):
            altyapi_list.append("WC")
        if altyapi.get('kanalizasyon'):
            altyapi_list.append("kanalizasyon")
        
        if altyapi_list:
            text_parts.append(f"Altyapı: {', '.join(altyapi_list)}")
        
        # Ulaşım bilgileri
        ulasim = alan.get('ulasim', {})
        if ulasim.get('yol_durumu'):
            text_parts.append(f"Yol durumu: {ulasim['yol_durumu']}")
        
        # Özellikler
        ozellikler = alan.get('ozellikler', {})
        if ozellikler.get('tur'):
            text_parts.append(f"Tür: {ozellikler['tur']}")
        if ozellikler.get('durum'):
            text_parts.append(f"Durum: {ozellikler['durum']}")
        if ozellikler.get('aciklama'):
            text_parts.append(f"Açıklama: {ozellikler['aciklama']}")
        
        return " | ".join(text_parts)

    def prepare_data_for_indexing(self, all_data: List[Dict[str, Any]]) -> Tuple[List[str], List[Dict[str, Any]]]:
        """Verileri indexleme için hazırlar"""
        logger.info("Veriler indexleme için hazırlanıyor...")
        
        documents = []
        metadata = []
        
        for data in all_data:
            ilce = data.get('ilce', '')
            toplanma_alanlari = data.get('toplanma_alanlari', [])
            
            for alan in toplanma_alanlari:
                # Doküman metni oluştur
                doc_text = self.create_document_text(alan, ilce)
                documents.append(doc_text)
                
                # Metadata oluştur
                meta = {
                    'ilce': ilce,
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
                metadata.append(meta)
        
        logger.info(f"Toplam {len(documents)} doküman hazırlandı")
        return documents, metadata

    def create_embeddings(self, documents: List[str]) -> np.ndarray:
        """Dokümanlardan embedding'ler oluşturur"""
        logger.info("Embedding'ler oluşturuluyor...")
        
        embeddings = self.model.encode(documents, show_progress_bar=True)
        logger.info(f"Embedding boyutu: {embeddings.shape}")
        
        return embeddings

    def build_index(self, embeddings: np.ndarray):
        """FAISS index oluşturur"""
        logger.info("FAISS index oluşturuluyor...")
        
        # Index boyutu
        dimension = embeddings.shape[1]
        
        # FAISS index oluştur (L2 distance için)
        self.index = faiss.IndexFlatL2(dimension)
        
        # Embedding'leri index'e ekle
        self.index.add(embeddings.astype('float32'))
        
        logger.info(f"Index oluşturuldu: {self.index.ntotal} vektör")

    def save_index(self):
        """Index'i dosyaya kaydeder"""
        logger.info("Index kaydediliyor...")
        
        # FAISS index'i kaydet
        faiss.write_index(self.index, str(self.index_file))
        
        # Dokümanları kaydet
        with open(self.documents_file, 'wb') as f:
            pickle.dump(self.documents, f)
        
        # Metadata'yı kaydet
        with open(self.metadata_file, 'wb') as f:
            pickle.dump(self.metadata, f)
        
        logger.info("Index başarıyla kaydedildi")

    def load_index(self) -> bool:
        """Index'i dosyadan yükler"""
        try:
            if not self.index_file.exists():
                return False
            
            logger.info("Index yükleniyor...")
            
            # FAISS index'i yükle
            self.index = faiss.read_index(str(self.index_file))
            
            # Dokümanları yükle
            with open(self.documents_file, 'rb') as f:
                self.documents = pickle.load(f)
            
            # Metadata'yı yükle
            with open(self.metadata_file, 'rb') as f:
                self.metadata = pickle.load(f)
            
            logger.info(f"Index yüklendi: {self.index.ntotal} vektör")
            return True
            
        except Exception as e:
            logger.error(f"Index yükleme hatası: {e}")
            return False

    def search(self, query: str, k: int = 5) -> List[Dict[str, Any]]:
        """Arama yapar"""
        if self.index is None:
            logger.error("Index yüklenmemiş!")
            return []
        
        # Query embedding'i oluştur
        query_embedding = self.model.encode([query])
        
        # Arama yap
        distances, indices = self.index.search(query_embedding.astype('float32'), k)
        
        # Sonuçları hazırla
        results = []
        for i, (distance, idx) in enumerate(zip(distances[0], indices[0])):
            if idx < len(self.metadata):
                result = {
                    'rank': i + 1,
                    'distance': float(distance),
                    'similarity': float(1 / (1 + distance)),  # Similarity score
                    'document': self.documents[idx],
                    'metadata': self.metadata[idx]
                }
                results.append(result)
        
        return results

    def build_full_index(self):
        """Tam index oluşturma işlemi"""
        logger.info("Tam index oluşturma işlemi başlatılıyor...")
        
        # Verileri yükle
        all_data = self.load_json_data()
        
        # Verileri hazırla
        documents, metadata = self.prepare_data_for_indexing(all_data)
        self.documents = documents
        self.metadata = metadata
        
        # Embedding'leri oluştur
        embeddings = self.create_embeddings(documents)
        
        # Index oluştur
        self.build_index(embeddings)
        
        # Index'i kaydet
        self.save_index()
        
        logger.info("Index oluşturma tamamlandı!")

    def test_search(self):
        """Test aramaları yapar"""
        logger.info("Test aramaları yapılıyor...")
        
        test_queries = [
            "Kadıköy'de park",
            "elektrik ve su olan alanlar",
            "büyük toplanma alanları",
            "Üsküdar mahalle",
            "koordinat bilgisi olan alanlar"
        ]
        
        for query in test_queries:
            logger.info(f"\nArama: '{query}'")
            results = self.search(query, k=3)
            
            for result in results:
                logger.info(f"  {result['rank']}. {result['metadata']['alan_adi']} "
                          f"({result['metadata']['ilce']}) - Similarity: {result['similarity']:.3f}")

def main():
    """Ana fonksiyon"""
    indexer = ToplanmaAlanlariIndexer()
    
    # Index var mı kontrol et
    if not indexer.load_index():
        logger.info("Index bulunamadı, yeni index oluşturuluyor...")
        indexer.build_full_index()
    else:
        logger.info("Mevcut index yüklendi")
    
    # Test aramaları
    indexer.test_search()

if __name__ == "__main__":
    main()
