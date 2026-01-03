import { MaintenancePOI, Category } from '../types';
import { DEFAULT_CATEGORIES, APP_STORAGE_KEY, CATEGORY_STORAGE_KEY, REMOTE_STORAGE_URL } from '../constants';
import { db, storage, auth } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  getDocs
} from 'firebase/firestore';
import { 
  ref, 
  uploadString, 
  getDownloadURL 
} from 'firebase/storage';
import { signInAnonymously } from 'firebase/auth';

// --- Types for Storage ---
interface AppData {
  pois: MaintenancePOI[];
  categories: string[];
}

// --- Observer Pattern ---
type StorageListener = (data: AppData) => void;
const listeners: Set<StorageListener> = new Set();

// Internal State Cache
let _cache: AppData = {
  pois: [],
  categories: DEFAULT_CATEGORIES
};

// --- Helpers ---

const notifyListeners = () => {
  listeners.forEach(l => l({ ..._cache }));
};

const loadLocal = (): AppData => {
  try {
    const storedPois = localStorage.getItem(APP_STORAGE_KEY);
    const storedCats = localStorage.getItem(CATEGORY_STORAGE_KEY);
    return {
      pois: storedPois ? JSON.parse(storedPois) : [],
      categories: storedCats ? JSON.parse(storedCats) : DEFAULT_CATEGORIES
    };
  } catch (e) {
    return { pois: [], categories: DEFAULT_CATEGORIES };
  }
};

const saveLocal = (data: AppData) => {
  try {
    localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(data.pois));
    localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(data.categories));
  } catch (e) {
    console.warn("Local save error", e);
  }
};

// --- FIREBASE LOGIC ---

// Upload Base64 to Firebase Storage and return URL
const uploadImage = async (id: string, base64String: string): Promise<string> => {
  if (!storage) return base64String; // Fallback if no firebase
  
  try {
    // Check if it's already a URL
    if (base64String.startsWith('http')) return base64String;

    const timestamp = Date.now();
    // Create a reference e.g. 'poi-images/12345/987654321.jpg'
    const storageRef = ref(storage, `poi-images/${id}/${timestamp}.jpg`);
    
    await uploadString(storageRef, base64String, 'data_url');
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading image to Firebase:", error);
    return base64String; // Return original on failure to avoid data loss
  }
};

// Initialize Firebase Listeners
const initFirebase = async () => {
  if (!db) return;

  // 0. AUTHENTICATION (Fixes permission-denied)
  // We try to sign in anonymously to satisfy rules like "allow read, write: if request.auth != null"
  if (auth) {
    try {
      await signInAnonymously(auth);
      console.log("Firebase Auth: Accesso anonimo effettuato.");
    } catch (error: any) {
      console.warn("Firebase Auth Warning: Impossibile accedere in modo anonimo.", error.code);
      // Note: If 'auth/admin-restricted-operation' occurs, Anonymous Auth must be enabled in Firebase Console.
    }
  }

  // 1. Listen to POIs
  const q = query(collection(db, "pois"), orderBy("createdAt", "desc"));
  onSnapshot(q, (snapshot) => {
    const remotePois: MaintenancePOI[] = [];
    snapshot.forEach((doc) => {
      remotePois.push(doc.data() as MaintenancePOI);
    });
    
    _cache.pois = remotePois;
    saveLocal(_cache);
    notifyListeners();
  }, (error) => {
    console.error("Firestore POI sync error:", error.message);
    if (error.code === 'permission-denied') {
      console.error("SUGGERIMENTO: Controlla le 'Security Rules' in Firebase Console o abilita 'Anonymous Auth'.");
    }
  });

  // 2. Listen to Categories (Stored in a 'settings' collection or similar)
  const catRef = doc(db, "settings", "categories");
  onSnapshot(catRef, (doc) => {
    if (doc.exists()) {
      const data = doc.data();
      if (data && Array.isArray(data.list)) {
        _cache.categories = data.list;
        saveLocal(_cache);
        notifyListeners();
      }
    }
  }, (error) => {
    // Silent fail for categories optional sync
    console.warn("Firestore Categories sync warning:", error.code);
  });
};

