import React, { useState } from 'react';
import { Package, FileText } from 'lucide-react';

interface ItemArtworkProps {
  illustration?: string;
  name: string;
  photoUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showNfcCoil?: boolean;
}

// Map of illustration identifiers to the exact extracted high-resolution sticker tiles
const TILE_MAP: Record<string, string> = {
  'work-meds': '/assets/tiles/tile_work_meds.png',
  'house-keys': '/assets/tiles/tile_house_keys.png',
  'car-keys': '/assets/tiles/tile_car_keys.png',
  'headphones': '/assets/tiles/tile_headphones.png',
  'wicker-hamper': '/assets/tiles/tile_wicker_hamper.png',
  'running-shoes': '/assets/tiles/tile_running_shoes.png',
  'slide-sandals': '/assets/tiles/tile_slide_sandals.png',
  'street-runners': '/assets/tiles/tile_street_runners.png',
  'water-bottle': '/assets/tiles/tile_water_bottle.png',
  'spring-water': '/assets/tiles/tile_spring_water.png',
  'pill-tower': '/assets/tiles/tile_pill_tower.png',
};

// Automatic fallback based on item name keywords
function detectTile(name: string, illustration?: string): string | null {
  if (illustration && TILE_MAP[illustration]) {
    return TILE_MAP[illustration];
  }
  const lower = name.toLowerCase();
  if (lower.includes('work med') || lower.includes('meds')) return TILE_MAP['work-meds'];
  if (lower.includes('car key')) return TILE_MAP['car-keys'];
  if (lower.includes('house key') || lower.includes('key')) return TILE_MAP['house-keys'];
  if (lower.includes('headphone') || lower.includes('audio')) return TILE_MAP['headphones'];
  if (lower.includes('hamper') || lower.includes('laundry')) return TILE_MAP['wicker-hamper'];
  if (lower.includes('running') || lower.includes('runner shoe')) return TILE_MAP['running-shoes'];
  if (lower.includes('sandal') || lower.includes('slide')) return TILE_MAP['slide-sandals'];
  if (lower.includes('street runner')) return TILE_MAP['street-runners'];
  if (lower.includes('water bottle') || lower.includes('flask')) return TILE_MAP['water-bottle'];
  if (lower.includes('spring water') || lower.includes('carafe')) return TILE_MAP['spring-water'];
  if (lower.includes('pill') || lower.includes('rotary')) return TILE_MAP['pill-tower'];
  return null;
}

export const ItemArtwork: React.FC<ItemArtworkProps> = ({
  illustration,
  name,
  photoUrl,
  size = 'md',
  showNfcCoil = true,
}) => {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32',
  }[size];

  const tileSrc = detectTile(name, illustration);

  // If a tile is matched from the template sheet or die cut sticker
  if (tileSrc && !imgError) {
    const isSpecialDieCut = tileSrc.includes('work_meds') || tileSrc.includes('house_keys') || tileSrc.includes('car_keys');

    return (
      <div
        className={`relative ${sizeClasses} rounded-full flex items-center justify-center shrink-0 ${
          isSpecialDieCut ? '' : 'overflow-hidden border border-stone-200/80 bg-[#FAF6EE] shadow-2xs'
        }`}
      >
        <img
          src={tileSrc}
          alt={name}
          onError={() => setImgError(true)}
          referrerPolicy="no-referrer"
          className={`w-full h-full object-contain filter drop-shadow-xs transition-transform duration-200 hover:scale-105 ${
            isSpecialDieCut ? 'scale-105' : 'scale-100 rounded-full'
          }`}
        />
      </div>
    );
  }

  // Fallback for custom uploaded photos
  if (photoUrl && photoUrl.trim() !== '' && !imgError) {
    return (
      <div className={`relative ${sizeClasses} rounded-full overflow-hidden border border-stone-200 shrink-0 bg-stone-100 shadow-2xs`}>
        <img
          src={photoUrl}
          alt={name}
          onError={() => setImgError(true)}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // Subtle copper antenna ring fallback for new custom items or documents
  const isDoc = name.toLowerCase().includes('doc') || name.toLowerCase().includes('passport');

  return (
    <div
      className={`relative ${sizeClasses} rounded-full flex items-center justify-center shrink-0 shadow-2xs border border-stone-200/80 overflow-hidden bg-[#FAF6EE]`}
    >
      {showNfcCoil && (
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full opacity-35 pointer-events-none"
        >
          <circle cx="50" cy="50" r="46" fill="none" stroke="#C98A58" strokeWidth="1.2" />
          <circle cx="50" cy="50" r="41" fill="none" stroke="#C98A58" strokeWidth="1.2" strokeDasharray="3 1.5" />
          <circle cx="50" cy="50" r="36" fill="none" stroke="#C98A58" strokeWidth="1.2" />
          <circle cx="50" cy="50" r="31" fill="none" stroke="#C98A58" strokeWidth="1.2" />
          <circle cx="50" cy="50" r="26" fill="none" stroke="#C98A58" strokeWidth="1.2" strokeDasharray="4 2" />
          <circle cx="50" cy="50" r="20" fill="none" stroke="#C98A58" strokeWidth="1.2" />
        </svg>
      )}
      <div className="relative z-10 flex items-center justify-center text-stone-700">
        {isDoc ? <FileText size={size === 'sm' ? 18 : size === 'lg' ? 36 : 24} className="text-amber-800" /> : <Package size={size === 'sm' ? 18 : size === 'lg' ? 36 : 24} className="text-stone-600" />}
      </div>
    </div>
  );
};
