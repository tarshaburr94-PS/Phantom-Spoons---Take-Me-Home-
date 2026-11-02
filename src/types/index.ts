export type ItemStatus = 'at_home' | 'with_me' | 'in_transit' | 'misplaced';

export type SpoonImpact = 'low' | 'medium' | 'high' | 'critical';

export interface HomeLocation {
  id: string;
  name: string; // e.g. "Wooden Key Bowl"
  room: string; // e.g. "Entryway"
  specificSpot: string; // e.g. "On the console table right next to the front door"
  nfcTagUid?: string; // Optional NFC station tag on the actual furniture/container
  color: string; // tailwind color token
  icon: string;
  notes?: string;
  photoUrl?: string;
}

export interface Item {
  id: string;
  name: string;
  category?: string; // Optional category, e.g., 'Keys', 'Electronics', 'Documents', 'Medication'
  homeLocationId: string;
  currentStatus: ItemStatus;
  lastKnownLocation: string;
  lastUpdated: string;
  nfcTagUid: string; // NTAG213 / NTAG215 UID or custom tag string
  photoUrl?: string;
  stickerIllustration?: string;
  spoonImpact: SpoonImpact;
  searchTips: string[];
  notes?: string;
  totalRetrievals: number;
}

export interface ScanEvent {
  id: string;
  timestamp: string;
  itemId: string;
  itemName: string;
  action: 'checked_in_home' | 'taken_with_me' | 'misplaced_reported' | 'retrieved_home' | 'tag_written';
  locationName: string;
  notes?: string;
}

export interface NFCTagSimulation {
  uid: string;
  name: string;
  type: 'item' | 'home_station';
  targetId: string;
  description: string;
  badge: string;
}
