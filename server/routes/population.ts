import { Router } from 'express';
import { PopulationAnalysisTool } from '../agents/tools/populationAnalysisTool.js';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();
const populationTool = new PopulationAnalysisTool();

/**
 * GET /api/population/map-data
 * Harita için nüfus verilerini döner
 */
router.get('/map-data', async (req, res) => {
  try {
    console.log('🔍 Nüfus harita verisi isteniyor...');
    console.log('Current working directory:', process.cwd());
    console.log('__dirname:', __dirname);
    
    const mapData = populationTool.getMapData();
    
    if (!mapData) {
      console.error('❌ Nüfus verileri null döndü');
      console.error('PopulationAnalysisTool instance:', populationTool);
      console.error('Population data loaded:', populationTool['populationData'] ? 'Yes' : 'No');
      
      return res.status(500).json({ 
        error: 'Nüfus verileri yüklenemedi',
        details: 'PopulationAnalysisTool.getMapData() null döndü. Veri dosyaları kontrol edilmeli.',
        debug: {
          workingDirectory: process.cwd(),
          dirname: __dirname,
          dataLoaded: populationTool['populationData'] ? true : false
        }
      });
    }
    
    console.log(`✅ ${mapData.length} il için nüfus verisi döndürülüyor`);
    res.json({
      success: true,
      data: mapData
    });
  } catch (error) {
    console.error('❌ Harita verisi hatası:', error);
    res.status(500).json({ 
      error: 'Harita verisi alınamadı',
      details: error instanceof Error ? error.message : 'Bilinmeyen hata',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
});

/**
 * GET /api/population/age-distribution
 * Yaş dağılımı verilerini döner
 */
router.get('/age-distribution', async (req, res) => {
  try {
    const { province } = req.query;
    const ageData = populationTool.getAgeDistributionData(province as string);
    
    if (!ageData) {
      return res.status(404).json({ error: 'Yaş dağılımı verisi bulunamadı' });
    }
    
    res.json({
      success: true,
      data: ageData
    });
  } catch (error) {
    console.error('Yaş dağılımı hatası:', error);
    res.status(500).json({ error: 'Yaş dağılımı verisi alınamadı' });
  }
});

/**
 * GET /api/population/analysis
 * Nüfus analizi yapar
 */
router.get('/analysis', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Sorgu parametresi gerekli' });
    }
    
    const analysis = await populationTool.execute({ query: query as string, userContext: { userId: 'anonymous' } });
    
    res.json({
      success: true,
      data: analysis?.data || null
    });
  } catch (error) {
    console.error('Nüfus analizi hatası:', error);
    res.status(500).json({ error: 'Nüfus analizi yapılamadı' });
  }
});

/**
 * GET /api/population/provinces
 * Tüm il isimlerini döner
 */
router.get('/provinces', async (req, res) => {
  try {
    const mapData = populationTool.getMapData();
    
    if (!mapData) {
      return res.status(500).json({ error: 'Nüfus verileri yüklenemedi' });
    }
    
    const provinces = mapData.map((item: any) => item.province);
    
    res.json({
      success: true,
      data: provinces
    });
  } catch (error) {
    console.error('İl listesi hatası:', error);
    res.status(500).json({ error: 'İl listesi alınamadı' });
  }
});

/**
 * GET /api/population/population-trend
 * Seçilen il için nüfus trend verilerini döner (son 10 yıl)
 */
router.get('/population-trend', async (req, res) => {
  try {
    const { province } = req.query;
    
    if (!province) {
      return res.status(400).json({ error: 'İl parametresi gerekli' });
    }
    
    const trendData = populationTool.getPopulationTrendData(province as string);
    
    if (!trendData || trendData.length === 0) {
      return res.status(404).json({ error: 'Nüfus trend verisi bulunamadı' });
    }
    
    res.json({
      success: true,
      data: trendData
    });
  } catch (error) {
    console.error('Nüfus trend hatası:', error);
    res.status(500).json({ error: 'Nüfus trend verisi alınamadı' });
  }
});

export default router;
