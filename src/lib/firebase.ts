import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA00h4zrOQ4rtLcTKNTQRBEAdD5ycNE4bI",
  authDomain: "winter-arc-d4f72.firebaseapp.com",
  projectId: "winter-arc-d4f72",
  storageBucket: "winter-arc-d4f72.firebasestorage.app",
  messagingSenderId: "199053427628",
  appId: "1:199053427628:web:635109392792cc6ed5b009",
  measurementId: "G-F0VTQEVS5V"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
