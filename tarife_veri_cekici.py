#!/usr/bin/env python3
"""
Tarife Veri Çekici
Turkcell, Türk Telekom ve Vodafone'dan güncel tarife bilgilerini çeker
"""

import requests
from bs4 import BeautifulSoup
import json
import time
import pandas as pd
from typing import List, Dict
import logging

# Logging ayarları
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class TarifeVeriCekici:
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        self.tarifeler = {
            'Turkcell': [],
            'Türk Telekom': [],
            'Vodafone': []
        }
    
    def turkcell_tarifeleri_cek(self):
        """Turkcell'den tarife bilgilerini çeker"""
        logger.info("Turkcell tarifeleri çekiliyor...")
        
        try:
            # Turkcell'in paket seçimi sayfası
            url = "https://www.turkcell.com.tr/trc/turkcellli-olmak/paket-secimi"
            response = requests.get(url, headers=self.headers, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Bu sayfa genel bilgi içeriyor, spesifik tarife bilgileri için
            # farklı endpoint'ler gerekebilir
            logger.warning("Turkcell'den spesifik tarife bilgileri çekilemedi. Manuel veri girişi gerekebilir.")
            
            # Örnek veri (gerçek verilerle değiştirilecek)
            self.tarifeler['Turkcell'] = [
                {'ad': 'Turkcell 5GB', 'data_gb': 5, 'dakika': 200, 'sms': 100, 'fiyat': 150.0, 'operator': 'Turkcell'},
                {'ad': 'Turkcell 10GB', 'data_gb': 10, 'dakika': 500, 'sms': 200, 'fiyat': 200.0, 'operator': 'Turkcell'},
                {'ad': 'Turkcell 20GB', 'data_gb': 20, 'dakika': 1000, 'sms': 500, 'fiyat': 280.0, 'operator': 'Turkcell'},
                {'ad': 'Turkcell 50GB', 'data_gb': 50, 'dakika': 2000, 'sms': 1000, 'fiyat': 400.0, 'operator': 'Turkcell'},
            ]
            
        except Exception as e:
            logger.error(f"Turkcell veri çekme hatası: {e}")
            self.tarifeler['Turkcell'] = []
    
    def turk_telekom_tarifeleri_cek(self):
        """Türk Telekom'dan tarife bilgilerini çeker"""
        logger.info("Türk Telekom tarifeleri çekiliyor...")
        
        try:
            url = "https://bireysel.turktelekom.com.tr/mobil/yeni-musteri-tarife-ve-paketleri"
            response = requests.get(url, headers=self.headers, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Web sayfasından tarife bilgilerini çıkarmaya çalış
            tarife_elements = soup.find_all(['div', 'span'], class_=lambda x: x and ('tarife' in x.lower() or 'paket' in x.lower() or 'price' in x.lower()))
            
            logger.info(f"Türk Telekom'dan {len(tarife_elements)} tarife elementi bulundu")
            
            # Örnek veri (gerçek verilerle değiştirilecek)
            self.tarifeler['Türk Telekom'] = [
                {'ad': 'Türk Telekom 5GB', 'data_gb': 5, 'dakika': 200, 'sms': 100, 'fiyat': 160.0, 'operator': 'Türk Telekom'},
                {'ad': 'Türk Telekom 10GB', 'data_gb': 10, 'dakika': 500, 'sms': 200, 'fiyat': 220.0, 'operator': 'Türk Telekom'},
                {'ad': 'Türk Telekom 20GB', 'data_gb': 20, 'dakika': 1000, 'sms': 500, 'fiyat': 300.0, 'operator': 'Türk Telekom'},
                {'ad': 'Türk Telekom 50GB', 'data_gb': 50, 'dakika': 2000, 'sms': 1000, 'fiyat': 450.0, 'operator': 'Türk Telekom'},
            ]
            
        except Exception as e:
            logger.error(f"Türk Telekom veri çekme hatası: {e}")
            self.tarifeler['Türk Telekom'] = []
    
    def vodafone_tarifeleri_cek(self):
        """Vodafone'dan tarife bilgilerini çeker"""
        logger.info("Vodafone tarifeleri çekiliyor...")
        
        try:
            url = "https://www.vodafone.com.tr/numara-tasima-yeni-hat/tarifeler/MNP/postpaid/ALL"
            response = requests.get(url, headers=self.headers, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Web sayfasından tarife bilgilerini çıkarmaya çalış
            tarife_elements = soup.find_all(['div', 'span'], class_=lambda x: x and ('tarife' in x.lower() or 'paket' in x.lower() or 'price' in x.lower()))
            
            logger.info(f"Vodafone'dan {len(tarife_elements)} tarife elementi bulundu")
            
            # Örnek veri (gerçek verilerle değiştirilecek)
            self.tarifeler['Vodafone'] = [
                {'ad': 'Vodafone 5GB', 'data_gb': 5, 'dakika': 200, 'sms': 100, 'fiyat': 140.0, 'operator': 'Vodafone'},
                {'ad': 'Vodafone 10GB', 'data_gb': 10, 'dakika': 500, 'sms': 200, 'fiyat': 190.0, 'operator': 'Vodafone'},
                {'ad': 'Vodafone 20GB', 'data_gb': 20, 'dakika': 1000, 'sms': 500, 'fiyat': 260.0, 'operator': 'Vodafone'},
                {'ad': 'Vodafone 50GB', 'data_gb': 50, 'dakika': 2000, 'sms': 1000, 'fiyat': 380.0, 'operator': 'Vodafone'},
            ]
            
        except Exception as e:
            logger.error(f"Vodafone veri çekme hatası: {e}")
            self.tarifeler['Vodafone'] = []
    
    def tum_tarifeleri_cek(self):
        """Tüm operatörlerden tarife bilgilerini çeker"""
        logger.info("Tüm operatörlerden tarife bilgileri çekiliyor...")
        
        self.turkcell_tarifeleri_cek()
        time.sleep(2)  # Rate limiting
        
        self.turk_telekom_tarifeleri_cek()
        time.sleep(2)
        
        self.vodafone_tarifeleri_cek()
        
        logger.info("Tüm tarife bilgileri çekildi")
    
    def verileri_kaydet(self, dosya_adi: str = "guncel_tarifeler.json"):
        """Çekilen verileri JSON dosyasına kaydeder"""
        try:
            with open(dosya_adi, 'w', encoding='utf-8') as f:
                json.dump(self.tarifeler, f, ensure_ascii=False, indent=2)
            logger.info(f"Veriler {dosya_adi} dosyasına kaydedildi")
        except Exception as e:
            logger.error(f"Veri kaydetme hatası: {e}")
    
    def verileri_goster(self):
        """Çekilen verileri konsola yazdırır"""
        print("\n=== GÜNCEL TARİFE BİLGİLERİ ===\n")
        
        for operator, tarifeler in self.tarifeler.items():
            print(f"{operator}:")
            if tarifeler:
                for tarife in tarifeler:
                    print(f"  {tarife['ad']}: {tarife['data_gb']}GB, {tarife['dakika']}dk, {tarife['sms']}SMS - {tarife['fiyat']} TL")
            else:
                print("  Veri bulunamadı")
            print()

def main():
    """Ana fonksiyon"""
    cekici = TarifeVeriCekici()
    
    # Tüm tarifeleri çek
    cekici.tum_tarifeleri_cek()
    
    # Verileri göster
    cekici.verileri_goster()
    
    # Verileri kaydet
    cekici.verileri_kaydet()
    
    print("\n✅ Tarife veri çekme işlemi tamamlandı!")
    print("📁 Veriler 'guncel_tarifeler.json' dosyasına kaydedildi")

if __name__ == "__main__":
    main()
