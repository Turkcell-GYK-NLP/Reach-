import type { Express } from "express";
import { locationService } from "../services/locationService";

export function registerLocationRoutes(app: Express): void {
  // Get current location
  app.get("/api/location/current", async (req, res) => {
    try {
      const location = await locationService.getCurrentLocation();
      res.json(location);
    } catch (error) {
      res.status(500).json({ error: "Failed to get current location", details: error });
    }
  });

  // Get location by coordinates
  app.get("/api/location/by-coordinates", async (req, res) => {
    try {
      console.log("Location by coordinates isteği:", req.query);
      
      const lat = parseFloat(req.query.lat as string);
      const lng = parseFloat(req.query.lng as string);
      
      console.log("Parsed coordinates:", lat, lng);
      
      if (isNaN(lat) || isNaN(lng)) {
        console.error("Invalid coordinates:", req.query);
        return res.status(400).json({ error: "Invalid coordinates" });
      }
      
      const location = await locationService.getLocationByCoordinates(lat, lng);
      console.log("Location service response:", location);
      
      res.json(location);
    } catch (error) {
      console.error("Location by coordinates error:", error);
      res.status(500).json({ error: "Failed to get location by coordinates", details: error });
    }
  });

  // Get nearest safe area
  app.get("/api/location/nearest-safe-area", async (req, res) => {
    try {
      const nearestArea = await locationService.getNearestSafeArea();
      res.json(nearestArea);
    } catch (error) {
      res.status(500).json({ error: "Failed to get nearest safe area", details: error });
    }
  });

  // Get safe areas by location
  app.get("/api/safe-areas/:location", async (req, res) => {
    try {
      const location = req.params.location;
      
      // FAISS'den gerçek toplanma alanları ara
      const { spawn } = require('child_process');
      const path = require('path');
      
      const pythonScript = path.join(process.cwd(), 'faiss_search.py');
      const pythonProcess = spawn('python3', [pythonScript, location], {
        cwd: process.cwd(),
        env: { ...process.env, PATH: process.env.PATH }
      });

      let output = '';
      let errorOutput = '';

      pythonProcess.stdout.on('data', (data: any) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data: any) => {
        errorOutput += data.toString();
      });

      pythonProcess.on('close', (code: any) => {
        if (code === 0) {
          try {
            const results = JSON.parse(output);
            const safeAreas = results.map((result: any) => ({
              name: result.metadata.alan_adi,
              district: result.metadata.ilce,
              neighborhood: result.metadata.mahalle,
              coordinates: {
                lat: result.metadata.koordinat.lat,
                lng: result.metadata.koordinat.lng
              },
              area: result.metadata.alan_bilgileri.toplam_alan,
              facilities: extractFacilities(result.metadata.altyapi),
              similarity: result.similarity
            }));
            res.json(safeAreas);
          } catch (parseError) {
            res.status(500).json({ error: "JSON parse hatası", details: parseError });
          }
        } else {
          res.status(500).json({ error: "Python script hatası", details: errorOutput });
        }
      });

      pythonProcess.on('error', (error: any) => {
        res.status(500).json({ error: "Python process hatası", details: error });
      });

    } catch (error) {
      res.status(500).json({ error: "Failed to get safe areas", details: error });
    }
  });
}

function extractFacilities(altyapi: any): string[] {
  const facilities = [];
  if (altyapi.elektrik) facilities.push('Elektrik');
  if (altyapi.su) facilities.push('Su');
  if (altyapi.wc) facilities.push('WC');
  if (altyapi.kanalizasyon) facilities.push('Kanalizasyon');
  return facilities;
}

