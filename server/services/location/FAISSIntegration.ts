import { SafeArea } from './types.js';

export class FAISSIntegration {
  /**
   * Get toplanma alanları from FAISS using Python script
   */
  async getToplanmaAlanlari(preferredDistrict?: string): Promise<SafeArea[]> {
    try {
      const { spawn } = require('child_process');
      const path = require('path');
      
      const pythonScript = path.join(process.cwd(), 'faiss_search.py');
      const pythonCmd = process.env.PYTHON || (process.platform === 'win32' ? 'python' : 'python3');
      const query = preferredDistrict ? `${preferredDistrict} toplanma alanı` : 'toplanma alanı';
      
      const pythonProcess = spawn(pythonCmd, [pythonScript, query], {
        cwd: process.cwd(),
        env: { ...process.env, PATH: process.env.PATH }
      });

      return new Promise((resolve, reject) => {
        let output = '';
        let errorOutput = '';

        pythonProcess.stdout.on('data', (data: Buffer) => {
          output += data.toString();
        });

        pythonProcess.stderr.on('data', (data: Buffer) => {
          errorOutput += data.toString();
        });

        pythonProcess.on('close', (code: number) => {
          if (code === 0) {
            try {
              const results = JSON.parse(output);
              let safeAreas: SafeArea[] = results.map((result: any) => ({
                name: result.metadata.alan_adi,
                district: result.metadata.ilce,
                coordinates: {
                  lat: result.metadata.koordinat.lat || 0,
                  lng: result.metadata.koordinat.lng || 0
                },
                category: 'toplanma_alanı'
              }));
              
              // Filter by preferred district if specified
              if (preferredDistrict) {
                const lowerPref = preferredDistrict.toLowerCase();
                const districtFiltered = safeAreas.filter((a: SafeArea) => 
                  (a.district || '').toLowerCase().includes(lowerPref)
                );
                if (districtFiltered.length > 0) {
                  safeAreas = districtFiltered;
                }
              }
              
              resolve(safeAreas);
            } catch (parseError) {
              console.error('JSON parse error:', parseError);
              resolve([]);
            }
          } else {
            console.error('Python script error:', errorOutput);
            resolve([]);
          }
        });

        pythonProcess.on('error', (error: Error) => {
          console.error('Python process error:', error);
          resolve([]);
        });
      });
    } catch (error) {
      console.error('FAISS search error:', error);
      return [];
    }
  }

  /**
   * Get ilk yardım (first aid) information from FAISS
   */
  async getIlkyardimInfo(query: string): Promise<any[]> {
    try {
      const { spawn } = require('child_process');
      const path = require('path');
      
      const pythonScript = path.join(process.cwd(), 'ilkyardim_search.py');
      const pythonCmd = process.env.PYTHON || (process.platform === 'win32' ? 'python' : 'python3');
      
      const pythonProcess = spawn(pythonCmd, [pythonScript, query], {
        cwd: process.cwd(),
        env: { ...process.env, PATH: process.env.PATH }
      });

      return new Promise((resolve, reject) => {
        let output = '';
        let errorOutput = '';

        pythonProcess.stdout.on('data', (data: Buffer) => {
          output += data.toString();
        });

        pythonProcess.stderr.on('data', (data: Buffer) => {
          errorOutput += data.toString();
        });

        pythonProcess.on('close', (code: number) => {
          if (code === 0) {
            try {
              const results = JSON.parse(output);
              resolve(results);
            } catch (parseError) {
              console.error('JSON parse error:', parseError);
              resolve([]);
            }
          } else {
            console.error('Python script error:', errorOutput);
            resolve([]);
          }
        });

        pythonProcess.on('error', (error: Error) => {
          console.error('Python process error:', error);
          resolve([]);
        });
      });
    } catch (error) {
      console.error('İlkyardım search error:', error);
      return [];
    }
  }

  /**
   * Check if FAISS index is available
   */
  async checkFAISSAvailability(): Promise<boolean> {
    try {
      const fs = require('fs');
      const path = require('path');
      
      const indexPath = path.join(process.cwd(), 'faiss_index/toplanma_alanlari.index');
      return fs.existsSync(indexPath);
    } catch (error) {
      console.error('FAISS availability check error:', error);
      return false;
    }
  }
}

