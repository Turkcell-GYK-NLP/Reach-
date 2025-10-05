/**
 * Hastane Arama Modal - İlçe filtreleme ve hastane listesi
 */

import React, { useState } from 'react';
import { X, Hospital, MapPin, Phone, Globe, Clock, Filter } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface HospitalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Hospital {
  id: string;
  name: string;
  type: string;
  phone?: string;
  address?: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  emergency?: string;
  website?: string;
  operator?: string;
  beds?: string;
  district?: string;
}

const HospitalModal: React.FC<HospitalModalProps> = ({ isOpen, onClose }) => {
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');

  // API çağrıları
  const { data: districtsData } = useQuery({
    queryKey: ['districts'],
    queryFn: () => api.getDistricts(),
    enabled: isOpen
  });

  const { data: hospitalsData, isLoading } = useQuery({
    queryKey: ['hospitals', selectedDistrict],
    queryFn: () => api.getHospitals(selectedDistrict === 'all' ? undefined : selectedDistrict),
    enabled: isOpen
  });

  // Gösterilecek hastaneler
  const displayHospitals = hospitalsData?.data || [];
  const districts = districtsData?.data || [];

  // İlçe seçimi değiştiğinde
  const handleDistrictChange = (district: string) => {
    setSelectedDistrict(district);
  };

  // Hastane kartı click handler
  const handleHospitalClick = (hospital: Hospital) => {
    // Hastane detaylarını göster veya haritada konumunu aç
    if (hospital.coordinates) {
      const url = `https://www.google.com/maps?q=${hospital.coordinates.latitude},${hospital.coordinates.longitude}`;
      window.open(url, '_blank');
    }
  };

  // Telefon arama
  const handleCallHospital = (phone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`tel:${phone}`);
  };

  if (!isOpen) return null;

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-[100]" onClick={onClose} />}
      <div className="fixed inset-4 md:inset-8 bg-white rounded-lg shadow-2xl z-[110] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Hospital className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Hastane Arama</h2>
              <p className="text-sm text-gray-500">İstanbul hastanelerini keşfedin</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-10 w-10 p-0"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <div className="flex justify-center">
            <div className="w-full max-w-md">
              <Select value={selectedDistrict} onValueChange={handleDistrictChange}>
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-400" />
                    <SelectValue placeholder="İlçe seçin" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm İlçeler</SelectItem>
                  {districts.map((district: string) => (
                    <SelectItem key={district} value={district}>
                      {district}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-hidden flex flex-col">
        <div className="p-6 bg-white">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-800">
              {displayHospitals.length} hastane bulundu
            </h3>
            {selectedDistrict && selectedDistrict !== 'all' && (
              <span className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                {selectedDistrict}
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Hastaneler yükleniyor...</span>
            </div>
          ) : displayHospitals.length === 0 ? (
            <div className="text-center py-12">
              <Hospital className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-500 mb-2">Hastane bulunamadı</h3>
              <p className="text-gray-400">
                {selectedDistrict && selectedDistrict !== 'all'
                  ? 'Seçilen ilçede hastane bulunamadı. Başka bir ilçe seçin.'
                  : 'Henüz hastane verisi bulunmuyor.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayHospitals.map((hospital: Hospital) => (
                  <Card 
                    key={hospital.id}
                    className="cursor-pointer transition-all hover:shadow-md hover:border-blue-200"
                    onClick={() => handleHospitalClick(hospital)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="text-base font-semibold text-gray-800 truncate">
                              {hospital.name}
                            </h4>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                              {hospital.type}
                            </span>
                          </div>
                          
                          {hospital.address && (
                            <div className="flex items-center gap-2 mb-2">
                              <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              <span className="text-sm text-gray-600">{hospital.address}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            {hospital.emergency === 'yes' && (
                              <span className="flex items-center gap-1 text-red-600">
                                <Clock className="h-4 w-4" />
                                Acil Servis
                              </span>
                            )}
                            {hospital.beds && (
                              <span>{hospital.beds} yatak</span>
                            )}
                            {hospital.operator && (
                              <span className="truncate">{hospital.operator}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 ml-4">
                          {hospital.phone && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => handleCallHospital(hospital.phone!, e)}
                              className="flex items-center gap-1"
                            >
                              <Phone className="h-3 w-3" />
                              Ara
                            </Button>
                          )}
                          {hospital.website && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(hospital.website, '_blank');
                              }}
                              className="flex items-center gap-1"
                            >
                              <Globe className="h-3 w-3" />
                              Site
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default HospitalModal;
