import { Coordinates, PriorityLevel } from './types';

export const UMBRIA_CENTER: Coordinates = {
  lat: 42.938,
  lng: 12.621,
};

export const DEFAULT_CATEGORIES = [
  'Albero da tagliare',
  'Guardrail danneggiato',
  'Buca stradale',
  'Segnaletica mancante',
  'Rifiuti abbandonati',
  'Illuminazione guasta'
];

export const APP_STORAGE_KEY = 'manutenzione_umbria_data';
export const CATEGORY_STORAGE_KEY = 'manutenzione_umbria_categories';

// --- FIREBASE CONFIGURATION ---
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCi5Z5FBUiANTI4OmatYylTB3DBtDsDoMs",
  authDomain: "mappatura-segnalazioni.firebaseapp.com",
  projectId: "mappatura-segnalazioni",
  storageBucket: "mappatura-segnalazioni.firebasestorage.app",
  messagingSenderId: "983426698364",
  appId: "1:983426698364:web:a43258dcb4fbd0a9eb0df9"
};

// Fallback legacy per demo se Firebase non è configurato
export const REMOTE_STORAGE_ID = 'manutenzione-umbria-demo-storage-v3';
export const REMOTE_STORAGE_URL = `https://extendsclass.com/api/json-storage/bin/${REMOTE_STORAGE_ID}`;

// Priority Configuration
export const PRIORITY_CONFIG: Record<PriorityLevel, { label: string, color: string, bg: string, border: string }> = {
  'HIGH': { 
    label: 'Alta', 
    color: 'text-red-700', 
    bg: 'bg-red-100',
    border: 'border-red-200'
  },
  'MEDIUM': { 
    label: 'Media', 
    color: 'text-amber-700', 
    bg: 'bg-amber-100',
    border: 'border-amber-200'
  },
  'LOW': { 
    label: 'Bassa', 
    color: 'text-blue-700', 
    bg: 'bg-blue-100',
    border: 'border-blue-200'
  }
};

export type MarkerShape = 'circle' | 'square' | 'triangle';

// Icon configuration
export interface CategoryConfigItem {
  icon: string; // SVG path d attribute
  color: string; // Tailwind color class for UI
  hex: string; // Hex code for Map Marker background
  shape: MarkerShape; // Shape of the map marker
}

export const COMPLETED_ICON_PATH = 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z'; // Checkmark

export const CATEGORY_CONFIG: Record<string, CategoryConfigItem> = {
  'Buca stradale': {
    icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9h10v2H7z', 
    color: 'text-red-600',
    hex: '#dc2626',
    shape: 'triangle' // Danger -> Triangle
  },
  'Albero da tagliare': {
    icon: 'M12 2L2 22h20L12 2zm0 3.99L18.53 19H5.47L12 5.99zM8 15h8v2H8z', 
    color: 'text-green-600',
    hex: '#16a34a',
    shape: 'circle' // Organic -> Circle
  },
  'Guardrail danneggiato': {
    icon: 'M2 6v12h2V8h5v10h2V8h5v10h2V8h4V6H2zm0 0', 
    color: 'text-orange-600',
    hex: '#ea580c',
    shape: 'square' // Structure -> Square
  },
  'Segnaletica mancante': {
    icon: 'M12 2L1 21h22L12 2zm0 3.45l8.27 14.28H3.73L12 5.45zM11 10h2v5h-2zm0 6h2v2h-2z', 
    color: 'text-yellow-500',
    hex: '#eab308',
    shape: 'triangle' // Danger -> Triangle
  },
  'Rifiuti abbandonati': {
    icon: 'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z', 
    color: 'text-slate-600',
    hex: '#475569',
    shape: 'circle' // Generic -> Circle
  },
  'Illuminazione guasta': {
    icon: 'M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6A4.997 4.997 0 017 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z', 
    color: 'text-purple-600',
    hex: '#9333ea',
    shape: 'square' // Structure -> Square
  },
  'default': {
    icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z', 
    color: 'text-blue-600',
    hex: '#2563eb',
    shape: 'circle'
  }
};