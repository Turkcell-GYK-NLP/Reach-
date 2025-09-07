#!/usr/bin/env python3
"""
Toplanma Alanları Veri Dönüştürücü
Farklı formatlardaki toplanma alanı verilerini ortak JSON formatına dönüştürür.
"""

import os
import json
import pandas as pd
import PyPDF2
import docx
from pathlib import Path
import re
from typing import Dict, List, Any
import logging

# Logging ayarları
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ToplanmaAlanlariConverter:
    def __init__(self, input_dir: str = "Datas", output_dir: str = "new_datas"):
        self.input_dir = Path(input_dir)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        # Ortak JSON şeması
        self.common_schema = {
            "ilce": "",
            "toplanma_alanlari": []
        }
        
        # Toplanma alanı şeması
        self.alan_schema = {
            "id": "",
            "ad": "",
            "mahalle": "",
            "koordinat": {
                "lat": 0.0,
                "lng": 0.0
            },
            "alan_bilgileri": {
                "toplam_alan": 0,
                "kullanilabilir_alan": 0,
                "kapasite": 0
            },
            "altyapi": {
                "elektrik": False,
                "su": False,
                "wc": False,
                "kanalizasyon": False
            },
            "ulasim": {
                "yol_durumu": "",
                "ulasim_tipi": []
            },
            "ozellikler": {
                "tur": "",
                "durum": "",
                "tabela_kodu": "",
                "aciklama": ""
            }
        }

    def extract_district_name(self, filename: str) -> str:
        """Dosya adından ilçe adını çıkarır"""
        return Path(filename).stem

    def process_csv_file(self, file_path: Path) -> Dict[str, Any]:
        """CSV dosyalarını işler"""
        logger.info(f"CSV dosyası işleniyor: {file_path}")
        
        try:
            df = pd.read_csv(file_path, encoding='utf-8')
        except UnicodeDecodeError:
            df = pd.read_csv(file_path, encoding='latin-1')
        
        district_name = self.extract_district_name(file_path.name)
        result = {
            "ilce": district_name,
            "toplanma_alanlari": []
        }
        
        for _, row in df.iterrows():
            alan = self.create_alan_from_csv_row(row, district_name)
            if alan:
                result["toplanma_alanlari"].append(alan)
        
        logger.info(f"CSV'den {len(result['toplanma_alanlari'])} alan çıkarıldı")
        return result

    def create_alan_from_csv_row(self, row: pd.Series, district_name: str) -> Dict[str, Any]:
        """CSV satırından alan objesi oluşturur"""
        alan = self.alan_schema.copy()
        
        # Farklı CSV formatları için uyumlu mapping
        column_mapping = {
            'ad': ['AD', 'Veri Adi', 'ad', 'name'],
            'mahalle': ['MAHALLE ADI', 'Mahalle Adi', 'mahalle', 'neighborhood'],
            'lat': ['ENLEM', 'Enlem', 'lat', 'latitude'],
            'lng': ['BOYLAM', 'Boylam', 'lng', 'longitude'],
            'toplam_alan': ['TOPLAM ALAN', 'Toplam Alani (m2)', 'alan', 'area'],
            'elektrik': ['ELEKTRIK', 'Elektrik', 'elektrik', 'electricity'],
            'su': ['SU', 'Su', 'su', 'water'],
            'wc': ['WC/KANALIZASYON', 'WC / KANALIZASYON', 'wc', 'toilet'],
            'yol_durumu': ['YOL DURUMU', 'Yol Durumu', 'yol', 'road'],
            'tur': ['TUR', 'Tur', 'tur', 'type'],
            'durum': ['DURUM', 'Durum', 'durum', 'status']
        }
        
        # Kolonları bul ve değerleri ata
        for field, possible_columns in column_mapping.items():
            for col in possible_columns:
                if col in row.index and pd.notna(row[col]):
                    if field in ['lat', 'lng']:
                        try:
                            alan['koordinat'][field] = float(row[col])
                        except (ValueError, TypeError):
                            pass
                    elif field in ['toplam_alan']:
                        try:
                            alan['alan_bilgileri'][field] = float(row[col])
                        except (ValueError, TypeError):
                            pass
                    elif field in ['elektrik', 'su', 'wc']:
                        alan['altyapi'][field] = str(row[col]).lower() in ['var', 'yes', 'true', '1']
                    elif field == 'yol_durumu':
                        alan['ulasim'][field] = str(row[col])
                    elif field in ['tur', 'durum']:
                        alan['ozellikler'][field] = str(row[col])
                    else:
                        alan[field] = str(row[col])
                    break
        
        # ID oluştur
        alan['id'] = f"{district_name}_{len(alan['ad'])}"
        
        # Koordinat kontrolü
        if alan['koordinat']['lat'] == 0.0 or alan['koordinat']['lng'] == 0.0:
            logger.warning(f"Koordinat bulunamadı: {alan['ad']}")
            return None
        
        return alan

    def process_xlsx_file(self, file_path: Path) -> Dict[str, Any]:
        """XLSX dosyalarını işler"""
        logger.info(f"XLSX dosyası işleniyor: {file_path}")
        
        try:
            df = pd.read_excel(file_path)
        except Exception as e:
            logger.error(f"XLSX okuma hatası: {e}")
            return {"ilce": self.extract_district_name(file_path.name), "toplanma_alanlari": []}
        
        district_name = self.extract_district_name(file_path.name)
        result = {
            "ilce": district_name,
            "toplanma_alanlari": []
        }
        
        for _, row in df.iterrows():
            alan = self.create_alan_from_csv_row(row, district_name)  # Aynı logic
            if alan:
                result["toplanma_alanlari"].append(alan)
        
        logger.info(f"XLSX'den {len(result['toplanma_alanlari'])} alan çıkarıldı")
        return result

    def process_pdf_file(self, file_path: Path) -> Dict[str, Any]:
        """PDF dosyalarını işler"""
        logger.info(f"PDF dosyası işleniyor: {file_path}")
        
        district_name = self.extract_district_name(file_path.name)
        result = {
            "ilce": district_name,
            "toplanma_alanlari": []
        }
        
        try:
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                text = ""
                
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
                
                # PDF'den toplanma alanı bilgilerini çıkar
                alanlar = self.extract_areas_from_pdf_text(text, district_name)
                result["toplanma_alanlari"] = alanlar
                
        except Exception as e:
            logger.error(f"PDF okuma hatası: {e}")
        
        logger.info(f"PDF'den {len(result['toplanma_alanlari'])} alan çıkarıldı")
        return result

    def extract_areas_from_pdf_text(self, text: str, district_name: str) -> List[Dict[str, Any]]:
        """PDF metninden toplanma alanı bilgilerini çıkarır"""
        alanlar = []
        
        # Farklı PDF formatları için özel işleme
        if district_name.lower() == 'bağcılar':
            alanlar = self.extract_bagcilar_format(text, district_name)
        elif district_name.lower() == 'ataşehir':
            alanlar = self.extract_atasehir_format(text, district_name)
        elif district_name.lower() == 'fatih':
            alanlar = self.extract_fatih_format(text, district_name)
        elif district_name.lower() == 'sarıyer':
            alanlar = self.extract_sariyer_format(text, district_name)
        elif district_name.lower() == 'sultanbeyli':
            alanlar = self.extract_sultanbeyli_format(text, district_name)
        elif district_name.lower() == 'üsküdar':
            alanlar = self.extract_uskudar_format(text, district_name)
        else:
            # Genel format
            alanlar = self.extract_general_pdf_format(text, district_name)
        
        return alanlar

    def extract_bagcilar_format(self, text: str, district_name: str) -> List[Dict[str, Any]]:
        """Bağcılar PDF formatını işler"""
        alanlar = []
        lines = text.split('\n')
        
        for line in lines:
            line = line.strip()
            if not line or len(line) < 10:
                continue
                
            # Satır numarası ile başlayan satırları işle
            if re.match(r'^\d+\s+', line):
                parts = line.split()
                if len(parts) >= 3:
                    try:
                        satir_no = int(parts[0])
                        remaining = ' '.join(parts[1:])
                        
                        # Mahalle adını bul
                        mahalle_match = re.search(r'([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+(?:Mahallesi|Mah\.))', remaining)
                        mahalle = mahalle_match.group(1).strip() if mahalle_match else ""
                        
                        # Park adını bul
                        park_patterns = [
                            r'([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+(?:Parkı|Park|Alanı|Alan|Meydanı|Meydan|Lisesi|Okulu|Okul|Stadyumu|Sahası|Saha))',
                            r'([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+(?:İlköğretim|Anadolu|Meslek|Teknik))'
                        ]
                        
                        park_adi = ""
                        for pattern in park_patterns:
                            park_match = re.search(pattern, remaining)
                            if park_match:
                                park_adi = park_match.group(1).strip()
                                break
                        
                        if park_adi:
                            alan = self.alan_schema.copy()
                            alan['id'] = f"{district_name}_pdf_{satir_no}"
                            alan['ad'] = park_adi
                            alan['mahalle'] = mahalle
                            alan['koordinat']['lat'] = 0.0
                            alan['koordinat']['lng'] = 0.0
                            alan['ozellikler']['tur'] = "Toplanma Alanı"
                            alan['ozellikler']['durum'] = "Aktif"
                            
                            alanlar.append(alan)
                            
                    except (ValueError, IndexError):
                        continue
        
        return alanlar

    def extract_atasehir_format(self, text: str, district_name: str) -> List[Dict[str, Any]]:
        """Ataşehir PDF formatını işler"""
        alanlar = []
        lines = text.split('\n')
        
        for line in lines:
            line = line.strip()
            if not line or len(line) < 10:
                continue
            
            # Mahalle ve park bilgilerini çıkar
            if 'Mh.' in line and ('Park' in line or 'Lisesi' in line or 'Okulu' in line):
                # Mahalle adını bul
                mahalle_match = re.search(r'([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+Mh\.)', line)
                mahalle = mahalle_match.group(1).strip() if mahalle_match else ""
                
                # Park/alan adını bul
                park_patterns = [
                    r'([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+(?:Parkı|Park|Alanı|Alan|Lisesi|Okulu|Okul|Kulübü|Sahası|Saha))',
                    r'([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+(?:İlköğretim|Anadolu|Meslek|Teknik|Üniversitesi))'
                ]
                
                park_adi = ""
                for pattern in park_patterns:
                    park_match = re.search(pattern, line)
                    if park_match:
                        park_adi = park_match.group(1).strip()
                        break
                
                if park_adi:
                    alan = self.alan_schema.copy()
                    alan['id'] = f"{district_name}_pdf_{len(alanlar)+1}"
                    alan['ad'] = park_adi
                    alan['mahalle'] = mahalle
                    alan['koordinat']['lat'] = 0.0
                    alan['koordinat']['lng'] = 0.0
                    alan['ozellikler']['tur'] = "Toplanma Alanı"
                    alan['ozellikler']['durum'] = "Aktif"
                    
                    alanlar.append(alan)
        
        return alanlar

    def extract_fatih_format(self, text: str, district_name: str) -> List[Dict[str, Any]]:
        """Fatih PDF formatını işler"""
        alanlar = []
        lines = text.split('\n')
        
        for line in lines:
            line = line.strip()
            if not line or len(line) < 10:
                continue
            
            # "Acil Durum Toplanma Alanı" ile başlayan satırları işle
            if 'Acil Durum Toplanma Alanı' in line:
                # Park adını bul
                park_patterns = [
                    r'([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+(?:Parkı|Park|Alanı|Alan|Meydanı|Meydan|Stadyumu|Sahası|Saha))',
                    r'([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+(?:Çukurbostan|Anıt|Şehir))'
                ]
                
                park_adi = ""
                for pattern in park_patterns:
                    park_match = re.search(pattern, line)
                    if park_match:
                        park_adi = park_match.group(1).strip()
                        break
                
                # Mahalle adını bul
                mahalle_match = re.search(r'([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+Mh\.)', line)
                mahalle = mahalle_match.group(1).strip() if mahalle_match else ""
                
                if park_adi:
                    alan = self.alan_schema.copy()
                    alan['id'] = f"{district_name}_pdf_{len(alanlar)+1}"
                    alan['ad'] = park_adi
                    alan['mahalle'] = mahalle
                    alan['koordinat']['lat'] = 0.0
                    alan['koordinat']['lng'] = 0.0
                    alan['ozellikler']['tur'] = "Toplanma Alanı"
                    alan['ozellikler']['durum'] = "Aktif"
                    
                    alanlar.append(alan)
        
        return alanlar

    def extract_sariyer_format(self, text: str, district_name: str) -> List[Dict[str, Any]]:
        """Sarıyer PDF formatını işler"""
        alanlar = []
        lines = text.split('\n')
        
        for line in lines:
            line = line.strip()
            if not line or len(line) < 10:
                continue
            
            # Koordinat içeren satırları işle
            coord_match = re.search(r'(\d+\.\d+)\s+(\d+\.\d+)', line)
            if coord_match:
                lat = float(coord_match.group(1))
                lng = float(coord_match.group(2))
                
                # Park adını bul
                park_patterns = [
                    r'([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+(?:Parkı|Park|Alanı|Alan|Meydanı|Meydan|Lisesi|Okulu|Okul|Stadyumu|Sahası|Saha))',
                    r'([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+(?:İlköğretim|Anadolu|Meslek|Teknik|Üniversitesi))'
                ]
                
                park_adi = ""
                for pattern in park_patterns:
                    park_match = re.search(pattern, line)
                    if park_match:
                        park_adi = park_match.group(1).strip()
                        break
                
                # Mahalle adını bul
                mahalle_match = re.search(r'([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+(?:MAH|MH|MAHALLE))', line)
                mahalle = mahalle_match.group(1).strip() if mahalle_match else ""
                
                if park_adi:
                    alan = self.alan_schema.copy()
                    alan['id'] = f"{district_name}_pdf_{len(alanlar)+1}"
                    alan['ad'] = park_adi
                    alan['mahalle'] = mahalle
                    alan['koordinat']['lat'] = lat
                    alan['koordinat']['lng'] = lng
                    alan['ozellikler']['tur'] = "Toplanma Alanı"
                    alan['ozellikler']['durum'] = "Aktif"
                    
                    alanlar.append(alan)
        
        return alanlar

    def extract_sultanbeyli_format(self, text: str, district_name: str) -> List[Dict[str, Any]]:
        """Sultanbeyli PDF formatını işler"""
        alanlar = []
        lines = text.split('\n')
        
        for line in lines:
            line = line.strip()
            if not line or len(line) < 10:
                continue
            
            # Park adı ve alan bilgisi içeren satırları işle
            if 'Parkı' in line and 'm2' in line:
                # Park adını bul
                park_match = re.search(r'([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+Parkı)', line)
                park_adi = park_match.group(1).strip() if park_match else ""
                
                # Mahalle adını bul
                mahalle_match = re.search(r'([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+Mahallesi)', line)
                mahalle = mahalle_match.group(1).strip() if mahalle_match else ""
                
                # Alan bilgisini bul
                alan_match = re.search(r'(\d+)\s*m2', line)
                alan_m2 = float(alan_match.group(1)) if alan_match else 0.0
                
                if park_adi:
                    alan = self.alan_schema.copy()
                    alan['id'] = f"{district_name}_pdf_{len(alanlar)+1}"
                    alan['ad'] = park_adi
                    alan['mahalle'] = mahalle
                    alan['koordinat']['lat'] = 0.0
                    alan['koordinat']['lng'] = 0.0
                    alan['alan_bilgileri']['toplam_alan'] = alan_m2
                    alan['ozellikler']['tur'] = "Toplanma Alanı"
                    alan['ozellikler']['durum'] = "Aktif"
                    
                    alanlar.append(alan)
        
        return alanlar

    def extract_uskudar_format(self, text: str, district_name: str) -> List[Dict[str, Any]]:
        """Üsküdar PDF formatını işler"""
        alanlar = []
        lines = text.split('\n')
        
        for line in lines:
            line = line.strip()
            if not line or len(line) < 10:
                continue
            
            # S.NO ile başlayan satırları işle
            if re.match(r'^\d+\s+', line):
                parts = line.split()
                if len(parts) >= 3:
                    try:
                        satir_no = int(parts[0])
                        remaining = ' '.join(parts[1:])
                        
                        # Park adını bul
                        park_patterns = [
                            r'([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+(?:PARKI|PARK|ALANI|ALAN|MEYDANI|MEYDAN|LİSESİ|OKULU|OKUL|STADYUMU|SAHASI|SAHA))',
                            r'([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+(?:İLKÖĞRETİM|ANADOLU|MESLEK|TEKNİK|ÜNİVERSİTESİ))'
                        ]
                        
                        park_adi = ""
                        for pattern in park_patterns:
                            park_match = re.search(pattern, remaining)
                            if park_match:
                                park_adi = park_match.group(1).strip()
                                break
                        
                        # Mahalle adını bul
                        mahalle_match = re.search(r'([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+(?:MAH|MH|MAHALLE))', remaining)
                        mahalle = mahalle_match.group(1).strip() if mahalle_match else ""
                        
                        # Koordinat bilgisini bul
                        coord_match = re.search(r'(\d+,\d+)\s+(\d+,\d+)', remaining)
                        lat = float(coord_match.group(1).replace(',', '.')) if coord_match else 0.0
                        lng = float(coord_match.group(2).replace(',', '.')) if coord_match else 0.0
                        
                        if park_adi:
                            alan = self.alan_schema.copy()
                            alan['id'] = f"{district_name}_pdf_{satir_no}"
                            alan['ad'] = park_adi
                            alan['mahalle'] = mahalle
                            alan['koordinat']['lat'] = lat
                            alan['koordinat']['lng'] = lng
                            alan['ozellikler']['tur'] = "Toplanma Alanı"
                            alan['ozellikler']['durum'] = "Aktif"
                            
                            alanlar.append(alan)
                            
                    except (ValueError, IndexError):
                        continue
        
        return alanlar

    def extract_general_pdf_format(self, text: str, district_name: str) -> List[Dict[str, Any]]:
        """Genel PDF formatını işler"""
        alanlar = []
        lines = text.split('\n')
        
        for line in lines:
            line = line.strip()
            if not line or len(line) < 10:
                continue
            
            # Park/alan adı pattern'leri
            park_patterns = [
                r'([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+(?:Parkı|Park|Alanı|Alan|Meydanı|Meydan|Lisesi|Okulu|Okul|Stadyumu|Sahası|Saha))',
                r'([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+(?:İlköğretim|Anadolu|Meslek|Teknik))'
            ]
            
            for pattern in park_patterns:
                park_match = re.search(pattern, line)
                if park_match:
                    park_adi = park_match.group(1).strip()
                    
                    # Mahalle adını bul
                    mahalle_match = re.search(r'([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+(?:Mahallesi|Mah\.|Mh\.))', line)
                    mahalle = mahalle_match.group(1).strip() if mahalle_match else ""
                    
                    alan = self.alan_schema.copy()
                    alan['id'] = f"{district_name}_pdf_{len(alanlar)+1}"
                    alan['ad'] = park_adi
                    alan['mahalle'] = mahalle
                    alan['koordinat']['lat'] = 0.0
                    alan['koordinat']['lng'] = 0.0
                    alan['ozellikler']['tur'] = "Toplanma Alanı"
                    alan['ozellikler']['durum'] = "Aktif"
                    
                    alanlar.append(alan)
                    break
        
        return alanlar

    def process_rtf_file(self, file_path: Path) -> Dict[str, Any]:
        """RTF dosyalarını işler"""
        logger.info(f"RTF dosyası işleniyor: {file_path}")
        
        district_name = self.extract_district_name(file_path.name)
        result = {
            "ilce": district_name,
            "toplanma_alanlari": []
        }
        
        try:
            # RTF dosyasını basit metin olarak oku
            with open(file_path, 'r', encoding='utf-8') as file:
                content = file.read()
            
            # RTF formatından temizle
            clean_text = re.sub(r'\\\\[a-z]+\d*', '', content)
            clean_text = re.sub(r'[{}]', '', clean_text)
            clean_text = re.sub(r'\\\\', '', clean_text)
            clean_text = re.sub(r'\\[a-z]+\d*', '', clean_text)
            clean_text = re.sub(r'Width\d+', '', clean_text)
            clean_text = re.sub(r'-108', '', clean_text)
            
            # Metinden alan bilgilerini çıkar
            alanlar = self.extract_areas_from_rtf_text(clean_text, district_name)
            result["toplanma_alanlari"] = alanlar
            
        except Exception as e:
            logger.error(f"RTF okuma hatası: {e}")
        
        logger.info(f"RTF'den {len(result['toplanma_alanlari'])} alan çıkarıldı")
        return result

    def extract_areas_from_rtf_text(self, text: str, district_name: str) -> List[Dict[str, Any]]:
        """RTF metninden toplanma alanı bilgilerini çıkarır"""
        alanlar = []
        
        # RTF'den mahalle ve park bilgilerini çıkar
        lines = text.split('\n')
        current_mahalle = ""
        
        for line in lines:
            line = line.strip()
            if not line or len(line) < 3:
                continue
            
            # Mahalle adı pattern'i
            mahalle_match = re.search(r'([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+(?:MAH\.|MH\.|MAHALLE))', line)
            if mahalle_match:
                current_mahalle = mahalle_match.group(1).strip()
                continue
            
            # Park adı pattern'i
            park_patterns = [
                r'([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+(?:PARKI|PARK|ALANI|ALAN|MEYDANI|MEYDAN))',
                r'([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+(?:KORULUĞU|KORULUK|BAHÇESİ|BAHÇE))'
            ]
            
            for pattern in park_patterns:
                park_match = re.search(pattern, line)
                if park_match:
                    park_adi = park_match.group(1).strip()
                    
                    # Alan objesi oluştur
                    alan = self.alan_schema.copy()
                    alan['id'] = f"{district_name}_rtf_{len(alanlar)+1}"
                    alan['ad'] = park_adi
                    alan['mahalle'] = current_mahalle
                    alan['koordinat']['lat'] = 0.0  # Koordinat yok
                    alan['koordinat']['lng'] = 0.0  # Koordinat yok
                    alan['ozellikler']['tur'] = "Toplanma Alanı"
                    alan['ozellikler']['durum'] = "Aktif"
                    
                    alanlar.append(alan)
                    break
        
        return alanlar

    def process_file(self, file_path: Path) -> Dict[str, Any]:
        """Dosya tipine göre işleme yapar"""
        extension = file_path.suffix.lower()
        
        if extension == '.csv':
            return self.process_csv_file(file_path)
        elif extension == '.xlsx':
            return self.process_xlsx_file(file_path)
        elif extension == '.pdf':
            return self.process_pdf_file(file_path)
        elif extension == '.rtf':
            return self.process_rtf_file(file_path)
        else:
            logger.warning(f"Desteklenmeyen dosya formatı: {extension}")
            return {"ilce": self.extract_district_name(file_path.name), "toplanma_alanlari": []}

    def save_json(self, data: Dict[str, Any], filename: str):
        """JSON dosyası olarak kaydeder"""
        output_path = self.output_dir / f"{filename}.json"
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        logger.info(f"JSON kaydedildi: {output_path}")

    def convert_all_files(self):
        """Tüm dosyaları dönüştürür"""
        logger.info("Toplanma alanları dönüştürme işlemi başlatılıyor...")
        
        total_areas = 0
        
        for file_path in self.input_dir.iterdir():
            if file_path.is_file():
                logger.info(f"İşleniyor: {file_path.name}")
                
                try:
                    result = self.process_file(file_path)
                    self.save_json(result, file_path.stem)
                    total_areas += len(result['toplanma_alanlari'])
                    
                except Exception as e:
                    logger.error(f"Dosya işleme hatası {file_path.name}: {e}")
        
        # Özet JSON oluştur
        summary = {
            "toplam_ilce": len(list(self.input_dir.iterdir())),
            "toplam_alan": total_areas,
            "olusturma_tarihi": pd.Timestamp.now().isoformat(),
            "aciklama": "İstanbul ilçeleri toplanma alanları veritabanı"
        }
        
        self.save_json(summary, "00_ozet")
        
        logger.info(f"Dönüştürme tamamlandı! Toplam {total_areas} alan işlendi.")
        return total_areas

def main():
    """Ana fonksiyon"""
    converter = ToplanmaAlanlariConverter()
    total_areas = converter.convert_all_files()
    
    print(f"\n✅ Dönüştürme tamamlandı!")
    print(f"📊 Toplam {total_areas} toplanma alanı işlendi")
    print(f"📁 Çıktı klasörü: {converter.output_dir}")
    print(f"📄 JSON dosyaları hazır!")

if __name__ == "__main__":
    main()