// --- LEGACY/DEMO FALLBACK LOGIC ---
// (Used only if Firebase config is missing)
const fetchRemoteLegacy = async (): Promise<AppData | null> => {
  try {
    const res = await fetch(REMOTE_STORAGE_URL, { method: 'GET' });
    if (res.ok) return await res.json();
    return null;
  } catch (e) { return null; }
};

const pushRemoteLegacy = async (data: AppData) => {
  try {
    await fetch(REMOTE_STORAGE_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  } catch (e) {}
};

// --- PUBLIC API ---

export const initStorage = async () => {
  // Load local first for speed
  _cache = loadLocal();
  notifyListeners();

  if (db) {
    // USE FIREBASE
    await initFirebase();
  } else {
    // USE LEGACY POLLING
    const remoteData = await fetchRemoteLegacy();
    if (remoteData && remoteData.pois) {
      _cache = remoteData;
      saveLocal(_cache);
      notifyListeners();
    }
  }
};

export const subscribeToUpdates = (listener: StorageListener) => {
  listeners.add(listener);
  listener(_cache);
  return () => { listeners.delete(listener); };
};

// Polling only needed for Legacy mode
export const startPolling = (intervalMs = 5000) => {
  if (db) return; // No polling needed with Firestore!

  setInterval(async () => {
    const remoteData = await fetchRemoteLegacy();
    if (remoteData && JSON.stringify(remoteData) !== JSON.stringify(_cache)) {
      _cache = remoteData;
      saveLocal(_cache);
      notifyListeners();
    }
  }, intervalMs);
};

export const getPOIs = () => _cache.pois;
export const getCategories = () => _cache.categories;

export const savePOI = async (poi: MaintenancePOI) => {
  // Optimistic Update
  const optimisticList = [poi, ..._cache.pois];
  _cache.pois = optimisticList;
  notifyListeners();

  if (db) {
    // FIREBASE SAVE
    try {
      // 1. Upload images first
      const imageUrls = await Promise.all(poi.images.map(img => uploadImage(poi.id, img)));
      const finalPoi = { ...poi, images: imageUrls };

      // 2. Save document
      await setDoc(doc(db, "pois", poi.id), finalPoi);
      
      // Update cache with real URL version (optional, listener will catch it anyway)
    } catch (e) {
      console.error("Firebase Save Error", e);
    }
  } else {
    // LEGACY SAVE
    saveLocal(_cache);
    pushRemoteLegacy(_cache);
  }
};

export const updatePOI = async (poi: MaintenancePOI) => {
  // Optimistic
  _cache.pois = _cache.pois.map(p => p.id === poi.id ? poi : p);
  notifyListeners();

  if (db) {
    // FIREBASE UPDATE
    try {
       // Check for new images that are base64
       const imageUrls = await Promise.all(poi.images.map(img => uploadImage(poi.id, img)));
       const finalPoi = { ...poi, images: imageUrls };
       
       await updateDoc(doc(db, "pois", poi.id), finalPoi);
    } catch (e) {
      console.error("Firebase Update Error", e);
    }
  } else {
    // LEGACY
    saveLocal(_cache);
    pushRemoteLegacy(_cache);
  }
};

export const saveCategory = async (newCategory: string) => {
  if (_cache.categories.includes(newCategory)) return;

  _cache.categories = [..._cache.categories, newCategory];
  notifyListeners();

  if (db) {
    // FIREBASE
    try {
      await setDoc(doc(db, "settings", "categories"), { list: _cache.categories });
    } catch(e) {
       console.error("Category save error", e);
    }
  } else {
    // LEGACY
    saveLocal(_cache);
    pushRemoteLegacy(_cache);
  }
};