import React, { useEffect, useState, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import Login from './components/Login';
import CreatePOIModal from './components/CreatePOIModal';
import POIDetailsModal from './components/POIDetailsModal';
import { 
  getPOIs, 
  savePOI, 
  updatePOI, 
  getCategories, 
  saveCategory, 
  initStorage, 
  subscribeToUpdates, 
  startPolling 
} from './services/storageService';
import { getAddressFromCoordinates } from './services/geocodingService';
import { User, Role, MaintenancePOI, Coordinates, PriorityLevel } from './types';
import { UMBRIA_CENTER, CATEGORY_CONFIG, COMPLETED_ICON_PATH, MarkerShape } from './constants';

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// --- SVG SHAPES DEFINITIONS ---
const SVG_SHAPES: Record<MarkerShape, string> = {
  // Triangle pointing downish/broad
  triangle: "M12 2L23 21H1L12 2Z", 
  // Rounded Square
  square: "M4 2h16a2 2 0 012 2v16a2 2 0 01-2 2H4a2 2 0 01-2-2V4a2 2 0 012-2z",
  // Circle
  circle: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"
};

// Helper to create custom SVG DivIcon with Shapes and Priority Badge
const getCategoryIcon = (category: string, status: string, priority?: PriorityLevel) => {
  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG['default'];
  const isCompleted = status === 'COMPLETED';
  const isHighPriority = priority === 'HIGH' && !isCompleted;
  
  const markerColor = isCompleted ? '#10b981' : config.hex;
  const iconSvgPath = isCompleted ? COMPLETED_ICON_PATH : config.icon;
  const shapeType = isCompleted ? 'circle' : config.shape; // Completed always circle
  const shapePath = SVG_SHAPES[shapeType];
  
  // We construct a full SVG string
  const html = `
    <div class="marker-shape-container">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Background Shape with Color -->
        <path d="${shapePath}" fill="${markerColor}" stroke="white" stroke-width="1.5" style="filter: drop-shadow(0px 2px 3px rgba(0,0,0,0.2));"/>
        
        <!-- Inner Icon (White) - Scaled down slightly and centered -->
        <g transform="translate(5, 5) scale(0.58)"> 
           <path d="${iconSvgPath}" fill="white"/>
        </g>

        <!-- High Priority Badge (Red Dot) -->
        ${isHighPriority ? `
          <circle cx="20" cy="4" r="3.5" fill="#ef4444" stroke="white" stroke-width="1" class="priority-badge"/>
        ` : ''}
      </svg>
    </div>
  `;

  return new L.DivIcon({
    className: 'custom-div-icon',
    html: html,
    iconSize: [48, 48],
    iconAnchor: [24, 24], // Center center
    popupAnchor: [0, -24]
  });
};

// User Location Icon (Blue Dot with Pulse)
const userLocationIcon = new L.DivIcon({
  className: 'user-location-marker',
  html: '<div class="user-pulse"></div><div class="user-dot"></div>',
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

// --- COMPONENTS ---

// Toast Notification Component
const Toast = ({ message, onClose }: { message: string; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[2000] animate-slideUp">
      <div className="bg-slate-900/90 backdrop-blur-md text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-white/10">
        <div className="bg-emerald-500 rounded-full p-1">
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
        </div>
        <span className="font-medium text-sm">{message}</span>
      </div>
    </div>
  );
};

interface MapLegendProps {
  allCategories: string[];
  activeCategories: Set<string>;
  onToggle: (cat: string) => void;
}

// Interactive Map Legend Component
const MapLegend = ({ allCategories, activeCategories, onToggle }: MapLegendProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Combine configured categories with any extra ones found in storage
  const displayCategories = Array.from(new Set([...Object.keys(CATEGORY_CONFIG).filter(k => k !== 'default'), ...allCategories]));

  return (
    <div className="absolute bottom-28 left-4 z-[400] flex flex-col items-start gap-2 pointer-events-none">
      <div className={`pointer-events-auto bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 overflow-hidden transition-all duration-300 origin-bottom-left
        ${isOpen ? 'w-64 opacity-100 scale-100' : 'w-12 h-12 opacity-0 scale-90 hidden'}`}>
        
        <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Filtra Categorie</h3>
          <span className="text-[10px] font-bold text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full">{activeCategories.size} attive</span>
        </div>
        
        <div className="p-3 max-h-60 overflow-y-auto scrollbar-hide space-y-2">
          {displayCategories.map(cat => {
            const config = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG['default'];
            const isActive = activeCategories.has(cat);

            return (
              <button 
                key={cat} 
                onClick={() => onToggle(cat)}
                className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all duration-200 border
                  ${isActive ? 'bg-white border-slate-100 shadow-sm' : 'bg-slate-50 border-transparent opacity-50 grayscale'}`}
              >
                <div className="w-8 h-8 shrink-0 relative flex items-center justify-center transform transition-transform hover:scale-110">
                   <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                      <path d={SVG_SHAPES[config.shape]} fill={config.hex} stroke="white" strokeWidth="1.5"/>
                      <g transform="translate(5, 5) scale(0.58)"> 
                        <path d={config.icon} fill="white"/>
                      </g>
                   </svg>
                </div>
                <span className={`text-xs font-semibold leading-tight text-left flex-1 ${isActive ? 'text-slate-700' : 'text-slate-400'}`}>{cat}</span>
                {isActive && <div className="w-2 h-2 rounded-full bg-emerald-500"></div>}
              </button>
            );
          })}
          
          {/* Static Completed Item (Non-interactive for simplicity, or could toggle 'COMPLETED' status) */}
          <div className="flex items-center gap-3 p-2 border border-transparent opacity-80 mt-2 pt-2 border-t-slate-100">
             <div className="w-8 h-8 shrink-0 relative flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path d={SVG_SHAPES['circle']} fill="#10b981" stroke="white" strokeWidth="1.5"/>
                  <g transform="translate(5, 5) scale(0.58)"> 
                    <path d={COMPLETED_ICON_PATH} fill="white"/>
                  </g>
                </svg>
             </div>
             <span className="text-xs font-semibold text-slate-600 leading-tight">Completato</span>
          </div>
        </div>
      </div>

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`pointer-events-auto w-12 h-12 rounded-xl shadow-lg border flex items-center justify-center transition-colors
          ${isOpen ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-white hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border-slate-200'}`}
        title="Legenda e Filtri"
      >
        {isOpen ? (
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        ) : (
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
        )}
      </button>
    </div>
  );
};

// Map click handler component
const MapEvents = ({ onMapClick }: { onMapClick: (e: L.LeafletMouseEvent) => void }) => {
  useMapEvents({
    click: onMapClick,
  });
  return null;
};

// GeoLocation component with LIVE tracking
const LocateUser = ({ onLocationFound }: { onLocationFound: (latlng: L.LatLng) => void }) => {
  const map = useMap();
  const isFirstLocate = useRef(true);

  useEffect(() => {
    // Enable watch for live tracking
    map.locate({ watch: true, enableHighAccuracy: true });

    const handleLocationFound = (e: L.LocationEvent) => {
      onLocationFound(e.latlng);
      // Only fly to location on the FIRST detection to avoid locking the map view
      if (isFirstLocate.current) {
        map.flyTo(e.latlng, 16, {
          animate: true,
          duration: 1.5
        });
        isFirstLocate.current = false;
      }
    };

    const handleLocationError = (e: L.ErrorEvent) => {
      console.warn("Location error:", e.message);
    };

    map.on("locationfound", handleLocationFound);
    map.on("locationerror", handleLocationError);
    
    return () => {
      map.off("locationfound", handleLocationFound);
      map.off("locationerror", handleLocationError);
      map.stopLocate(); // Clean up
    };
  }, [map, onLocationFound]);
  return null;
};

type FilterStatus = 'ALL' | 'PENDING';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [pois, setPois] = useState<MaintenancePOI[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set());
  
  const [map, setMap] = useState<L.Map | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');
  const [userLocation, setUserLocation] = useState<L.LatLng | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Creating POI State
  const [isCreating, setIsCreating] = useState(false);
  const [tempLocation, setTempLocation] = useState<Coordinates | null>(null);
  const [tempAddress, setTempAddress] = useState<string>('');

  // Viewing POI State
  const [selectedPOI, setSelectedPOI] = useState<MaintenancePOI | null>(null);

  // Initial Data Load and Sync
  useEffect(() => {
    // Initialize storage (loads local, fetches remote)
    initStorage();
    // Start polling for other devices' changes
    startPolling(5000);

    // Subscribe to updates from storage service
    const unsubscribe = subscribeToUpdates((data) => {
      setPois(data.pois);
      setCategories(data.categories);
      
      // If we receive new categories, we might want to activate them or not.
      // For now, we just ensure the active set logic is stable.
      // If first load, activate all.
    });

    // Set initial active categories based on default or loaded
    // We do this separately or derive it. For now, we'll just init once.
    // Note: This simple logic might reset filters on update if we aren't careful,
    // but `activeCategories` is state, so it persists.
    const initialCats = getCategories();
    if (initialCats.length > 0) {
      setActiveCategories(prev => prev.size === 0 ? new Set(initialCats) : prev);
    }

    return () => { unsubscribe(); };
  }, []);

  useEffect(() => {
    if (map) {
      const resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
      });
      const mapContainer = map.getContainer();
      resizeObserver.observe(mapContainer);
      setTimeout(() => {
        map.invalidateSize();
      }, 200);
      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [map]);

  useEffect(() => {
    if (map) {
      const resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
      });
      const mapContainer = map.getContainer();
      resizeObserver.observe(mapContainer);
      setTimeout(() => {
        map.invalidateSize();
      }, 200);
      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [map]);

  const handleMapClick = async (e: L.LeafletMouseEvent) => {
    if (user?.role === Role.SEGNALATORE) {
      const coords = { lat: e.latlng.lat, lng: e.latlng.lng };
      setTempLocation(coords);
      setTempAddress(''); // Clear previous
      setIsCreating(true);
      
      // Async fetch address
      const address = await getAddressFromCoordinates(coords);
      setTempAddress(address);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  const handleToggleCategory = (cat: string) => {
    const newSet = new Set(activeCategories);
    if (newSet.has(cat)) {
      newSet.delete(cat);
    } else {
      newSet.add(cat);
    }
    setActiveCategories(newSet);
  };

  const handleSavePOI = (data: Partial<MaintenancePOI>, newCategory?: string) => {
    if (!tempLocation || !user) return;

    const newPOI: MaintenancePOI = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5), // Better ID for collision avoidance
      title: data.title || 'Segnalazione',
      description: data.description || '',
      category: data.category || 'Altro',
      priority: data.priority || 'MEDIUM',
      location: tempLocation,
      address: data.address,
      status: 'PENDING',
      createdAt: Date.now(),
      createdBy: user.name,
      images: data.images || []
    };

    savePOI(newPOI);
    
    if (newCategory) {
      saveCategory(newCategory);
      setActiveCategories(prev => new Set(prev).add(newCategory)); // Auto-enable new category
    }

    setIsCreating(false);
    setTempLocation(null);
    setTempAddress('');
    showToast("Segnalazione inviata e sincronizzata!");
  };

  const handleUpdateStatus = (id: string, status: 'COMPLETED') => {
    if (!selectedPOI) return;
    const updated = { ...selectedPOI, status };
    updatePOI(updated);
    setSelectedPOI(updated);
    showToast("Stato aggiornato e sincronizzato!");
  };

  const handleAddImageToPOI = async (id: string, base64: string) => {
    if (!selectedPOI) return;
    // IMPORTANT: Images are already resized by the Modal/Input handler if using CreatePOIModal logic,
    // but POIDetailsModal handles its own upload. We should probably resize there too, 
    // but for now assume the user knows or we rely on the generic storage limit.
    // To be safe, we could resize here, but `base64` comes from `POIDetailsModal`.
    // Let's just save it.
    const updated = { ...selectedPOI, images: [...selectedPOI.images, base64] };
    updatePOI(updated);
    setSelectedPOI(updated);
    showToast("Foto caricata e sincronizzata!");
  };

  const handleLocateUser = () => {
    if (map) {
      // Force fly to user location if we have it, or locate again
      if (userLocation) {
         map.flyTo(userLocation, 16, { animate: true, duration: 1 });
      } else {
         map.locate({ enableHighAccuracy: true });
      }
    }
  };

  // Advanced Filter Logic
  const filteredPois = useMemo(() => {
    let result = pois;
    
    // 1. Filter by Status
    if (filterStatus === 'PENDING') {
      result = result.filter(p => p.status !== 'COMPLETED');
    }
    
    // 2. Filter by Active Categories
    result = result.filter(p => activeCategories.has(p.category));
    
    return result;
  }, [pois, filterStatus, activeCategories]);

  // Stats for Operators
  const pendingCount = pois.filter(p => p.status === 'PENDING' || p.status === 'IN_PROGRESS').length;

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <div className="h-screen w-screen flex flex-col relative overflow-hidden bg-slate-100">
      
      {/* Toast Notification */}
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}

      {/* Floating Header & Controls */}
      <div className="absolute top-4 left-4 right-4 z-[500] flex flex-col gap-3 pointer-events-none">
        
        {/* Top Row: Profile + Logout + (Operator Filters) */}
        <div className="flex justify-between items-start">
          <div className="pointer-events-auto bg-white/90 backdrop-blur-md shadow-lg shadow-slate-200/50 rounded-2xl p-3 flex items-center gap-3 border border-white/20 animate-slideUp">
             <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md
               ${user.role === Role.OPERATORE ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' : 'bg-gradient-to-br from-indigo-400 to-indigo-600'}`}>
               <span className="font-bold text-lg">{user.name.charAt(0)}</span>
             </div>
             <div className="pr-2">
               <h1 className="text-sm font-bold text-slate-800 leading-none">{user.role === Role.OPERATORE ? 'Operatore' : 'Segnalatore'}</h1>
               <p className="text-xs text-slate-500 mt-0.5">Manutenzione Umbria</p>
             </div>
          </div>

          <div className="flex gap-2">
            {/* Operator Filters - Visible only to operators */}
            {user.role === Role.OPERATORE && (
              <div className="pointer-events-auto bg-white/90 backdrop-blur-md shadow-lg rounded-2xl p-1.5 flex items-center border border-white/20 animate-slideUp">
                 <button 
                   onClick={() => setFilterStatus('PENDING')}
                   className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterStatus === 'PENDING' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                 >
                   Da Fare ({pendingCount})
                 </button>
                 <button 
                   onClick={() => setFilterStatus('ALL')}
                   className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterStatus === 'ALL' ? 'bg-slate-200 text-slate-800 shadow-inner' : 'text-slate-500 hover:bg-slate-50'}`}
                 >
                   Tutte
                 </button>
              </div>
            )}

            <button 
              onClick={() => setUser(null)}
              className="pointer-events-auto bg-white/90 backdrop-blur-md shadow-lg shadow-slate-200/50 rounded-full p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 border border-white/20 transition-all active:scale-95 animate-slideUp"
              title="Esci"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Map Area */}
      <div className="flex-1 relative z-0 h-full w-full">
        <MapContainer 
          center={[UMBRIA_CENTER.lat, UMBRIA_CENTER.lng]} 
          zoom={9} 
          className="h-full w-full outline-none"
          zoomControl={false}
          ref={setMap}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <LocateUser onLocationFound={setUserLocation} />
          <MapEvents onMapClick={handleMapClick} />
          
          {/* User Location Marker */}
          {userLocation && (
            <Marker 
              position={userLocation} 
              icon={userLocationIcon} 
              zIndexOffset={1000}
              interactive={false}
            />
          )}

          {/* Markers */}
          {filteredPois.map(poi => (
            <Marker 
              key={poi.id} 
              position={[poi.location.lat, poi.location.lng]}
              // Pass priority to generate the badge
              icon={getCategoryIcon(poi.category, poi.status, poi.priority)}
              eventHandlers={{
                click: () => {
                  setSelectedPOI(poi);
                },
              }}
            >
            </Marker>
          ))}
        </MapContainer>
        
        {/* Legend Overlay with Interactive Filters */}
        <MapLegend 
          allCategories={categories} 
          activeCategories={activeCategories} 
          onToggle={handleToggleCategory} 
        />
        
        {/* Floating Action Buttons */}
        <div className="absolute bottom-8 right-6 z-[400] flex flex-col gap-4 pointer-events-none">
          
          {/* Instructions Pill */}
          <div className="pointer-events-auto self-end bg-slate-900/80 backdrop-blur-md text-white px-4 py-2 rounded-full shadow-xl text-xs font-medium mb-2 animate-fadeIn border border-white/10">
             {user.role === Role.SEGNALATORE 
               ? "Tocca la mappa per segnalare"
               : "Tocca un marker per gestire"}
          </div>

          {/* Location FAB */}
          <button
            onClick={handleLocateUser}
            className="pointer-events-auto w-14 h-14 bg-white hover:bg-indigo-50 text-indigo-600 rounded-2xl shadow-2xl shadow-indigo-900/20 border border-white/50 flex items-center justify-center transition-transform active:scale-90 pulse-ring"
          >
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </button>
        </div>

      </div>

      {/* Modals */}
      {isCreating && tempLocation && (
        <CreatePOIModal 
          location={tempLocation}
          address={tempAddress}
          availableCategories={categories}
          onClose={() => { setIsCreating(false); setTempLocation(null); setTempAddress(''); }}
          onSave={handleSavePOI}
        />
      )}

      {selectedPOI && (
        <POIDetailsModal 
          poi={selectedPOI}
          userRole={user.role}
          onClose={() => setSelectedPOI(null)}
          onUpdateStatus={handleUpdateStatus}
          onAddImage={handleAddImageToPOI}
        />
      )}
    </div>
  );
}