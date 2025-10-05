import { DistrictBounds } from './types.js';

// GERÇEK İstanbul ilçe merkezleri ve yarıçapları
export const ISTANBUL_DISTRICTS: DistrictBounds[] = [
  // Avrupa Yakası
  { name: "Beyoğlu", center: { lat: 41.0370, lng: 28.9857 }, radius: 3 },
  { name: "Beşiktaş", center: { lat: 41.0422, lng: 29.0098 }, radius: 4 },
  { name: "Şişli", center: { lat: 41.0602, lng: 28.9887 }, radius: 5 },
  { name: "Kağıthane", center: { lat: 41.0789, lng: 28.9785 }, radius: 4 },
  { name: "Sarıyer", center: { lat: 41.1735, lng: 29.0434 }, radius: 15 },
  { name: "Eyüpsultan", center: { lat: 41.0546, lng: 28.9343 }, radius: 8 },
  { name: "Fatih", center: { lat: 41.0186, lng: 28.9497 }, radius: 6 },
  { name: "Zeytinburnu", center: { lat: 40.9895, lng: 28.9012 }, radius: 3 },
  { name: "Bakırköy", center: { lat: 40.9744, lng: 28.8737 }, radius: 4 },
  { name: "Bahçelievler", center: { lat: 40.9967, lng: 28.8567 }, radius: 4 },
  { name: "Bağcılar", center: { lat: 41.0395, lng: 28.8414 }, radius: 5 },
  { name: "Küçükçekmece", center: { lat: 41.0082, lng: 28.7761 }, radius: 8 },
  { name: "Büyükçekmece", center: { lat: 41.0214, lng: 28.5858 }, radius: 12 },
  { name: "Avcılar", center: { lat: 41.0199, lng: 28.7245 }, radius: 6 },
  { name: "Esenyurt", center: { lat: 41.0297, lng: 28.6744 }, radius: 8 },
  { name: "Arnavutköy", center: { lat: 41.1977, lng: 28.7322 }, radius: 12 },
  { name: "Gaziosmanpaşa", center: { lat: 41.0609, lng: 28.9104 }, radius: 5 },
  { name: "Esenler", center: { lat: 41.0446, lng: 28.8764 }, radius: 4 },
  { name: "Güngören", center: { lat: 41.0201, lng: 28.8742 }, radius: 3 },
  { name: "Sultangazi", center: { lat: 41.1089, lng: 28.8613 }, radius: 6 },
  { name: "Bayrampaşa", center: { lat: 41.0462, lng: 28.8951 }, radius: 3 },
  
  // Asya Yakası
  { name: "Kadıköy", center: { lat: 40.9839, lng: 29.0365 }, radius: 6 },
  { name: "Üsküdar", center: { lat: 41.0214, lng: 29.0068 }, radius: 5 },
  { name: "Beykoz", center: { lat: 41.1158, lng: 29.0997 }, radius: 15 },
  { name: "Ümraniye", center: { lat: 41.0195, lng: 29.1244 }, radius: 6 },
  { name: "Ataşehir", center: { lat: 40.9833, lng: 29.1167 }, radius: 5 },
  { name: "Maltepe", center: { lat: 40.9436, lng: 29.1667 }, radius: 6 },
  { name: "Kartal", center: { lat: 40.9064, lng: 29.1836 }, radius: 7 },
  { name: "Pendik", center: { lat: 40.8783, lng: 29.2333 }, radius: 8 },
  { name: "Tuzla", center: { lat: 40.8231, lng: 29.2975 }, radius: 10 },
  { name: "Şile", center: { lat: 41.1744, lng: 29.6097 }, radius: 20 },
  { name: "Çekmeköy", center: { lat: 41.0311, lng: 29.2119 }, radius: 8 },
  { name: "Sancaktepe", center: { lat: 41.0089, lng: 29.2331 }, radius: 6 },
  { name: "Sultanbeyli", center: { lat: 40.9631, lng: 29.2631 }, radius: 5 }
];

// İstanbul'un yaklaşık sınırları
export const ISTANBUL_BOUNDS = {
  minLat: 40.8,   // En güney nokta (Tuzla)
  maxLat: 41.6,   // En kuzey nokta (Şile)
  minLng: 28.5,   // En batı nokta (Büyükçekmece)
  maxLng: 29.7    // En doğu nokta (Şile)
};

