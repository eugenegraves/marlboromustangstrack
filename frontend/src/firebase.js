// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// Replace with your actual Firebase config after creating a project in Firebase console
const firebaseConfig = {
  apiKey: "AIzaSyBVvnryFjPqBfxW3KQAYuF-vagQ-_4wqKU",
  authDomain: "marlboromustangstrack.firebaseapp.com",
  projectId: "marlboromustangstrack",
  storageBucket: "marlboromustangstrack.firebasestorage.app",
  messagingSenderId: "89454090009",
  appId: "1:89454090009:web:366da8e3506f7168ee1788",
  measurementId: "G-Y3DMX03KG2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);
const analytics = getAnalytics(app);

export { db, storage, auth, analytics };
export default app; 