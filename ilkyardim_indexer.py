#!/usr/bin/env python3
"""
İlkyardım FAISS Indexleme Sistemi
İlkyardım verilerini FAISS ile indexler ve arama yapar.
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
import re

# Logging ayarları
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class IlkyardimIndexer:
    def __init__(self, data_file: str = "Datas/ilkyardım.txt", index_dir: str = "faiss_index"):
        self.data_file = Path(data_file)
        self.index_dir = Path(index_dir)
        self.index_dir.mkdir(exist_ok=True)
        
        # Sentence transformer modeli
        try:
            self.model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
        except Exception as e:
            print(f"Model yükleme hatası, basit embedding kullanılıyor: {e}")
            self.model = None
        
        # FAISS index
        self.index = None
        self.documents = []
        self.metadata = []
        
        # Index dosya yolları
        self.index_file = self.index_dir / "ilkyardim.index"
        self.documents_file = self.index_dir / "ilkyardim_documents.pkl"
        self.metadata_file = self.index_dir / "ilkyardim_metadata.pkl"

    def parse_ilkyardim_text(self) -> List[Dict[str, Any]]:
        """İlkyardım txt dosyasını parse eder"""
        logger.info("İlkyardım metni parse ediliyor...")
        
        if not self.data_file.exists():
            logger.error(f"Dosya bulunamadı: {self.data_file}")
            return []
        
        try:
            # Farklı encoding'leri dene
            encodings = ['utf-8', 'cp1254', 'iso-8859-9', 'latin1']
            content = None
            
            for encoding in encodings:
                try:
                    with open(self.data_file, 'r', encoding=encoding) as f:
                        content = f.read()
                        logger.info(f"Dosya başarıyla okundu: {encoding}")
                        break
                except:
                    continue
            
            if content is None:
                raise Exception("Hiçbir encoding ile dosya okunamadı")
                
        except Exception as e:
            logger.error(f"Dosya okuma hatası: {e}")
            return []
        
        # Bölümleri ayır (başlıklar genellikle büyük harf ve numaralı)
        sections = []
        current_section = {"title": "", "content": "", "keywords": [], "category": ""}
        
        lines = content.split('\n')
        current_title = ""
        current_content = []
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Numara kaldır (line number prefix)
            if '|' in line:
                line = line.split('|', 1)[1] if '|' in line else line
            
            # Başlık tespiti (soru format veya numaralı başlık)
            if (line.endswith('?') or 
                line.endswith('nedir?') or 
                line.endswith('nelerdir?') or 
                line.endswith('nasıl') or
                re.match(r'^\([0-9]+\)', line) or
                line.isupper() and len(line) > 3):
                
                # Önceki bölümü kaydet
                if current_title and current_content:
                    section_content = '\n'.join(current_content)
                    category = self.categorize_content(current_title, section_content)
                    keywords = self.extract_keywords(current_title, section_content)
                    
                    sections.append({
                        "title": current_title,
                        "content": section_content,
                        "keywords": keywords,
                        "category": category,
                        "length": len(section_content)
                    })
                
                # Yeni bölüm başlat
                current_title = line
                current_content = []
            else:
                # İçerik satırları
                if line and not line.startswith('|'):
                    current_content.append(line)
        
        # Son bölümü ekle
        if current_title and current_content:
            section_content = '\n'.join(current_content)
            category = self.categorize_content(current_title, section_content)
            keywords = self.extract_keywords(current_title, section_content)
            
            sections.append({
                "title": current_title,
                "content": section_content,
                "keywords": keywords,
                "category": category,
                "length": len(section_content)
            })
        
        logger.info(f"Toplam {len(sections)} bölüm parse edildi")
        return sections

    def categorize_content(self, title: str, content: str) -> str:
        """İçeriği kategorize eder"""
        title_lower = title.lower()
        content_lower = content.lower()
        
        # Kategoriler
        if any(word in title_lower for word in ['temel yaşam', 'kalp', 'solunum', 'yapay solunum']):
            return "temel_yasam_destegi"
        elif any(word in title_lower for word in ['kanama', 'yara', 'kan']):
            return "kanama_yara"
        elif any(word in title_lower for word in ['kırık', 'çıkık', 'burkulma']):
            return "kemik_kas_yaralanma"
        elif any(word in title_lower for word in ['yanık', 'sıcak', 'donma']):
            return "isi_yaralanma"
        elif any(word in title_lower for word in ['bilinç', 'bayılma', 'koma']):
            return "bilinc_bozuklugu"
        elif any(word in title_lower for word in ['zehir', 'şofben', 'karbon']):
            return "zehirlenme"
        elif any(word in title_lower for word in ['hayvan', 'ısırma', 'sokma']):
            return "hayvan_yaralanma"
        elif any(word in title_lower for word in ['göz', 'kulak', 'burun', 'yabancı cisim']):
            return "yabanciisim"
        elif any(word in title_lower for word in ['boğulma', 'tıkanma']):
            return "bogulma_tikanma"
        elif any(word in title_lower for word in ['taşıma', 'sedye']):
            return "tasima_teknik"
        elif any(word in title_lower for word in ['ilkyardım nedir', 'tanım', 'amaç']):
            return "genel_bilgi"
        else:
            return "diger"

    def extract_keywords(self, title: str, content: str) -> List[str]:
        """Anahtar kelimeleri çıkarır"""
        # Önemli tıbbi terimler
        medical_terms = [
            'acil', 'yardım', 'kanama', 'kırık', 'yanık', 'bilinç', 'solunum', 'kalp',
            'nefes', 'yaralanma', 'hastane', 'ambulans', '112', 'masaj', 'pozisyon',
            'tedavi', 'kontrol', 'belirti', 'semptom', 'müdahale', 'uygulama'
        ]
        
        keywords = []
        text = (title + ' ' + content).lower()
        
        for term in medical_terms:
            if term in text:
                keywords.append(term)
        
        # Başlıktan önemli kelimeleri al
        title_words = re.findall(r'\b\w+\b', title.lower())
        keywords.extend([word for word in title_words if len(word) > 3])
        
        return list(set(keywords))

    def create_document_text(self, section: Dict[str, Any]) -> str:
        """Bölümden arama metni oluşturur"""
        text_parts = []
        
        # Başlık
        text_parts.append(f"Başlık: {section['title']}")
        
        # Kategori
        text_parts.append(f"Kategori: {section['category']}")
        
        # Anahtar kelimeler
        if section['keywords']:
            text_parts.append(f"Anahtar kelimeler: {', '.join(section['keywords'])}")
        
        # İçerik (ilk 500 karakter)
        content_preview = section['content'][:500] + "..." if len(section['content']) > 500 else section['content']
        text_parts.append(f"İçerik: {content_preview}")
        
        return " | ".join(text_parts)

    def prepare_data_for_indexing(self, sections: List[Dict[str, Any]]) -> Tuple[List[str], List[Dict[str, Any]]]:
        """Verileri indexleme için hazırlar"""
        logger.info("Veriler indexleme için hazırlanıyor...")
        
        documents = []
        metadata = []
        
        for i, section in enumerate(sections):
            # Doküman metni oluştur
            doc_text = self.create_document_text(section)
            documents.append(doc_text)
            
            # Metadata oluştur
            meta = {
                'id': i,
                'title': section['title'],
                'content': section['content'],
                'keywords': section['keywords'],
                'category': section['category'],
                'length': section['length'],
                'full_data': section
            }
            metadata.append(meta)
        
        logger.info(f"Toplam {len(documents)} doküman hazırlandı")
        return documents, metadata

    def create_embeddings(self, documents: List[str]) -> np.ndarray:
        """Dokümanlardan embedding'ler oluşturur"""
        logger.info("Embedding'ler oluşturuluyor...")
        
        if self.model is not None:
            embeddings = self.model.encode(documents, show_progress_bar=True)
        else:
            embeddings = self.create_simple_embeddings(documents)
        
        logger.info(f"Embedding boyutu: {embeddings.shape}")
        return embeddings
    
    def create_simple_embeddings(self, documents: List[str]) -> np.ndarray:
        """Basit TF-IDF benzeri embedding oluşturur"""
        from collections import Counter
        
        # Tüm kelimeleri topla
        all_words = set()
        doc_words = []
        
        for doc in documents:
            words = re.findall(r'\b\w+\b', doc.lower())
            doc_words.append(words)
            all_words.update(words)
        
        all_words = list(all_words)
        word_to_idx = {word: i for i, word in enumerate(all_words)}
        
        # TF-IDF benzeri vektörler oluştur
        embeddings = []
        for words in doc_words:
            word_counts = Counter(words)
            vector = np.zeros(len(all_words))
            
            for word, count in word_counts.items():
                if word in word_to_idx:
                    vector[word_to_idx[word]] = count / len(words)
            
            embeddings.append(vector)
        
        return np.array(embeddings)

    def build_index(self, embeddings: np.ndarray):
        """FAISS index oluşturur"""
        logger.info("FAISS index oluşturuluyor...")
        
        dimension = embeddings.shape[1]
        self.index = faiss.IndexFlatL2(dimension)
        self.index.add(embeddings.astype('float32'))
        
        logger.info(f"Index oluşturuldu: {self.index.ntotal} vektör")

    def save_index(self):
        """Index'i dosyaya kaydeder"""
        logger.info("Index kaydediliyor...")
        
        faiss.write_index(self.index, str(self.index_file))
        
        with open(self.documents_file, 'wb') as f:
            pickle.dump(self.documents, f)
        
        with open(self.metadata_file, 'wb') as f:
            pickle.dump(self.metadata, f)
        
        logger.info("Index başarıyla kaydedildi")

    def load_index(self) -> bool:
        """Index'i dosyadan yükler"""
        try:
            if not self.index_file.exists():
                return False
            
            logger.info("Index yükleniyor...")
            
            self.index = faiss.read_index(str(self.index_file))
            
            with open(self.documents_file, 'rb') as f:
                self.documents = pickle.load(f)
            
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
        if self.model is not None:
            query_embedding = self.model.encode([query])
        else:
            query_embedding = self.create_simple_embeddings([query])
        
        # Arama yap
        distances, indices = self.index.search(query_embedding.astype('float32'), k)
        
        # Sonuçları hazırla
        results = []
        for i, (distance, idx) in enumerate(zip(distances[0], indices[0])):
            if idx < len(self.metadata):
                result = {
                    'rank': i + 1,
                    'distance': float(distance),
                    'similarity': float(1 / (1 + distance)),
                    'document': self.documents[idx],
                    'metadata': self.metadata[idx]
                }
                results.append(result)
        
        return results

    def build_full_index(self):
        """Tam index oluşturma işlemi"""
        logger.info("İlkyardım tam index oluşturma işlemi başlatılıyor...")
        
        # Verileri parse et
        sections = self.parse_ilkyardim_text()
        
        if not sections:
            logger.error("Hiç veri parse edilemedi!")
            return
        
        # Verileri hazırla
        documents, metadata = self.prepare_data_for_indexing(sections)
        self.documents = documents
        self.metadata = metadata
        
        # Embedding'leri oluştur
        embeddings = self.create_embeddings(documents)
        
        # Index oluştur
        self.build_index(embeddings)
        
        # Index'i kaydet
        self.save_index()
        
        logger.info("İlkyardım index oluşturma tamamlandı!")

    def test_search(self):
        """Test aramaları yapar"""
        logger.info("Test aramaları yapılıyor...")
        
        test_queries = [
            "kalp masajı nasıl yapılır",
            "kanama nasıl durdurulur",
            "kırık tespit",
            "yanık tedavisi",
            "bilinç kaybı",
            "zehirlenme",
            "ilkyardım tanımı",
            "112 arama",
            "yaralanma"
        ]
        
        for query in test_queries:
            logger.info(f"\nArama: '{query}'")
            results = self.search(query, k=3)
            
            for result in results:
                logger.info(f"  {result['rank']}. {result['metadata']['title']} "
                          f"({result['metadata']['category']}) - Similarity: {result['similarity']:.3f}")

def main():
    """Ana fonksiyon"""
    indexer = IlkyardimIndexer()
    
    # Index var mı kontrol et
    if not indexer.load_index():
        logger.info("İlkyardım index bulunamadı, yeni index oluşturuluyor...")
        indexer.build_full_index()
    else:
        logger.info("Mevcut İlkyardım index yüklendi")
    
    # Test aramaları
    indexer.test_search()

if __name__ == "__main__":
    main()
