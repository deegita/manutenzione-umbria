import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAuth, Auth } from "firebase/auth";
import { FIREBASE_CONFIG } from "../constants";

// Singleton instances
let app: FirebaseApp | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;
let auth: Auth | undefined;

// Helper to check if config is actually populated
const isConfigValid = () => {
  // Valid check: apiKey exists, is not a placeholder (starts with standard prefix or just not the placeholder text), and projectId exists
  return FIREBASE_CONFIG.apiKey && 
         !FIREBASE_CONFIG.apiKey.startsWith("INSERISCI") && 
         FIREBASE_CONFIG.projectId;
};

try {
  if (isConfigValid()) {
    if (!getApps().length) {
      app = initializeApp(FIREBASE_CONFIG);
    } else {
      app = getApp();
    }
    
    db = getFirestore(app);
    storage = getStorage(app);
    auth = getAuth(app);
    
    console.log("Firebase connesso con successo.");
  } else {
    console.warn("Firebase Config mancante o placeholder rilevato. L'app funzionerà in modalità locale/demo.");
  }
} catch (error) {
  console.error("Errore durante l'inizializzazione di Firebase:", error);
}

export { db, storage, auth };