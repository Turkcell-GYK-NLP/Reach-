import { Router } from 'express';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Tarife önerisi endpoint'i
router.post('/tarife-onerisi', async (req, res) => {
  try {
    const { user_id } = req.body;
    
    if (!user_id) {
      return res.status(400).json({ 
        error: 'user_id gerekli' 
      });
    }

    // Python script'ini virtual environment'da çalıştır
    const pythonScript = path.join(__dirname, '../../tarife_onerisi_sistemi.py');
    const venvPython = path.join(__dirname, '../../venv/bin/python');
    const pythonProcess = spawn(venvPython, [pythonScript, '--user-id', user_id.toString()]);
    
    let output = '';
    let error = '';
    
    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('Python script hatası:', error);
        return res.status(500).json({ 
          error: 'Tarife önerisi hesaplanırken hata oluştu',
          details: error
        });
      }
      
      try {
        // Python output'unu parse et
        const lines = output.split('\n');
        let result = null;
        
        for (const line of lines) {
          if (line.includes('Kullanıcı') && line.includes(':')) {
            const parts = line.split(':');
            if (parts.length >= 2) {
              const userId = parts[0].replace('Kullanıcı', '').trim();
              if (userId === user_id.toString()) {
                result = {
                  user_id: parseInt(userId),
                  status: 'success'
                };
              }
            }
          }
        }
        
        if (!result) {
          return res.status(404).json({ 
            error: 'Kullanıcı bulunamadı' 
          });
        }
        
        res.json(result);
      } catch (parseError) {
        console.error('Output parse hatası:', parseError);
        res.status(500).json({ 
          error: 'Sonuç parse edilemedi',
          raw_output: output
        });
      }
    });
    
  } catch (error) {
    console.error('Tarife önerisi hatası:', error);
    res.status(500).json({ 
      error: 'Sunucu hatası' 
    });
  }
});

// Toplu analiz endpoint'i
router.get('/toplu-analiz', async (req, res) => {
  try {
    const { sample_size = 100 } = req.query;
    
    // Python script'ini virtual environment'da çalıştır
    const pythonScript = path.join(__dirname, '../../tarife_onerisi_sistemi.py');
    const venvPython = path.join(__dirname, '../../venv/bin/python');
    const pythonProcess = spawn(venvPython, [pythonScript, '--bulk-analysis', sample_size.toString()]);
    
    let output = '';
    let error = '';
    
    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('Python script hatası:', error);
        return res.status(500).json({ 
          error: 'Toplu analiz hesaplanırken hata oluştu',
          details: error
        });
      }
      
      try {
        // Python output'unu parse et
        const result = {
          status: 'success',
          sample_size: parseInt(sample_size as string),
          raw_output: output
        };
        
        res.json(result);
      } catch (parseError) {
        console.error('Output parse hatası:', parseError);
        res.status(500).json({ 
          error: 'Sonuç parse edilemedi',
          raw_output: output
        });
      }
    });
    
  } catch (error) {
    console.error('Toplu analiz hatası:', error);
    res.status(500).json({ 
      error: 'Sunucu hatası' 
    });
  }
});

// Profil bazlı analiz endpoint'i
router.get('/profil-analizi', async (req, res) => {
  try {
    // Python script'ini virtual environment'da çalıştır
    const pythonScript = path.join(__dirname, '../../tarife_onerisi_sistemi.py');
    const venvPython = path.join(__dirname, '../../venv/bin/python');
    const pythonProcess = spawn(venvPython, [pythonScript, '--profile-analysis']);
    
    let output = '';
    let error = '';
    
    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('Python script hatası:', error);
        return res.status(500).json({ 
          error: 'Profil analizi hesaplanırken hata oluştu',
          details: error
        });
      }
      
      try {
        const result = {
          status: 'success',
          raw_output: output
        };
        
        res.json(result);
      } catch (parseError) {
        console.error('Output parse hatası:', parseError);
        res.status(500).json({ 
          error: 'Sonuç parse edilemedi',
          raw_output: output
        });
      }
    });
    
  } catch (error) {
    console.error('Profil analizi hatası:', error);
    res.status(500).json({ 
      error: 'Sunucu hatası' 
    });
  }
});

export default router;
