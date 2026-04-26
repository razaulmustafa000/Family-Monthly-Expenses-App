import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC0-HhrQ0ixf4sW4kFSZ8NHo276q30yQD4",
  authDomain: "family-hissab.firebaseapp.com",
  projectId: "family-hissab",
  storageBucket: "family-hissab.firebasestorage.app",
  messagingSenderId: "170256958453",
  appId: "1:170256958453:web:0c70ffd5ca82f32b1d96bc",
  measurementId: "G-BJ4P3TT9QB"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);